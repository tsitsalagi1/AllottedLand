/* AllottedLand.com v0.38 universal branded print packet
   Prints research-path output, Dawes results, approved/site-search results, and individual result cards.
   Uses the existing hidden #printPacket print container.
*/
(function(){
  const $ = (id) => document.getElementById(id);
  const text = (v) => String(v == null ? '' : v).trim();
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function packetReady(){ return $('printPacket') && $('printPacketContent'); }

  function stripForPrint(node){
    const clone = node.cloneNode(true);
    clone.removeAttribute('id');
    clone.querySelectorAll('script, style, input, textarea, select').forEach((el) => {
      if (el.tagName === 'TEXTAREA') {
        const pre = document.createElement('pre');
        pre.className = 'print-pre';
        pre.textContent = el.value || el.textContent || '';
        el.replaceWith(pre);
      } else {
        el.remove();
      }
    });
    clone.querySelectorAll('button').forEach((btn) => {
      const label = document.createElement('span');
      label.className = 'print-button-label';
      label.textContent = btn.textContent || '';
      btn.replaceWith(label);
    });
    clone.querySelectorAll('[data-print-injected], .no-print, .dawes-select-btn').forEach((el) => el.remove());
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    clone.querySelectorAll('[aria-live]').forEach((el) => el.removeAttribute('aria-live'));
    return clone.innerHTML;
  }

  function sectionHTML(title, bodyHTML, note){
    return `<section class="print-result"><h2>${esc(title)}</h2>${note ? `<p class="print-meta">${esc(note)}</p>` : ''}<div class="print-section-body">${bodyHTML}</div></section>`;
  }

  function buildPacket(title, intro, sections){
    if (!packetReady()) {
      alert('Print packet container is missing. Re-upload index.html and assets/print-packet.js from the latest package.');
      return;
    }
    const date = $('printPacketDate');
    const content = $('printPacketContent');
    if (date) date.textContent = new Date().toLocaleString();
    content.innerHTML = sectionHTML(title, `<p>${esc(intro || 'Research packet generated from visible site results.')}</p>`) + sections.join('');
    window.setTimeout(() => window.print(), 80);
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
    if (!hasBuiltPath(path)) {
      alert('Build a research path first, then print/save the packet.');
      return;
    }
    const sections = [sectionHTML('Built search path result', stripForPrint(path))];
    if (request && text(request.value)) {
      sections.push(sectionHTML('Copy-paste county records request', `<pre class="print-pre">${esc(request.value)}</pre>`));
    }
    buildPacket('AllottedLand.com Research Path Packet', 'This packet captures the built search path, source-route clues, and county-record request generated from the information entered on the site.', sections);
  }

  function resultStatusText(){
    return [text($('count')?.textContent), text($('status')?.textContent)].filter(Boolean).join(' · ');
  }

  function printSiteSearchResults(){
    const results = $('results');
    if (!results || !text(results.textContent)) {
      alert('Run a site search first, then print/save the visible results.');
      return;
    }
    const cards = results.querySelectorAll('article, .card, .result-card');
    if (!cards.length && /enter a township|no approved public records/i.test(text(results.textContent))) {
      alert('There are no site-search records to print yet. Run a search that returns visible records or map leads.');
      return;
    }
    const sections = [sectionHTML('Site search index results', stripForPrint(results), resultStatusText())];
    buildPacket('AllottedLand.com Site Search Results Packet', 'This packet captures the visible site-search index results or map leads from AllottedLand.com.', sections);
  }

  function printDawesVisibleResults(){
    const results = $('dawesResults');
    if (!results || !text(results.textContent)) {
      alert('Run a Dawes search first, then print/save the visible results.');
      return;
    }
    const cards = results.querySelectorAll('article, .card, .dawes-card');
    if (!cards.length && /no search|no dawes records matched|empty/i.test(text(results.textContent))) {
      alert('There are no Dawes result cards to print yet. Run a search that returns visible records.');
      return;
    }
    const note = [text($('dawesCount')?.textContent), text($('dawesStatus')?.textContent)].filter(Boolean).join(' · ');
    const sections = [sectionHTML('Dawes / Five Tribes search results', stripForPrint(results), note)];
    buildPacket('AllottedLand.com Dawes Search Results Packet', 'This packet captures visible Dawes/Five Tribes search leads from AllottedLand.com.', sections);
  }

  function printSingleCard(card){
    if (!card) return;
    const heading = text(card.querySelector('h3,h2,h1')?.textContent) || 'Visible record';
    buildPacket('AllottedLand.com Record Packet', 'This packet captures one visible record or map lead from AllottedLand.com.', [sectionHTML(heading, stripForPrint(card))]);
  }

  function addCardPrintButtons(root){
    if (!root) return;
    root.querySelectorAll('#results article, #dawesResults article').forEach((card) => {
      if (card.querySelector('[data-print-injected="card"]')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'link-button secondary no-print';
      btn.setAttribute('data-print-injected', 'card');
      btn.textContent = 'Print this record';
      const actions = card.querySelector('.card-actions, .dawes-card-head, .meta') || card;
      if (actions.classList.contains('dawes-card-head')) {
        actions.appendChild(btn);
      } else {
        actions.appendChild(btn);
      }
    });
  }

  function observeResultAreas(){
    ['results','dawesResults'].forEach((id) => {
      const el = $(id);
      if (!el) return;
      addCardPrintButtons(el);
      const obs = new MutationObserver(() => addCardPrintButtons(el));
      obs.observe(el, { childList: true, subtree: true });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('printPathBtn')?.addEventListener('click', printResearchPath);
    $('printSiteResultsBtn')?.addEventListener('click', printSiteSearchResults);
    // The Dawes button has its own selected-result packet builder. If no selected/current
    // Dawes packet is available, users can still print visible Dawes result cards individually.
    $('printVisibleDawesBtn')?.addEventListener('click', printDawesVisibleResults);
    observeResultAreas();
  });

  document.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-print-injected="card"]');
    if (!btn) return;
    event.preventDefault();
    printSingleCard(btn.closest('article, .card, .result-card'));
  });

  window.AllottedPrint = {
    buildPacket,
    printResearchPath,
    printSiteSearchResults,
    printDawesVisibleResults,
    printSingleCard
  };
})();
