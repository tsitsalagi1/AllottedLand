// Cloudflare Pages Function: /api/census-lookup
// v0.43 Census geocoder + TIGERweb AIANNH/OTSA source-lead connector. No API key required for these services.
// Hotfix: blank lat/lon query params must stay null; Number(null) becomes 0 and caused false Gulf-of-Guinea coordinate lookups.
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=900' }
});
function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
function first(...vals){ return vals.map(clean).find(Boolean) || ''; }
function num(v){
  const raw = String(v == null ? '' : v).trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
function safeStr(v){ return clean(typeof v === 'object' ? JSON.stringify(v) : v); }
const AIANNH_LAYERS = [
  { id: 2, label: 'Federal American Indian Reservations' },
  { id: 3, label: 'Off-Reservation Trust Lands' },
  { id: 7, label: 'Oklahoma Tribal Statistical Areas' },
  { id: 8, label: 'State Designated Tribal Statistical Areas' }
];
function officialCensusUrl(){ return 'https://geocoding.geo.census.gov/geocoder/'; }
function officialTigerUrl(){ return 'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer'; }
function card(title, url, type, description, sourceId){ return { title, url, date: '', type, sourceId: sourceId || '', description: clean(description).slice(0, 1000), thumbnail: '' }; }
function geographyCards(geos){
  const rows = [];
  if (!geos || typeof geos !== 'object') return rows;
  for (const [layer, items] of Object.entries(geos)) {
    if (!Array.isArray(items) || !items.length) continue;
    for (const item of items.slice(0, 5)) {
      const name = first(item.NAME, item.BASENAME, item.GEOID, item.GEOIDFQ, item.COUNTY, layer);
      const id = first(item.GEOID, item.GEOIDFQ, item.COUNTY, item.TRACT, item.BLOCK);
      rows.push(card(`${layer}: ${name}`, officialCensusUrl(), 'Census geocoder geography', Object.entries(item).slice(0,12).map(([k,v]) => `${k}: ${safeStr(v)}`).join(' · '), id));
    }
  }
  return rows;
}
async function geocode(address, lat, lon){
  let url;
  if (lat != null && lon != null) {
    url = new URL('https://geocoding.geo.census.gov/geocoder/geographies/coordinates');
    url.searchParams.set('x', String(lon));
    url.searchParams.set('y', String(lat));
  } else {
    url = new URL('https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress');
    url.searchParams.set('address', address);
  }
  url.searchParams.set('benchmark', 'Public_AR_Current');
  url.searchParams.set('vintage', 'Current_Current');
  url.searchParams.set('layers', 'all');
  url.searchParams.set('format', 'json');
  const response = await fetch(url.toString(), { headers: { accept: 'application/json' } });
  const data = await response.json().catch(() => ({}));
  return { response, data, url: url.toString() };
}
async function queryTigerPoint(layer, lat, lon){
  const url = new URL(`https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer/${layer.id}/query`);
  url.searchParams.set('f', 'json');
  url.searchParams.set('geometry', JSON.stringify({ x: lon, y: lat, spatialReference: { wkid: 4326 } }));
  url.searchParams.set('geometryType', 'esriGeometryPoint');
  url.searchParams.set('inSR', '4326');
  url.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  url.searchParams.set('outFields', 'NAME,BASENAME,GEOID,AIANNH,AIANNHCC,AIANNHCOMP,LSADC,MTFCC,OID');
  url.searchParams.set('returnGeometry', 'false');
  const response = await fetch(url.toString(), { headers: { accept: 'application/json' } });
  const data = await response.json().catch(() => ({}));
  const features = Array.isArray(data.features) ? data.features : [];
  return features.map(f => {
    const a = f.attributes || {};
    const name = first(a.NAME, a.BASENAME, a.GEOID, layer.label);
    return card(`${layer.label}: ${name}`, `https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer/${layer.id}`, 'Census TIGERweb AIANNH geography lead', Object.entries(a).filter(([,v]) => clean(v)).map(([k,v]) => `${k}: ${safeStr(v)}`).join(' · '), first(a.GEOID, a.AIANNH, a.OID));
  });
}
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const address = clean(url.searchParams.get('address'));
  let lat = num(url.searchParams.get('lat'));
  let lon = num(url.searchParams.get('lon'));
  const limit = Math.max(1, Math.min(30, Number(url.searchParams.get('limit') || 20)));
  if (!address && (lat == null || lon == null)) return json({ error: 'Enter an address, or both lat and lon.' }, 400);
  const rows = [];
  let officialUrl = officialCensusUrl();
  try {
    const g = await geocode(address, lat, lon);
    officialUrl = g.url;
    if (!g.response.ok) return json({ query: address || `${lat},${lon}`, provider: 'Census official-source links', results: [card('Open Census Geocoder', officialCensusUrl(), 'Census lookup', `Census Geocoder returned HTTP ${g.response.status}. Use the official tool directly.`, '')], official_url: officialCensusUrl(), fallback: true }, 200);
    if (address) {
      const match = g.data?.result?.addressMatches?.[0];
      if (match) {
        rows.push(card(`Census geocoder matched: ${first(match.matchedAddress, address)}`, officialUrl, 'Census geocoder match', `Coordinates: ${match.coordinates?.y || ''}, ${match.coordinates?.x || ''} · TIGER line ID: ${match.tigerLine?.tigerLineId || ''}`, match.tigerLine?.tigerLineId || ''));
        lat = num(match.coordinates?.y);
        lon = num(match.coordinates?.x);
        rows.push(...geographyCards(match.geographies));
      } else {
        rows.push(card(`No Census address match for: ${address}`, officialUrl, 'Census geocoder search', 'Census could not geocode this address from its address-range database. Try a USPS-style street address with ZIP, remove punctuation/directional wording, or use latitude/longitude from a map pin.', ''));
        rows.push(card('Use latitude/longitude for Census tribal geography lookup', officialTigerUrl(), 'Census coordinate lookup tip', 'For rural, historic, or non-standard addresses, copy the map pin coordinates and search again with lat/lon. The site can then query TIGERweb AIANNH, OTSA, off-reservation trust, and related Census tribal geography layers by point.', ''));
      }
    } else {
      rows.push(card(`Census coordinate lookup: ${lat}, ${lon}`, officialUrl, 'Census geocoder coordinate lookup', 'Coordinate-based geographic lookup from Census Geocoder.', ''));
      rows.push(...geographyCards(g.data?.result?.geographies));
    }
  } catch (err) {
    rows.push(card('Census Geocoder request failed', officialCensusUrl(), 'Census lookup', err.message || 'Request failed. Use the official Census Geocoder directly.', ''));
  }
  if (lat != null && lon != null) {
    for (const layer of AIANNH_LAYERS) {
      try {
        const tiger = await queryTigerPoint(layer, lat, lon);
        rows.push(...tiger);
      } catch (_) {}
    }
    rows.push(card('Open Census TIGERweb AIANNH map service', officialTigerUrl(), 'Census TIGERweb map service', 'Use this official TIGERweb service to inspect Federal American Indian Reservations, Off-Reservation Trust Lands, Oklahoma Tribal Statistical Areas, and related Census tribal geographies. Treat as a geography lead, not final Indian Country legal proof.', ''));
  }
  return json({ query: address || `${lat},${lon}`, provider: 'U.S. Census Geocoder / TIGERweb', results: rows.slice(0, limit), official_url: officialUrl, fallback: false, notice: 'Census/TIGERweb results are geography leads. They are not final proof of title, land status, ownership, or 18 U.S.C. § 1151 Indian Country status.' });
}
