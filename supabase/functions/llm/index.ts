import { handleOptions, json } from '../_shared/http.ts';
import { requireUser } from '../_shared/auth.ts';

type Role = 'system' | 'user' | 'assistant';

type Provider = 'openai' | 'anthropic' | 'ollama-remote' | 'github-models' | 'huggingface';

interface Message { role: Role; content: string }

function badRequest(message: string) {
  return json({ error: 'Validation Error', message }, { status: 400 });
}

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`${name} is not configured`);
  return v;
}

function optionalEnv(name: string, fallback: string): string {
  return Deno.env.get(name) || fallback;
}

function validateBody(body: any): { provider: Provider; model: string; messages: Message[]; temperature?: number; max_tokens?: number } {
  const provider: Provider = (body?.provider || 'openai') as Provider;
  const allowed: Provider[] = ['openai','anthropic','ollama-remote','github-models','huggingface'];
  if (!allowed.includes(provider)) throw new Error('Unsupported provider');

  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length < 1 || messages.length > 30) throw new Error('messages must be an array (1..30)');
  const parsed: Message[] = messages.map((m: any) => ({ role: m.role, content: String(m.content || '') })).filter((m: Message) => m.content.length > 0);
  for (const m of parsed) {
    if (!['system','user','assistant'].includes(m.role)) throw new Error('Invalid message role');
    if (m.content.length > 8000) throw new Error('Message too long');
  }

  const model = String(body?.model || '').trim();
  const temperature = body?.temperature;
  const max_tokens = body?.max_tokens;

  return {
    provider,
    model,
    messages: parsed,
    temperature: typeof temperature === 'number' ? temperature : undefined,
    max_tokens: typeof max_tokens === 'number' ? max_tokens : undefined,
  };
}

function getConfig(provider: Provider) {
  switch (provider) {
    case 'openai':
      return {
        url: 'https://api.openai.com/v1/chat/completions',
        model: optionalEnv('OPENAI_MODEL', 'gpt-4o-mini'),
        headers: () => ({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env('OPENAI_API_KEY')}`,
        }),
        format: (messages: Message[], model: string, opts: any) => ({
          model,
          messages,
          temperature: opts.temperature ?? 0.3,
          max_tokens: opts.max_tokens ?? 1000,
        }),
        parse: (data: any) => data?.choices?.[0]?.message?.content ?? '',
      };

    case 'anthropic':
      return {
        url: 'https://api.anthropic.com/v1/messages',
        model: optionalEnv('ANTHROPIC_MODEL', 'claude-3-haiku-20240307'),
        headers: () => ({
          'Content-Type': 'application/json',
          'x-api-key': env('ANTHROPIC_API_KEY'),
          'anthropic-version': '2023-06-01',
        }),
        format: (messages: Message[], model: string, opts: any) => {
          const systemMsg = messages.find(m => m.role === 'system');
          const other = messages.filter(m => m.role !== 'system');
          return {
            model,
            max_tokens: opts.max_tokens ?? 1000,
            system: systemMsg?.content || 'You are a helpful travel operations assistant.',
            messages: other.map(m => ({ role: m.role, content: m.content })),
          };
        },
        parse: (data: any) => data?.content?.[0]?.text ?? '',
      };

    case 'ollama-remote':
      return {
        url: optionalEnv('OLLAMA_BASE_URL', 'http://localhost:11434/api/chat'),
        model: optionalEnv('OLLAMA_MODEL', 'llama3.2:3b'),
        headers: () => ({ 'Content-Type': 'application/json' }),
        format: (messages: Message[], model: string, opts: any) => ({
          model,
          messages,
          stream: false,
          options: {
            temperature: opts.temperature ?? 0.3,
            num_predict: opts.max_tokens ?? 1000,
          },
        }),
        parse: (data: any) => data?.message?.content ?? '',
      };

    case 'github-models':
      return {
        url: 'https://models.inference.ai.azure.com/chat/completions',
        model: optionalEnv('GITHUB_MODEL', 'meta-llama/Llama-3.2-11B-Vision-Instruct'),
        headers: () => ({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env('GITHUB_TOKEN')}`,
        }),
        format: (messages: Message[], model: string, opts: any) => ({
          model,
          messages,
          temperature: opts.temperature ?? 0.3,
          max_tokens: opts.max_tokens ?? 1000,
        }),
        parse: (data: any) => data?.choices?.[0]?.message?.content ?? '',
      };

    case 'huggingface':
      return {
        url: `https://api-inference.huggingface.co/models/${optionalEnv('HF_MODEL', 'meta-llama/Llama-3.2-3B-Instruct')}`,
        model: optionalEnv('HF_MODEL', 'meta-llama/Llama-3.2-3B-Instruct'),
        headers: () => ({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env('HF_API_KEY')}`,
        }),
        format: (messages: Message[], _model: string, opts: any) => {
          const prompt = messages.map(m => `${m.role}: ${m.content}`).join('\n');
          return {
            inputs: prompt,
            parameters: {
              max_new_tokens: opts.max_tokens ?? 500,
              temperature: opts.temperature ?? 0.3,
              return_full_text: false,
            },
          };
        },
        parse: (data: any) => data?.[0]?.generated_text ?? '',
      };
  }
}

Deno.serve(async (req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  if (req.method !== 'POST') return json({ error: 'Method Not Allowed' }, { status: 405 });

  // Basic auth gate to prevent public abuse. Set ALLOW_ANON_LLM=true if you want demo mode.
  const allowAnon = (Deno.env.get('ALLOW_ANON_LLM') || 'false').toLowerCase() === 'true';
  const user = await requireUser(req);
  if (!allowAnon && !user) {
    return json({ error: 'Unauthorized', message: 'Sign in required for AI features' }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return badRequest('Body must be valid JSON');
  }

  let parsed;
  try {
    parsed = validateBody(body);
  } catch (e) {
    return badRequest((e as Error).message);
  }

  const cfg = getConfig(parsed.provider);
  const model = parsed.model || cfg.model;

  try {
    const upstream = await fetch(cfg.url, {
      method: 'POST',
      headers: cfg.headers(),
      body: JSON.stringify(cfg.format(parsed.messages, model, { temperature: parsed.temperature, max_tokens: parsed.max_tokens })),
    });

    if (!upstream.ok) {
      const detail = (await upstream.text()).slice(0, 800);
      return json({ error: 'Upstream LLM error', provider: parsed.provider, status: upstream.status, detail }, { status: 502 });
    }

    const data = await upstream.json();
    const text = cfg.parse(data);

    return json({ text, provider: parsed.provider, model, usage: (data as any)?.usage || null });
  } catch (e) {
    return json({ error: 'Internal Server Error', message: (e as Error).message || String(e) }, { status: 500 });
  }
});
