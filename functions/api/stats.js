import { json } from './_util.js';

export async function onRequestGet({ env }) {
  if (!env.DB) {
    return json({
      approved_records: 0,
      pending_records: 0,
      section_status: {},
      warning: 'D1 binding DB is not configured.'
    });
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

  const section_status = {};
  for (const row of sections.results || []) {
    section_status[row.status || 'unknown'] = row.count || 0;
  }

  return json({
    approved_records: approved.count || 0,
    pending_records: pending.count || 0,
    section_status
  });
}
