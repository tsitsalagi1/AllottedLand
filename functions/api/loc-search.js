// Cloudflare Pages Function: /api/loc-search
// Public Library of Congress JSON/YAML API proxy for map/source leads.
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=900' }
});
function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
function first(...vals){ return vals.map(clean).find(Boolean) || ''; }
function normalize(item){
  const title = first(item.title, item.item?.title, item.name);
  const url = first(item.url, item.id, item.item?.url);
  const date = first(item.date, item.item?.date, Array.isArray(item.date) ? item.date.join(', ') : '');
  const desc = first(item.description, item.item?.description, Array.isArray(item.description) ? item.description.join(' ') : '', item.subject && Array.isArray(item.subject) ? item.subject.slice(0,6).join(', ') : '');
  const image = Array.isArray(item.image_url) ? item.image_url[0] : first(item.image_url, item.thumbnail, item.item?.image_url);
  return { title: title || 'LOC source lead', url: url || 'https://www.loc.gov/maps/', date, description: desc.slice(0, 500), thumbnail: image };
}
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const q = clean(url.searchParams.get('q'));
  const limit = Math.max(1, Math.min(20, Number(url.searchParams.get('limit') || 10)));
  if (!q) return json({ error: 'Missing q search term.' }, 400);
  const loc = new URL('https://www.loc.gov/maps/');
  loc.searchParams.set('fo', 'json');
  loc.searchParams.set('at', 'results');
  loc.searchParams.set('c', String(limit));
  loc.searchParams.set('q', `${q} Indian Territory allotment`);
  loc.searchParams.set('fa', 'location:oklahoma');
  try {
    const response = await fetch(loc.toString(), { headers: { 'accept': 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return json({ error: `LOC API returned HTTP ${response.status}.`, official_url: loc.toString() }, response.status);
    const rows = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
    return json({ query: q, provider: 'Library of Congress JSON/YAML API', results: rows.map(normalize).slice(0, limit), official_url: loc.toString() });
  } catch (err) {
    return json({ error: err.message || 'LOC API request failed.', official_url: loc.toString() }, 502);
  }
}
