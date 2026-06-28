import { json, readJson } from './_util.js';
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  if (!env.ADMIN_KEY || request.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'Admin key required.' }, 401);
  const body = await readJson(request); const id = String(body.id || '').trim(); if (!id) return json({ error: 'id required' }, 400);
  const row = await env.DB.prepare('SELECT * FROM pending_testimonials WHERE id=?').bind(id).first(); if (!row) return json({ error: 'Pending testimonial not found.' }, 404);
  const now = new Date().toISOString(); const title = String(body.title || row.title || 'Family story').trim();
  await env.DB.prepare(`INSERT INTO approved_testimonials (id, title, display_name, tribe, story, publication_choice, approved_at, record_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, title, row.display_name || '', row.tribe || '', row.story || '', row.publication_choice || 'anonymous_public', now, JSON.stringify(row)).run();
  await env.DB.prepare('DELETE FROM pending_testimonials WHERE id=?').bind(id).run();
  return json({ ok: true, approved: 1 });
}
