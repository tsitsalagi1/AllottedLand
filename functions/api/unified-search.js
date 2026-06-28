// Cloudflare Pages Function: /api/unified-search
// v0.51: one-search research planner for AllottedLand.com.
// Builds research paths, matching approved-record leads, source links, and agency request packets.
const json = (body, status = 200) => new Response(JSON.stringify(body, null, 2), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
function lower(v){ return clean(v).toLowerCase(); }
function digits(v){ return clean(v).replace(/[^0-9]/g, ''); }

function queryNameParts(q){
  const cleaned = clean(q).replace(/\b(roll|enrollment|card|census|section|township|range|county|ave|avenue|street|road|tax|sale|sheriff|probate|guardian)\b/gi, ' ');
  const m = cleaned.match(/\b([A-Z][A-Za-z'’.-]{2,})\s+([A-Z][A-Za-z'’.-]{2,})\b/);
  return m ? {first:lower(m[1]), last:lower(m[2])} : null;
}
function numbersFromQuery(q){
  const found = [];
  const re = /\b(?:roll|enrollment|card|census card|allotment|no\.?|number)\s*#?\s*(\d{2,7})\b/gi;
  let m;
  while ((m = re.exec(clean(q)))) found.push(m[1]);
  return found;
}
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
  if (/\b(roll|enrollment|card|census card|dawes)\b/i.test(q) || /^\d{2,7}$/.test(digits(q))) types.push('dawes/enrollment information');
  if (looksName(q)) types.push('person/family name');
  if (includesAny(q, ['tax sale','sheriff sale','guardian','probate','foreclosure','mortgage','oil','gas lease','restricted indian land','deed','judgment'])) types.push('land-loss/legal-notice information');
  if (includesAny(q, ['bureau of indian affairs','bia','federal register','rule','notice','ordinance','trust acquisition','land into trust'])) types.push('federal-notice information');
  if (!types.length) types.push('general research information');
  return types;
}
function sourceLeads(q){
  const qDawes = [q, 'Dawes Five Civilized Tribes allotment enrollment'].join(' ');
  const mapQ = [q, 'Indian Territory allotment map township range section'].join(' ');
  const newsQ = [q, 'tax sale sheriff sale guardian probate allotment'].join(' ');
  const frQ = [q, 'Bureau of Indian Affairs allotment land'].join(' ');
  return [
    { group:'NARA', title:'Search NARA Catalog', type:'official source search', url:`https://catalog.archives.gov/search?q=${escUrl(qDawes)}`, description:'Search for Dawes rolls, census/enrollment cards, enrollment packets, allotment jackets, maps, RG 48, and RG 75 record leads.' },
    { group:'NARA', title:'NARA Dawes research guide', type:'research guide', url:'https://www.archives.gov/research/native-americans/dawes', description:'Plain guide explaining Final Dawes Rolls, census cards, enrollment applications, allotment jackets, maps, and the proper order of research.' },
    { group:'OHS', title:'Oklahoma Historical Society Dawes search', type:'state source search', url:'https://www.okhistory.org/research/dawes', description:'Search by first name, last name, tribal nation, roll number, or card number, then use the card/roll result to find packets.' },
    { group:'LOC Maps', title:'Library of Congress map search', type:'official map search', url:`https://www.loc.gov/maps/?q=${escUrl(mapQ)}&fa=location:oklahoma`, description:'Search allotment maps, Indian Territory maps, township/range atlas pages, and map-image record leads.' },
    { group:'Newspapers', title:'Chronicling America newspaper search', type:'historic newspaper search', url:`https://www.loc.gov/collections/chronicling-america/?q=${escUrl(newsQ)}`, description:'Search historic newspapers for tax-sale, sheriff-sale, probate, guardianship, oil/gas, and local legal notices.' },
    { group:'Federal notices', title:'Federal Register search', type:'federal notice search', url:`https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=${escUrl(frQ)}`, description:'Search BIA notices, tribal ordinances, land acquisitions, rules, and federal policy records. Verify legal reliance against the official PDF/govinfo source.' },
    { group:'Census/TIGERweb', title:'Census Geocoder / TIGERweb', type:'geography lead', url:'https://geocoding.geo.census.gov/geocoder/', description:'Use addresses or coordinates to find Census geography leads. This is not final proof of title, ownership, or Indian Country status.' },
    { group:'BIA/LTRO', title:'BIA Land Titles and Records request path', type:'official title-record request path', url:'https://www.bia.gov/bia/ots/dtaot/bltr', description:'Use for trust/restricted title documents, patents, deeds, probate orders, leases, rights-of-way, plats, and Title Status Report direction.' },
    { group:'BLM/GLO', title:'BLM General Land Office Records', type:'official federal land-record search', url:'https://glorecords.blm.gov/', description:'Search federal land patents, survey plats, field notes, tract books, and township land catalog leads.' }
  ];
}
function researchPath(q, detected){
  const steps = [];
  const starter = /do not know where to start|don't know where to start|start anywhere|general five tribes/i.test(q);
  steps.push({
    title:'1. Put the information you have in one working file',
    body:`Start with the information exactly as entered: ${q}. Do not clean it up too much yet. Old spelling, nicknames, county names, book/page references, and family stories can be the thing that finds the record.`,
    where:'Your family papers, old deeds, cemetery notes, screenshots, county records, BIA replies, emails, and this printable AllottedLand.com packet.',
    lookFor:'Names, spelling variants, married names, relatives, tribe/Nation, roll/card/allotment numbers, county, town, cemetery, creek, township/range/section, deed book/page, case number, and dates.'
  });
  if (starter || detected.includes('person/family name') || detected.includes('dawes/enrollment information')) {
    steps.push({
      title:'2. Start with the Dawes Final Roll entry',
      body:'For Cherokee, Choctaw, Chickasaw, Creek/Muscogee, and Seminole research in Indian Territory, the Dawes Final Roll entry is usually the first hard lead. It can identify the roll/enrollment number and census card number.',
      where:'Oklahoma Historical Society Dawes search, NARA Catalog, AllottedLand.com Dawes/index leads, and the NARA Dawes guide.',
      lookFor:'Roll/enrollment number, name, tribe, enrollment category, age, sex, blood degree, and census card number.'
    });
    steps.push({
      title:'3. Use the census card number to find the family card',
      body:'The census card is usually the family-group record. It may show relatives, relationship to head of household, parents, card transfers, rejected/doubtful status, and related cards.',
      where:'NARA Catalog Enrollment Cards series, OHS research path, FamilySearch/Ancestry access where available, and NARA research facilities.',
      lookFor:'Card number, family members, relationships, parents, age, sex, blood degree, earlier-roll references, birth/death/marriage notes, and rejected/doubtful markings.'
    });
    steps.push({
      title:'4. Pull the enrollment application or testimony packet',
      body:'The enrollment application can explain the short index result. It may contain testimony, affidavits, residence or post-office information, objections, correspondence, and family evidence.',
      where:'NARA Catalog Applications for Enrollment series, NARA Fort Worth, OHS ordering guidance, FamilySearch/Ancestry when available.',
      lookFor:'Application number, census card number, testimony, residence, parent and relative names, affidavits, correspondence, objections, and appeal information.'
    });
  }
  if (starter || detected.includes('dawes/enrollment information') || detected.includes('person/family name') || detected.includes('township-range-section')) {
    steps.push({
      title:'5. Find the land allotment jacket',
      body:'If the person was approved, the allotment jacket is the bridge from person to land. It is the record most likely to give the legal land description.',
      where:'NARA Dawes Land Allotment Jackets / Applications for Allotment, FamilySearch, Ancestry, NARA research facilities, and BIA/LTRO information.',
      lookFor:'Enrollment number, legal description, township/range/section, physical location, improvements, plat maps, correspondence, and contested allotment notices.'
    });
  }
  if (starter || detected.includes('township-range-section')) {
    steps.push({
      title:'6. Use township/range/section to find maps and county records',
      body:'Once you have township, range, and section, search map pages and county land records. The map tells where to look; the title and court records tell what happened later.',
      where:'AllottedLand.com map index, Library of Congress maps, NARA allotment maps, BLM/GLO survey plats and tract books, county GIS, county clerk, and court records.',
      lookFor:'Township, range, section, map page, allottee name or map number, nearby names, roads, rivers, railroad rights-of-way, townsites, deed book/page, and instrument numbers.'
    });
  }
  if (starter || detected.includes('address/place') || detected.includes('coordinates')) {
    steps.push({
      title:'7. Convert modern places to coordinates, then verify the map pin',
      body:'Modern addresses and place names are only starting points. Resolve the place to coordinates, then check whether the pin is actually on the land being researched.',
      where:'AllottedLand.com address-to-coordinate lookup, Census Geocoder, TIGERweb AIANNH layers, county GIS, official tribal/federal maps, and original land descriptions.',
      lookFor:'Latitude/longitude, county, tract/block, Census tribal-geography leads, and whether the pin lines up with the historic legal description.'
    });
  }
  if (starter || detected.includes('land-loss/legal-notice information')) {
    steps.push({
      title:'8. Search for the legal event that moved the land',
      body:'If the family lost the land, identify the legal mechanism. Do not stop at “it was sold.” Look for the document that caused the transfer.',
      where:'County clerk grantor/grantee indexes, legal-description indexes, treasurer tax-sale records, sheriff-sale files, court/probate/guardianship records, historic newspapers, and AllottedLand.com Land Loss Project intake.',
      lookFor:'Tax deed, sheriff deed, mortgage foreclosure, guardian sale, probate order, partition, deed, lease, oil/gas instrument, court judgment, publication notice, buyer/lender name, sale amount, acreage, and whether federal approval appears.'
    });
  }
  if (starter || detected.includes('federal-notice information')) {
    steps.push({
      title:'9. Check federal notices and agency records',
      body:'Federal notices may show BIA/Interior involvement, tribal ordinances, land acquisitions, repatriation notices, environmental records, policy trails, or agency contacts.',
      where:'Federal Register, NARA Catalog, BIA/LTRO, DOI/BIA pages, Regulations.gov when added, and agency FOIA/contact paths.',
      lookFor:'Agency, docket or notice number, FR citation, date, official PDF/govinfo link, BIA region or office, tribe, county, land description, and contact person.'
    });
  }
  steps.push({
    title:'10. Verify against original records before relying on it',
    body:'A website result is a lead. The proof is the original record chain. Verify each match before using it for legal, title, heirship, enrollment, or ownership claims.',
    where:'BIA/LTRO Title Status Report path, county clerk and court records, NARA/OHS images, tribal records offices, BLM/GLO, and qualified legal counsel where needed.',
    lookFor:'Patent, allotment jacket, deed, probate order, lease, right-of-way, plat, Title Status Report, restriction/removal approval, tax deed, sheriff deed, mortgage, release, and full chain of title.'
  });
  return steps;
}
function requestPacket(q){
  const information = q || '[describe the family/land information]';
  return [
    {
      title:'NARA / OHS Dawes records request',
      summary:'Use this when asking for help locating Dawes roll, card, enrollment packet, allotment jacket, or map leads.',
      body:`Hello,\n\nI am researching Five Tribes Dawes and allotment records for my family. The information I have is:\n\n${information}\n\nI am trying to find the record trail that connects the person or family name to any Dawes roll entry, census/enrollment card, enrollment application packet, land allotment jacket, and allotment map.\n\nPlease help identify any of the following records or search paths:\n\n1. Final Dawes Roll entry, including roll/enrollment number, tribe, enrollment category, age, sex, blood degree, and census card number.\n2. Dawes census/enrollment card for the family group, including related card numbers or rejected/doubtful card references.\n3. Enrollment application or testimony packet, including application/card number and any residence, family, or correspondence information.\n4. Land allotment jacket or application for allotment, including enrollment number, legal description, township/range/section, plat map, correspondence, or contested allotment notice.\n5. Allotment map or catalog/source link connected to the legal description.\n\nIf your office does not hold the record, please tell me the correct repository, series name, catalog link, packet number, or ordering process.\n\nThank you.`
    },
    {
      title:'County clerk / court records request',
      summary:'Use this for county land records, tax sale, sheriff sale, probate, guardianship, mortgage, deed, oil/gas, or court files.',
      body:`Hello,\n\nI am researching the county land-record and court-record history for a possible allotted-land tract or family land trail. The information I have is:\n\n${information}\n\nI am trying to find out what county records show about the land, who owned it, and whether it was sold, mortgaged, foreclosed, taxed, probated, leased, or transferred.\n\nPlease search any available records or indexes for:\n\n1. Grantor/grantee deeds and deed indexes.\n2. Legal-description indexes by township, range, section, subdivision, or tract.\n3. Mortgages, releases, liens, judgments, sheriff deeds, and foreclosure records.\n4. Tax sale, resale, treasurer deed, or county tax records.\n5. Probate, guardianship, partition, minor’s sale, or estate records.\n6. Oil and gas leases, assignments, releases, and related instruments.\n7. Book/page, instrument number, case number, filing date, buyer/lender name, sale amount, acreage, and legal description.\n\nPlease also tell me whether the county has older index books, archived case files, or a separate office where these records must be requested.\n\nThank you.`
    },
    {
      title:'BIA / LTRO Indian land title request',
      summary:'Use this when the question is trust/restricted title, patents, deeds, probate orders, leases, rights-of-way, plats, or Title Status Report direction.',
      body:`Hello,\n\nI am researching whether there are Bureau of Indian Affairs / Land Titles and Records documents connected to a possible allotted-land or restricted/trust land title trail. The information I have is:\n\n${information}\n\nI am trying to identify whether federal Indian land title records exist and which office can verify the title/restriction history.\n\nPlease help identify the correct LTRO or BIA office and any available path to request or locate:\n\n1. Title Status Report or other title-status information, if available to the requester.\n2. Allotment patent or original allotment title document.\n3. Deeds, approved conveyances, restriction-removal approvals, or federal approvals.\n4. Probate orders, estate documents, partitions, or heirship-related title records.\n5. Leases, oil/gas instruments, rights-of-way, easements, cadastral surveys, plats, or subdivision documents.\n6. Any BIA file number, tract ID, allotment number, enrollment number, legal description, or office routing information needed to continue the search.\n\nIf this request must be sent to a different LTRO, agency, regional office, or FOIA office, please provide the correct contact and what identifiers I should include.\n\nThank you.`
    },
    {
      title:'BLM/GLO land and survey records request path',
      summary:'Use this when the information includes township/range/section and you need federal land/survey context.',
      body:`Hello,\n\nI am researching federal land and survey records connected to this information:\n\n${information}\n\nI am trying to find whether any federal land patent, survey plat, field note, tract book, township record, or land-status record helps identify the land location or title history.\n\nPlease help identify where to search for:\n\n1. Township/range/section survey plats.\n2. Field notes and tract books.\n3. Federal land patents or conveyance records.\n4. Land-status or control-document index records.\n5. Any meridian, township, range, section, aliquot part, or patent/certificate number needed to continue the search.\n\nThank you.`
    }
  ];
}
function extractTRS(s){
  const q = lower(s).replace(/,/g,' ');
  let t='', r='', sec='';
  let m = q.match(/\bt\s*(\d{1,2})\s*n?\s*r\s*(\d{1,2})\s*e?\b/);
  if (!m) m = q.match(/\btownship\s*(\d{1,2}).*?\brange\s*(\d{1,2})\b/);
  if (m) { t = m[1]; r = m[2]; }
  const sm = q.match(/\bsection\s*(\d{1,2})\b|\bsec\.?\s*(\d{1,2})\b|\bs\s*(\d{1,2})\b/);
  if (sm) sec = sm[1] || sm[2] || sm[3] || '';
  return {t,r,sec};
}
function normalizeRecord(row){
  if (!row) return null;
  let r = row;
  if (row.record_json) { try { r = JSON.parse(row.record_json); } catch (_) { r = row; } }
  return {
    title: r.verified_name || [r.first_name, r.middle_name, r.last_name].filter(Boolean).join(' ') || r.sheet_title || 'Approved site record',
    type: r.verified_name ? 'approved allotment/site record' : 'site record',
    url: r.source_link || '',
    description: [r.township_range, r.section ? `Section ${r.section}` : '', r.county ? `${r.county} County` : '', r.notes || r.legal_description || ''].filter(Boolean).join(' · '),
    raw: r
  };
}
function recordScore(row, q){
  let r = row;
  if (row?.record_json) { try { r = JSON.parse(row.record_json); } catch (_) { r = row; } }
  const b = lower(JSON.stringify(r || {}));
  const title = lower([r.verified_name, r.first_name, r.middle_name, r.last_name, r.full_name].filter(Boolean).join(' '));
  let score = 0, strong = false;
  let numberMatched = false;
  for (const ds of numbersFromQuery(q)) {
    if (ds && ds.length >= 2 && b.includes(ds)) { score += 50; strong = true; numberMatched = true; }
  }
  let personMatched = false;
  const nm = queryNameParts(q);
  if (nm) {
    if (title.includes(nm.first) && title.includes(nm.last)) { score += 60; strong = true; personMatched = true; }
    else if (title.includes(nm.last) && nm.last.length > 3) { score += 30; strong = true; personMatched = true; }
  }
  const qt = extractTRS(q), rt = extractTRS([r.township_range, r.legal_description, r.description, r.notes].filter(Boolean).join(' '));
  if (!rt.t && r.township) rt.t = String(r.township).replace(/\D/g,'');
  if (!rt.r && r.range) rt.r = String(r.range).replace(/\D/g,'');
  if (!rt.sec && r.section) rt.sec = String(r.section).replace(/\D/g,'');
  if (qt.t && qt.r && qt.t === rt.t && qt.r === rt.r) { score += 45; strong = true; }
  if (qt.sec && qt.sec === rt.sec && qt.t && qt.r && qt.t === rt.t && qt.r === rt.r) score += 12;
  if ((nm || numbersFromQuery(q).length) && !personMatched && !numberMatched) return 0;
  return strong && score >= 24 ? score : 0;
}
async function searchApprovedRecords(env, q){
  if (!env.DB || !q) return [];
  try {
    const result = await env.DB.prepare(`SELECT record_json, verified_name, township_range, section, county, source_link FROM approved_records ORDER BY created_at DESC LIMIT 500`).all();
    return (result.results || []).map(row => ({row, score:recordScore(row, q)})).filter(x => x.score > 0).sort((a,b)=>b.score-a.score).slice(0, 12).map(x => normalizeRecord(x.row)).filter(Boolean);
  } catch (_) { return []; }
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
