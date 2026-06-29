import { json, readJson } from './_util.js';

function rowsToObject(rows) {
  const out = {};
  for (const r of rows) {
    out[String(r.section)] = { status: r.status, rows: r.rows_count, updated_at: r.updated_at, reviewer_contact: r.reviewer_contact || '' };
  }
  return out;
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ section_status: {}, warning: 'D1 binding DB is not configured.' });
  const url = new URL(request.url);
  const tr = url.searchParams.get('township_range');
  if (!tr) return json({ error: 'township_range is required' }, 400);
  const result = await env.DB.prepare('SELECT section, status, rows_count, updated_at, reviewer_contact FROM section_status WHERE township_range = ? ORDER BY CAST(section AS INTEGER)').bind(tr).all();
  return json({ township_range: tr, section_status: rowsToObject(result.results || []) });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  if (!env.REVIEWER_KEY || request.headers.get('X-Reviewer-Key') !== env.REVIEWER_KEY) return json({ error: 'Reviewer key required to update status directly.' }, 401);
  const body = await readJson(request);
  const tr = String(body.township_range || '').trim();
  const statusObj = body.section_status || {};
  if (!tr) return json({ error: 'township_range is required' }, 400);
  const now = new Date().toISOString();
  for (const [section, info] of Object.entries(statusObj)) {
    await env.DB.prepare(`INSERT INTO section_status (id, township_range, loc_page, section, status, rows_count, reviewer_contact, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET status=excluded.status, rows_count=excluded.rows_count, reviewer_contact=excluded.reviewer_contact, updated_at=excluded.updated_at`)
      .bind(`${tr}:${section}`, tr, Number(body.loc_page || 0) || null, String(section), String(info.status || 'not_started'), Number(info.rows || 0), String(body.reviewer_contact || ''), now)
      .run();
  }
  return json({ ok: true });
}
