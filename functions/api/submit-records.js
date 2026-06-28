import { json, readJson, makeId, normalizeRecord, uniqueKey } from './_util.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'D1 binding DB is not configured.' }, 500);
  const body = await readJson(request);
  const records = Array.isArray(body.records) ? body.records.map(normalizeRecord) : [];
  if (!records.length) return json({ error: 'No records were submitted.' }, 400);
  if (records.length > 200) return json({ error: 'Too many records in one submission. Limit is 200.' }, 400);

  const meta = body.meta || {};
  const reviewer = body.reviewer || {};
  const tr = String(meta.township_range || records[0].township_range || '').trim();
  const locPage = Number(meta.loc_page || records[0].loc_page || 0) || null;
  const reviewerContact = String(reviewer.contact || reviewer.initials || '').trim();
  const submissionId = makeId('sub');
  const now = new Date().toISOString();
  const reviewerKey = request.headers.get('X-Reviewer-Key') || '';
  const trusted = Boolean(env.REVIEWER_KEY && reviewerKey && reviewerKey === env.REVIEWER_KEY);
  const mode = trusted ? 'approved' : 'pending_review';

  const seen = new Set();
  const deduped = [];
  for (const r of records) {
    if (!r.verified_name || !r.township_range || !r.section) continue;
    const key = uniqueKey(r);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }
  if (!deduped.length) return json({ error: 'No usable records after duplicate cleanup.' }, 400);

  await env.DB.prepare(`INSERT INTO submission_log (id, township_range, loc_page, reviewer_contact, record_count, status, payload_json, created_at, user_agent)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(submissionId, tr, locPage, reviewerContact, deduped.length, mode, JSON.stringify(body), now, request.headers.get('User-Agent') || '')
    .run();

  for (const r of deduped) {
    const id = makeId(mode === 'approved' ? 'rec' : 'pend');
    const table = mode === 'approved' ? 'approved_records' : 'pending_records';
    await env.DB.prepare(`INSERT INTO ${table} (id, submission_id, verified_name, first_name, middle_name, last_name, tribe, map_number, number_shown_on_map, number_type, roll_number, enrollment_number, census_card_number, allotment_number, status_restriction_notation, loc_page, township_range, township, range, section, county, state, legal_description, source_link, confidence, needs_human_review, notes, record_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, submissionId, r.verified_name, r.first_name, r.middle_name, r.last_name, r.tribe, r.map_number, r.number_shown_on_map, r.number_type, r.roll_number, r.enrollment_number, r.census_card_number, r.allotment_number, r.status_restriction_notation, r.loc_page, r.township_range, r.township, r.range, r.section, r.county, r.state, r.legal_description, r.source_link, r.confidence, r.needs_human_review, r.notes, JSON.stringify(r), now)
      .run();
  }

  const sectionStatus = body.section_status || {};
  for (const [section, info] of Object.entries(sectionStatus)) {
    const status = String(info.status || 'has_rows');
    const rows = Number(info.rows || deduped.filter(r => String(r.section) === String(section)).length || 0);
    const id = `${tr || 'unknown'}:${section}`;
    await env.DB.prepare(`INSERT INTO section_status (id, township_range, loc_page, section, status, rows_count, reviewer_contact, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET status=excluded.status, rows_count=excluded.rows_count, reviewer_contact=excluded.reviewer_contact, updated_at=excluded.updated_at`)
      .bind(id, tr, locPage, String(section), status, rows, reviewerContact, now)
      .run();
  }

  if (body.grid && tr) {
    const gridId = `${tr}:${locPage || 'unknown'}`;
    await env.DB.prepare(`INSERT INTO grid_calibrations (id, township_range, loc_page, grid_json, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET grid_json=excluded.grid_json, updated_at=excluded.updated_at`)
      .bind(gridId, tr, locPage, JSON.stringify(body.grid), now)
      .run();
  }

  return json({ ok: true, mode, submission_id: submissionId, record_count: deduped.length });
}
