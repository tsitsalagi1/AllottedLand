import { json } from './_util.js';

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  if (!env.ADMIN_KEY || request.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'Admin key required.' }, 401);
  const url = new URL(request.url);
  const tr = url.searchParams.get('township_range');
  let sql = 'SELECT id, submission_id, verified_name, township_range, section, number_shown_on_map, number_type, created_at, record_json FROM pending_records';
  const args = [];
  if (tr) { sql += ' WHERE township_range = ?'; args.push(tr); }
  sql += ' ORDER BY created_at DESC LIMIT 1000';
  const result = await env.DB.prepare(sql).bind(...args).all();
  return json({ pending: result.results || [] });
}
