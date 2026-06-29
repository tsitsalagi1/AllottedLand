// Cloudflare Pages Function: /api/loc-search
// v0.40: resilient LOC connector. If LOC blocks/limits server-side JSON fetches,
// return printable official-source link cards instead of an HTTP error.
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=900' }
});
function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
function first(...vals){ return vals.map(clean).find(Boolean) || ''; }
function officialLinks(q){
  const baseQ = clean(q) || 'Cherokee Indian Territory allotment map';
  const mapQ = [baseQ, 'Indian Territory allotment map'].join(' ');
  return {
    mapsSearch: `https://www.loc.gov/maps/?q=${encodeURIComponent(mapQ)}&fa=location:oklahoma`,
    generalSearch: `https://www.loc.gov/search/?q=${encodeURIComponent(mapQ)}&fa=partof:maps|location:oklahoma`,
    atlasSearch: `https://www.loc.gov/maps/?q=${encodeURIComponent(baseQ + ' Cherokee Nation atlas')}`
  };
}
function fallbackRows(q, reason){
  const links = officialLinks(q);
  return [
    {
      title: `Open Library of Congress map search for: ${q}`,
      url: links.mapsSearch,
      date: '',
      description: reason ? `LOC did not return live JSON through the server connector (${reason}). Use this official LOC map search link and print/save it as a source lead.` : 'Official LOC map search prepared from the user clues.',
      thumbnail: ''
    },
    {
      title: 'Search LOC general results filtered to maps/Oklahoma',
      url: links.generalSearch,
      date: '',
      description: 'Backup LOC search path. Useful when the maps endpoint blocks a proxy request or when records are indexed outside the /maps/ endpoint.',
      thumbnail: ''
    },
    {
      title: 'Search LOC for Cherokee Nation atlas / allotment map clues',
      url: links.atlasSearch,
      date: '',
      description: 'Use for atlas pages, township/range pages, and historic Indian Territory map records.',
      thumbnail: ''
    }
  ];
}
function normalize(item){
  const title = first(item.title, item.item?.title, item.name);
  const url = first(item.url, item.id, item.item?.url, item.link);
  const date = first(Array.isArray(item.date) ? item.date.join(', ') : item.date, item.item?.date);
  const desc = first(
    Array.isArray(item.description) ? item.description.join(' ') : item.description,
    item.item?.description,
    Array.isArray(item.subject) ? item.subject.slice(0,8).join(', ') : item.subject,
    item.partof
  );
  const image = Array.isArray(item.image_url) ? item.image_url[0] : first(item.image_url, item.thumbnail, item.item?.image_url);
  return { title: title || 'LOC source lead', url: url || 'https://www.loc.gov/maps/', date, description: desc.slice(0, 700), thumbnail: image };
}
async function tryLoc(url){
  const response = await fetch(url.toString(), {
    headers: {
      'accept': 'application/json,text/plain,*/*'
    }
  });
  const text = await response.text();
  let data = {};
  try { data = JSON.parse(text); } catch (_) {}
  return { response, data, text };
}
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const q = clean(url.searchParams.get('q'));
  const limit = Math.max(1, Math.min(20, Number(url.searchParams.get('limit') || 10)));
  if (!q) return json({ error: 'Missing q search term.' }, 400);

  const q2 = `${q} Indian Territory allotment map`;
  const urls = [];
  const loc1 = new URL('https://www.loc.gov/maps/');
  loc1.searchParams.set('fo', 'json');
  loc1.searchParams.set('at', 'results');
  loc1.searchParams.set('c', String(limit));
  loc1.searchParams.set('q', q2);
  loc1.searchParams.set('fa', 'location:oklahoma');
  urls.push(loc1);

  const loc2 = new URL('https://www.loc.gov/search/');
  loc2.searchParams.set('fo', 'json');
  loc2.searchParams.set('at', 'results');
  loc2.searchParams.set('c', String(limit));
  loc2.searchParams.set('q', q2);
  loc2.searchParams.set('fa', 'partof:maps|location:oklahoma');
  urls.push(loc2);

  let lastError = '';
  for (const loc of urls) {
    try {
      const { response, data, text } = await tryLoc(loc);
      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        continue;
      }
      const rows = Array.isArray(data?.results) ? data.results : (Array.isArray(data) ? data : []);
      if (rows.length) {
        return json({ query: q, provider: 'Library of Congress JSON/YAML API', results: rows.map(normalize).slice(0, limit), official_url: loc.toString(), fallback: false });
      }
      lastError = '0 JSON results';
    } catch (err) {
      lastError = err.message || 'LOC request failed';
    }
  }
  return json({
    query: q,
    provider: 'Library of Congress official-source links',
    results: fallbackRows(q, lastError),
    official_url: officialLinks(q).mapsSearch,
    fallback: true,
    notice: 'LOC API is public, but rate limiting/proxy blocking can occur. AllottedLand.com returned official LOC links instead of failing the user search.'
  });
}
