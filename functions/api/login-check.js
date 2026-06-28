import { json, readJson } from './_util.js';

export async function onRequestPost({ request, env }) {
  const body = await readJson(request);
  const role = String(body.role || '').trim();
  const key = String(body.key || '').trim();
  if (!key) return json({ error: 'Key required.' }, 400);
  if (role === 'admin') {
    if (env.ADMIN_KEY && key === env.ADMIN_KEY) return json({ ok: true, role: 'admin', message: 'Admin key accepted.' });
    return json({ error: 'Admin key rejected.' }, 401);
  }
  if (env.REVIEWER_KEY && key === env.REVIEWER_KEY) return json({ ok: true, role: 'reviewer', message: 'Reviewer key accepted.' });
  return json({ error: 'Reviewer key rejected.' }, 401);
}
