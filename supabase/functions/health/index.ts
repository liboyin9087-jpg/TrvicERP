import { handleOptions, json } from '../_shared/http.ts';

Deno.serve((req) => {
  const opt = handleOptions(req);
  if (opt) return opt;

  return json({ ok: true, ts: new Date().toISOString() });
});
