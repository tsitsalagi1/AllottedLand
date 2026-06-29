export function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' }
  });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch (err) {
    throw new Error('Request body must be valid JSON.');
  }
}

export function makeId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomUUID()}`;
}

export function normalizeRecord(raw = {}) {
  const first = String(raw.first_name || raw.given_name || '').trim();
  const middle = String(raw.middle_name || '').trim();
  const last = String(raw.last_name || raw.surname || '').trim();
  const verified = String(raw.verified_name || [first, middle, last].filter(Boolean).join(' ')).trim();
  const tr = String(raw.township_range || '').trim();
  const section = String(raw.section || '').trim();
  const mapNumber = String(raw.map_number || raw.number_shown_on_map || raw.allotment_number || raw.roll_number || '').trim();
  const numberType = String(raw.number_type || (raw.allotment_number ? 'allotment_number' : raw.roll_number ? 'roll_number' : 'unknown_map_number')).trim();
  return {
    verified_name: verified,
    first_name: first,
    middle_name: middle,
    last_name: last,
    surname: last,
    given_name: first,
    tribe: String(raw.tribe || 'Cherokee Nation').trim(),
    map_number: mapNumber,
    number_shown_on_map: String(raw.number_shown_on_map || mapNumber).trim(),
    number_type: numberType,
    roll_number: String(raw.roll_number || '').trim(),
    enrollment_number: String(raw.enrollment_number || '').trim(),
    census_card_number: String(raw.census_card_number || '').trim(),
    allotment_number: String(raw.allotment_number || '').trim(),
    status_restriction_notation: String(raw.status_restriction_notation || '').trim(),
    loc_page: Number(raw.loc_page || 0) || null,
    township_range: tr,
    township: String(raw.township || '').trim(),
    range: String(raw.range || '').trim(),
    section,
    county: String(raw.county || '').trim(),
    state: String(raw.state || 'Oklahoma').trim(),
    legal_description: String(raw.legal_description || (section && tr ? `Section ${section}, ${tr}` : '')).trim(),
    source_link: String(raw.source_link || '').trim(),
    confidence: String(raw.confidence || 'human-reviewed').trim(),
    needs_human_review: String(raw.needs_human_review || 'no').trim(),
    notes: String(raw.notes || '').trim(),
    review_trace: raw.review_trace || {}
  };
}

export function uniqueKey(r) {
  return [r.verified_name, r.number_shown_on_map || r.map_number, r.township_range, r.section]
    .map(v => String(v || '').trim().toLowerCase())
    .join('|');
}
