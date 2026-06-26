const manifestUrl = 'https://www.loc.gov/item/2011585467/manifest.json';
let maps = [];
let records = [];
let countyRoutes = [];
let manifestCanvases = [];

const $ = id => document.getElementById(id);
const norm = v => (v || '').toString().trim().toLowerCase();
const compact = v => norm(v).replace(/\s+/g,'');
const digits = v => (v || '').toString().replace(/[^0-9]/g,'');
const has = v => (v || '').toString().trim().length > 0;

function locPageUrl(page){ return `https://www.loc.gov/resource/g4021gm.gla00497/?sp=${page}&st=image`; }
function textBlob(item){ return Object.values(item || {}).join(' ').toLowerCase(); }
function escapeHtml(s){return (s||'').toString().replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function iiifImageUrl(page, size='1200,'){
  const canvas = manifestCanvases[page-1];
  const service = canvas?.images?.[0]?.resource?.service;
  const id = service?.['@id'] || service?.id;
  if(!id) return '';
  return `${id}/full/${size}/0/default.jpg`;
}

async function loadJson(path, fallback){
  try{
    const r = await fetch(path);
    if(!r.ok) throw new Error(path);
    return await r.json();
  }catch(e){ return fallback; }
}

async function loadData(){
  [maps, records, countyRoutes] = await Promise.all([
    loadJson('data/map_index.json', []),
    loadJson('data/allotment_records.json', []),
    loadJson('data/county_routes.json', [])
  ]);
  try{
    const manifest = await fetch(manifestUrl).then(r=>r.json());
    manifestCanvases = manifest.sequences?.[0]?.canvases || [];
    $('status').textContent = `Loaded ${maps.length} map pages, ${records.length} verified allotment-name rows, and ${countyRoutes.length} county-route examples. LOC image previews ready.`;
  }catch(e){
    $('status').textContent = `Loaded ${maps.length} map pages, ${records.length} verified allotment-name rows, and ${countyRoutes.length} county-route examples. LOC preview manifest could not be loaded in this browser; open LOC links still work.`;
  }
  runSearch();
}

function getFilters(){
  return {
    givenName:norm($('givenName').value), surname:norm($('surname').value), roll:digits($('rollNumber').value), allotment:digits($('allotmentNumber').value),
    township:digits($('township').value), range:digits($('range').value), townshipRange:norm($('townshipRange').value), section:digits($('section').value), keyword:norm($('keyword').value)
  };
}

function recordMatches(r,f){
  if(f.givenName && !norm(r.given_name).includes(f.givenName) && !norm(r.verified_name).includes(f.givenName) && !norm(r.possible_ocr_name).includes(f.givenName)) return false;
  if(f.surname && !norm(r.surname).includes(f.surname) && !norm(r.verified_name).includes(f.surname) && !norm(r.possible_ocr_name).includes(f.surname)) return false;
  if(f.roll && digits(r.roll_number || r.enrollment_number) !== f.roll) return false;
  if(f.allotment && digits(r.allotment_number) !== f.allotment) return false;
  if(f.township && digits(r.township) !== f.township) return false;
  if(f.range && digits(r.range) !== f.range) return false;
  if(f.townshipRange && !compact(r.township_range).includes(compact(f.townshipRange))) return false;
  if(f.section && digits(r.section) !== f.section) return false;
  if(f.keyword && !textBlob(r).includes(f.keyword)) return false;
  return true;
}

function mapMatches(m,f){
  if(f.givenName || f.surname || f.roll || f.allotment || f.section) return false;
  if(f.township && digits(m.township) !== f.township) return false;
  if(f.range && digits(m.range) !== f.range) return false;
  if(f.townshipRange && !compact(m.township_range).includes(compact(f.townshipRange))) return false;
  if(f.keyword && !textBlob(m).includes(f.keyword)) return false;
  return true;
}

function renderCard(item){
  const page = item.loc_page;
  const title = item.verified_name || item.sheet_title || `LOC page ${page}`;
  const type = item.verified_name || item.possible_ocr_name ? 'Allotment row' : 'Map page';
  const parts = [];
  if(item.roll_number || item.enrollment_number) parts.push(`<span class="pill">Roll ${escapeHtml(item.roll_number || item.enrollment_number)}</span>`);
  if(item.allotment_number) parts.push(`<span class="pill">Allotment ${escapeHtml(item.allotment_number)}</span>`);
  if(item.township_range) parts.push(`<span class="pill">${escapeHtml(item.township_range)}</span>`);
  if(item.section) parts.push(`<span class="pill">Section ${escapeHtml(item.section)}</span>`);
  if(item.county) parts.push(`<span class="pill">${escapeHtml(item.county)} County</span>`);
  if(item.status_restriction_notation) parts.push(`<span class="pill">${escapeHtml(item.status_restriction_notation)}</span>`);
  const desc = [item.legal_description, item.notes, item.ocr_status].filter(Boolean).join(' · ');
  return `<article class="card">
    <h3>${escapeHtml(title)}</h3>
    <div class="meta"><span class="pill">${type}</span><span class="pill">LOC page ${escapeHtml(page)}</span>${parts.join('')}</div>
    ${desc ? `<p>${escapeHtml(desc)}</p>` : ''}
    <div class="card-actions">
      <button class="link-button" onclick="showMap(${Number(page) || 1})">Preview map</button>
      <a class="link-button" href="${escapeHtml(item.source_link || locPageUrl(page))}" target="_blank" rel="noopener">Open source</a>
    </div>
  </article>`;
}

function runSearch(){
  const f = getFilters();
  let hits = records.filter(r=>recordMatches(r,f));
  hits = hits.concat(maps.filter(m=>mapMatches(m,f)));
  hits = hits.slice(0,200);
  $('count').textContent = `${hits.length} result${hits.length===1?'':'s'}`;
  $('results').innerHTML = hits.length ? hits.map(renderCard).join('') : '<p class="hint">No results yet. Try township/range, or add OCR/verified name rows to <code>data/allotment_records.json</code>.</p>';
}

function showMap(page){
  const viewer = $('viewer');
  const open = $('openLoc');
  open.href = locPageUrl(page);
  open.classList.remove('hidden');
  const img = iiifImageUrl(page);
  if(img){
    viewer.className = '';
    viewer.innerHTML = `<img class="viewer-image" src="${img}" alt="LOC map page ${page}">`;
  }else{
    viewer.className = 'viewer-empty';
    viewer.innerHTML = `Preview not available here. <a href="${locPageUrl(page)}" target="_blank" rel="noopener">Open LOC page ${page}</a>.`;
  }
}

function getWizard(){
  return {
    tribe: $('wizTribe').value,
    first: $('wizFirst').value.trim(),
    last: $('wizLast').value.trim(),
    variants: $('wizVariants').value.trim(),
    roll: $('wizRoll').value.trim(),
    card: $('wizCard').value.trim(),
    allotment: $('wizAllotment').value.trim(),
    place: $('wizPlace').value.trim(),
    township: digits($('wizTownship').value),
    range: digits($('wizRange').value),
    section: digits($('wizSection').value),
    story: $('wizStory').value.trim()
  };
}

function findMapMatchesFromWizard(w){
  if(!w.township || !w.range) return [];
  return maps.filter(m => digits(m.township) === w.township && digits(m.range) === w.range).slice(0,10);
}

function findCountyRoute(w){
  if(!w.township || !w.range) return null;
  const exact = countyRoutes.find(r => digits(r.township) === w.township && digits(r.range) === w.range && digits(r.section) === w.section && w.section);
  if(exact) return exact;
  const tr = countyRoutes.find(r => digits(r.township) === w.township && digits(r.range) === w.range && !r.section);
  if(tr) return tr;
  const sameTR = countyRoutes.find(r => digits(r.township) === w.township && digits(r.range) === w.range);
  return sameTR || null;
}

function makeLegalDescription(w){
  const parts = [];
  if(w.section) parts.push(`Section ${w.section}`);
  if(w.township) parts.push(`Township ${w.township} North`);
  if(w.range) parts.push(`Range ${w.range} East`);
  return parts.join(', ');
}

function makeCountyRequest(w, route){
  const name = [w.first, w.last].filter(Boolean).join(' ') || '[Ancestor Name]';
  const legal = makeLegalDescription(w) || '[legal description / township-range-section]';
  const county = route?.county ? `${route.county} County` : '[County Clerk / Register of Deeds]';
  const roll = w.roll ? `, roll/enrollment number ${w.roll}` : '';
  const card = w.card ? `, census card number ${w.card}` : '';
  const allotment = w.allotment ? `, allotment number ${w.allotment}` : '';
  const tribe = w.tribe || '[Tribe/Nation]';
  return `To: ${county} Clerk / Land Records Office\n\nSubject: Land Record Search Request — ${name}\n\nHello,\n\nI am researching the allotment and later land-title history of ${name}, ${tribe}${roll}${card}${allotment}. The land description or search clue I have is: ${legal}.\n\nPlease search the county land records under this name, possible name variants, and the legal description for any related records, including:\n\n- patents or allotment-related filings\n- deeds and warranty deeds\n- mortgages and mortgage releases\n- sheriff deeds / sheriff sale records\n- tax deeds / tax sale records\n- oil and gas leases\n- mineral deeds or assignments\n- probate-related filings\n- liens, judgments, releases, and right-of-way records\n\nIf the records are indexed under a different spelling, recording district, grantor/grantee entry, book/page, instrument number, or legal description, please let me know what search terms or index entries should be used.\n\nThank you.`;
}

function buildResearchPath(e){
  e.preventDefault();
  const w = getWizard();
  const mapHits = findMapMatchesFromWizard(w);
  const route = findCountyRoute(w);
  const request = makeCountyRequest(w, route);
  $('countyRequest').value = request;

  if(w.township){ $('township').value = w.township; }
  if(w.range){ $('range').value = w.range; }
  if(w.section){ $('section').value = w.section; }
  if(w.first){ $('givenName').value = w.first; }
  if(w.last){ $('surname').value = w.last; }
  if(w.roll){ $('rollNumber').value = w.roll; }
  if(w.allotment){ $('allotmentNumber').value = w.allotment; }
  runSearch();

  const clues = [];
  if(w.first || w.last) clues.push(`Name clue: ${escapeHtml([w.first,w.last].filter(Boolean).join(' '))}`);
  if(w.variants) clues.push(`Variants: ${escapeHtml(w.variants)}`);
  if(w.roll) clues.push(`Roll/enrollment number: ${escapeHtml(w.roll)}`);
  if(w.card) clues.push(`Census card number: ${escapeHtml(w.card)}`);
  if(w.allotment) clues.push(`Allotment number: ${escapeHtml(w.allotment)}`);
  if(w.place) clues.push(`Place clue: ${escapeHtml(w.place)}`);
  if(makeLegalDescription(w)) clues.push(`Land-grid clue: ${escapeHtml(makeLegalDescription(w))}`);

  const mapHtml = mapHits.length ? mapHits.map(m => `<li><button class="link-button" onclick="showMap(${Number(m.loc_page)})">${escapeHtml(m.township_range || m.sheet_title)} — LOC page ${escapeHtml(m.loc_page)}</button></li>`).join('') : '<li>No direct LOC map match yet. Add township and range, or search by name after verified records are loaded.</li>';
  const countyHtml = route ? `<strong>${escapeHtml(route.county)} County, ${escapeHtml(route.state || 'Oklahoma')}</strong><br><span class="muted">Basis: ${escapeHtml(route.basis || 'township/range route example')}</span>` : '<strong>County not resolved yet.</strong><br><span class="muted">The site needs a completed township/range/section-to-county table. Use the legal description with Oklahoma PLSS/county maps or county clerk indexes until that table is filled.</span>';

  $('researchPath').innerHTML = `
    <h2>Research path for ${escapeHtml([w.first,w.last].filter(Boolean).join(' ') || 'this family search')}</h2>
    <div class="alert"><strong>Goal:</strong> connect the family clue → enrollment/allotment record → legal description → map image → modern county records → BIA/LTRO records if trust or restricted land may be involved.</div>
    <div class="path-grid">
      <div class="mini-card"><h3>Clues entered</h3><ul>${clues.length ? clues.map(c=>`<li>${c}</li>`).join('') : '<li>No clues entered yet.</li>'}</ul></div>
      <div class="mini-card"><h3>Possible LOC map</h3><ul>${mapHtml}</ul></div>
      <div class="mini-card"><h3>County route</h3><p>${countyHtml}</p></div>
    </div>
    <div class="path-grid">
      <div class="mini-card"><h3>Federal record path</h3><ul><li>Search Dawes census card / roll number.</li><li>Find enrollment jacket.</li><li>Use enrollment number to locate allotment jacket.</li><li>Extract township, range, section, acreage, and allotment data.</li></ul></div>
      <div class="mini-card"><h3>County record path</h3><ul><li>Search grantor/grantee indexes.</li><li>Search legal description indexes.</li><li>Look for deeds, mortgages, releases, sheriff deeds, tax deeds, oil and gas leases, liens, and probate-related filings.</li></ul></div>
      <div class="mini-card"><h3>Trust/restricted land path</h3><ul><li>If restrictions or trust status may exist, request BIA/LTRO title records.</li><li>Ask for patents, deeds, probate orders, leases, rights-of-way, cadastral surveys, plats, and Title Status Report where available.</li></ul></div>
    </div>`;
}

function fillExample(){
  $('wizTribe').value = 'Cherokee Nation';
  $('wizFirst').value = 'Claudie';
  $('wizLast').value = 'Ketcher';
  $('wizVariants').value = 'Claude Ketcher';
  $('wizRoll').value = '1637';
  $('wizAllotment').value = '';
  $('wizPlace').value = 'Craig County';
  $('wizTownship').value = '26';
  $('wizRange').value = '21';
  $('wizSection').value = '9';
  $('wizStory').value = 'Family allotment land; later title-chain search may include mortgage, sheriff sale, oil and gas lease, tax record, or release.';
}

function clearWizard(){
  document.querySelectorAll('#wizardForm input, #wizardForm textarea').forEach(i=>i.value='');
  $('countyRequest').value='';
  $('researchPath').innerHTML = '<h2>Your research path will appear here.</h2><p class="muted">Fill out the “What do you know?” form and the site will create a step-by-step plan, possible map matches, county record direction, BIA/LTRO direction, and a copy-paste records request.</p>';
}

['givenName','surname','rollNumber','allotmentNumber','township','range','townshipRange','section','keyword'].forEach(id => $(id).addEventListener('input', runSearch));
$('searchBtn').addEventListener('click', runSearch);
$('clearBtn').addEventListener('click', () => { document.querySelectorAll('#search input').forEach(i=>i.value=''); runSearch(); });
$('wizardForm').addEventListener('submit', buildResearchPath);
$('fillExample').addEventListener('click', fillExample);
$('clearWizard').addEventListener('click', clearWizard);
$('copyRequest').addEventListener('click', async () => {
  const text = $('countyRequest').value;
  if(!text) return;
  try{ await navigator.clipboard.writeText(text); $('copyRequest').textContent='Copied'; setTimeout(()=>$('copyRequest').textContent='Copy request',1200); }
  catch(e){ $('countyRequest').select(); document.execCommand('copy'); }
});
window.showMap = showMap;
loadData();
