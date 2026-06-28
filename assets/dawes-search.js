/* AllottedLand.com v0.37 Dawes search + branded print packet fixes
   - No automatic results before the user searches
   - Dawes search/PDF gated by research-only consent checkbox
   - Print packet never displays on-screen; it only appears in print/save-PDF output
*/
(function () {
  const $ = (id) => document.getElementById(id);
  const state = {
    records: [],
    filtered: [],
    selected: new Map(),
    loaded: false,
    hasSearched: false
  };
  const text = (v) => String(v == null ? '' : v).trim();
  const lower = (v) => text(v).toLowerCase();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
  const attr = (s) => esc(s).replace(/`/g, '&#96;');
  const compact = (arr) => arr.map(text).filter(Boolean);
  const categoryBuckets = {
    blood: ['blood', 'bb', 'minor', 'newborn', 'citizen by blood', 'minors by blood', 'newborns by blood'],
    freedmen: ['freedmen', 'freedman', 'f ', 'fm', 'fnb', 'minor freedmen', 'newborn freedmen'],
    intermarried: ['intermarried', 'marriage', 'citizen by marriage', 'iw'],
    adopted: ['adopted', 'delaware'],
    rejected: ['denied', 'doubtful', 'rejected', 'stricken', 'r ', 'd ']
  };

  function normalizeRecord(r, index) {
    const full = text(r.full_name) || compact([r.first_name, r.middle_name, r.last_name]).join(' ') || 'Unnamed person';
    const tribe = text(r.tribe || r.nation);
    const category = text(r.enrollment_category || r.category || r.category_abbreviation);
    const id = text(r.id) || ['dawes', tribe, category, r.roll_number, r.census_card_number, full, index]
      .map(lower).join('-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return Object.assign({}, r, { id, full_name: full, tribe, enrollment_category: category });
  }

  function dawesAgreed() {
    return !!$('dawesAgree')?.checked;
  }

  function setDawesGate() {
    const searchBtn = $('dawesSearchBtn');
    const printBtn = $('printDawesBtn');
    const ok = dawesAgreed();
    if (searchBtn) searchBtn.disabled = !ok;
    if (printBtn) printBtn.disabled = !ok;
    try { localStorage.setItem('allottedland_dawes_agreement', ok ? 'yes' : 'no'); } catch (e) {}
  }

  function requireDawesAgree() {
    if (dawesAgreed()) return true;
    const target = $('dawesAgree');
    alert('Please check the Dawes research-lead agreement box before searching or printing.');
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    target?.focus();
    return false;
  }

  async function loadDawesIndex() {
    const status = $('dawesStatus');
    try {
      const response = await fetch('data/dawes_index.json', { headers: { accept: 'application/json' } });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const payload = await response.json();
      state.records = (Array.isArray(payload.records) ? payload.records : []).map(normalizeRecord);
      state.filtered = [];
      state.loaded = true;
      state.hasSearched = false;
      if (status) status.textContent = state.records.length
        ? `Dawes index loaded (${state.records.length} record${state.records.length === 1 ? '' : 's'}). Enter a name, roll number, census card number, tribe, or category to search.`
        : 'Dawes index file loaded, but it has no records yet. Add rows to data/dawes_index.json.';
      renderEmptyStart();
    } catch (error) {
      if (status) status.textContent = 'Could not load data/dawes_index.json. Add the file and redeploy the site.';
      state.records = [];
      state.filtered = [];
      state.loaded = false;
      state.hasSearched = false;
      renderResults([], { emptyReason: 'load-error' });
    }
  }

  function searchableText(r) {
    return lower([
      r.full_name, r.first_name, r.middle_name, r.last_name, r.tribe, r.nation,
      r.enrollment_category, r.category_abbreviation, r.roll_number, r.census_card_number,
      r.age, r.sex, r.blood_degree, r.relationship_to_head, r.source_title, r.notes,
      r.variant_names, r.family_group, r.search_terms
    ].join(' '));
  }

  function categoryMatches(r, bucket) {
    if (!bucket) return true;
    const hay = searchableText(r);
    return (categoryBuckets[bucket] || [bucket]).some((term) => hay.includes(term));
  }

  function hasCriteria() {
    return ['dawesQuery', 'dawesTribe', 'dawesCategory', 'dawesRoll', 'dawesCard']
      .some((id) => text($(id)?.value));
  }

  function filterRecords() {
    const q = lower($('dawesQuery')?.value);
    const tribe = lower($('dawesTribe')?.value);
    const bucket = lower($('dawesCategory')?.value);
    const roll = lower($('dawesRoll')?.value);
    const card = lower($('dawesCard')?.value);
    const parts = q.split(/\s+/).filter(Boolean);
    return state.records.filter((r) => {
      const hay = searchableText(r);
      if (tribe && !lower(r.tribe || r.nation).includes(tribe)) return false;
      if (roll && !lower(r.roll_number).includes(roll)) return false;
      if (card && !lower(r.census_card_number).includes(card)) return false;
      if (bucket && !categoryMatches(r, bucket)) return false;
      if (parts.length && !parts.every((part) => hay.includes(part))) return false;
      return true;
    });
  }

  function researchStepList(r) {
    const roll = text(r.roll_number);
    const card = text(r.census_card_number);
    const items = [];
    if (card) items.push(`Use census card number ${esc(card)} to locate the Dawes census/enrollment card and family group.`);
    if (card) items.push('Use the census card/application number to locate the enrollment jacket/testimonial packet.');
    if (roll) items.push(`Use enrollment/roll number ${esc(roll)} to look for the land allotment jacket.`);
    items.push('Use the allotment jacket legal description to search township/range/section maps and county land records.');
    items.push('If land-loss evidence exists, submit tax sale, sheriff sale, deed, probate, mortgage, guardian, BIA/LTRO, or court-record clues to the Land Loss Project.');
    return `<ol>${items.map((item) => `<li>${item}</li>`).join('')}</ol>`;
  }

  function resultCard(r) {
    const selected = state.selected.has(r.id);
    const meta = compact([
      r.tribe,
      r.enrollment_category,
      r.category_abbreviation ? `Category ${r.category_abbreviation}` : '',
      r.roll_number ? `Roll ${r.roll_number}` : '',
      r.census_card_number ? `Card ${r.census_card_number}` : '',
      r.blood_degree ? `Blood ${r.blood_degree}` : '',
      r.age ? `Age ${r.age}` : '',
      r.sex ? `Sex ${r.sex}` : ''
    ]);
    const sourceUrl = text(r.source_url);
    return `<article class="card dawes-card" data-dawes-id="${attr(r.id)}">
      <div class="dawes-card-head">
        <div>
          <p class="eyebrow dark">${esc(r.record_type || 'Dawes Roll Match')}</p>
          <h3>${esc(r.full_name)}</h3>
        </div>
        <button type="button" class="secondary dawes-select-btn" data-action="select" data-dawes-id="${attr(r.id)}">${selected ? 'Selected for PDF' : 'Add to PDF'}</button>
      </div>
      <div class="meta">${meta.map((m) => `<span class="pill">${esc(m)}</span>`).join('')}</div>
      ${r.relationship_to_head ? `<p><strong>Family relationship:</strong> ${esc(r.relationship_to_head)}</p>` : ''}
      ${r.notes ? `<p class="hint"><strong>Notes:</strong> ${esc(r.notes)}</p>` : ''}
      <details class="next-step-details">
        <summary>Next research steps</summary>
        ${researchStepList(r)}
      </details>
      <div class="card-actions">
        ${sourceUrl ? `<a class="link-button" href="${attr(sourceUrl)}" target="_blank" rel="noopener">Open source</a>` : ''}
        <a class="link-button secondary" href="evidence.html">Submit land-loss evidence</a>
      </div>
    </article>`;
  }

  function renderEmptyStart() {
    const count = $('dawesCount');
    const results = $('dawesResults');
    if (count) count.textContent = '0 results';
    if (results) results.innerHTML = '<p class="muted">No search has been run yet. Check the agreement box, enter a name, spelling variant, roll number, census card number, tribe, or category, then click Search Dawes leads.</p>';
  }

  function renderResults(records, opts = {}) {
    const results = $('dawesResults');
    const count = $('dawesCount');
    if (count) count.textContent = records.length + ' result' + (records.length === 1 ? '' : 's');
    if (!results) return;
    if (!records.length) {
      if (opts.emptyReason === 'load-error') {
        results.innerHTML = '<p class="muted">No Dawes records are available because the index file could not be loaded.</p>';
      } else if (!state.records.length) {
        results.innerHTML = '<p class="muted">The Dawes index is empty. Add bulk rows to <code>data/dawes_index.json</code>.</p>';
      } else if (!state.hasSearched) {
        renderEmptyStart();
      } else {
        results.innerHTML = '<p class="muted">No Dawes records matched. Try a spelling variant, last name only, roll number, or census card number.</p>';
      }
      return;
    }
    results.innerHTML = records.slice(0, 100).map(resultCard).join('') + (records.length > 100 ? '<p class="muted">Showing first 100 matches. Narrow the search for more precise results.</p>' : '');
  }

  function runSearch() {
    if (!requireDawesAgree()) return;
    if (!state.loaded) return;
    const status = $('dawesStatus');
    if (!hasCriteria()) {
      state.filtered = [];
      state.hasSearched = false;
      if (status) status.textContent = 'Enter at least one Dawes search clue before running the search.';
      renderEmptyStart();
      return;
    }
    state.filtered = filterRecords();
    state.hasSearched = true;
    if (status) status.textContent = state.filtered.length
      ? 'Search complete. Add results to the branded PDF packet or print the current matches.'
      : 'No matches found in the current Dawes index.';
    renderResults(state.filtered);
  }

  function clearSearch() {
    ['dawesQuery', 'dawesTribe', 'dawesCategory', 'dawesRoll', 'dawesCard'].forEach((id) => {
      const el = $(id);
      if (el) el.value = '';
    });
    state.filtered = [];
    state.selected.clear();
    state.hasSearched = false;
    renderEmptyStart();
    const status = $('dawesStatus');
    if (status) status.textContent = state.records.length
      ? `Dawes index loaded (${state.records.length} record${state.records.length === 1 ? '' : 's'}). Enter a name, roll number, census card number, tribe, or category to search.`
      : 'Dawes index file loaded, but it has no records yet.';
  }

  function toggleSelected(id) {
    const record = state.records.find((r) => r.id === id);
    if (!record) return;
    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.set(id, record);
    renderResults(state.filtered);
  }

  function printRecordHTML(r, index) {
    const rows = [
      ['Name', r.full_name],
      ['Tribe / Nation', r.tribe || r.nation],
      ['Enrollment category', compact([r.enrollment_category, r.category_abbreviation]).join(' / ')],
      ['Roll / enrollment number', r.roll_number],
      ['Census card number', r.census_card_number],
      ['Age', r.age],
      ['Sex', r.sex],
      ['Blood degree', r.blood_degree],
      ['Relationship to head', r.relationship_to_head],
      ['Source', r.source_title],
      ['Source URL', r.source_url],
      ['Notes', r.notes]
    ].filter(([, value]) => text(value));
    return `<section class="print-result">
      <h2>${index + 1}. ${esc(r.full_name)}</h2>
      <table><tbody>${rows.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>
      <h3>Suggested next research steps</h3>
      ${researchStepList(r)}
    </section>`;
  }

  function buildPrintPacket() {
    if (!requireDawesAgree()) return;
    const selected = Array.from(state.selected.values());
    const records = selected.length ? selected : (state.hasSearched ? state.filtered : []);
    if (!records.length) {
      alert('No Dawes results are available to print yet. Run a search first, or select one or more search results for the PDF packet.');
      return;
    }
    const content = $('printPacketContent');
    const date = $('printPacketDate');
    if (date) date.textContent = new Date().toLocaleString();
    if (content) {
      content.innerHTML = `<p class="print-meta">${selected.length ? 'Selected results' : 'Current search results'} · ${records.length} record${records.length === 1 ? '' : 's'}</p>` + records.map(printRecordHTML).join('');
    }
    window.setTimeout(() => window.print(), 100);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!$('dawesResults')) return;
    try {
      if ($('dawesAgree') && localStorage.getItem('allottedland_dawes_agreement') === 'yes') $('dawesAgree').checked = true;
    } catch (e) {}
    $('dawesAgree')?.addEventListener('change', setDawesGate);
    setDawesGate();
    loadDawesIndex();
    $('dawesSearchBtn')?.addEventListener('click', runSearch);
    $('dawesClearBtn')?.addEventListener('click', clearSearch);
    $('printDawesBtn')?.addEventListener('click', buildPrintPacket);
    ['dawesQuery', 'dawesRoll', 'dawesCard'].forEach((id) => {
      $(id)?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') { event.preventDefault(); runSearch(); }
      });
    });
    $('dawesResults')?.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-action="select"]');
      if (btn) toggleSelected(btn.getAttribute('data-dawes-id'));
    });
  });
})();
