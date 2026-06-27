import { json } from './_util.js';

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  if (!env.ADMIN_KEY || request.headers.get('X-Admin-Key') !== env.ADMIN_KEY) {
    return json({ error: 'Admin key required.' }, 401);
  }

  const one = async (sql, ...args) => {
    const res = await env.DB.prepare(sql).bind(...args).first();
    return res || {};
  };

  const approved = await one('SELECT COUNT(*) AS count FROM approved_records');
  const pending = await one('SELECT COUNT(*) AS count FROM pending_records');
  const sections = await env.DB.prepare(
    'SELECT status, COUNT(*) AS count FROM section_status GROUP BY status'
  ).all();

  const latestRows = await env.DB.prepare(
    `SELECT id, verified_name, township_range, section, number_shown_on_map, number_type, created_at, record_json
     FROM approved_records
     ORDER BY created_at DESC
     LIMIT 20`
  ).all();

  const section_status = {};
  for (const row of sections.results || []) {
    section_status[row.status || 'unknown'] = row.count || 0;
  }

  const latest_approved = (latestRows.results || []).map(row => {
    let record = {};
    try { record = JSON.parse(row.record_json || '{}'); } catch { record = {}; }
    return {
      id: row.id,
      verified_name: row.verified_name || record.verified_name || '',
      township_range: row.township_range || record.township_range || '',
      section: row.section || record.section || '',
      number_shown_on_map: row.number_shown_on_map || record.number_shown_on_map || record.map_number || '',
      number_type: row.number_type || record.number_type || '',
      created_at: row.created_at || '',
      record
    };
  });

  return json({
    approved_records: approved.count || 0,
    pending_records: pending.count || 0,
    section_status,
    latest_approved
  });
}
