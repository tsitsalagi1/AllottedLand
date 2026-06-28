/* AllottedLand.com v0.39 official source connector hub
   Uses safe official-source lookups. NARA uses a Cloudflare Function so the API key stays server-side.
*/
(function(){
  const $ = (id) => document.getElementById(id);
  const text = (v) => String(v == null ? '' : v).trim();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  const SOURCES = [
    {key:'nara', label:'NARA Catalog', type:'Live API with key', url:'https://catalog.archives.gov/search', why:'Final Dawes Rolls, census/enrollment cards, enrollment jackets, allotment jackets, allotment maps, RG 48, RG 75.'},
    {key:'loc', label:'Library of Congress Maps', type:'Public JSON API', url:'https://www.loc.gov/maps/', why:'Digitized maps, atlases, item metadata, images, resources, and source links.'},
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
      place: field('sourcePlace') || field('wizPlace'),
      township: field('sourceTownship') || field('wizTownship'),
      range: field('sourceRange') || field('wizRange'),
      section: field('sourceSection') || field('wizSection'),
      keyword: field('sourceKeyword') || field('keyword') || field('dawesQuery')
    };
  }
  function builtQuery(){
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
    return parts.join(' ').replace(/\s+/g,' ').trim();
  }
  function baseOfficialLinks(q){
    const c = sourceClues();
    const qDawes = [q, 'Dawes'].filter(Boolean).join(' ');
    const locQ = [q, 'Indian Territory allotment map'].filter(Boolean).join(' ');
    const gloName = c.name ? c.name : q;
    return [
      {label:'Open NARA Catalog search', url:`https://catalog.archives.gov/search?q=${encodeURIComponent(qDawes)}`, source:'NARA Catalog'},
      {label:'Open NARA Dawes research guide', url:'https://www.archives.gov/research/native-americans/dawes', source:'NARA Dawes Guide'},
      {label:'Open LOC map search', url:`https://www.loc.gov/maps/?q=${encodeURIComponent(locQ)}&fa=location:oklahoma`, source:'Library of Congress'},
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
    const idLine = item.naId ? `NAID: ${item.naId}` : (item.date ? `Date: ${item.date}` : (item.sourceId || ''));
    const desc = item.description || item.summary || item.snippet || item.partOf || '';
    const thumb = item.thumbnail ? `<img class="source-thumb" src="${esc(item.thumbnail)}" alt="" loading="lazy">` : '';
    return `<article class="card source-result-card" data-provider="${esc(provider)}">
      <div class="source-result-layout">${thumb}<div><div class="meta"><span class="pill">${esc(provider)}</span>${idLine ? `<span class="pill">${esc(idLine)}</span>`:''}</div><h3>${esc(title)}</h3>${desc ? `<p>${esc(desc)}</p>`:''}<div class="card-actions"><a class="link-button" href="${esc(url)}" target="_blank" rel="noopener">Open official record</a><button type="button" class="link-button secondary source-print-one">Print this source lead</button></div></div></div>
    </article>`;
  }

  function setStatus(msg, bad){ const s = $('sourceStatus'); if(s){ s.className = bad ? 'status bad' : 'status'; s.textContent = msg; } }
  function showResults(title, provider, rows, note){
    const out = $('sourceResults');
    if (!out) return;
    out.innerHTML = `<div class="results-head"><h3>${esc(title)}</h3><span>${rows.length} result(s)</span></div>${note ? `<p class="hint">${esc(note)}</p>`:''}${rows.length ? rows.map(r => resultCard(r, provider)).join('') : '<p class="muted">No live source results returned. Use the official source links below.</p>'}`;
    renderLinks();
  }

  async function searchNara(){
    const q = builtQuery();
    if (!q) return setStatus('Enter at least one clue before searching official sources.', true);
    setStatus('Searching NARA Catalog through AllottedLand.com server-side connector...');
    try{
      const params = new URLSearchParams({ q, limit:'10' });
      const r = await fetch('/api/nara-search?' + params.toString());
      const d = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(d.error || 'NARA connector is not configured yet.');
      showResults('NARA Catalog source leads', 'NARA Catalog', d.results || [], d.notice || 'NARA live API results are source leads; verify on the official record page.');
      setStatus(`NARA returned ${(d.results||[]).length} source lead(s).`);
    }catch(e){
      showResults('NARA Catalog source leads', 'NARA Catalog', [], e.message);
      setStatus(e.message + ' Use the official NARA links below until NARA_API_KEY is set.', true);
    }
  }

  async function searchLoc(){
    const q = builtQuery();
    if (!q) return setStatus('Enter at least one clue before searching LOC.', true);
    setStatus('Searching Library of Congress map metadata...');
    try{
      const params = new URLSearchParams({ q, limit:'10' });
      const r = await fetch('/api/loc-search?' + params.toString());
      const d = await r.json().catch(()=>({}));
      if (!r.ok) throw new Error(d.error || 'LOC connector failed.');
      showResults('Library of Congress map source leads', 'Library of Congress', d.results || [], 'LOC JSON/YAML API result cards. Open the official record to view images, resources, and citation data.');
      setStatus(`LOC returned ${(d.results||[]).length} source lead(s).`);
    }catch(e){
      // Fallback: open source links still work even when API proxy is not deployed.
      showResults('Library of Congress map source leads', 'Library of Congress', [], e.message);
      setStatus(e.message + ' Use the official LOC links below.', true);
    }
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

  function printSourceResults(){
    const results = $('sourceResults');
    const links = $('sourceLinkResults');
    const body = [results?.innerHTML, links?.innerHTML].filter(Boolean).join('');
    if (!body || !body.replace(/<[^>]+>/g,'').trim()) { alert('Search or build official-source links first.'); return; }
    if (window.AllottedPrint?.buildPacket) {
      window.AllottedPrint.buildPacket('AllottedLand.com Official Source Leads Packet', 'This packet captures official source lookups and prepared source links for follow-up research.', [`<section class="print-result"><h2>Official source lookup results</h2>${body}</section>`]);
    } else {
      window.print();
    }
  }

  function printOne(card){
    if (window.AllottedPrint?.printSingleCard) return window.AllottedPrint.printSingleCard(card);
    window.print();
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderOfficialSourceCards();
    $('sourceUseCluesBtn')?.addEventListener('click', useCurrentClues);
    $('sourceLinksBtn')?.addEventListener('click', () => { renderLinks(); setStatus('Built official-source links.'); });
    $('sourceNaraBtn')?.addEventListener('click', searchNara);
    $('sourceLocBtn')?.addEventListener('click', searchLoc);
    $('sourcePrintBtn')?.addEventListener('click', printSourceResults);
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.source-print-one');
      if (!btn) return;
      e.preventDefault();
      printOne(btn.closest('article, .card'));
    });
  });
})();
