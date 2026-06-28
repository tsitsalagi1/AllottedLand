// Cloudflare Pages Function: /api/nara-search
// v0.40: broader NARA search and printable fallback leads.
// Requires Pages environment variable NARA_API_KEY for live API results.
const NOTICE = 'This product uses the National Archives Catalog API but is not endorsed or certified by the National Archives and Records Administration.';
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
function first(...vals){ return vals.map(clean).find(Boolean) || ''; }
function stripHtml(s){ return clean(String(s || '').replace(/<[^>]*>/g, ' ')); }
function findObjValue(obj, keys){
  if (!obj || typeof obj !== 'object') return '';
  for (const key of keys) if (obj[key] != null) return obj[key];
  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object') {
      const found = findObjValue(val, keys);
      if (found) return found;
    }
  }
  return '';
}
function dateText(v){
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) return v.map(dateText).filter(Boolean).join('; ');
  if (typeof v === 'object') return clean(v.logicalDate || [v.month, v.day, v.year].filter(Boolean).join('/') || v.year || '');
  return clean(v);
}
function normalize(raw){
  const sourceRoot = raw?._source || raw?.record || raw?.description || raw || {};
  const rec = sourceRoot.record || sourceRoot.description || sourceRoot;
  const naId = first(rec.naId, rec.naid, sourceRoot.naId, sourceRoot.naid, raw?._id, findObjValue(sourceRoot, ['naId','naid']));
  const title = first(rec.title, rec.heading, rec.descriptionTitle, rec.objectTitle, sourceRoot.title, findObjValue(sourceRoot, ['title','heading']));
  const level = first(rec.levelOfDescription, findObjValue(sourceRoot, ['levelOfDescription']));
  const type = first(Array.isArray(rec.generalRecordsTypes) ? rec.generalRecordsTypes.join(', ') : rec.generalRecordsTypes, rec.recordType, findObjValue(sourceRoot, ['recordType']));
  const description = stripHtml(first(rec.scopeAndContentNote, rec.description, rec.summary, rec.generalNote, sourceRoot.description, findObjValue(sourceRoot, ['scopeAndContentNote','description','summary'])));
  const dates = first(dateText(rec.productionDates), dateText(rec.inclusiveStartDate), dateText(rec.coverageDates), dateText(rec.date), findObjValue(sourceRoot, ['date']));
  const ancestors = Array.isArray(rec.ancestors) ? rec.ancestors.map(a => a.title).filter(Boolean).slice(0,3).join(' > ') : '';
  const url = first(rec.catalogUrl, rec.url, rec.onlineUrl, sourceRoot.catalogUrl, naId ? `https://catalog.archives.gov/id/${encodeURIComponent(naId)}` : 'https://catalog.archives.gov/');
  const digital = Array.isArray(rec.digitalObjects) ? rec.digitalObjects[0] : null;
  const thumb = first(rec.thumbnailUrl, digital?.thumbnailUrl, digital?.objectUrl, findObjValue(sourceRoot, ['thumbnailUrl','thumbnail']));
  return { title: title || 'NARA Catalog source lead', naId, date: dates, level, type, partOf: ancestors, description: description.slice(0, 800), url, thumbnail: thumb };
}
function extractRecords(data){
  const candidates = [data?.body?.hits?.hits, data?.hits?.hits, data?.results, data?.records, data?.opaResponse?.results?.result, data?.body?.results];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}
function officialUrl(q){ return `https://catalog.archives.gov/search?q=${encodeURIComponent(q)}`; }
function fallbackRows(q, reason){
  const broad = clean(q) || 'Dawes Five Civilized Tribes';
  const dawes = `${broad} Dawes`;
  return [
    { title: `Open NARA Catalog search for: ${broad}`, naId: '', date: '', level: 'official link', type: 'Catalog search', description: reason ? `NARA live API did not return usable rows (${reason}). Open this official NARA Catalog search as the source lead.` : 'Prepared official NARA Catalog search link.', url: officialUrl(broad), thumbnail: '' },
    { title: 'Search NARA for Dawes / Five Civilized Tribes records', naId: '', date: '', level: 'official link', type: 'Catalog search', description: 'Backup search path for Final Dawes Rolls, census/enrollment cards, enrollment packets, allotment jackets, and related records.', url: officialUrl(`${dawes} Five Civilized Tribes enrollment allotment`), thumbnail: '' },
    { title: 'NARA Dawes Rolls research guide', naId: '', date: '', level: 'official guide', type: 'Research guide', description: 'NARA guide explaining Final Rolls, census cards, enrollment applications, allotment jackets, and map research steps.', url: 'https://www.archives.gov/research/native-americans/dawes', thumbnail: '' }
  ];
}
function buildQueries(q){
  const base = clean(q);
  const parts = [base];
  if (!/dawes/i.test(base)) parts.push(`${base} Dawes`);
  parts.push(`${base} Five Civilized Tribes`);
  parts.push(`${base} enrollment`);
  parts.push(`${base} allotment`);
  return [...new Set(parts.map(clean).filter(Boolean))].slice(0, 5);
}
async function callNara(q, limit, key){
  const search = new URL('https://catalog.archives.gov/api/v2/records/search');
  search.searchParams.set('q', q);
  search.searchParams.set('rows', String(Math.max(1, Math.min(20, limit))));
  const response = await fetch(search.toString(), {
    headers: { 'content-type': 'application/json', 'x-api-key': key }
  });
  const data = await response.json().catch(() => ({}));
  return { response, data, url: search.toString() };
}
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const q = clean(url.searchParams.get('q'));
  const limit = Math.max(1, Math.min(20, Number(url.searchParams.get('limit') || 10)));
  if (!q) return json({ error: 'Missing q search term.' }, 400);
  if (!env.NARA_API_KEY || env.NARA_API_KEY === 'your_read_only_nara_catalog_api_key') {
    return json({ query: q, provider: 'NARA official-source links', results: fallbackRows(q, 'NARA_API_KEY is not configured'), official_url: officialUrl(q), fallback: true, notice: NOTICE });
  }
  const seen = new Set();
  const results = [];
  let lastError = '';
  let usedUrl = officialUrl(q);
  for (const query of buildQueries(q)) {
    try {
      const { response, data, url: apiUrl } = await callNara(query, limit, env.NARA_API_KEY);
      usedUrl = officialUrl(query);
      if (!response.ok) { lastError = data?.error || data?.message || `HTTP ${response.status}`; continue; }
      const rows = extractRecords(data).map(normalize).filter(r => r.title || r.naId);
      for (const r of rows) {
        const key = r.naId || r.url || r.title;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push(r);
        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    } catch (err) {
      lastError = err.message || 'NARA API request failed';
    }
  }
  if (!results.length) {
    return json({ query: q, provider: 'NARA official-source links', results: fallbackRows(q, lastError || '0 live rows'), official_url: officialUrl(q), fallback: true, notice: NOTICE });
  }
  return json({ query: q, provider: 'NARA Catalog API', results, official_url: usedUrl, fallback: false, notice: NOTICE });
}
