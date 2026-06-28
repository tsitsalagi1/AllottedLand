/* AllottedLand.com v0.48 universal branded print packet
   Supports both the on-page Print buttons and browser Ctrl+P.
   If users print the page directly, it builds a packet from visible unified results.
*/
(function(){
  const $ = (id) => document.getElementById(id);
  const text = (v) => String(v == null ? '' : v).trim();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function packetReady(){ return $('printPacket') && $('printPacketContent'); }
  function stripForPrint(node){
    const clone = node.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('script, style').forEach((el) => el.remove());
    clone.querySelectorAll('input, textarea, select').forEach((el) => {
      const value = el.tagName === 'SELECT' ? (el.options?.[el.selectedIndex || 0]?.text || el.value || '') : (el.value || el.textContent || '');
      if (text(value)) {
        const pre = document.createElement('pre');
        pre.className = 'print-pre';
        pre.textContent = value;
        el.replaceWith(pre);
      } else el.remove();
    });
    clone.querySelectorAll('button').forEach((btn) => {
      const label = document.createElement('span');
      label.className = 'print-button-label';
      label.textContent = btn.textContent || '';
      btn.replaceWith(label);
    });
    clone.querySelectorAll('[data-print-injected], .no-print, .dawes-select-btn, .copy-request-btn').forEach((el) => el.remove());
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    clone.querySelectorAll('[aria-live]').forEach((el) => el.removeAttribute('aria-live'));
    return clone.innerHTML;
  }
  function sectionHTML(title, bodyHTML, note){
    return `<section class="print-result"><h2>${esc(title)}</h2>${note ? `<p class="print-meta">${esc(note)}</p>` : ''}<div class="print-section-body">${bodyHTML}</div></section>`;
  }
  function setPacketVisibilityAttrs(){
    const packet = $('printPacket');
    if (!packet) return;
    packet.setAttribute('aria-hidden','false');
    packet.dataset.ready = 'yes';
    document.body.classList.add('print-packet-ready');
  }
  function buildPacket(title, intro, sections){
    if (!packetReady()) {
      alert('Print packet container is missing. Re-upload index.html and assets/print-packet.js from the latest package.');
      return;
    }
    const date = $('printPacketDate');
    const content = $('printPacketContent');
    if (date) date.textContent = new Date().toLocaleString();
    content.innerHTML = sectionHTML(title, `<p>${esc(intro || 'Research packet generated from visible site results.')}</p>`) + (sections || []).join('');
    setPacketVisibilityAttrs();
    window.setTimeout(() => window.print(), 120);
  }

  function unifiedResultsReady(){
    const results = $('unifiedResults');
    return results && text(results.textContent) && !/results will appear here/i.test(results.textContent) && !/building the plain-english research path/i.test(results.textContent);
  }
  function autoBuildUnifiedPacket(){
    if (!packetReady() || !unifiedResultsReady()) return false;
    const content = $('printPacketContent');
    if (text(content.textContent)) return true;
    const queryText = $('unifiedQuery')?.value ? `<p><strong>Information entered:</strong> ${esc($('unifiedQuery').value)}</p>` : '';
    const results = $('unifiedResults');
    const date = $('printPacketDate');
    if (date) date.textContent = new Date().toLocaleString();
    content.innerHTML = sectionHTML('AllottedLand.com Unified Research Packet', `<p>This packet captures the built research path, matching records, official source leads, and agency request text from the one-search tool.</p>${queryText}`) + sectionHTML('Unified search results', stripForPrint(results));
    setPacketVisibilityAttrs();
    return true;
  }

  function hasBuiltPath(path){
    if (!path) return false;
    const body = text(path.textContent);
    if (!body || /your research path will appear here/i.test(body)) return false;
    return !!(path.querySelector('.path-grid') || path.querySelector('.mini-card') || path.querySelector('ol, ul'));
  }
  function printResearchPath(){
    const path = $('researchPath');
    const request = $('countyRequest');
    if (!hasBuiltPath(path)) { alert('Build a research path first, then print/save the packet.'); return; }
    const sections = [sectionHTML('Built search path result', stripForPrint(path))];
    if (request && text(request.value)) sections.push(sectionHTML('Copy-paste county records request', `<pre class="print-pre">${esc(request.value)}</pre>`));
    buildPacket('AllottedLand.com Research Path Packet', 'This packet captures the built search path, source-route information, and county-record request generated from the information entered on the site.', sections);
  }
  function printSiteSearchResults(){
    const results = $('results');
    if (!results || !text(results.textContent)) { alert('Run a site search first, then print/save the visible results.'); return; }
    buildPacket('AllottedLand.com Site Search Results Packet', 'This packet captures visible site-search index results or map leads from AllottedLand.com.', [sectionHTML('Site search index results', stripForPrint(results))]);
  }
  function printDawesVisibleResults(){
    const results = $('dawesResults');
    if (!results || !text(results.textContent)) { alert('Run a Dawes search first, then print/save the visible results.'); return; }
    buildPacket('AllottedLand.com Dawes Search Results Packet', 'This packet captures visible Dawes/Five Tribes search leads from AllottedLand.com.', [sectionHTML('Dawes / Five Tribes search results', stripForPrint(results))]);
  }
  function printSingleCard(card){
    if (!card) return;
    const heading = text(card.querySelector('h3,h2,h1')?.textContent) || 'Visible record';
    buildPacket('AllottedLand.com Record Packet', 'This packet captures one visible record or map lead from AllottedLand.com.', [sectionHTML(heading, stripForPrint(card))]);
  }
  function addCardPrintButtons(root){
    if (!root) return;
    root.querySelectorAll('#results article, #dawesResults article, #unifiedResults article').forEach((card) => {
      if (card.querySelector('[data-print-injected="card"]')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'link-button secondary no-print';
      btn.setAttribute('data-print-injected', 'card');
      btn.textContent = 'Print this record';
      const actions = card.querySelector('.card-actions, .dawes-card-head, .meta, .request-card-head') || card;
      actions.appendChild(btn);
    });
  }
  function observeResultAreas(){
    ['results','dawesResults','unifiedResults'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      addCardPrintButtons(el);
      const obs = new MutationObserver(() => addCardPrintButtons(el));
      obs.observe(el, { childList: true, subtree: true });
    });
  }

  window.addEventListener('beforeprint', () => {
    // If the user hits Ctrl+P/browser print instead of the site button, fill the branded packet automatically.
    autoBuildUnifiedPacket();
  });
  document.addEventListener('DOMContentLoaded', () => {
    $('printPathBtn')?.addEventListener('click', printResearchPath);
    $('printSiteResultsBtn')?.addEventListener('click', printSiteSearchResults);
    $('printVisibleDawesBtn')?.addEventListener('click', printDawesVisibleResults);
    observeResultAreas();
  });
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-print-injected="card"]');
    if (!btn) return;
    event.preventDefault();
    printSingleCard(btn.closest('article, .card, .result-card'));
  });
  window.AllottedPrint = { buildPacket, printResearchPath, printSiteSearchResults, printDawesVisibleResults, printSingleCard, autoBuildUnifiedPacket };
})();
