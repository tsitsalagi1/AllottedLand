// Cloudflare Pages Function: /api/chronicling-search
// v0.42 Chronicling America / LOC collection connector. No API key required.
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=900' }
});
function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
function first(...vals){ return vals.map(clean).find(Boolean) || ''; }
function officialUrl(q){ return `https://www.loc.gov/collections/chronicling-america/?q=${encodeURIComponent(q)}`; }
function fallbackRows(q, reason){
  const query = clean(q) || 'allotment';
  return [{
    title: 'No automatic newspaper match found',
    url: officialUrl(query),
    date: '',
    type: 'Chronicling America manual search',
    description: 'No matching newspaper record was found automatically. Open Chronicling America to manually check historic newspaper notices for this name, family, or land record.',
    thumbnail: ''
  }];
}
function normalize(item){
  const title = first(item.title, item.item?.title, item.name, 'Chronicling America source lead');
  const url = first(item.url, item.id, item.item?.url, item.link);
  const date = first(Array.isArray(item.date) ? item.date.join(', ') : item.date, item.item?.date, item.created_published);
  const desc = first(
    Array.isArray(item.description) ? item.description.join(' ') : item.description,
    item.item?.description,
    Array.isArray(item.subject) ? item.subject.slice(0,8).join(', ') : item.subject,
    Array.isArray(item.location) ? item.location.join(', ') : item.location
  );
  const image = Array.isArray(item.image_url) ? item.image_url[0] : first(item.image_url, item.thumbnail, item.item?.image_url);
  return { title, url: url || 'https://www.loc.gov/collections/chronicling-america/', date, type: 'Historic newspaper source', description: desc.slice(0, 900), thumbnail: image };
}
async function tryLoc(url){
  const response = await fetch(url.toString(), { headers: { accept: 'application/json,text/plain,*/*' } });
  const text = await response.text();
  let data = {};
  try { data = JSON.parse(text); } catch (_) {}
  return { response, data, text };
}
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const q = clean(url.searchParams.get('q'));
  const place = clean(url.searchParams.get('place'));
  const limit = Math.max(1, Math.min(20, Number(url.searchParams.get('limit') || 10)));
  if (!q) return json({ error: 'Missing q search term.' }, 400);
  const live = new URL('https://www.loc.gov/collections/chronicling-america/');
  live.searchParams.set('fo', 'json');
  live.searchParams.set('at', 'results');
  live.searchParams.set('c', String(limit));
  live.searchParams.set('q', [q, place].filter(Boolean).join(' '));
  try {
    const { response, data } = await tryLoc(live);
    if (!response.ok) return json({ query: q, provider: 'Chronicling America official-source links', results: fallbackRows([q, place].filter(Boolean).join(' '), `HTTP ${response.status}`), official_url: officialUrl(q), fallback: true }, 200);
    const rows = Array.isArray(data?.results) ? data.results.map(normalize).filter(r => r.title || r.url).slice(0, limit) : [];
    if (!rows.length) return json({ query: q, provider: 'Chronicling America official-source links', results: fallbackRows([q, place].filter(Boolean).join(' '), '0 live rows'), official_url: officialUrl(q), fallback: true }, 200);
    return json({ query: q, provider: 'LOC / Chronicling America API', results: rows, official_url: live.toString(), fallback: false });
  } catch (err) {
    return json({ query: q, provider: 'Chronicling America official-source links', results: fallbackRows([q, place].filter(Boolean).join(' '), err.message || 'request failed'), official_url: officialUrl(q), fallback: true }, 200);
  }
}
