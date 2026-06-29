import { json } from './_util.js';
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  if (!env.ADMIN_KEY || request.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'Admin key required.' }, 401);
  const rows = await env.DB.prepare(`SELECT * FROM pending_evidence ORDER BY created_at DESC LIMIT 200`).all();
  return json({ pending: rows.results || [] });
}
