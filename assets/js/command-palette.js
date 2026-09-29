/* ==========================================================================
   TrailKit — Command Palette (Ctrl/Cmd + K)
   ========================================================================== */

(function () {
  'use strict';

  let root = null;
  let input = null;
  let list = null;
  let filtered = [];
  let selectedIndex = 0;
  let previousFocus = null;

  function escapeHtml(str) {
    if (window.TrailKit && window.TrailKit.escapeHtml) return window.TrailKit.escapeHtml(str);
    return String(str).replace(/[&<>"']/g, function (s) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
    });
  }

  function siteBase() {
    return /\/pages\/[^\/]*\.html?$/.test(location.pathname) ? '../' : '';
  }

  function ensureUI() {
    if (root) return;

    root = document.createElement('div');
    root.className = 'cmd-palette';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'Command palette');
    root.innerHTML =
      '<div class="cmd-palette-backdrop" data-close></div>' +
      '<div class="cmd-palette-panel" role="document">' +
        '<div class="cmd-palette-inputwrap">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
          '<input type="text" class="cmd-palette-input" placeholder="Search tools… (Esc to close)" aria-label="Search tools" autocomplete="off" spellcheck="false">' +
          '<kbd class="cmd-palette-kbd">Esc</kbd>' +
        '</div>' +
        '<ul class="cmd-palette-list" role="listbox" aria-label="Tools"></ul>' +
      '</div>';
    document.body.appendChild(root);

    input = root.querySelector('.cmd-palette-input');
    list = root.querySelector('.cmd-palette-list');

    root.querySelector('[data-close]').addEventListener('click', close);
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKeyDown);
    list.addEventListener('click', onListClick);
    list.addEventListener('mousemove', onListHover);
  }

  function fuzzyScore(query, text) {
    query = query.toLowerCase();
    text = text.toLowerCase();
    if (!query) return 1;
    const idx = text.indexOf(query);
    if (idx !== -1) return 100 - Math.min(idx, 99);
    let qi = 0, score = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
      if (text[ti] === query[qi]) { qi++; score += 2; }
    }
    return qi === query.length ? score : 0;
  }

  function computeResults(query) {
    const tools = window.TrailKit.tools || [];
    return tools
      .map(function (t) {
        const s = Math.max(fuzzyScore(query, t.title), fuzzyScore(query, t.category), fuzzyScore(query, t.desc) * 0.5);
        return { tool: t, score: s };
      })
      .filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .map(function (r) { return r.tool; });
  }

  function render() {
    if (!filtered.length) {
      list.innerHTML = '<li class="cmd-palette-empty" role="option" aria-disabled="true">No tools match your search.</li>';
      return;
    }
    list.innerHTML = filtered.map(function (t, i) {
      const fav = window.Favorites && window.Favorites.isFavorite(t.id);
      return '<li class="cmd-palette-item' + (i === selectedIndex ? ' is-selected' : '') + '" ' +
        'role="option" aria-selected="' + (i === selectedIndex) + '" data-index="' + i + '" data-id="' + t.id + '">' +
        '<span class="cmd-palette-icon" aria-hidden="true">' + (t.icon || '') + '</span>' +
        '<span class="cmd-palette-meta">' +
          '<span class="cmd-palette-title">' + escapeHtml(t.title) + '</span>' +
          '<span class="cmd-palette-cat">' + escapeHtml(t.category) + '</span>' +
        '</span>' +
        (fav ? '<span class="cmd-palette-fav" aria-label="Favorite">★</span>' : '') +
      '</li>';
    }).join('');
  }

  function refresh(query) {
    filtered = computeResults(query);
    if (selectedIndex >= filtered.length) selectedIndex = 0;
    render();
  }

  function onInput(e) { selectedIndex = 0; refresh(e.target.value); }

  function onKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1); render(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = Math.max(selectedIndex - 1, 0); render(); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const t = filtered[selectedIndex];
      if (t) navigate(t);
    }
  }

  function onListClick(e) {
    const li = e.target.closest('.cmd-palette-item');
    if (!li) return;
    const t = filtered[Number(li.dataset.index)];
    if (t) navigate(t);
  }

  function onListHover(e) {
    const li = e.target.closest('.cmd-palette-item');
    if (!li) return;
    const i = Number(li.dataset.index);
    if (i !== selectedIndex) { selectedIndex = i; render(); }
  }

  function navigate(tool) {
    close();
    const base = siteBase();
    if (window.Recent) window.Recent.add(tool.id);
    setTimeout(function () { window.location.href = base + tool.href; }, 60);
  }

  function open() {
    ensureUI();
    previousFocus = document.activeElement;
    root.classList.add('open');
    input.value = '';
    selectedIndex = 0;
    refresh('');
    setTimeout(function () { input.focus(); }, 40);
  }

  function close() {
    if (!root) return;
    root.classList.remove('open');
    if (previousFocus && typeof previousFocus.focus === 'function') {
      try { previousFocus.focus(); } catch (_) {}
    }
  }

  function toggle() {
    if (root && root.classList.contains('open')) close();
    else open();
  }

  document.addEventListener('keydown', function (e) {
    const isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (mod && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      toggle();
    }
  });

  window.CommandPalette = { open: open, close: close, toggle: toggle };
})();