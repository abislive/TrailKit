/* ==========================================================================
   TrailKit — Mobile Experience Layer
   - Injects bottom navigation + More drawer
   - Swipe gestures (edge-swipe to open drawer, swipe on forecast)
   - iOS zoom prevention
   - Haptic feedback on primary actions
   ========================================================================== */

(function () {
  'use strict';

  const isMobile = () => window.matchMedia('(max-width: 768px)').matches;
  const supportsHaptics = () => typeof navigator.vibrate === 'function';

  /* ---- Compute base path for relative links ---- */
  function basePath() {
    // We may be at ./index.html or ./pages/xxx.html
    const path = location.pathname;
    const inPages = /\/pages\/[^/]+$/.test(path);
    return inPages ? '../' : './';
  }

  /* ---- Bottom nav definition ---- */
  const NAV = [
    { id: 'home', label: 'Home', href: basePath() + 'index.html',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 9.5L12 3l9 6.5"/><path d="M5 10v10h14V10"/></svg>' },
    { id: 'outdoor', label: 'Outdoor', href: basePath() + 'pages/outdoor.html',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>' },
    { id: 'weather', label: 'Weather', href: basePath() + 'pages/weather.html',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>' },
    { id: 'image', label: 'Image', href: basePath() + 'pages/image-tools.html',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>' },
    { id: 'more', label: 'More', href: '#more',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>' }
  ];

  const MORE_TILES = [
    { label: 'PDF', href: 'pages/pdf-tools.html',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
    { label: 'Speech', href: 'pages/speech.html',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/></svg>' },
    { label: 'Utilities', href: 'pages/utilities.html',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' },
    { label: 'About', href: 'pages/about.html',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' },
    { label: 'Search', href: '#search',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' },
    { label: 'Help', href: '#help',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' }
  ];

  function detectActive() {
    const path = location.pathname;
    if (/\/pages\/outdoor\.html$/.test(path)) return 'outdoor';
    if (/\/pages\/weather\.html$/.test(path)) return 'weather';
    if (/\/pages\/image-tools\.html$/.test(path)) return 'image';
    if (/\/pages\/(pdf-tools|speech|utilities|about)\.html$/.test(path)) return 'more';
    return 'home';
  }

  function buildBottomNav() {
    if (document.querySelector('.bottom-nav')) return;
    const active = detectActive();
    const nav = document.createElement('nav');
    nav.className = 'bottom-nav';
    nav.setAttribute('aria-label', 'Primary mobile navigation');
    nav.innerHTML = NAV.map(function (item) {
      const isActive = item.id === active ? ' active' : '';
      const isMore = item.id === 'more';
      const tag = isMore ? 'button' : 'a';
      const attrs = isMore
        ? 'type="button" data-more-trigger'
        : 'href="' + item.href + '"';
      return '<' + tag + ' class="bottom-nav-item' + isActive + '" ' + attrs + ' aria-label="' + item.label + '">' +
        item.icon +
        '<span>' + item.label + '</span>' +
      '</' + tag + '>';
    }).join('');
    document.body.appendChild(nav);
    document.body.classList.add('has-bottom-nav');
  }

  function buildMoreDrawer() {
    if (document.querySelector('.more-drawer')) return;
    const base = basePath();
    const resolved = MORE_TILES.map(function (t) {
      const href = t.href.startsWith('#')
        ? t.href
        : base + t.href;
      return Object.assign({}, t, { href: href });
    });
    const drawer = document.createElement('div');
    drawer.className = 'more-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-modal', 'true');
    drawer.setAttribute('aria-label', 'More tools');
    drawer.innerHTML =
      '<div class="more-drawer-backdrop" data-more-close></div>' +
      '<div class="more-drawer-panel" role="document">' +
        '<div class="more-drawer-grabber" aria-hidden="true"></div>' +
        '<p class="more-drawer-title">More tools</p>' +
        '<div class="more-drawer-grid">' +
          resolved.map(function (t) {
            const dataAttr = t.href.startsWith('#') ? ' data-action="' + t.href.slice(1) + '"' : '';
            return '<a class="more-drawer-tile" href="' + t.href + '"' + dataAttr + '>' +
              t.icon +
              '<span>' + t.label + '</span>' +
            '</a>';
          }).join('') +
        '</div>' +
        '<div class="more-drawer-actions">' +
          '<button type="button" class="btn btn-outline" data-action="theme" id="more-theme">Toggle theme</button>' +
          '<button type="button" class="btn btn-outline" data-action="search">Search tools</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(drawer);

    drawer.addEventListener('click', function (e) {
      const closeTrigger = e.target.closest('[data-more-close]');
      if (closeTrigger) { closeDrawer(); return; }

      const tile = e.target.closest('[data-action]');
      if (!tile) return;
      const action = tile.dataset.action;
      if (action === 'search') { e.preventDefault(); closeDrawer(); window.CommandPalette && window.CommandPalette.open(); }
      else if (action === 'help') { e.preventDefault(); closeDrawer(); window.Help && window.Help.open(); }
      else if (action === 'theme') { e.preventDefault(); document.getElementById('theme-toggle') && document.getElementById('theme-toggle').click(); }
      // else: normal link navigation
      closeDrawer();
    });

    // Any normal link closes the drawer
    drawer.querySelectorAll('a:not([data-action])').forEach(function (a) {
      a.addEventListener('click', function () { closeDrawer(); });
    });
  }

  function openDrawer() {
    const d = document.querySelector('.more-drawer');
    if (!d) return;
    d.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (supportsHaptics()) { try { navigator.vibrate(10); } catch (_) {} }
  }
  function closeDrawer() {
    const d = document.querySelector('.more-drawer');
    if (!d) return;
    d.classList.remove('open');
    document.body.style.overflow = '';
  }
  window.MobileDrawer = { open: openDrawer, close: closeDrawer };

  /* ---- Wire up "More" trigger on the bottom nav ---- */
  function wireMoreTrigger() {
    document.addEventListener('click', function (e) {
      const trigger = e.target.closest('[data-more-trigger]');
      if (trigger) { e.preventDefault(); openDrawer(); }
    });
  }

  /* ---- Haptic feedback for primary buttons ---- */
  function wireHaptics() {
    if (!supportsHaptics()) return;
    document.addEventListener('pointerdown', function (e) {
      const el = e.target.closest('.btn-primary, .bottom-nav-item, .tool-card-fav, .sample-btn');
      if (!el) return;
      try { navigator.vibrate(8); } catch (_) {}
    }, { passive: true });
  }

  /* ---- Edge-swipe to open drawer ---- */
  function wireEdgeSwipe() {
    let startX = 0, startY = 0, tracking = false;
    document.addEventListener('touchstart', function (e) {
      if (!isMobile()) return;
      const t = e.touches[0];
      if (t.clientX <= 24) { // left edge
        startX = t.clientX;
        startY = t.clientY;
        tracking = true;
      }
    }, { passive: true });
    document.addEventListener('touchmove', function (e) {
      if (!tracking) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dx > 60 && dy < 50) {
        tracking = false;
        openDrawer();
      }
    }, { passive: true });
    document.addEventListener('touchend', function () { tracking = false; }, { passive: true });
  }

  /* ---- Swipe on forecast grid (touch scroll enhanced with momentum) ---- */
  function wireForecastSwipe() {
    document.addEventListener('touchstart', function (e) {
      const grid = e.target.closest('.forecast-grid');
      if (!grid) return;
      // Native overflow-x:auto already handles scrolling; just ensure the
      // gesture doesn't fight vertical scroll.
      grid.style.touchAction = 'pan-x pan-y';
    }, { passive: true });
  }

  /* ---- Prevent iOS rubber-band on horizontal drawers ---- */
  function wireScrollLock() {
    document.addEventListener('touchmove', function (e) {
      const d = document.querySelector('.more-drawer.open');
      if (!d) return;
      if (!e.target.closest('.more-drawer-panel')) {
        e.preventDefault();
      }
    }, { passive: false });
  }

  /* ---- Keyboard: Escape closes drawer ---- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', function () {
    if (document.body.classList.contains('error-page-body')) return;
    buildBottomNav();
    buildMoreDrawer();
    wireMoreTrigger();
    wireHaptics();
    wireEdgeSwipe();
    wireForecastSwipe();
    wireScrollLock();
  });
})();