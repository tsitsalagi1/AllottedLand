/* AllottedLand.com v0.46 unified search + research packet
   One horizontal universal form that replaces the guided family-land finder and searches local data, Dawes leads, map/index data, official-source links, geography leads, and request paths.
*/
(function(){
  const $ = (id) => document.getElementById(id);
  const text = (v) => String(v == null ? '' : v).trim();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const norm = (v) => text(v).toLowerCase();
  const digits = (v) => text(v).replace(/[^0-9]/g, '');
  const MAX_LOCAL = 12;
  const MAX_SOURCE = 8;

  function status(msg, bad){ const el = $('unifiedStatus'); if (el) { el.textContent = msg; el.classList.toggle('bad', !!bad); } }
  function val(id){ return text($(id)?.value); }
  function selected(id){ const el = $(id); if (!el) return ''; return text(el.options?.[el.selectedIndex || 0]?.text || el.value); }
  function asArrayData(data){ return Array.isArray(data) ? data : (Array.isArray(data?.records) ? data.records : []); }
  async function loadJson(path, fallback){ try{ const r = await fetch(path, {cache:'no-store'}); if(!r.ok) throw new Error(path); return await r.json(); } catch(e){ return fallback; } }
  async function api(path, params){ const r = await fetch(path + '?' + params.toString(), { headers:{accept:'application/json'} }); const d = await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.error || path + ' failed'); return d; }

  function qTokens(q){ return norm(q).split(/[^a-z0-9]+/).filter(t => t.length > 1); }
  function blob(obj){ return norm(JSON.stringify(obj || {})); }
  function scoreItem(item, q){
    const b = blob(item);
    const tokens = qTokens(q);
    let score = 0;
    for (const t of tokens) if (b.includes(t)) score += t.length > 3 ? 3 : 1;
    const dq = digits(q);
    if (dq && b.includes(dq)) score += 8;
    const tr = q.match(/T\s*\d{1,2}\s*N?\s*R\s*\d{1,2}\s*E?/i)?.[0];
    if (tr && b.replace(/\s+/g,'').includes(tr.toLowerCase().replace(/\s+/g,''))) score += 10;
    return score;
  }
  function looksAddress(q){ return /\d+\s+.*\b(ave|avenue|st|street|rd|road|dr|drive|ln|lane|hwy|highway|blvd|court|ct|circle)\b/i.test(q) || /\d+\s+[^,]+,\s*[^,]+,\s*(ok|oklahoma|ar|arkansas|tx|texas|ks|kansas|mo|missouri)\b/i.test(q); }
  function coords(q){ const m = text(q).match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/); return m ? {lat:m[1], lon:m[2]} : null; }
  function lossTerms(q){ return /tax sale|sheriff|guardian|probate|foreclosure|mortgage|deed|oil|gas lease|restricted indian land|judgment/i.test(q); }
  function legalTerms(q){ return /bureau of indian affairs|\bbia\b|federal register|rule|notice|ordinance|trust acquisition|land into trust|nagpra|consultation/i.test(q); }

  function collectUniversalClues(){
    return {
      description: val('unifiedQuery'),
      tribe: selected('wizTribe').replace('Any / not sure','').replace('Other / not sure',''),
      first: val('wizFirst'),
      last: val('wizLast'),
      variants: val('wizVariants'),
      category: selected('uniCategory').replace('Any / unknown',''),
      roll: val('wizRoll'),
      card: val('wizCard'),
      allotment: val('wizAllotment'),
      place: val('wizPlace'),
      address: val('uniAddress'),
      lat: val('uniLat'),
      lon: val('uniLon'),
      township: val('wizTownship'),
      range: val('wizRange'),
      section: val('wizSection'),
      legal: val('uniLegal'),
      notice: val('uniNotice'),
      sourceKeyword: val('uniSourceKeyword'),
      story: val('wizStory')
    };
  }
  function hasAnyClue(c){ return Object.values(c).some(Boolean); }
  function buildUnifiedQuery(starter){
    const c = collectUniversalClues();
    if (starter || !hasAnyClue(c)) return 'I do not know where to start Five Tribes Dawes allotment family land research';
    const name = [c.first, c.last].filter(Boolean).join(' ');
    const trs = [c.township && `T${c.township}`, c.range && `R${c.range}`, c.section && `section ${c.section}`].filter(Boolean).join(' ');
    const coord = c.lat && c.lon ? `${c.lat}, ${c.lon}` : '';
    return [
      c.description,
      name,
      c.variants && `name variants ${c.variants}`,
      c.tribe,
      c.category,
      c.roll && `roll enrollment ${c.roll}`,
      c.card && `census card ${c.card}`,
      c.allotment && `allotment ${c.allotment}`,
      c.place,
      c.address,
      coord,
      trs,
      c.legal,
      c.notice,
      c.sourceKeyword,
      c.story
    ].filter(Boolean).join(' | ').replace(/\s+/g,' ').trim();
  }

  function localCard(item, type){
    const title = item.verified_name || item.full_name || item.sheet_title || item.title || item.name || `LOC page ${item.loc_page || ''}` || 'Source lead';
    const bits = [];
    if (item.tribe || item.nation) bits.push(item.tribe || item.nation);
    if (item.enrollment_category) bits.push(item.enrollment_category);
    if (item.roll_number || item.enrollment_number) bits.push(`Roll ${item.roll_number || item.enrollment_number}`);
    if (item.census_card_number) bits.push(`Card ${item.census_card_number}`);
    if (item.township_range) bits.push(item.township_range);
    if (item.section) bits.push(`Section ${item.section}`);
    if (item.county) bits.push(`${item.county} County`);
    if (item.loc_page) bits.push(`LOC page ${item.loc_page}`);
    const desc = [item.legal_description, item.notes, item.description, item.source_title, item.ocr_status].filter(Boolean).join(' · ');
    const url = item.source_link || item.source_url || (item.loc_page ? `https://www.loc.gov/resource/g4021gm.gla00497/?sp=${encodeURIComponent(item.loc_page)}&st=image` : '');
    return `<article class="card unified-card"><h3>${esc(title)}</h3><div class="meta"><span class="pill">${esc(type)}</span>${bits.map(b=>`<span class="pill">${esc(b)}</span>`).join('')}</div>${desc ? `<p>${esc(desc)}</p>` : ''}${url ? `<p><a class="link-button" href="${esc(url)}" target="_blank" rel="noopener">Open source</a></p>` : ''}</article>`;
  }
  function sourceCard(r, fallbackLabel){
    const title = r.title || r.name || 'Official source lead';
    const provider = r.group || r.provider || r.type || fallbackLabel || 'Official source';
    const desc = r.description || r.notice || '';
    const url = r.url || r.official_url || '';
    return `<article class="card unified-source-card"><h3>${esc(title)}</h3><div class="meta"><span class="pill">${esc(provider)}</span>${r.date ? `<span class="pill">${esc(r.date)}</span>` : ''}${r.sourceId ? `<span class="pill">${esc(r.sourceId)}</span>` : ''}</div>${desc ? `<p>${esc(desc)}</p>` : ''}${url ? `<p><a class="link-button" href="${esc(url)}" target="_blank" rel="noopener">Open official source</a></p>` : ''}</article>`;
  }
  function pathCard(step){ return `<article class="mini-card path-step-card"><h3>${esc(step.title)}</h3><p>${esc(step.body)}</p>${step.where ? `<p class="where-to-search"><strong>Where to search:</strong> ${esc(step.where)}</p>` : ''}${step.lookFor ? `<p class="look-for"><strong>Look for:</strong> ${esc(step.lookFor)}</p>` : ''}</article>`; }
  function requestCard(req){ return `<article class="card request-lead-card"><h3>${esc(req.title)}</h3><pre class="requestBox">${esc(req.body)}</pre></article>`; }
  function section(title, body, note){ return `<section class="unified-result-section"><div class="results-head"><h3>${esc(title)}</h3>${note ? `<span>${esc(note)}</span>` : ''}</div>${body}</section>`; }

  async function searchLocal(q){
    const [maps, allots, dawes, db] = await Promise.all([
      loadJson('data/map_index.json', []),
      loadJson('data/allotment_records.json', []),
      loadJson('data/dawes_index.json', {records:[]}),
      api('/api/records', new URLSearchParams()).catch(() => ({records:[]}))
    ]);
    const pools = [
      {type:'LOC map index', rows:asArrayData(maps)},
      {type:'Allotment record index', rows:asArrayData(allots)},
      {type:'Dawes / Five Tribes lead', rows:asArrayData(dawes)},
      {type:'Approved site record', rows:asArrayData(db)}
    ];
    const results = [];
    for (const pool of pools) {
      const scored = pool.rows.map(item => ({item, score:scoreItem(item, q)})).filter(x => x.score > 0).sort((a,b)=>b.score-a.score).slice(0, MAX_LOCAL);
      for (const s of scored) results.push({type:pool.type, item:s.item, score:s.score});
    }
    return results.sort((a,b)=>b.score-a.score).slice(0, 28);
  }

  async function sourceCalls(q){
    const c = collectUniversalClues();
    const calls = [];
    const qClean = text(q);
    calls.push(api('/api/nara-search', new URLSearchParams({q:qClean, limit:String(MAX_SOURCE)})).catch(e => ({provider:'NARA', results:[], notice:e.message})));
    calls.push(api('/api/loc-search', new URLSearchParams({q:qClean, limit:String(MAX_SOURCE)})).catch(e => ({provider:'LOC', results:[], notice:e.message})));
    calls.push(api('/api/fr-search', new URLSearchParams({q:[qClean, legalTerms(qClean) ? '' : 'Bureau of Indian Affairs allotment land'].filter(Boolean).join(' '), limit:String(MAX_SOURCE)})).catch(e => ({provider:'Federal Register', results:[], notice:e.message})));
    calls.push(api('/api/chronicling-search', new URLSearchParams({q:[qClean, lossTerms(qClean) ? '' : 'tax sale sheriff sale guardian probate allotment'].filter(Boolean).join(' '), limit:String(MAX_SOURCE)})).catch(e => ({provider:'Chronicling America', results:[], notice:e.message})));
    if (c.lat && c.lon) calls.push(api('/api/census-lookup', new URLSearchParams({lat:c.lat, lon:c.lon, limit:'18'})).catch(e => ({provider:'Census', results:[], notice:e.message})));
    else if (c.address || looksAddress(qClean)) calls.push(api('/api/census-lookup', new URLSearchParams({address:c.address || qClean, limit:'18'})).catch(e => ({provider:'Census', results:[], notice:e.message})));
    else {
      const co = coords(qClean);
      if (co) calls.push(api('/api/census-lookup', new URLSearchParams({lat:co.lat, lon:co.lon, limit:'18'})).catch(e => ({provider:'Census', results:[], notice:e.message})));
    }
    return Promise.all(calls);
  }

  function fillLegacyFields(q){
    const c = collectUniversalClues();
    const name = [c.first, c.last].filter(Boolean).join(' ') || c.description;
    const words = text(name).split(/\s+/);
    const twoWords = /^[A-Za-z'’.\-]+\s+[A-Za-z'’.\-]+/.test(name) && !looksAddress(name);
    if (twoWords) { if ($('givenName')) $('givenName').value = words[0] || ''; if ($('surname')) $('surname').value = words.slice(1).join(' '); }
    const tr = c.township && c.range ? {t:c.township, r:c.range} : null;
    if (c.roll) { ['rollNumber','sourceRoll','dawesRoll'].forEach(id => { if($(id)) $(id).value = c.roll; }); }
    if (c.card) { ['sourceCard','dawesCard'].forEach(id => { if($(id)) $(id).value = c.card; }); }
    if (c.allotment) { ['allotmentNumber','sourceAllotment'].forEach(id => { if($(id)) $(id).value = c.allotment; }); }
    if (tr) { ['township','sourceTownship'].forEach(id => { if($(id)) $(id).value = tr.t; }); ['range','sourceRange'].forEach(id => { if($(id)) $(id).value = tr.r; }); if($('townshipRange')) $('townshipRange').value = `T${tr.t}N R${tr.r}E`; }
    if (c.section) { ['section','sourceSection'].forEach(id => { if($(id)) $(id).value = c.section; }); }
    if (c.address) { if ($('sourceAddress')) $('sourceAddress').value = c.address; }
    if (c.lat) { if ($('sourceLat')) $('sourceLat').value = c.lat; }
    if (c.lon) { if ($('sourceLon')) $('sourceLon').value = c.lon; }
    if (c.tribe) { if ($('sourceTribe')) $('sourceTribe').value = c.tribe.replace(' Nation',''); }
    if ($('sourceName') && (c.first || c.last)) $('sourceName').value = [c.first, c.last].filter(Boolean).join(' ');
    if ($('sourceKeyword')) $('sourceKeyword').value = [c.sourceKeyword, c.notice, c.legal, c.story].filter(Boolean).join(' ');
    if ($('keyword')) $('keyword').value = text(q);
  }

  function starterFill(){
    if ($('unifiedQuery') && !val('unifiedQuery')) $('unifiedQuery').value = 'I do not know where to start. Help me find Dawes, allotment, map, county, BIA/LTRO, and land-loss source records.';
    if (!$('unifiedAgree')?.checked) $('unifiedAgree').checked = true;
    runUnified(true);
  }

  async function runUnified(forceStarter){
    const q = buildUnifiedQuery(!!forceStarter);
    if (!$('unifiedAgree')?.checked) { status('Check the Privacy / Terms agreement before searching everything.', true); $('unifiedAgree')?.scrollIntoView({behavior:'smooth', block:'center'}); return; }
    try { localStorage.setItem('allottedland_unified_agreement','yes'); } catch(e) {}
    fillLegacyFields(q);
    const output = $('unifiedResults');
    if (output) output.innerHTML = '<p class="status">Building research path first, then searching local index, Dawes leads, official source connectors, geography leads, and request-packet logic…</p>';
    status('Running unified search…');
    try {
      const [planner, local, sources] = await Promise.all([
        api('/api/unified-search', new URLSearchParams({q})),
        searchLocal(q),
        sourceCalls(q)
      ]);
      const sections = [];
      const detected = (planner.detected_types || []).join(', ');
      sections.push(section('Built research path', `<p class="hint"><strong>Start here.</strong> This is the plain-language path for what to look for and where to search based on the clues entered.</p><div class="path-grid">${(planner.research_path || []).map(pathCard).join('')}</div>`, `${(planner.research_path||[]).length} step(s)`));
      sections.push(section('Search summary', `<p><strong>Query package:</strong> ${esc(q)}</p><p><strong>Detected clue type:</strong> ${esc(detected || 'general research clue')}</p><p class="hint">${esc(planner.notice || 'Research leads only. Verify all source records.')}</p>`, 'one-search package'));
      if ((planner.approved_records || []).length) sections.push(section('Approved website records', (planner.approved_records || []).map(r => sourceCard(r, 'Approved site record')).join(''), `${planner.approved_records.length} lead(s)`));
      sections.push(section('Local index matches', local.length ? local.map(x => localCard(x.item, x.type)).join('') : '<p class="muted">No local index rows matched yet. That will improve as map rows and Dawes index data are added. Use the research path and source links below to keep moving.</p>', `${local.length} lead(s)`));
      const flatSources = [];
      for (const s of sources) {
        const label = s.provider || 'Official source';
        if (Array.isArray(s.results) && s.results.length) for (const r of s.results.slice(0, MAX_SOURCE)) flatSources.push({...r, provider:label});
        else if (s.notice) flatSources.push({title:label + ' notice', provider:label, description:s.notice, url:s.official_url || ''});
      }
      sections.push(section('Official source leads', flatSources.length ? flatSources.map(r => sourceCard(r, r.provider)).join('') : '<p class="muted">No official source connectors returned visible leads. Use the prepared links below.</p>', `${flatSources.length} lead(s)`));
      const officialLinks = (planner.official_source_leads || []).map(r => sourceCard(r, r.group)).join('');
      sections.push(section('Prepared official links', officialLinks, `${(planner.official_source_leads||[]).length} link(s)`));
      sections.push(section('Record request packet', (planner.record_request_packet || []).map(requestCard).join(''), `${(planner.record_request_packet||[]).length} request(s)`));
      if (output) output.innerHTML = sections.join('');
      if ($('unifiedCount')) $('unifiedCount').textContent = `${local.length + flatSources.length + (planner.approved_records || []).length} result/lead card(s)`;
      status('Unified search complete. The research path is first; review each bucket below or print/save the full packet.');
    } catch (e) {
      if (output) output.innerHTML = `<p class="status bad">Unified search failed: ${esc(e.message || e)}</p>`;
      status('Unified search failed. Try fewer clues or use one of the advanced tools below.', true);
    }
  }

  function printUnified(){
    const output = $('unifiedResults');
    if (!output || !text(output.textContent) || /results will appear/i.test(output.textContent)) { alert('Run the unified search first.'); return; }
    if (window.AllottedPrint?.buildPacket) {
      window.AllottedPrint.buildPacket('AllottedLand.com Unified Research Packet', 'This packet captures the built research path, local index matches, Dawes/map leads, official source leads, geography leads, and record-request text.', [`<section class="print-result"><h2>Unified search results</h2>${output.innerHTML}</section>`]);
    } else window.print();
  }
  function clearUnified(){
    ['unifiedQuery','wizFirst','wizLast','wizVariants','wizRoll','wizCard','wizAllotment','wizPlace','uniAddress','uniLat','uniLon','wizTownship','wizRange','wizSection','uniLegal','uniNotice','uniSourceKeyword','wizStory'].forEach(id => { if($(id)) $(id).value=''; });
    if($('wizTribe')) $('wizTribe').value='';
    if($('uniCategory')) $('uniCategory').value='';
    if($('unifiedResults')) $('unifiedResults').innerHTML='<p class="muted">Results will appear here. The first section will be the built research path: what to look for, where to search, and what each record can prove.</p>';
    if($('unifiedCount')) $('unifiedCount').textContent='0 leads';
    status('Enter any clue, or click “I don’t know where to start,” to build a research path and search all available source leads.');
  }

  document.addEventListener('DOMContentLoaded', () => {
    try { if ($('unifiedAgree') && localStorage.getItem('allottedland_unified_agreement') === 'yes') $('unifiedAgree').checked = true; } catch(e) {}
    $('unifiedSearchBtn')?.addEventListener('click', () => runUnified(false));
    $('unifiedStarterBtn')?.addEventListener('click', starterFill);
    $('unifiedPrintBtn')?.addEventListener('click', printUnified);
    $('unifiedClearBtn')?.addEventListener('click', clearUnified);
    $('unifiedQuery')?.addEventListener('keydown', (e) => { if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runUnified(false); } });
  });
})();
