/* AllottedLand.com v0.45 unified search + research packet
   One search box for local index data, Dawes leads, map leads, source connectors, geography leads, and record-request paths.
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
  function pathCard(step){ return `<article class="mini-card"><h3>${esc(step.title)}</h3><p>${esc(step.body)}</p></article>`; }
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
    const calls = [];
    const qClean = text(q);
    calls.push(api('/api/nara-search', new URLSearchParams({q:qClean, limit:String(MAX_SOURCE)})).catch(e => ({provider:'NARA', results:[], notice:e.message})));
    calls.push(api('/api/loc-search', new URLSearchParams({q:qClean, limit:String(MAX_SOURCE)})).catch(e => ({provider:'LOC', results:[], notice:e.message})));
    calls.push(api('/api/fr-search', new URLSearchParams({q:[qClean, legalTerms(qClean) ? '' : 'Bureau of Indian Affairs allotment land'].filter(Boolean).join(' '), limit:String(MAX_SOURCE)})).catch(e => ({provider:'Federal Register', results:[], notice:e.message})));
    calls.push(api('/api/chronicling-search', new URLSearchParams({q:[qClean, lossTerms(qClean) ? '' : 'tax sale sheriff sale guardian probate allotment'].filter(Boolean).join(' '), limit:String(MAX_SOURCE)})).catch(e => ({provider:'Chronicling America', results:[], notice:e.message})));
    const c = coords(qClean);
    if (c) calls.push(api('/api/census-lookup', new URLSearchParams({lat:c.lat, lon:c.lon, limit:'18'})).catch(e => ({provider:'Census', results:[], notice:e.message})));
    else if (looksAddress(qClean)) calls.push(api('/api/census-lookup', new URLSearchParams({address:qClean, limit:'18'})).catch(e => ({provider:'Census', results:[], notice:e.message})));
    return Promise.all(calls);
  }

  function fillLegacyFields(q){
    const words = text(q).split(/\s+/);
    const twoWords = /^[A-Za-z'’.\-]+\s+[A-Za-z'’.\-]+/.test(q) && !looksAddress(q);
    if (twoWords) { if ($('wizFirst')) $('wizFirst').value = words[0] || ''; if ($('wizLast')) $('wizLast').value = words.slice(1).join(' '); if ($('givenName')) $('givenName').value = words[0] || ''; if ($('surname')) $('surname').value = words.slice(1).join(' '); }
    const roll = q.match(/\b(?:roll|enrollment)\s*#?\s*(\d{1,7})\b/i)?.[1];
    const card = q.match(/\b(?:card|census card)\s*#?\s*(\d{1,7})\b/i)?.[1];
    const tr = q.match(/T\s*(\d{1,2})\s*N?\s*R\s*(\d{1,2})\s*E?/i);
    const sec = q.match(/\bsection\s*(\d{1,2})\b/i)?.[1];
    if (roll) { ['wizRoll','rollNumber','sourceRoll'].forEach(id => { if($(id)) $(id).value = roll; }); }
    if (card) { ['wizCard','sourceCard'].forEach(id => { if($(id)) $(id).value = card; }); }
    if (tr) { ['wizTownship','township','sourceTownship'].forEach(id => { if($(id)) $(id).value = tr[1]; }); ['wizRange','range','sourceRange'].forEach(id => { if($(id)) $(id).value = tr[2]; }); if($('townshipRange')) $('townshipRange').value = `T${tr[1]}N R${tr[2]}E`; }
    if (sec) { ['wizSection','section','sourceSection'].forEach(id => { if($(id)) $(id).value = sec; }); }
    if (looksAddress(q)) { if ($('sourceAddress')) $('sourceAddress').value = text(q); }
    if ($('sourceKeyword')) $('sourceKeyword').value = text(q);
    if ($('keyword')) $('keyword').value = text(q);
  }

  async function runUnified(){
    const q = text($('unifiedQuery')?.value);
    if (!q) { status('Enter one clue first: name, roll/card number, address, township/range, county, or family story.', true); return; }
    if (!$('unifiedAgree')?.checked) { status('Check the Privacy / Terms agreement before searching everything.', true); $('unifiedAgree')?.scrollIntoView({behavior:'smooth', block:'center'}); return; }
    try { localStorage.setItem('allottedland_unified_agreement','yes'); } catch(e) {}
    fillLegacyFields(q);
    const output = $('unifiedResults');
    if (output) output.innerHTML = '<p class="status">Searching local index, Dawes leads, approved records, official source connectors, and research-path logic…</p>';
    status('Running unified search…');
    const [planner, local, sources] = await Promise.all([
      api('/api/unified-search', new URLSearchParams({q})),
      searchLocal(q),
      sourceCalls(q)
    ]);
    const sections = [];
    const detected = (planner.detected_types || []).join(', ');
    sections.push(section('Search summary', `<p><strong>Query:</strong> ${esc(q)}</p><p><strong>Detected clue type:</strong> ${esc(detected || 'general research clue')}</p><p class="hint">${esc(planner.notice || 'Research leads only. Verify all source records.')}</p>`, 'one-search package'));
    sections.push(section('Built research path', `<div class="path-grid">${(planner.research_path || []).map(pathCard).join('')}</div>`, `${(planner.research_path||[]).length} step(s)`));
    if ((planner.approved_records || []).length) sections.push(section('Approved website records', (planner.approved_records || []).map(r => sourceCard(r, 'Approved site record')).join(''), `${planner.approved_records.length} lead(s)`));
    sections.push(section('Local index matches', local.length ? local.map(x => localCard(x.item, x.type)).join('') : '<p class="muted">No local index rows matched yet. That will improve as map rows and Dawes index data are added.</p>', `${local.length} lead(s)`));
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
    status('Unified search complete. Review the buckets below or print/save the full packet.');
  }

  function printUnified(){
    const output = $('unifiedResults');
    if (!output || !text(output.textContent) || /search results will appear/i.test(output.textContent)) { alert('Run the unified search first.'); return; }
    if (window.AllottedPrint?.buildPacket) {
      window.AllottedPrint.buildPacket('AllottedLand.com Unified Research Packet', 'This packet captures one-search results: local index matches, Dawes/map leads, official source leads, geography leads, built research path, and record-request text.', [`<section class="print-result"><h2>Unified search results</h2>${output.innerHTML}</section>`]);
    } else window.print();
  }
  function clearUnified(){ if($('unifiedQuery')) $('unifiedQuery').value=''; if($('unifiedResults')) $('unifiedResults').innerHTML='<p class="muted">Unified search results will appear here.</p>'; if($('unifiedCount')) $('unifiedCount').textContent='0 leads'; status('Enter one clue to search all available site data and source connectors.'); }
  function useWizardClues(){
    const vals = [
      [$('wizFirst')?.value, $('wizLast')?.value].filter(Boolean).join(' '),
      $('wizRoll')?.value && `roll ${$('wizRoll').value}`,
      $('wizCard')?.value && `census card ${$('wizCard').value}`,
      $('wizAllotment')?.value && `allotment ${$('wizAllotment').value}`,
      $('wizTownship')?.value && $('wizRange')?.value && `T${$('wizTownship').value}N R${$('wizRange').value}E`,
      $('wizSection')?.value && `section ${$('wizSection').value}`,
      $('wizPlace')?.value,
      $('wizStory')?.value
    ].filter(Boolean);
    if ($('unifiedQuery')) $('unifiedQuery').value = vals.join(' ');
    status(vals.length ? 'Copied clues from the guided family-land finder.' : 'No guided-search clues found yet.', !vals.length);
  }

  document.addEventListener('DOMContentLoaded', () => {
    try { if ($('unifiedAgree') && localStorage.getItem('allottedland_unified_agreement') === 'yes') $('unifiedAgree').checked = true; } catch(e) {}
    $('unifiedSearchBtn')?.addEventListener('click', runUnified);
    $('unifiedPrintBtn')?.addEventListener('click', printUnified);
    $('unifiedClearBtn')?.addEventListener('click', clearUnified);
    $('unifiedUseCluesBtn')?.addEventListener('click', useWizardClues);
    $('unifiedQuery')?.addEventListener('keydown', (e) => { if(e.key === 'Enter') { e.preventDefault(); runUnified(); } });
  });
})();
