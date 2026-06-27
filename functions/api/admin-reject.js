import { json, readJson } from './_util.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  if (!env.ADMIN_KEY || request.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'Admin key required.' }, 401);
  const body = await readJson(request);
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (!ids.length) return json({ error: 'Provide pending record ids in ids array.' }, 400);
  let rejected = 0;
  for (const id of ids) {
    const row = await env.DB.prepare('SELECT id FROM pending_records WHERE id = ?').bind(id).first();
    if (!row) continue;
    await env.DB.prepare('DELETE FROM pending_records WHERE id = ?').bind(id).run();
    rejected++;
  }
  return json({ ok: true, rejected });
}
