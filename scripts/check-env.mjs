import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  const content = fs.readFileSync(filePath, 'utf8');
  const result = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    const hasQuotes =
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"));
    if (hasQuotes) {
      value = value.slice(1, -1);
    } else {
      const hashIndex = value.indexOf(' #');
      if (hashIndex >= 0) {
        value = value.slice(0, hashIndex).trim();
      }
    }
    result[key] = value;
  }
  return result;
}

function maskValue(key, value) {
  if (!value) return '';
  if (/(KEY|TOKEN|SECRET|PASSWORD)/i.test(key)) {
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }
  return value;
}

function reportSection(title, lines) {
  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
  lines.forEach((line) => console.log(line));
}

const frontendEnv = {
  ...readEnvFile(path.join(rootDir, '.env')),
  ...readEnvFile(path.join(rootDir, '.env.local')),
  ...process.env,
};

const aiServerEnv = {
  ...readEnvFile(path.join(rootDir, 'ai-server', '.env')),
  ...readEnvFile(path.join(rootDir, 'ai-server', '.env.local')),
  ...process.env,
};

const errors = [];
const warnings = [];

const frontRequired = ['VITE_USE_MOCK'];
const useMock = frontendEnv.VITE_USE_MOCK !== 'false';

if (!useMock) {
  frontRequired.push('VITE_API_URL', 'VITE_AI_API_URL', 'VITE_WS_URL', 'VITE_LINE_API_URL');
}

if (!frontendEnv.VITE_APP_URL) {
  warnings.push('VITE_APP_URL is not set (used by LINE callbacks).');
}

const weatherProvider = (frontendEnv.VITE_WEATHER_PROVIDER || 'openweathermap').toLowerCase();
if (weatherProvider !== 'mock') {
  frontRequired.push('VITE_WEATHER_API_KEY', 'VITE_WEATHER_API_URL');
}

frontRequired.forEach((key) => {
  if (!frontendEnv[key]) {
    errors.push(`Missing frontend env: ${key}`);
  }
});

const aiProvider = (aiServerEnv.LLM_PROVIDER || 'gemini').toLowerCase();
if (aiProvider === 'gemini' && !aiServerEnv.GOOGLE_API_KEY) {
  errors.push('Missing AI env: GOOGLE_API_KEY (Gemini)');
}
if (aiProvider === 'siliconflow' && !aiServerEnv.SILICONFLOW_API_KEY) {
  errors.push('Missing AI env: SILICONFLOW_API_KEY (SiliconFlow)');
}

if (!aiServerEnv.SILICONFLOW_API_KEY) {
  warnings.push('SILICONFLOW_API_KEY is missing (marketing mode uses Qwen2.5).');
}

const bflStyle = (aiServerEnv.BFL_API_STYLE || 'auto').toLowerCase();
const bflBaseUrl = aiServerEnv.BFL_BASE_URL || 'https://api.bfl.ml/v1';
const bflLooksLikeSiliconflow =
  bflStyle === 'siliconflow' ||
  bflBaseUrl.includes('siliconflow') ||
  bflBaseUrl.includes('/chat/completions');

const hasBflKey = Boolean(aiServerEnv.BFL_API_KEY);
const hasSiliconflowKey = Boolean(aiServerEnv.SILICONFLOW_API_KEY);

if (bflLooksLikeSiliconflow) {
  if (!hasBflKey && !hasSiliconflowKey) {
    errors.push('Missing image env: BFL_API_KEY or SILICONFLOW_API_KEY (Flux via SiliconFlow style).');
  }
} else if (!hasBflKey) {
  errors.push('Missing image env: BFL_API_KEY (Flux/BFL style).');
}

reportSection('Frontend env summary', [
  `VITE_USE_MOCK=${frontendEnv.VITE_USE_MOCK || '(missing)'}`,
  `VITE_API_URL=${maskValue('VITE_API_URL', frontendEnv.VITE_API_URL) || '(missing)'}`,
  `VITE_AI_API_URL=${maskValue('VITE_AI_API_URL', frontendEnv.VITE_AI_API_URL) || '(missing)'}`,
  `VITE_WS_URL=${maskValue('VITE_WS_URL', frontendEnv.VITE_WS_URL) || '(missing)'}`,
  `VITE_LINE_API_URL=${maskValue('VITE_LINE_API_URL', frontendEnv.VITE_LINE_API_URL) || '(missing)'}`,
  `VITE_APP_URL=${maskValue('VITE_APP_URL', frontendEnv.VITE_APP_URL) || '(missing)'}`,
  `VITE_WEATHER_PROVIDER=${frontendEnv.VITE_WEATHER_PROVIDER || '(missing)'}`,
  `VITE_WEATHER_API_URL=${maskValue('VITE_WEATHER_API_URL', frontendEnv.VITE_WEATHER_API_URL) || '(missing)'}`,
  `VITE_WEATHER_API_KEY=${maskValue('VITE_WEATHER_API_KEY', frontendEnv.VITE_WEATHER_API_KEY) || '(missing)'}`,
]);

reportSection('AI server env summary', [
  `LLM_PROVIDER=${aiProvider}`,
  `GEMINI_MODEL=${aiServerEnv.GEMINI_MODEL || 'gemini-2.5-flash (default)'}`,
  `GOOGLE_API_KEY=${maskValue('GOOGLE_API_KEY', aiServerEnv.GOOGLE_API_KEY) || '(missing)'}`,
  `SILICONFLOW_MODEL=${aiServerEnv.SILICONFLOW_MODEL || 'deepseek-ai/DeepSeek-V3 (default)'}`,
  `SILICONFLOW_MARKETING_MODEL=${aiServerEnv.SILICONFLOW_MARKETING_MODEL || 'Qwen/Qwen2.5-32B-Instruct (default)'}`,
  `SILICONFLOW_API_KEY=${maskValue('SILICONFLOW_API_KEY', aiServerEnv.SILICONFLOW_API_KEY) || '(missing)'}`,
  `BFL_BASE_URL=${aiServerEnv.BFL_BASE_URL || 'https://api.bfl.ml/v1 (default)'}`,
  `BFL_MODEL=${aiServerEnv.BFL_MODEL || 'flux-pro (default)'}`,
  `BFL_API_STYLE=${bflStyle}`,
  `BFL_API_KEY=${maskValue('BFL_API_KEY', aiServerEnv.BFL_API_KEY) || '(missing)'}`,
]);

if (warnings.length > 0) {
  reportSection('Warnings', warnings);
}

if (errors.length > 0) {
  reportSection('Errors', errors);
  process.exit(1);
}

console.log('\n✅ Environment check passed.');
