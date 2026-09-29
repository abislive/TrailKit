/* ==========================================================================
   TrailKit — App Bootstrap
   ========================================================================== */

(function () {
  'use strict';

  window.TrailKit = window.TrailKit || {};

  const $ = function (sel, root) { return (root || document).querySelector(sel); };
  const $$ = function (sel, root) { return Array.from((root || document).querySelectorAll(sel)); };
  window.TrailKit.$ = $;
  window.TrailKit.$$ = $$;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (s) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
    });
  }
  window.TrailKit.escapeHtml = escapeHtml;

  window.TrailKit.formatNumber = function (n, decimals) {
    if (decimals === undefined) decimals = 2;
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
  };

  window.TrailKit.formatBytes = function (bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
  };

  window.TrailKit.downloadBlob = function (blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  };

  window.TrailKit.showAlert = function (container, type, message) {
    if (!container) return;
    const map = { error: 'showError', success: 'showSuccess', info: 'showInfo', warning: 'showInfo' };
    const fn = map[type] || 'showInfo';
    window.ToolUI[fn](container, message);
  };
  window.TrailKit.clearAlert = function (container) { window.ToolUI.clear(container); };

  /* ---- Tool registry ---- */
  window.TrailKit.tools = [
    { id: 'outdoor', title: 'Outdoor & Navigation', category: 'outdoor', href: 'pages/outdoor.html',
      desc: 'Distance, bearing, sunrise/sunset, altitude from pressure.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>' },
    { id: 'weather', title: 'Weather', category: 'weather', href: 'pages/weather.html',
      desc: 'Current conditions and 7-day forecast via Open-Meteo. No API key.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>' },
    { id: 'image-tools', title: 'Image Toolkit', category: 'image', href: 'pages/image-tools.html',
      desc: 'Resize, compress, convert, rotate, crop — fully local.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' },
    { id: 'pdf-tools', title: 'Images to PDF', category: 'image', href: 'pages/pdf-tools.html',
      desc: 'Combine images into a single PDF with reorder, page-size, and orientation options.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
    { id: 'speech', title: 'Speech to Text', category: 'speech', href: 'pages/speech.html',
      desc: 'Live microphone transcription via the browser Web Speech API.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>' },
    { id: 'utilities', title: 'Developer Utilities', category: 'utilities', href: 'pages/utilities.html',
      desc: 'Hash (text + file), UUID, Base64, JSON, unit converter, QR code.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' },
    { id: 'currency', title: 'Currency Converter', category: 'utilities', href: 'pages/utilities.html#currency',
      desc: '200+ currencies via Frankfurter v2 (ECB + central bank data).',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>' }
  ];

  function renderToolCard(t, opts) {
    opts = opts || {};
    const fav = window.Favorites && window.Favorites.isFavorite(t.id);
    return '<a class="tool-card tool-card-anim" href="' + t.href + '" data-tool-id="' + t.id + '">' +
      '<span class="tool-card-icon" aria-hidden="true">' + t.icon + '</span>' +
      '<h3 class="tool-card-title">' + escapeHtml(t.title) + '</h3>' +
      '<p class="tool-card-desc">' + escapeHtml(t.desc) + '</p>' +
      '<span class="tool-card-tag">' + escapeHtml(t.category) + '</span>' +
      (opts.showFavButton ? '<button type="button" class="tool-card-fav" data-fav="' + t.id + '" aria-label="Toggle favorite for ' + escapeHtml(t.title) + '">' + (fav ? '★' : '☆') + '</button>' : '') +
    '</a>';
  }

  function renderHomeGrids() {
    const grid = document.getElementById('tool-grid');
    const noResults = document.getElementById('no-results');
    if (grid) {
      const filterBtns = $$('#category-filter .filter-btn');
      let activeCategory = 'all';

      function render() {
        const tools = window.TrailKit.tools.filter(function (t) {
          return activeCategory === 'all' || t.category === activeCategory;
        });
        grid.innerHTML = tools.map(function (t) { return renderToolCard(t, { showFavButton: true }); }).join('');
        grid.querySelectorAll('.tool-card-fav').forEach(function (btn) {
          btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            const id = btn.dataset.fav;
            window.Favorites.toggle(id);
            btn.textContent = window.Favorites.isFavorite(id) ? '★' : '☆';
            renderFavorites();
          });
        });
        if (noResults) noResults.classList.toggle('hidden', tools.length > 0);
      }

      filterBtns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          filterBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
          activeCategory = btn.dataset.category;
          render();
        });
      });
      render();
    }

    renderFavorites();
    renderRecent();

    const clearRecent = document.getElementById('dash-clear-recent');
    if (clearRecent) {
      clearRecent.addEventListener('click', function () {
        window.Recent.clear();
        renderRecent();
        window.Notify.info('Recent tools cleared');
      });
    }
  }

  function renderFavorites() {
    const wrap = document.getElementById('dash-favorites');
    const empty = document.getElementById('dash-favorites-empty');
    if (!wrap) return;
    const ids = window.Favorites.list();
    const tools = ids.map(function (id) { return window.TrailKit.tools.find(function (t) { return t.id === id; }); }).filter(Boolean);
    wrap.innerHTML = tools.map(function (t) { return renderToolCard(t, { showFavButton: true }); }).join('');
    wrap.querySelectorAll('.tool-card-fav').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        window.Favorites.toggle(btn.dataset.fav);
        renderFavorites();
      });
    });
    if (empty) empty.classList.toggle('hidden', tools.length > 0);
  }

  function renderRecent() {
    const wrap = document.getElementById('dash-recent');
    const empty = document.getElementById('dash-recent-empty');
    if (!wrap) return;
    const ids = window.Recent.list();
    const tools = ids.map(function (id) { return window.TrailKit.tools.find(function (t) { return t.id === id; }); }).filter(Boolean);
    wrap.innerHTML = tools.map(function (t) { return renderToolCard(t); }).join('');
    if (empty) empty.classList.toggle('hidden', tools.length > 0);
  }

  function initReveal() {
    const els = $$('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('visible'); }); return; }
    const obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); obs.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { obs.observe(el); });
  }

  function initNetworkBanner() {
    if (document.body.classList.contains('error-page-body')) return;
    let banner = document.getElementById('network-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'network-banner';
      banner.className = 'network-banner';
      banner.setAttribute('role', 'status');
      banner.setAttribute('aria-live', 'polite');
      banner.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M1 1l22 22"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/></svg>' +
        '<span>You are offline. Cached tools still work.</span>';
      document.body.appendChild(banner);
    }
    function update() { banner.classList.toggle('visible', !navigator.onLine); }
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
  }

  function projectRoot() {
    let dir = location.pathname.replace(/\/[^\/]*$/, '/') || '/';
    if (/\/pages\/$/.test(dir)) {
      dir = dir.replace(/pages\/$/, '');
    }
    return dir;
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'http:' && location.protocol !== 'https:') return;

    window.addEventListener('load', function () {
      const root = projectRoot();
      navigator.serviceWorker.register(root + 'sw.js', { scope: root }).catch(function (err) {
        if (window.console && console.info) console.info('[TrailKit] SW skipped:', err && err.message);
      });
    });
  }

  function initHeroActions() {
    const heroBtn = document.getElementById('hero-cmd-open');
    if (heroBtn) heroBtn.addEventListener('click', function () { window.CommandPalette.open(); });
    const headerBtn = document.getElementById('cmd-trigger');
    if (headerBtn) headerBtn.addEventListener('click', function () { window.CommandPalette.open(); });
  }

  function trackRecentClicks() {
    document.addEventListener('click', function (e) {
      const card = e.target.closest('.tool-card');
      if (!card) return;
      const id = card.dataset.toolId;
      if (id && window.Recent) window.Recent.add(id);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderHomeGrids();
    initReveal();
    initNetworkBanner();
    initHeroActions();
    registerSW();
    trackRecentClicks();

    window.TrailKitState.on('favorites', renderFavorites);
    window.TrailKitState.on('recent', renderRecent);
  });
})();