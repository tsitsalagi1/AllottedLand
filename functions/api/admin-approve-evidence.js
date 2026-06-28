import { json, readJson } from './_util.js';
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  if (!env.ADMIN_KEY || request.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'Admin key required.' }, 401);
  const body = await readJson(request); const id = String(body.id || '').trim(); if (!id) return json({ error: 'id required' }, 400);
  const row = await env.DB.prepare('SELECT * FROM pending_evidence WHERE id=?').bind(id).first(); if (!row) return json({ error: 'Pending evidence not found.' }, 404);
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO approved_evidence (id, family_name, tribe, county, decade, loss_method, source_type, summary, source_note, approved_at, record_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, row.family_name||'', row.tribe||'', row.county||'', row.decade||'unknown', row.loss_method||'unknown', row.source_type||'', row.summary||'', row.source_note||'', now, JSON.stringify(row)).run();
  await env.DB.prepare('DELETE FROM pending_evidence WHERE id=?').bind(id).run();
  return json({ ok: true, approved: 1 });
}
