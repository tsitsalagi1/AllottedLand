// Cloudflare Pages Function: /api/fr-search
// v0.42 Federal Register source-lead connector. No API key required.
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=900' }
});
function clean(v){ return String(v == null ? '' : v).replace(/\s+/g, ' ').trim(); }
function first(...vals){ return vals.map(clean).find(Boolean) || ''; }
function stripHtml(s){ return clean(String(s || '').replace(/<[^>]*>/g, ' ')); }
function officialUrl(q){ return `https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=${encodeURIComponent(q)}`; }
function fallbackRows(q, reason){
  const query = clean(q) || 'Bureau of Indian Affairs allotment';
  const terms = [query, `${query} Bureau of Indian Affairs`, `${query} Indian Affairs`, `${query} land acquisition`, `${query} tribal ordinance`];
  return terms.map((term, idx) => ({
    title: idx === 0 ? `Open Federal Register search for: ${term}` : `Federal Register backup search: ${term}`,
    url: officialUrl(term),
    date: '',
    type: 'Federal Register search',
    sourceId: '',
    description: reason ? `FederalRegister.gov API did not return usable rows (${reason}). Open this official Federal Register search as the source lead.` : 'Prepared official Federal Register search link.'
  }));
}
function normalize(doc){
  const title = first(doc.title, doc.abstract, 'Federal Register document');
  const agencies = Array.isArray(doc.agencies) ? doc.agencies.map(a => a.name).filter(Boolean).join('; ') : first(doc.agency_names);
  const citation = first(doc.citation, doc.document_number);
  const type = first(doc.type, doc.document_type, 'Federal Register document');
  const url = first(doc.html_url, doc.pdf_url, doc.public_inspection_pdf_url, doc.raw_text_url, doc.url);
  const desc = stripHtml(first(doc.abstract, doc.excerpts, agencies));
  return {
    title,
    url: url || 'https://www.federalregister.gov/',
    date: first(doc.publication_date, doc.signing_date),
    type,
    sourceId: citation,
    description: [agencies, desc].filter(Boolean).join(' — ').slice(0, 900)
  };
}
export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const q = clean(url.searchParams.get('q'));
  const limit = Math.max(1, Math.min(20, Number(url.searchParams.get('limit') || 10)));
  if (!q) return json({ error: 'Missing q search term.' }, 400);
  const api = new URL('https://www.federalregister.gov/api/v1/documents.json');
  api.searchParams.set('conditions[term]', q);
  api.searchParams.set('per_page', String(limit));
  api.searchParams.set('order', 'relevance');
  ['title','type','abstract','publication_date','html_url','pdf_url','agencies','citation','document_number'].forEach(f => api.searchParams.append('fields[]', f));
  try {
    const response = await fetch(api.toString(), { headers: { accept: 'application/json' } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return json({ query: q, provider: 'Federal Register official-source links', results: fallbackRows(q, `HTTP ${response.status}`), official_url: officialUrl(q), fallback: true }, 200);
    const rows = Array.isArray(data.results) ? data.results.map(normalize).filter(r => r.title || r.url).slice(0, limit) : [];
    if (!rows.length) return json({ query: q, provider: 'Federal Register official-source links', results: fallbackRows(q, '0 live rows'), official_url: officialUrl(q), fallback: true }, 200);
    return json({ query: q, provider: 'FederalRegister.gov API', results: rows, official_url: officialUrl(q), fallback: false, notice: 'FederalRegister.gov is an unofficial informational display. Verify legal reliance against the official PDF/govinfo source linked from each document.' });
  } catch (err) {
    return json({ query: q, provider: 'Federal Register official-source links', results: fallbackRows(q, err.message || 'request failed'), official_url: officialUrl(q), fallback: true }, 200);
  }
}
