import { json } from './_util.js';

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ records: [], warning: 'D1 binding DB is not configured.' });
  const url = new URL(request.url);
  const tr = url.searchParams.get('township_range');
  const section = url.searchParams.get('section');
  let sql = 'SELECT record_json FROM approved_records';
  const args = [];
  const where = [];
  if (tr) { where.push('township_range = ?'); args.push(tr); }
  if (section) { where.push('section = ?'); args.push(section); }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  sql += ' ORDER BY last_name, first_name, section, number_shown_on_map LIMIT 5000';
  const result = await env.DB.prepare(sql).bind(...args).all();
  const records = (result.results || []).map(row => {
    try { return JSON.parse(row.record_json); } catch { return null; }
  }).filter(Boolean);
  return json({ records });
}
