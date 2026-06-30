/* AllottedLand.com v0.54 unified search bugfix audit
   One home-page tool: users enter any information, the site builds a research path first,
   then shows only matching local/index records and source leads.
*/
(function(){
  const $ = (id) => document.getElementById(id);
  const text = (v) => String(v == null ? '' : v).trim();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const attr = (s) => esc(s).replace(/`/g,'&#96;');
  const norm = (v) => text(v).toLowerCase().replace(/[’]/g,"'").replace(/\s+/g,' ');
  const digits = (v) => text(v).replace(/[^0-9]/g, '');
  const MAX_LOCAL = 10;
  const MAX_SOURCE = 8;
  const STOP = new Set('i me my the a an and or of for to in on at by with from into help find search everything where what know start record records source sources lead leads official family land allotted allotment allotments dawes five civilized tribes cherokee nation county ok oklahoma indian territory look looking'.split(/\s+/));
  const NARA_WORKER_URL = 'https://allottedland-nara-proxy.dynamictech-nwa.workers.dev/';

  function status(msg, bad){ const el = $('unifiedStatus'); if (el) { el.textContent = msg; el.classList.toggle('bad', !!bad); } }
  function val(id){ return text($(id)?.value); }
  function selected(id){ const el = $(id); if (!el) return ''; return text(el.options?.[el.selectedIndex || 0]?.text || el.value); }
  function asArrayData(data){ return Array.isArray(data) ? data : (Array.isArray(data?.records) ? data.records : []); }
  async function loadJson(path, fallback){ try{ const r = await fetch(path, {cache:'no-store'}); if(!r.ok) throw new Error(path); return await r.json(); } catch(e){ return fallback; } }
  async function api(path, params){ const r = await fetch(path + '?' + params.toString(), { headers:{accept:'application/json'} }); const d = await r.json().catch(()=>({})); if(!r.ok) throw new Error(d.error || path + ' failed'); return d; }

  function cleanTokens(q){
    return norm(q).split(/[^a-z0-9]+/).filter(t => t.length > 1 && !STOP.has(t));
  }
  function looksAddress(q){ return /\d+\s+.*\b(ave|avenue|st|street|rd|road|dr|drive|ln|lane|hwy|highway|blvd|court|ct|circle)\b/i.test(q) || /\d+\s+[^,]+,\s*[^,]+,\s*(ok|oklahoma|ar|arkansas|tx|texas|ks|kansas|mo|missouri)\b/i.test(q); }
  function coords(q){ const m = text(q).match(/(-?\d{1,3}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/); return m ? {lat:m[1], lon:m[2]} : null; }
  function queryNameParts(q){
    const cleaned = text(q).replace(/\b(roll|enrollment|card|census|section|township|range|county|ave|avenue|street|road|tax|sale|sheriff|probate|guardian)\b/gi, ' ');
    const m = cleaned.match(/\b([A-Z][A-Za-z'’.-]{2,})\s+([A-Z][A-Za-z'’.-]{2,})\b/);
    return m ? {first:norm(m[1]), last:norm(m[2])} : null;
  }
  function numbersFromQuery(q){
    const found = [];
    const re = /\b(?:roll|enrollment|card|census card|allotment|no\.?|number)\s*#?\s*(\d{2,7})\b/gi;
    let m;
    while ((m = re.exec(text(q)))) found.push(m[1]);
    return found;
  }
  function lossTerms(q){ return /tax sale|sheriff|guardian|probate|foreclosure|mortgage|deed|oil|gas lease|restricted indian land|judgment/i.test(q); }
  function legalTerms(q){ return /bureau of indian affairs|\bbia\b|federal register|rule|notice|ordinance|trust acquisition|land into trust|nagpra|consultation/i.test(q); }
  function starterOnly(q){
    const l = norm(q);
    return /do not know where to start|don't know where to start|start anywhere/.test(l) && cleanTokens(q).length < 4 && !digits(q);
  }
  function extractTRS(s){
    const q = norm(s).replace(/,/g,' ');
    let t='', r='', sec='';
    let m = q.match(/\bt\s*(\d{1,2})\s*n?\s*r\s*(\d{1,2})\s*e?\b/);
    if (!m) m = q.match(/\btownship\s*(\d{1,2}).*?\brange\s*(\d{1,2})\b/);
    if (!m) m = q.match(/\b(\d{1,2})\s*n\s+(\d{1,2})\s*e\b/);
    if (m) { t = m[1]; r = m[2]; }
    let sm = q.match(/\bsection\s*(\d{1,2})\b|\bsec\.?\s*(\d{1,2})\b|\bs\s*(\d{1,2})\b/);
    if (sm) sec = sm[1] || sm[2] || sm[3] || '';
    return {t,r,sec};
  }
  function rowBlob(item){ return norm(JSON.stringify(item || {})); }
  function rowTitle(item){ return norm([item.verified_name, item.full_name, item.name, item.first_name, item.middle_name, item.last_name, item.sheet_title, item.title].filter(Boolean).join(' ')); }
  function rowTRS(item){
    const tr = extractTRS([item.township_range, item.legal_description, item.description, item.notes, item.sheet_title].filter(Boolean).join(' '));
    if (!tr.t && item.township) tr.t = String(item.township).replace(/\D/g,'');
    if (!tr.r && item.range) tr.r = String(item.range).replace(/\D/g,'');
    if (!tr.sec && item.section) tr.sec = String(item.section).replace(/\D/g,'');
    return tr;
  }
  function scoreItem(item, q){
    if (!item || starterOnly(q)) return 0;
    const c = collectUniversalClues();
    const b = rowBlob(item);
    const title = rowTitle(item);
    let score = 0;
    let strong = false;

    const qRolls = [c.roll, c.card, c.allotment, ...(digits(q) ? [digits(q)] : [])].filter(Boolean);
    let idMatched = false;
    for (const n of qRolls) {
      if (n.length >= 2 && b.includes(n)) { score += 55; strong = true; idMatched = true; }
    }

    const names = [];
    if (c.first || c.last) names.push([c.first, c.last].filter(Boolean).join(' '));
    const qm = text(q).match(/\b([A-Z][A-Za-z'’.-]+)\s+([A-Z][A-Za-z'’.-]+)\b/);
    if (qm && !looksAddress(qm[0])) names.push(qm[0]);
    let nameMatched = false;
    const hasNameInput = names.some(Boolean);
    for (const n of names) {
      const nt = cleanTokens(n);
      if (nt.length >= 2 && title.includes(nt.join(' '))) { score += 60; strong = true; nameMatched = true; }
      else if (nt.length >= 2 && nt.every(t => title.includes(t))) { score += 46; strong = true; nameMatched = true; }
      else if (nt.length === 1 && nt[0].length > 3 && title.includes(nt[0])) { score += 24; strong = true; nameMatched = true; }
    }

    const qt = c.township && c.range ? {t:String(c.township), r:String(c.range), sec:String(c.section||'')} : extractTRS(q);
    const rt = rowTRS(item);
    const hasSpecificPersonOrId = hasNameInput || qRolls.length > 0;
    if (qt.t && qt.r && rt.t === qt.t && rt.r === qt.r && !hasSpecificPersonOrId) { score += 45; strong = true; }
    if (qt.sec && rt.sec === qt.sec && (qt.t && qt.r ? (rt.t === qt.t && rt.r === qt.r) : true) && !hasSpecificPersonOrId) { score += 12; if (qt.t && qt.r) strong = true; }
    if (hasSpecificPersonOrId && !nameMatched && !idMatched) return 0;

    const countyWords = text([c.place, c.legal, c.notice, q].filter(Boolean).join(' ')).match(/\b([A-Za-z]+)\s+County\b/i);
    if (countyWords && b.includes(norm(countyWords[1])) && b.includes('county')) { score += 18; strong = true; }

    // Keyword matches are only supplemental. Generic tribe/source words alone must not return every row.
    const tokens = cleanTokens(q).filter(t => !['tax','sale','sheriff','guardian','probate','mortgage','section','roll','card','census'].includes(t));
    const keywordHits = tokens.filter(t => t.length > 3 && b.includes(t));
    score += Math.min(keywordHits.length * 4, 16);

    return strong && score >= 24 ? score : 0;
  }

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
  function fieldSummary(c){
    const rows = [];
    const add = (label, value) => { if (text(value)) rows.push(`<li><strong>${esc(label)}:</strong> ${esc(value)}</li>`); };
    add('Tribe / Nation', c.tribe);
    add('Ancestor name', [c.first, c.last].filter(Boolean).join(' '));
    add('Name variants', c.variants);
    add('Enrollment category', c.category);
    add('Roll / enrollment number', c.roll);
    add('Census card number', c.card);
    add('Allotment number', c.allotment);
    add('Place', c.place);
    add('Address', c.address);
    add('Coordinates', c.lat && c.lon ? `${c.lat}, ${c.lon}` : '');
    add('Township / Range / Section', [c.township && `T${c.township}`, c.range && `R${c.range}`, c.section && `Section ${c.section}`].filter(Boolean).join(' '));
    add('Legal / county / case information', c.legal);
    add('Land-loss or legal notice information', c.notice);
    add('Official-source keyword', c.sourceKeyword);
    add('Other information', c.description);
    add('Detailed family notes', c.story);
    return rows.length ? `<ul class="info-summary-list">${rows.join('')}</ul>` : '<p>No specific information was entered. The starter research path was generated.</p>';
  }
  function hasAnyClue(c){ return Object.values(c).some(Boolean); }
  function buildUnifiedQuery(starter){
    const c = collectUniversalClues();
    if (starter || !hasAnyClue(c)) return 'I do not know where to start. Help me find Dawes, allotment, map, county, BIA/LTRO, and land-loss source records.';
    const name = [c.first, c.last].filter(Boolean).join(' ');
    const trs = [c.township && `T${c.township}`, c.range && `R${c.range}`, c.section && `section ${c.section}`].filter(Boolean).join(' ');
    const coord = c.lat && c.lon ? `${c.lat}, ${c.lon}` : '';
    return [c.description, name, c.variants && `name variants ${c.variants}`, c.tribe, c.category, c.roll && `roll enrollment ${c.roll}`, c.card && `census card ${c.card}`, c.allotment && `allotment ${c.allotment}`, c.place, c.address, coord, trs, c.legal, c.notice, c.sourceKeyword, c.story].filter(Boolean).join(' | ').replace(/\s+/g,' ').trim();
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
  function partnerCard(p){
    const label = p.label || p.type || 'Free resource';
    const desc = p.description || '';
    const note = p.note ? `<p class="small-note">${esc(p.note)}</p>` : '';
    return `<article class="card unified-source-card partner-resource-card"><h3>${esc(p.name || 'Helpful resource')}</h3><div class="meta"><span class="pill">${esc(label)}</span>${p.category ? `<span class="pill">${esc(p.category)}</span>` : ''}</div>${desc ? `<p>${esc(desc)}</p>` : ''}${p.url ? `<p><a class="link-button" href="${esc(p.url)}" target="_blank" rel="noopener">Open resource</a></p>` : ''}${note}</article>`;
  }
  async function partnerResources(){
    const data = await loadJson('data/partner_links.json', {partners:[]});
    const rows = Array.isArray(data) ? data : (data.partners || []);
    return rows.filter(p => p && p.active !== false).sort((a,b)=>(a.order||99)-(b.order||99));
  }
  function requestCard(req){
    const body = req.body || '';
    return `<article class="card request-lead-card"><div class="request-card-head"><h3>${esc(req.title)}</h3><button type="button" class="link-button secondary copy-request-btn no-print" data-copy-text="${attr(body)}">Copy request</button></div>${req.summary ? `<p>${esc(req.summary)}</p>` : ''}<pre class="requestBox">${esc(body)}</pre></article>`;
  }
  function section(title, body, note){ return `<section class="unified-result-section"><div class="results-head"><h3>${esc(title)}</h3>${note ? `<span>${esc(note)}</span>` : ''}</div>${body}</section>`; }

  async function searchLocal(q){
    if (starterOnly(q)) return [];
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
    const seen = new Set();
    const results = [];
    for (const pool of pools) {
      const scored = pool.rows.map(item => ({item, score:scoreItem(item, q)})).filter(x => x.score > 0).sort((a,b)=>b.score-a.score).slice(0, MAX_LOCAL);
      for (const s of scored) {
        const key = pool.type + '|' + (s.item.id || s.item.loc_page || s.item.verified_name || JSON.stringify(s.item).slice(0,80));
        if (seen.has(key)) continue;
        seen.add(key);
        results.push({type:pool.type, item:s.item, score:s.score});
      }
    }
    return results.sort((a,b)=>b.score-a.score).slice(0, 24);
  }


  function naraClean(value){
    return String(value == null ? '' : value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function naraFirst(...values){
    return values.map(naraClean).find(Boolean) || '';
  }
  function naraTitle(hit){
    const source = hit?._source || {};
    const rec = source.record || source.description || source;
    return naraFirst(rec.title, rec.heading, source.title, 'NARA Catalog source lead');
  }
  function naraNaid(hit){
    const source = hit?._source || {};
    const rec = source.record || source.description || source;
    return naraFirst(rec.naId, rec.naid, source.naId, source.naid, hit?._id);
  }
  function naraDescription(hit){
    const source = hit?._source || {};
    const rec = source.record || source.description || source;
    return naraFirst(rec.scopeAndContentNote, rec.description, rec.summary, rec.generalNote, source.description).slice(0, 800);
  }
  function naraDateText(value){
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.map(naraDateText).filter(Boolean).join('; ');
    if (typeof value === 'object') return naraClean(value.logicalDate || [value.month, value.day, value.year].filter(Boolean).join('/') || value.year || '');
    return naraClean(value);
  }
  function normalizeNaraHit(hit){
    const source = hit?._source || {};
    const rec = source.record || source.description || source;
    const naId = naraNaid(hit);
    const digital = Array.isArray(rec.digitalObjects) ? rec.digitalObjects[0] : null;
    return {
      title: naraTitle(hit),
      naId,
      sourceId: naId ? `NAID ${naId}` : '',
      date: naraFirst(naraDateText(rec.productionDates), naraDateText(rec.inclusiveStartDate), naraDateText(rec.date)),
      level: naraFirst(rec.levelOfDescription, source.levelOfDescription),
      type: naraFirst(Array.isArray(rec.generalRecordsTypes) ? rec.generalRecordsTypes.join(', ') : rec.generalRecordsTypes, rec.recordType, 'NARA Catalog'),
      description: naraDescription(hit),
      url: naraFirst(rec.catalogUrl, rec.url, source.catalogUrl, naId ? `https://catalog.archives.gov/id/${encodeURIComponent(naId)}` : 'https://catalog.archives.gov/'),
      thumbnail: naraFirst(rec.thumbnailUrl, digital?.thumbnailUrl, digital?.objectUrl),
      provider: 'NARA Catalog API'
    };
  }
  async function searchNaraWorker(q, limit){
    const url = new URL(NARA_WORKER_URL);
    url.searchParams.set('q', q);
    url.searchParams.set('rows', String(Math.max(1, Math.min(25, limit || MAX_SOURCE))));
    const response = await fetch(url.toString(), { headers: { accept: 'application/json' }, cache: 'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || data.message || `NARA Worker failed: ${response.status}`);
    const hits = data?.hits?.hits || data?.body?.hits?.hits || [];
    const results = hits.map(normalizeNaraHit).filter(r => r.title || r.naId).slice(0, limit || MAX_SOURCE);
    return {
      provider: 'NARA Catalog API',
      results,
      official_url: `https://catalog.archives.gov/search?q=${encodeURIComponent(q)}`,
      fallback: false,
      notice: 'This product uses the National Archives Catalog API but is not endorsed or certified by the National Archives and Records Administration.'
    };
  }


  function sourceBlob(r){
    return norm([r.provider, r.group, r.type, r.title, r.name, r.sourceId, r.description, r.notice, r.date, r.url].filter(Boolean).join(' '));
  }
  function hasResearchSignal(blob){
    return /(dawes|allotment|allotted|enrollment|enrolment|census card|final roll|five civilized tribes|five tribes|application for enrollment|application for allotment|allotment jacket|land allotment|patent|title status|title record|tract|township|range|section|plat|map|bureau of indian affairs|indian affairs|bia|rg 75|rg75|rg 48|ltro|restricted land|trust land|probate|guardian|tax sale|sheriff sale|deed|mortgage|lease)/.test(blob);
  }
  function sourceLeadScore(r, q){
    const c = collectUniversalClues();
    const blob = sourceBlob(r);
    // A fallback/no-match newspaper card is not a record match. Keep it out of Best Matching leads.
    if (/no newspaper match found|no automatic newspaper match|manual newspaper search/i.test(blob)) {
      return {score:0, best:false};
    }
    let score = 0;
    let strongSpecific = false;

    const ids = [c.roll, c.card, c.allotment, ...numbersFromQuery(q), ...(digits(q).length >= 3 ? [digits(q)] : [])]
      .filter(Boolean)
      .map(String);
    for (const id of ids) {
      if (id.length >= 3 && blob.includes(id)) { score += 90; strongSpecific = true; }
    }

    const names = [];
    if (c.first || c.last) names.push([c.first, c.last].filter(Boolean));
    const guessed = queryNameParts(q);
    if (guessed?.first || guessed?.last) names.push([guessed.first, guessed.last].filter(Boolean));
    for (const parts of names) {
      const good = parts.filter(Boolean).filter(t => t.length > 2);
      if (good.length >= 2 && good.every(t => blob.includes(t))) { score += 80; strongSpecific = true; }
      else if (good.length === 1 && good[0].length > 4 && blob.includes(good[0])) { score += 35; strongSpecific = true; }
    }

    const qt = c.township && c.range ? {t:String(c.township), r:String(c.range), sec:String(c.section||'')} : extractTRS(q);
    if (qt.t && qt.r) {
      const tHit = new RegExp(`\b(township\s*)?${qt.t}\s*n?\b`).test(blob);
      const rHit = new RegExp(`\b(range\s*)?${qt.r}\s*e?\b`).test(blob);
      const sHit = !qt.sec || new RegExp(`\b(section\s*)?${qt.sec}\b`).test(blob);
      if (tHit && rHit && sHit) { score += 80; strongSpecific = true; }
    }

    const signal = hasResearchSignal(blob);
    if (signal) score += 28;

    const tokens = cleanTokens(q).filter(t => t.length > 3 && !['cherokee','nation','county','indian','records','record','source','official','search','land','family'].includes(t));
    const hits = tokens.filter(t => blob.includes(t));
    score += Math.min(hits.length * 10, 40);

    if (/NARA Catalog API/i.test(r.provider || '') && !signal && !strongSpecific) score -= 18;
    if (/photograph|photo|byway|youth choir|postmaster appointments|still picture/i.test([r.title, r.description, r.type].filter(Boolean).join(' ')) && !strongSpecific && !signal) score -= 30;

    return {score, best: (strongSpecific && score >= 55) || (signal && score >= 60)};
  }
  function splitOfficialSources(flatSources, q){
    const best = [];
    const related = [];
    for (const r of flatSources) {
      const ranked = sourceLeadScore(r, q);
      const enriched = {...r, matchScore: ranked.score};
      if (ranked.best) best.push(enriched);
      else related.push(enriched);
    }
    const sorter = (a,b) => (b.matchScore || 0) - (a.matchScore || 0);
    return {best: best.sort(sorter), related: related.sort(sorter)};
  }

  async function sourceCalls(q){
    const c = collectUniversalClues();
    const calls = [];
    const qClean = text(q);
    calls.push(searchNaraWorker(qClean, MAX_SOURCE).catch(e => ({provider:'NARA Catalog API', results:[], notice:e.message})));
    calls.push(api('/api/fr-search', new URLSearchParams({q:[qClean, legalTerms(qClean) ? '' : 'Bureau of Indian Affairs allotment land'].filter(Boolean).join(' '), limit:String(MAX_SOURCE)})).catch(e => ({provider:'Federal Register', results:[], notice:e.message})));
    calls.push(api('/api/chronicling-search', new URLSearchParams({q:qClean, limit:String(MAX_SOURCE)})).catch(e => ({provider:'Historic newspapers', results:[], notice:e.message})));
    // Keep LOC as prepared linkout until LOC Labs resolves 403 behavior from server-side requests.
    if (c.lat && c.lon) calls.push(api('/api/census-lookup', new URLSearchParams({lat:c.lat, lon:c.lon, limit:'18'})).catch(e => ({provider:'Census', results:[], notice:e.message})));
    else if (c.address || looksAddress(qClean)) calls.push(api('/api/census-lookup', new URLSearchParams({address:c.address || qClean, limit:'18'})).catch(e => ({provider:'Census', results:[], notice:e.message})));
    else { const co = coords(qClean); if (co) calls.push(api('/api/census-lookup', new URLSearchParams({lat:co.lat, lon:co.lon, limit:'18'})).catch(e => ({provider:'Census', results:[], notice:e.message}))); }
    return Promise.all(calls);
  }

  function fillLegacyFields(q){
    const c = collectUniversalClues();
    const name = [c.first, c.last].filter(Boolean).join(' ') || c.description;
    const words = text(name).split(/\s+/);
    const twoWords = /^[A-Za-z'’\.\-]+\s+[A-Za-z'’\.\-]+/.test(name) && !looksAddress(name);
    if (twoWords) { if ($('givenName')) $('givenName').value = words[0] || ''; if ($('surname')) $('surname').value = words.slice(1).join(' '); }
    if (c.roll) { ['rollNumber','sourceRoll','dawesRoll'].forEach(id => { if($(id)) $(id).value = c.roll; }); }
    if (c.card) { ['sourceCard','dawesCard'].forEach(id => { if($(id)) $(id).value = c.card; }); }
    if (c.allotment) { ['allotmentNumber','sourceAllotment'].forEach(id => { if($(id)) $(id).value = c.allotment; }); }
    if (c.township && c.range) { ['township','sourceTownship'].forEach(id => { if($(id)) $(id).value = c.township; }); ['range','sourceRange'].forEach(id => { if($(id)) $(id).value = c.range; }); if($('townshipRange')) $('townshipRange').value = `T${c.township}N R${c.range}E`; }
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
    runUnified(true);
  }

  async function runUnified(forceStarter){
    const q = buildUnifiedQuery(!!forceStarter);
    if (!$('unifiedAgree')?.checked) { status('Check the Privacy / Terms agreement before searching everything.', true); $('unifiedAgree')?.scrollIntoView({behavior:'smooth', block:'center'}); return; }
    try { localStorage.setItem('allottedland_unified_agreement','yes'); } catch(e) {}
    fillLegacyFields(q);
    const output = $('unifiedResults');
    if (output) output.innerHTML = '<p class="status">Building the research path first. Then searching matching site records and official source leads…</p>';
    status('Running one-search family land finder…');
    try {
      const [planner, local, sources, partners] = await Promise.all([
        api('/api/unified-search', new URLSearchParams({q})),
        searchLocal(q),
        sourceCalls(q),
        partnerResources()
      ]);
      const sections = [];
      const detected = (planner.detected_types || []).join(', ');
      sections.push(section('Built research path', `<p class="hint"><strong>Start here.</strong> These steps explain what record to look for, where to search for it, and why it matters. A result card is only a lead; the research path tells the family what to do next.</p><div class="path-grid">${(planner.research_path || []).map(pathCard).join('')}</div>`, `${(planner.research_path||[]).length} step(s)`));
      sections.push(section('Information searched', `<p class="section-help"><strong>What this is:</strong> This is the information the family entered. Use it to double-check spellings, numbers, places, and dates before sending request text to an office.</p>${fieldSummary(collectUniversalClues())}`, 'review before requesting records'));
      if (partners.length) {
        sections.push(section('Free genealogy starting point', `<p class="section-help"><strong>Why this is shown:</strong> Many families need to build a basic family tree before they know which names, relatives, dates, roll numbers, counties, or records to search here. This free resource can help organize that information. AllottedLand.com is not sharing your search with this site unless you choose to open the link.</p>${partners.map(partnerCard).join('')}`, `${partners.length} resource(s)`));
      }
      const siteCards = [];
      if ((planner.approved_records || []).length) siteCards.push(...(planner.approved_records || []).map(r => sourceCard(r, 'Approved site record')));
      if (local.length) siteCards.push(...local.map(x => localCard(x.item, x.type)));
      sections.push(section('Matching site/index records', siteCards.length ? `<p class="section-help"><strong>What this means:</strong> These are records already loaded into AllottedLand.com that match the information you entered. A match is a lead, not proof. Open the source and compare it to the original record.</p>${siteCards.join('')}` : '<p class="muted"><strong>No matching site records yet.</strong> This is normal while the map database is still being built. Use the research path, official source leads, and request packet below to keep moving.</p>', `${siteCards.length} match(es)`));
      const flatSources = [];
      for (const s of sources) {
        const label = s.provider || 'Official source';
        if (Array.isArray(s.results) && s.results.length) for (const r of s.results.slice(0, MAX_SOURCE)) flatSources.push({...r, provider:label});
      }
      const rankedSources = splitOfficialSources(flatSources, q);
      sections.push(section('Best matching official leads', rankedSources.best.length ? `<p class="section-help"><strong>What these are:</strong> These official-source leads contain stronger signals from the information entered, such as a name, number, township/range/section, or Dawes/allotment/land-record terms. They are still leads, not proof. Open the source and verify the original record before relying on it.</p>${rankedSources.best.map(r => sourceCard(r, r.provider)).join('')}` : '<p class="muted"><strong>No strong official-source matches yet.</strong> This does not mean no record exists. Use the related official leads and prepared source links below to continue searching.</p>', `${rankedSources.best.length} match(es)`));
      sections.push(section('Related official leads', rankedSources.related.length ? `<p class="section-help"><strong>What these are:</strong> These are broader official-source leads from systems such as NARA, Federal Register, historic newspapers, Census/TIGERweb, and other public source sites. They may be useful context, but they are not being treated as strong matches.</p>${rankedSources.related.map(r => sourceCard(r, r.provider)).join('')}` : '<p class="muted"><strong>No related official-source leads found.</strong> Use the prepared official links below. They open the right source searches even when the site cannot retrieve a result automatically.</p>', `${rankedSources.related.length} lead(s)`));
      const officialLinks = (planner.official_source_leads || []).map(r => sourceCard(r, r.group)).join('');
      sections.push(section('Prepared official links', `<p class="section-help"><strong>What these do:</strong> These links are safety-net searches and agency paths. They are useful when the official source search does not return a result, when an outside site blocks an automated request, or when the family needs to continue the search directly on an official site.</p>${officialLinks}`, `${(planner.official_source_leads||[]).length} link(s)`));
      sections.push(section('Agency record request packets', `<p class="section-help"><strong>What these are:</strong> Copy the request for the agency, archive, county clerk, court clerk, BIA/LTRO office, or land-record office. Each request tells the office what record trail the family is trying to locate and lists the record types to check.</p>${(planner.record_request_packet || []).map(requestCard).join('')}`, `${(planner.record_request_packet||[]).length} request(s)`));
      if (output) output.innerHTML = sections.join('');
      if ($('unifiedCount')) $('unifiedCount').textContent = `${siteCards.length + rankedSources.best.length} best match card(s); ${rankedSources.related.length} related official lead(s)`;
      status('Unified search complete. Start with the built research path, then use the matching records, source links, and copy-paste request packets below.');
    } catch (e) {
      if (output) output.innerHTML = `<p class="status bad">Unified search failed: ${esc(e.message || e)}</p>`;
      status('Unified search failed. Try less information or try again in a moment.', true);
    }
  }

  function printUnified(){
    const output = $('unifiedResults');
    if (!output || !text(output.textContent) || /results will appear/i.test(output.textContent)) { alert('Run the unified search first.'); return; }
    if (window.AllottedPrint?.buildPacket) {
      window.AllottedPrint.buildPacket('AllottedLand.com Research Packet', 'This packet includes the research path, matching site records, source leads, official links, and agency request text.', [`<section class="print-result"><h2>Unified search results</h2>${output.innerHTML}</section>`]);
    } else window.print();
  }
  function clearUnified(){
    ['unifiedQuery','wizFirst','wizLast','wizVariants','wizRoll','wizCard','wizAllotment','wizPlace','uniAddress','uniLat','uniLon','wizTownship','wizRange','wizSection','uniLegal','uniNotice','uniSourceKeyword','wizStory'].forEach(id => { if($(id)) $(id).value=''; });
    if($('wizTribe')) $('wizTribe').value='';
    if($('uniCategory')) $('uniCategory').value='';
    if($('unifiedResults')) $('unifiedResults').innerHTML='<p class="muted">Results will appear here. The first section will be the built research path: what to look for, where to search, and why each record matters.</p>';
    if($('unifiedCount')) $('unifiedCount').textContent='0 leads';
    status('Enter any information you have, or click “I don’t know where to start,” to build a research path and search all available source leads.');
  }

  async function copyText(value){
    try { await navigator.clipboard.writeText(value); status('Request text copied. Paste it into an email or records-request form.'); }
    catch(e) { window.prompt('Copy this request text:', value); }
  }

  document.addEventListener('DOMContentLoaded', () => {
    try { if ($('unifiedAgree') && localStorage.getItem('allottedland_unified_agreement') === 'yes') $('unifiedAgree').checked = true; } catch(e) {}
    $('unifiedSearchBtn')?.addEventListener('click', () => runUnified(false));
    $('unifiedStarterBtn')?.addEventListener('click', starterFill);
    $('unifiedPrintBtn')?.addEventListener('click', printUnified);
    $('unifiedClearBtn')?.addEventListener('click', clearUnified);
    $('unifiedQuery')?.addEventListener('keydown', (e) => { if(e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); runUnified(false); } });
  });
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.copy-request-btn');
    if (!btn) return;
    event.preventDefault();
    copyText(btn.getAttribute('data-copy-text') || '');
  });
})();
