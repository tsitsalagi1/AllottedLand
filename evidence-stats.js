import { json, readJson } from './_util.js';
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  if (!env.ADMIN_KEY || request.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'Admin key required.' }, 401);
  const body = await readJson(request); const id = String(body.id || '').trim(); if (!id) return json({ error: 'id required' }, 400);
  await env.DB.prepare('DELETE FROM pending_testimonials WHERE id=?').bind(id).run();
  return json({ ok: true, rejected: 1 });
}
