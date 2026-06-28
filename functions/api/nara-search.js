// Cloudflare Pages Function: /api/nara-search
// Requires Pages environment variable NARA_API_KEY.
// This keeps the NARA key server-side and returns only lightweight source leads.
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
function first(...vals){ return vals.map(clean).find(Boolean) || ''; }
function asArray(v){ return Array.isArray(v) ? v : (v ? [v] : []); }
function stripHtml(s){ return clean(String(s || '').replace(/<[^>]*>/g, ' ')); }
function findObjValue(obj, keys){
  if (!obj || typeof obj !== 'object') return '';
  for (const key of keys) {
    if (obj[key] != null) return obj[key];
  }
  for (const val of Object.values(obj)) {
    if (val && typeof val === 'object') {
      const found = findObjValue(val, keys);
      if (found) return found;
    }
  }
  return '';
}
function normalize(raw){
  const src = raw?._source || raw?.record || raw?.description || raw || {};
  const naId = first(src.naId, src.naid, src.naIds, raw?._id, findObjValue(src, ['naId','naid']));
  const title = first(src.title, src.heading, src.descriptionTitle, src.objectTitle, findObjValue(src, ['title','heading']));
  const description = stripHtml(first(src.scopeAndContentNote, src.scopeContentNote, src.description, src.summary, src.generalNote, findObjValue(src, ['scopeAndContentNote','description','summary'])));
  const date = first(src.inclusiveStartDate, src.inclusiveEndDate, src.productionDates, src.date, src.coverageDates, findObjValue(src, ['inclusiveStartDate','date']));
  const url = first(src.catalogUrl, src.url, src.onlineUrl, naId ? `https://catalog.archives.gov/id/${encodeURIComponent(naId)}` : 'https://catalog.archives.gov/');
  const thumb = first(src.thumbnailUrl, src.thumbnail, src.previewUrl, findObjValue(src, ['thumbnailUrl','thumbnail']));
  return { title: title || 'NARA Catalog source lead', naId, date, description: description.slice(0, 500), url, thumbnail: thumb };
}
function extractRecords(data){
  const candidates = [
    data?.body?.hits?.hits,
    data?.hits?.hits,
    data?.results,
    data?.records,
    data?.opaResponse?.results?.result,
    data?.body?.results
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const q = clean(url.searchParams.get('q'));
  const limit = Math.max(1, Math.min(20, Number(url.searchParams.get('limit') || 10)));
  if (!q) return json({ error: 'Missing q search term.' }, 400);
  if (!env.NARA_API_KEY) {
    return json({
      error: 'NARA_API_KEY is not configured in Cloudflare Pages environment variables.',
      official_url: `https://catalog.archives.gov/search?q=${encodeURIComponent(q)}`,
      required_notice: 'This product uses the National Archives Catalog API but is not endorsed or certified by the National Archives and Records Administration.'
    }, 501);
  }
  const search = new URL('https://catalog.archives.gov/api/v2/records/search');
  const dawesFocused = `${q} Dawes Five Civilized Tribes allotment enrollment`;
  search.searchParams.set('q', dawesFocused);
  search.searchParams.set('rows', String(limit));
  try {
    const response = await fetch(search.toString(), {
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.NARA_API_KEY
      }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json({ error: data?.error || data?.message || `NARA API returned HTTP ${response.status}.`, official_url: `https://catalog.archives.gov/search?q=${encodeURIComponent(dawesFocused)}` }, response.status);
    }
    const results = extractRecords(data).map(normalize).filter(r => r.title || r.naId).slice(0, limit);
    return json({
      query: q,
      provider: 'NARA Catalog API',
      results,
      official_url: `https://catalog.archives.gov/search?q=${encodeURIComponent(dawesFocused)}`,
      notice: 'This product uses the National Archives Catalog API but is not endorsed or certified by the National Archives and Records Administration.'
    });
  } catch (err) {
    return json({ error: err.message || 'NARA API request failed.', official_url: `https://catalog.archives.gov/search?q=${encodeURIComponent(q)}` }, 502);
  }
}
