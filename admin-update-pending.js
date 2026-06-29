import { json, readJson, makeId } from './_util.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  if (!env.ADMIN_KEY || request.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'Admin key required.' }, 401);
  const body = await readJson(request);
  const ids = Array.isArray(body.ids) ? body.ids : [];
  if (!ids.length) return json({ error: 'Provide pending record ids in ids array.' }, 400);
  let approved = 0;
  const now = new Date().toISOString();
  for (const id of ids) {
    const row = await env.DB.prepare('SELECT * FROM pending_records WHERE id = ?').bind(id).first();
    if (!row) continue;
    const recId = makeId('rec');
    await env.DB.prepare(`INSERT INTO approved_records (id, submission_id, verified_name, first_name, middle_name, last_name, tribe, map_number, number_shown_on_map, number_type, roll_number, enrollment_number, census_card_number, allotment_number, status_restriction_notation, loc_page, township_range, township, range, section, county, state, legal_description, source_link, confidence, needs_human_review, notes, record_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(recId, row.submission_id, row.verified_name, row.first_name, row.middle_name, row.last_name, row.tribe, row.map_number, row.number_shown_on_map, row.number_type, row.roll_number, row.enrollment_number, row.census_card_number, row.allotment_number, row.status_restriction_notation, row.loc_page, row.township_range, row.township, row.range, row.section, row.county, row.state, row.legal_description, row.source_link, 'human-reviewed', 'no', row.notes, row.record_json, now)
      .run();
    await env.DB.prepare('DELETE FROM pending_records WHERE id = ?').bind(id).run();
    approved++;
  }
  return json({ ok: true, approved });
}
