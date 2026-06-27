import { json, readJson, normalizeRecord } from './_util.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  if (!env.ADMIN_KEY || request.headers.get('X-Admin-Key') !== env.ADMIN_KEY) return json({ error: 'Admin key required.' }, 401);
  const body = await readJson(request);
  const id = String(body.id || '').trim();
  if (!id) return json({ error: 'Missing pending record id.' }, 400);
  const existing = await env.DB.prepare('SELECT * FROM pending_records WHERE id = ?').bind(id).first();
  if (!existing) return json({ error: 'Pending record not found.' }, 404);
  const r = normalizeRecord(body.record || {});
  if (!r.verified_name || !r.township_range || !r.section) return json({ error: 'Record needs verified_name, township_range, and section.' }, 400);
  await env.DB.prepare(`UPDATE pending_records SET
    verified_name = ?, first_name = ?, middle_name = ?, last_name = ?, tribe = ?, map_number = ?, number_shown_on_map = ?, number_type = ?, roll_number = ?, enrollment_number = ?, census_card_number = ?, allotment_number = ?, status_restriction_notation = ?, loc_page = ?, township_range = ?, township = ?, range = ?, section = ?, county = ?, state = ?, legal_description = ?, source_link = ?, confidence = ?, needs_human_review = ?, notes = ?, record_json = ?
    WHERE id = ?`)
    .bind(r.verified_name, r.first_name, r.middle_name, r.last_name, r.tribe, r.map_number, r.number_shown_on_map, r.number_type, r.roll_number, r.enrollment_number, r.census_card_number, r.allotment_number, r.status_restriction_notation, r.loc_page, r.township_range, r.township, r.range, r.section, r.county, r.state, r.legal_description, r.source_link, r.confidence, r.needs_human_review, r.notes, JSON.stringify(r), id)
    .run();
  return json({ ok: true, id });
}
