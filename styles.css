/* AllottedLand.com v0.43 official source connector hub
   Adds no-key/low-friction public source leads while map indexing continues:
   Federal Register, Chronicling America/LOC, Census Geocoder/TIGERweb, and printable request packets.
*/
(function(){
  const $ = (id) => document.getElementById(id);
  const text = (v) => String(v == null ? '' : v).trim();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const SOURCES = [
    {key:'nara', label:'NARA Catalog', type:'Live API with key / official links', url:'https://catalog.archives.gov/search', why:'Final Dawes Rolls, census/enrollment cards, enrollment jackets, allotment jackets, allotment maps, RG 48, RG 75. Live rows activate after NARA_API_KEY is set.'},
    {key:'loc', label:'Library of Congress Maps', type:'Public JSON API / official links', url:'https://www.loc.gov/maps/', why:'Digitized maps, atlases, item metadata, images, resources, and source links. If the proxy is blocked, the site returns printable official LOC search links.'},
    {key:'chronicling', label:'Chronicling America Newspapers', type:'Public LOC API / official links', url:'https://www.loc.gov/collections/chronicling-america/', why:'Historical newspaper search leads for tax-sale notices, sheriff sales, guardianship notices, probate notices, oil/gas notices, and family-name clues.'},
    {key:'federalregister', label:'Federal Register', type:'Public API, no key', url:'https://www.federalregister.gov/developers/documentation/api/v1', why:'BIA notices, tribal ordinances, land acquisitions, environmental notices, Indian Affairs rules, and official PDF links.'},
    {key:'census', label:'Census Geocoder / TIGERweb', type:'Public geography APIs', url:'https://geocoding.geo.census.gov/geocoder/', why:'Address or coordinate lookup for county, tract/block, Census AIANNH, off-reservation trust, and Oklahoma Tribal Statistical Area source leads. v0.44 can resolve an address to coordinates first when Census needs a coordinate lookup.'},
    {key:'ohs', label:'Oklahoma Historical Society Dawes Search', type:'Official state search/link', url:'https://www.okhistory.org/research/dawes', why:'Search by first name, last name, tribal nation, roll number, and card number; packet ordering path.'},
    {key:'bia', label:'BIA/LTRO Land Titles and Records', type:'Official record-request path', url:'https://www.bia.gov/bia/ots/dtaot/bltr', why:'Official federal office-of-record for trust/restricted title documents, patents, deeds, probate orders, leases, rights-of-way, plats, and title status.'},
    {key:'blm', label:'BLM GLO Records', type:'Official federal land-records link', url:'https://glorecords.blm.gov/', why:'Federal land patents, survey plats, field notes, land status records, tract books, and township land catalog.'},
    {key:'naraaws', label:'NARA Catalog AWS bulk dataset', type:'Bulk metadata path', url:'https://www.archives.gov/developer/national-archives-catalog-dataset', why:'Bulk archival descriptions and digital-object metadata; better than scraping the live API.'}
  ];

  function field(id){ return text($(id)?.value); }
  function selected(id){ return text($(id)?.options?.[$(id)?.selectedIndex || 0]?.text || $(id)?.value); }
  function sourceClues(){
    return {
      name: field('sourceName') || [field('wizFirst'), field('wizLast')].filter(Boolean).join(' '),
      tribe: field('sourceTribe') || selected('wizTribe').replace('Other / not sure',''),
      roll: field('sourceRoll') || field('wizRoll') || field('dawesRoll'),
      card: field('sourceCard') || field('wizCard') || field('dawesCard'),
      allotment: field('sourceAllotment') || field('wizAllotment'),
      place: field('sourcePlace') || field('wizPlace') || field('uniLegal'),
      township: field('sourceTownship') || field('wizTownship'),
      range: field('sourceRange') || field('wizRange'),
      section: field('sourceSection') || field('wizSection'),
      keyword: field('sourceKeyword') || field('uniSourceKeyword') || field('uniNotice') || field('uniLegal') || field('keyword') || field('dawesQuery') || field('unifiedQuery'),
      address: field('sourceAddress') || field('uniAddress'),
      lat: field('sourceLat') || field('uniLat'),
      lon: field('sourceLon') || field('uniLon')
    };
  }
  function builtQuery(extra){
    const c = sourceClues();
    const parts = [];
    if (c.name) parts.push(c.name);
    if (c.tribe) parts.push(c.tribe.replace(' Nation',''));
    if (c.roll) parts.push(`roll ${c.roll}`);
    if (c.card) parts.push(`census card ${c.card}`);
    if (c.allotment) parts.push(`allotment ${c.allotment}`);
    if (c.township || c.range || c.section) parts.push([c.township && `T${c.township}`, c.range && `R${c.range}`, c.section && `section ${c.section}`].filter(Boolean).join(' '));
    if (c.place) parts.push(c.place);
    if (c.keyword) parts.push(c.keyword);
    if (extra) parts.push(extra);
    return parts.join(' ').replace(/\s+/g,' ').trim();
  }
  function trString(){
    const c = sourceClues();
    return [c.township && `T${c.township}`, c.range && `R${c.range}`, c.section && `Section ${c.section}`].filter(Boolean).join(' ');
  }
  function baseOfficialLinks(q){
    const c = sourceClues();
    const qDawes = [q, 'Dawes'].filter(Boolean).join(' ');
    const locQ = [q, 'Indian Territory allotment map'].filter(Boolean).join(' ');
    const newsQ = [q, c.place, 'tax sale sheriff sale guardian probate allotment'].filter(Boolean).join(' ');
    const frQ = [q, c.tribe, 'Bureau of Indian Affairs allotment land'].filter(Boolean).join(' ');
    return [
      {label:'Open NARA Catalog search', url:`https://catalog.archives.gov/search?q=${encodeURIComponent(qDawes)}`, source:'NARA Catalog'},
      {label:'Open NARA Dawes research guide', url:'https://www.archives.gov/research/native-americans/dawes', source:'NARA Dawes Guide'},
      {label:'Open LOC map search', url:`https://www.loc.gov/maps/?q=${encodeURIComponent(locQ)}&fa=location:oklahoma`, source:'Library of Congress'},
      {label:'Open Chronicling America newspaper search', url:`https://www.loc.gov/collections/chronicling-america/?q=${encodeURIComponent(newsQ)}`, source:'Chronicling America / LOC'},
      {label:'Open Federal Register search', url:`https://www.federalregister.gov/documents/search?conditions%5Bterm%5D=${encodeURIComponent(frQ)}`, source:'Federal Register'},
      {label:'Open Census Geocoder', url:'https://geocoding.geo.census.gov/geocoder/', source:'U.S. Census Bureau'},
      {label:'Open Census TIGERweb AIANNH service', url:'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/AIANNHA/MapServer', source:'Census TIGERweb'},
      {label:'Open OHS Dawes Rolls search', url:'https://www.okhistory.org/research/dawes', source:'Oklahoma Historical Society'},
      {label:'Open BIA/LTRO title-record path', url:'https://www.bia.gov/bia/ots/dtaot/bltr', source:'BIA/LTRO'},
      {label:'Open BLM GLO Records', url:'https://glorecords.blm.gov/search/default.aspx', source:'BLM GLO'},
      {label:'Open NARA AWS bulk dataset info', url:'https://www.archives.gov/developer/national-archives-catalog-dataset', source:'NARA AWS dataset'}
    ];
  }

  function renderOfficialSourceCards(){
    const wrap = $('sourceCards');
    if (!wrap) return;
    wrap.innerHTML = SOURCES.map(s => `<article class="source-mini-card"><div><span class="pill">${esc(s.type)}</span><h3>${esc(s.label)}</h3><p>${esc(s.why)}</p></div><a class="link-button" href="${esc(s.url)}" target="_blank" rel="noopener">Open source</a></article>`).join('');
  }

  function renderLinks(){
    const q = builtQuery();
    const links = baseOfficialLinks(q);
    const box = $('sourceLinkResults');
    if (!box) return;
    box.innerHTML = `<h3>Official source links for ${esc(q || 'your clues')}</h3><p class="hint">These open the source systems directly. Some official sites do not expose a public API, so the safest option is a prepared official-source link and printable checklist.</p><div class="source-link-list">${links.map(l => `<a class="link-button" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join('')}</div>`;
  }

  function resultCard(item, provider){
    const title = item.title || item.heading || item.naId || item.id || 'Source lead';
    const url = item.url || item.catalogUrl || item.link || item.id || '#';
    const idLine = item.naId ? `NAID: ${item.naId}` : (item.sourceId ? item.sourceId : (item.date ? `Date: ${item.date}` : ''));
    const typeLine = item.type || item.level || '';
    const desc = item.description || item.summary || item.snippet || item.partOf || '';
    const thumb = item.thumbnail ? `<img class="source-thumb" src="${esc(item.thumbnail)}" alt="" loading="lazy">` : '';
    return `<article class="card source-result-card" data-provider="${esc(provider)}">
      <div class="source-result-layout">${thumb}<div><div class="meta"><span class="pill">${esc(provider)}</span>${typeLine ? `<span class="pill">${esc(typeLine)}</span>`:''}${idLine ? `<span class="pill">${esc(idLine)}</span>`:''}</div><h3>${esc(title)}</h3>${desc ? `<p>${esc(desc)}</p>`:''}<div class="card-actions"><a class="link-button" href="${esc(url)}" target="_blank" rel="noopener">Open official record</a><button type="button" class="link-button secondary source-print-one">Print this source lead</button></div></div></div>
    </article>`;
  }

  function setStatus(msg, bad){ const s = $('sourceStatus'); if(s){ s.className = bad ? 'status bad' : 'status'; s.textContent = msg; } }
  function showResults(title, provider, rows, note){
    const out = $('sourceResults');
    if (!out) return;
    out.innerHTML = `<div class="results-head"><h3>${esc(title)}</h3><span>${rows.length} result(s)</span></div>${note ? `<p class="hint">${esc(note)}</p>`:''}${rows.length ? rows.map(r => resultCard(r, provider)).join('') : '<p class="muted">No live source results returned. Use the official source links below.</p>'}`;
    renderLinks();
  }
  async function apiSearch(endpoint, params, title, provider, loading){
    const q = params.get('q') || params.get('address') || `${params.get('lat') || ''},${params.get('lon') || ''}`;
    if (!q.replace(/[,\s]/g,'')) return setStatus('Enter at least one clue before searching official sources.', true);
    setStatus(loading || `Searching ${provider}...`);
    try{
      const r = await fetch(endpoint + '?' + params.toString());
      const d = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(d.error || `${provider} connector failed.`);
      showResults(title, provider, d.results || [], d.notice || (d.fallback ? 'Returned official fallback source links.' : 'Live source results are research leads; verify on the official source page.'));
      setStatus(`${provider} returned ${(d.results||[]).length} source lead(s).${d.fallback ? ' Fallback official links were used.' : ''}`);
    }catch(e){
      showResults(title, provider, [], e.message);
      setStatus(e.message + ' Use the official source links below.', true);
    }
  }
  function searchNara(){ const q = builtQuery(); return apiSearch('/api/nara-search', new URLSearchParams({ q, limit:'10' }), 'NARA Catalog source leads', 'NARA Catalog', 'Searching NARA Catalog through AllottedLand.com server-side connector...'); }
  function searchLoc(){ const q = builtQuery('Indian Territory allotment map'); return apiSearch('/api/loc-search', new URLSearchParams({ q, limit:'10' }), 'Library of Congress map source leads', 'Library of Congress', 'Searching Library of Congress map metadata...'); }
  function searchNews(){ const c = sourceClues(); const q = builtQuery('tax sale sheriff sale guardian probate allotment'); return apiSearch('/api/chronicling-search', new URLSearchParams({ q, place:c.place, limit:'10' }), 'Chronicling America newspaper source leads', 'Chronicling America / LOC', 'Searching historic newspaper leads for notices and family-name clues...'); }
  function searchFR(){ const q = builtQuery('Bureau of Indian Affairs allotment land'); return apiSearch('/api/fr-search', new URLSearchParams({ q, limit:'10' }), 'Federal Register source leads', 'Federal Register', 'Searching Federal Register notices and rules...'); }

  async function resolveAddress(){
    const c = sourceClues();
    if (!c.address) return setStatus('Enter an address before converting it to coordinates.', true);
    const params = new URLSearchParams({ address: c.address, limit:'5' });
    setStatus('Resolving address to latitude/longitude...');
    try{
      const r = await fetch('/api/address-resolve?' + params.toString());
      const d = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(d.error || 'Address resolver failed.');
      if (d.resolved) {
        if ($('sourceLat')) $('sourceLat').value = d.resolved.lat;
        if ($('sourceLon')) $('sourceLon').value = d.resolved.lon;
        showResults('Address-to-coordinate leads', d.resolved.provider || 'Address resolver', d.results || [], d.notice || 'Verify coordinates before relying on geography leads.');
        setStatus(`Resolved address to ${d.resolved.lat}, ${d.resolved.lon}. Now use Census geography lookup.`);
      } else {
        showResults('Address-to-coordinate leads', 'Address resolver', d.results || [], d.notice || 'No coordinates found.');
        setStatus('No coordinates found. Try a more complete street address or paste map-pin coordinates.', true);
      }
    }catch(e){
      showResults('Address-to-coordinate leads', 'Address resolver', [], e.message);
      setStatus(e.message + ' Try latitude/longitude from a map pin.', true);
    }
  }

  function searchCensus(){
    const c = sourceClues();
    const params = new URLSearchParams({ limit:'20' });
    if (c.address) params.set('address', c.address);
    if (c.lat) params.set('lat', c.lat);
    if (c.lon) params.set('lon', c.lon);
    if (!c.address && !(c.lat && c.lon)) return setStatus('Enter an address or latitude/longitude for Census geography lookup.', true);
    return apiSearch('/api/census-lookup', params, 'Census geography source leads', 'Census Geocoder / TIGERweb', 'Looking up Census geography and tribal-area source leads...');
  }
  function useCurrentClues(){
    const c = sourceClues();
    if ($('sourceName')) $('sourceName').value = c.name || '';
    if ($('sourceTribe')) $('sourceTribe').value = c.tribe || '';
    if ($('sourceRoll')) $('sourceRoll').value = c.roll || '';
    if ($('sourceCard')) $('sourceCard').value = c.card || '';
    if ($('sourceAllotment')) $('sourceAllotment').value = c.allotment || '';
    if ($('sourcePlace')) $('sourcePlace').value = c.place || '';
    if ($('sourceTownship')) $('sourceTownship').value = c.township || '';
    if ($('sourceRange')) $('sourceRange').value = c.range || '';
    if ($('sourceSection')) $('sourceSection').value = c.section || '';
    if ($('sourceKeyword')) $('sourceKeyword').value = c.keyword || '';
    setStatus('Copied current page clues into the official-source lookup form.');
  }
  function requestSection(title, body){ return `<article class="card request-lead-card"><h3>${esc(title)}</h3><pre class="requestBox">${esc(body)}</pre><button type="button" class="link-button secondary source-print-one">Print this request</button></article>`; }
  function buildRecordRequests(){
    const c = sourceClues();
    const name = c.name || '[ancestor name]';
    const tribe = c.tribe || '[tribe/nation]';
    const roll = c.roll || '[roll/enrollment number if known]';
    const card = c.card || '[census card number if known]';
    const tr = trString() || '[township/range/section if known]';
    const place = c.place || '[county/town/place if known]';
    const sourceLine = `Name: ${name}\nTribe/Nation: ${tribe}\nRoll/enrollment no.: ${roll}\nCensus card no.: ${card}\nAllotment no.: ${c.allotment || '[allotment number if known]'}\nLocation clue: ${tr}\nCounty/place clue: ${place}`;
    const requests = [
      requestSection('NARA / Archives request lead', `I am researching Five Tribes Dawes/allotment records and need help locating the Final Roll entry, census/enrollment card, enrollment packet, and any land allotment jacket or map record for:\n\n${sourceLine}\n\nPlease identify any relevant NAID/catalog records, series, file units, digital objects, or ordering instructions.`),
      requestSection('OHS Dawes / packet request lead', `I am researching Dawes and allotment records and need help locating the OHS Dawes index entry, enrollment card, enrollment packet, and land allotment packet if available.\n\n${sourceLine}\n\nPlease provide the card/roll reference, packet ordering path, and any related family-card cross-references.`),
      requestSection('County clerk land-record request lead', `I am researching historical land records connected to an allotment or family land-loss event. Please search grantor/grantee indexes, deed records, mortgages, releases, sheriff deeds, tax deeds, probate-related deeds, guardian deeds, oil/gas leases, and liens for:\n\n${sourceLine}\n\nRequested date range: allotment era through present, or at minimum 1900–1935 if indexes are manual. Please provide book/page, instrument number, date, parties, legal description, and copies or ordering instructions.`),
      requestSection('BIA/LTRO title-record request lead', `I am requesting guidance on whether BIA/LTRO title records, a Title Status Report, patents, deeds, probate orders, leases, rights-of-way, cadastral surveys, plats, or other Indian land title documents exist for the following allotment/family land clue:\n\n${sourceLine}\n\nPlease identify the correct LTRO office, required request form/process, and any records needed to verify trust/restricted/title history.`),
      requestSection('BLM/GLO township-range lead', `I am researching federal land and survey records that may help interpret a township/range/section legal description connected to allotted land.\n\n${sourceLine}\n\nPlease check BLM/GLO patents, survey plats, field notes, tract books, and township land catalog records for this township/range/section or nearby area.`)
    ];
    const out = $('sourceResults');
    if (out) out.innerHTML = `<div class="results-head"><h3>Record request packet</h3><span>${requests.length} request(s)</span></div><p class="hint">These are copy-paste request leads. Verify recipient requirements before sending private documents.</p>${requests.join('')}`;
    renderLinks();
    setStatus('Built record request packet. Use Print source leads / save PDF to save it.');
  }
  function printSourceResults(){
    const results = $('sourceResults');
    const links = $('sourceLinkResults');
    const body = [results?.innerHTML, links?.innerHTML].filter(Boolean).join('');
    if (!body || !body.replace(/<[^>]+>/g,'').trim()) { alert('Search or build official-source links first.'); return; }
    if (window.AllottedPrint?.buildPacket) {
      window.AllottedPrint.buildPacket('AllottedLand.com Official Source Leads Packet', 'This packet captures official source lookups, prepared source links, Census geography leads, Federal Register notices, newspaper leads, and record-request text for follow-up research.', [`<section class="print-result"><h2>Official source lookup results</h2>${body}</section>`]);
    } else {
      window.print();
    }
  }
  function printOne(card){ if (window.AllottedPrint?.printSingleCard) return window.AllottedPrint.printSingleCard(card); window.print(); }

  document.addEventListener('DOMContentLoaded', () => {
    renderOfficialSourceCards();
    $('sourceUseCluesBtn')?.addEventListener('click', useCurrentClues);
    $('sourceLinksBtn')?.addEventListener('click', () => { renderLinks(); setStatus('Built official-source links.'); });
    $('sourceNaraBtn')?.addEventListener('click', searchNara);
    $('sourceLocBtn')?.addEventListener('click', searchLoc);
    $('sourceNewsBtn')?.addEventListener('click', searchNews);
    $('sourceFRBtn')?.addEventListener('click', searchFR);
    $('sourceResolveAddressBtn')?.addEventListener('click', resolveAddress);
    $('sourceCensusBtn')?.addEventListener('click', searchCensus);
    $('sourceRequestsBtn')?.addEventListener('click', buildRecordRequests);
    $('sourcePrintBtn')?.addEventListener('click', printSourceResults);
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.source-print-one');
      if (!btn) return;
      e.preventDefault();
      printOne(btn.closest('article, .card'));
    });
  });
})();
