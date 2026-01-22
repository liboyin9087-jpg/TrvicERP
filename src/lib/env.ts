const LOCALHOST_PATTERN = /(localhost|127\.0\.0\.1|0\.0\.0\.0)/i;

const REQUIRED_URLS = [
  { key: 'VITE_API_URL', label: 'Backend API URL' },
  { key: 'VITE_AI_API_URL', label: 'AI API URL' },
  { key: 'VITE_WS_URL', label: 'WebSocket URL' },
  { key: 'VITE_LINE_API_URL', label: 'LINE API URL' },
];

export function warnIfEnvMisconfigured(): void {
  if (!import.meta.env.PROD) {
    return;
  }

  const env = import.meta.env as Record<string, string | undefined>;
  const useMock = env.VITE_USE_MOCK !== 'false';
  const issues: string[] = [];

  if (useMock) {
    console.info('[env] Mock mode enabled; backend requests are disabled.');
    return;
  }

  for (const { key, label } of REQUIRED_URLS) {
    const value = env[key];
    if (!value && !useMock) {
      issues.push(`${key} is missing (${label}).`);
      continue;
    }
    if (value && LOCALHOST_PATTERN.test(value)) {
      issues.push(`${key} points to localhost (${value}).`);
    }
  }

  if (issues.length > 0) {
    console.warn(
      [
        '[env] Possible Vercel deployment config issues:',
        ...issues.map((issue) => `- ${issue}`),
      ].join('\n')
    );
  }
}
