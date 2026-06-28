// Cloudflare Pages Function: /api/unified-search
// v0.45: one-search research path package for AllottedLand.com.
// Returns detected clue types, D1 approved-record matches, source leads, and request-path text.
const json = (body, status = 200) => new Response(JSON.stringify(body, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
function lower(v){ return clean(v).toLowerCase(); }
function digits(v){ return clean(v).replace(/[^0-9]/g, ''); }
function escUrl(v){ return encodeURIComponent(clean(v)); }
function includesAny(q, words){ const l = lower(q); return words.some(w => l.includes(w)); }
function hasCoord(q){ return /-?\d{1,3}\.\d+\s*,\s*-?\d{1,3}\.\d+/.test(q); }
function looksAddress(q){ return /\d+\s+[^,]+,\s*[^,]+,?\s*(ok|oklahoma|ar|arkansas|ks|kansas|tx|texas|mo|missouri|nm|new mexico|co|colorado)\b/i.test(q) || /\d+\s+.*\b(ave|avenue|st|street|rd|road|dr|drive|ln|lane|hwy|highway|blvd|circle|ct|court)\b/i.test(q); }
function looksTRS(q){ return /\bT?\s*\d{1,2}\s*N?\s+R?\s*\d{1,2}\s*E?\b/i.test(q) || /\btownship\b|\brange\b|\bsection\b/i.test(q); }
function looksName(q){ return /^[A-Za-z'’.\-]+\s+[A-Za-z'’.\-]+/.test(clean(q)) && !looksAddress(q) && !looksTRS(q); }
function classify(q){
  const types = [];
  if (looksAddress(q)) types.push('address/place');
  if (hasCoord(q)) types.push('coordinates');
  if (looksTRS(q)) types.push('township-range-section');
  if (/\b(roll|enrollment|card|census card|dawes)\b/i.test(q) || /^\d{2,7}$/.test(digits(q))) types.push('dawes/enrollment clue');
  if (looksName(q)) types.push('person/family name');
  if (includesAny(q, ['tax sale','sheriff sale','guardian','probate','foreclosure','mortgage','oil','gas lease','restricted indian land','deed','judgment'])) types.push('land-loss/legal-notice clue');
  if (includesAny(q, ['bureau of indian affairs','bia','federal register','rule','notice','ordinance','trust acquisition','land into trust'])) types.push('federal-notice clue');
  if (!types.length) types.push('general research clue');
  return types;
}
function sourceLeads(q, detected){
  const qDawes = [q, 'Dawes Five Civilized Tribes allotment enrollment'].join(' ');
  const mapQ = [q, 'Indian Territory allotment map'].join(' ');
  const newsQ = [q, 'tax sale sheriff sale guardian probate allotment'].join(' ');
  const frQ = [q, 'Bureau of Indian Affairs allotment land'].join(' ');
  const leads = [
    { group:'NARA', title:'Search NARA Catalog', type:'official source search', url:`https://catalog.archives.gov/search?q=${escUrl(qDawes)}`, description:'Use for Dawes rolls, census/enrollment cards, enrollment packets, allotment jackets, maps, RG 48, and RG 75 source leads.' },
    { group:'NARA', title:'NARA Dawes research guide', type:'research guide', url:'https://www.archives.gov/research/native-americans/dawes', description:'Explains Final Dawes Rolls, census cards, enrollment applications, allotment jackets, and maps.' },
    { group:'OHS', title:'Oklahoma Historical Society Dawes search', type:'state source search', url:'https://www.okhistory.org/research/dawes', description:'Use for first/last name, tribal nation, roll number, and card number lookup.' },
    { group:'LOC Maps', title:'Library of Congress map search', type:'official map search', url:`https://www.loc.gov/maps/?q=${escUrl(mapQ)}&fa=location:oklahoma`, description:'Use for allotment maps, Indian Territory maps, township/range atlas pages, and source image leads.' },
    { group:'Newspapers', title:'Chronicling America newspaper search', type:'historic newspaper search', url:`https://www.loc.gov/collections/chronicling-america/?q=${escUrl(newsQ)}`, description:'Use for tax-sale notices, sheriff-sale notices, probate, guardianship, oil/gas, and local legal notices.' },
    { group:'Federal notices', title:'Federal Register search', type:'federal notice search', url:`https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=${escUrl(frQ)}`, description:'Use for BIA notices, tribal ordinances, land acquisitions, rules, and federal policy/source leads.' },
    { group:'Census/TIGERweb', title:'Census Geocoder / TIGERweb', type:'geography lead', url:'https://geocoding.geo.census.gov/geocoder/', description:'Use addresses or coordinates to find Census geography leads. Not final proof of title or Indian Country status.' },
    { group:'BIA/LTRO', title:'BIA Land Titles and Records path', type:'official title-record request path', url:'https://www.bia.gov/bia/ots/dtaot/bltr', description:'Use for trust/restricted title documents, patents, deeds, probate orders, leases, rights-of-way, plats, and Title Status Report direction.' },
    { group:'BLM/GLO', title:'BLM General Land Office Records', type:'official federal land-record search', url:'https://glorecords.blm.gov/', description:'Use for federal land patents, survey plats, field notes, tract books, and township land catalog leads.' }
  ];
  return leads;
}
function researchPath(q, detected){
  const steps = [];
  steps.push({ title:'Start with the clue exactly as entered', body:`Search term: ${q}. Keep spelling variants, married names, nicknames, county/town clues, roll/card numbers, and legal descriptions together in the packet.` });
  if (detected.includes('person/family name') || detected.includes('dawes/enrollment clue')) {
    steps.push({ title:'Dawes / enrollment path', body:'Search Dawes Final Roll, census card, enrollment packet, and allotment jacket. Capture roll number, census card number, enrollment category, age, sex, blood degree, and family-card relationships when found.' });
  }
  if (detected.includes('township-range-section')) {
    steps.push({ title:'Land-grid / map path', body:'Use township, range, and section to find LOC map pages, BLM/GLO survey records, county legal-description indexes, and modern county routing.' });
  }
  if (detected.includes('address/place') || detected.includes('coordinates')) {
    steps.push({ title:'Place / geography path', body:'Resolve the place to coordinates, verify the map pin, then run Census/TIGERweb geography lookup for county, tract/block, AIANNH/OTSA/off-reservation trust geography leads. Treat as geography leads only.' });
  }
  if (detected.includes('land-loss/legal-notice clue')) {
    steps.push({ title:'Land-loss notice path', body:'Search county clerk indexes and historic newspapers for deeds, tax deeds, sheriff deeds, mortgage foreclosures, probate, guardian sales, oil/gas leases, liens, judgments, and notices.' });
  }
  if (detected.includes('federal-notice clue')) {
    steps.push({ title:'Federal notice path', body:'Search Federal Register, NARA, BIA/LTRO, and agency source pages for BIA notices, rules, ordinances, land acquisitions, consultations, or official agency actions.' });
  }
  steps.push({ title:'Proof path', body:'Verify every lead against original source records: NARA/OHS Dawes records, allotment jackets, county clerk books/pages, court files, BIA/LTRO title records, tribal records, and official map images.' });
  return steps;
}
function requestPacket(q, detected){
  return [
    { title:'NARA / OHS request clue', body:`I am researching Five Tribes Dawes/allotment records connected to this clue: ${q}. Please help identify any Final Roll entry, census/enrollment card, enrollment packet, allotment jacket, allotment map, NAID/catalog record, packet number, or ordering path.` },
    { title:'County clerk request clue', body:`I am researching land-title history connected to this clue: ${q}. Please search grantor/grantee indexes, legal-description indexes, deeds, mortgages, releases, sheriff deeds, tax deeds, oil/gas leases, liens, judgments, probate-related filings, and related book/page or instrument records.` },
    { title:'BIA/LTRO request clue', body:`I am researching whether trust/restricted Indian land title records exist for this clue: ${q}. Please identify the correct LTRO office and any Title Status Report, patent, deed, probate order, lease, right-of-way, cadastral survey, plat, or other Indian land title document path.` }
  ];
}
function normalizeRecord(row){
  if (!row) return null;
  let r = row;
  if (row.record_json) {
    try { r = JSON.parse(row.record_json); } catch (_) { r = row; }
  }
  return {
    title: r.verified_name || [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || r.sheet_title || 'Approved site record',
    type: r.verified_name ? 'approved allotment/site record' : 'site record',
    url: r.source_link || '',
    description: [r.township_range, r.section ? `Section ${r.section}` : '', r.county ? `${r.county} County` : '', r.notes || r.legal_description || ''].filter(Boolean).join(' · '),
    raw: r
  };
}
async function searchApprovedRecords(env, q){
  if (!env.DB || !q) return [];
  const like = `%${q.slice(0, 80)}%`;
  try {
    const result = await env.DB.prepare(`SELECT record_json, verified_name, township_range, section, county, source_link FROM approved_records
      WHERE record_json LIKE ? OR verified_name LIKE ? OR township_range LIKE ? OR county LIKE ?
      ORDER BY created_at DESC LIMIT 25`).bind(like, like, like, like).all();
    return (result.results || []).map(normalizeRecord).filter(Boolean);
  } catch (_) {
    return [];
  }
}
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const q = clean(url.searchParams.get('q'));
  if (!q) return json({ error:'Missing q search term.' }, 400);
  const detected = classify(q);
  const approved_records = await searchApprovedRecords(env, q);
  return json({
    query: q,
    provider: 'AllottedLand.com unified search planner',
    detected_types: detected,
    research_path: researchPath(q, detected),
    approved_records,
    official_source_leads: sourceLeads(q, detected),
    record_request_packet: requestPacket(q, detected),
    notice: 'Unified search results are research leads, not proof of title, ownership, citizenship, heirship, or legal rights. Verify every lead against original source records.'
  });
}
