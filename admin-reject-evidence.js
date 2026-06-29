// Cloudflare Pages Function: /api/address-resolve
// v0.44 Address-to-coordinate helper for Census/TIGERweb source leads.
// Uses Census Geocoder first. If Census cannot match, uses OpenStreetMap Nominatim as a low-volume fallback.
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=86400' }
});
function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
function num(v){ const n = Number(v); return Number.isFinite(n) ? n : null; }
function card(title, url, type, description, sourceId){ return { title, url, date:'', type, sourceId: sourceId || '', description: clean(description).slice(0,1000), thumbnail:'' }; }
function censusUrl(address){
  const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress');
  url.searchParams.set('address', address);
  url.searchParams.set('benchmark', 'Public_AR_Current');
  url.searchParams.set('format', 'json');
  return url;
}
function nominatimUrl(address){
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', address);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'us');
  return url;
}
async function resolveCensus(address){
  const url = censusUrl(address);
  const response = await fetch(url.toString(), { headers: { accept: 'application/json' } });
  const data = await response.json().catch(() => ({}));
  const match = data?.result?.addressMatches?.[0];
  if (!response.ok || !match) return null;
  const lat = num(match.coordinates?.y);
  const lon = num(match.coordinates?.x);
  if (lat == null || lon == null) return null;
  return {
    provider: 'U.S. Census Geocoder',
    lat, lon,
    label: match.matchedAddress || address,
    confidence: 'Census address-range match',
    url: url.toString(),
    raw: match
  };
}
async function resolveNominatim(address){
  const url = nominatimUrl(address);
  const response = await fetch(url.toString(), {
    headers: {
      accept: 'application/json',
      'User-Agent': 'AllottedLand.com/0.44 (https://allottedland.com; public allotment research source-lead lookup)',
      'Referer': 'https://allottedland.com/'
    }
  });
  const data = await response.json().catch(() => []);
  const row = Array.isArray(data) ? data[0] : null;
  if (!response.ok || !row) return null;
  const lat = num(row.lat);
  const lon = num(row.lon);
  if (lat == null || lon == null) return null;
  return {
    provider: 'OpenStreetMap Nominatim fallback',
    lat, lon,
    label: row.display_name || address,
    confidence: `OSM class/type: ${clean(row.class) || 'unknown'} / ${clean(row.type) || 'unknown'}; importance: ${clean(row.importance) || 'unknown'}`,
    url: url.toString(),
    raw: row
  };
}
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const address = clean(url.searchParams.get('address') || url.searchParams.get('q'));
  if (!address) return json({ error: 'Enter an address to resolve.' }, 400);
  const results = [];
  let resolved = null;
  try {
    resolved = await resolveCensus(address);
    if (resolved) {
      results.push(card(`Address resolved by Census: ${resolved.label}`, resolved.url, 'Address to coordinates', `Latitude: ${resolved.lat} · Longitude: ${resolved.lon} · ${resolved.confidence}`, 'census'));
    }
  } catch (err) {
    results.push(card('Census address resolver did not return a match', 'https://geocoding.geo.census.gov/geocoder/', 'Address to coordinates', err.message || 'Census request failed.', ''));
  }
  if (!resolved) {
    try {
      resolved = await resolveNominatim(address);
      if (resolved) {
        results.push(card(`Address resolved by OpenStreetMap: ${resolved.label}`, resolved.url, 'Address to coordinates', `Latitude: ${resolved.lat} · Longitude: ${resolved.lon} · ${resolved.confidence}. Verify the map pin before relying on this as a Census/TIGERweb geography lead.`, 'osm'));
      }
    } catch (err) {
      results.push(card('OpenStreetMap fallback did not return a match', 'https://www.openstreetmap.org/search', 'Address to coordinates', err.message || 'OSM/Nominatim request failed.', ''));
    }
  }
  if (!resolved) {
    results.push(card('No coordinate match found', 'https://www.openstreetmap.org/search', 'Address to coordinates', 'Try a USPS-style street address with ZIP, remove punctuation, or right-click the location in a map and paste latitude/longitude directly.', ''));
    return json({ query: address, provider: 'Address coordinate resolver', results, resolved: null, fallback: true, notice: 'No coordinates found. Address-to-coordinate results are research leads only.' });
  }
  return json({
    query: address,
    provider: 'Address coordinate resolver',
    results,
    resolved: { lat: resolved.lat, lon: resolved.lon, label: resolved.label, provider: resolved.provider, confidence: resolved.confidence, url: resolved.url },
    official_url: resolved.url,
    fallback: resolved.provider.includes('OpenStreetMap'),
    notice: 'Coordinates are research leads. Verify the point before using it for Census/TIGERweb geography lookup. OpenStreetMap/Nominatim data is © OpenStreetMap contributors under ODbL.'
  });
}
