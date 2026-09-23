/* ==========================================================================
   TrailKit — App Bootstrap & Shared Utilities
   ========================================================================== */

(function () {
  'use strict';

  /* ---- Shared namespace ---- */
  window.TrailKit = window.TrailKit || {};

  /* ---- DOM helpers ---- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  window.TrailKit.$ = $;
  window.TrailKit.$$ = $$;

  /* ---- Toast / alert helper ---- */
  function showAlert(container, type, message) {
    if (!container) return;
    const icons = {
      error: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
      success: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
      info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
      warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
    };
    container.innerHTML = `<div class="alert alert-${type}">${icons[type] || icons.info}<div>${message}</div></div>`;
  }

  function clearAlert(container) {
    if (container) container.innerHTML = '';
  }

  window.TrailKit.showAlert = showAlert;
  window.TrailKit.clearAlert = clearAlert;

  /* ---- File download helper ---- */
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  window.TrailKit.downloadBlob = downloadBlob;

  /* ---- Number formatting ---- */
  function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '—';
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  }

  function formatNumber(n, decimals = 2) {
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: 0 });
  }

  window.TrailKit.formatBytes = formatBytes;
  window.TrailKit.formatNumber = formatNumber;

  /* ---- Tool registry (used by homepage) ---- */
  window.TrailKit.tools = [
    {
      id: 'outdoor',
      title: 'Outdoor & Navigation',
      desc: 'Distance calculator, compass heading, sunrise/sunset, and offline altitude estimation.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
      category: 'outdoor',
      href: 'pages/outdoor.html'
    },
    {
      id: 'weather',
      title: 'Weather',
      desc: 'Live weather and 5-day forecast from the free Open-Meteo API. No API key required.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
      category: 'weather',
      href: 'pages/weather.html'
    },
    {
      id: 'image-tools',
      title: 'Image Toolkit',
      desc: 'Resize, compress, convert, rotate, crop, and inspect images — all locally in your browser.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
      category: 'image',
      href: 'pages/image-tools.html'
    },
    {
      id: 'pdf-tools',
      title: 'Images to PDF',
      desc: 'Combine multiple images into a single PDF with reordering, preview, and page-size options.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      category: 'image',
      href: 'pages/pdf-tools.html'
    },
    {
      id: 'speech',
      title: 'Speech to Text',
      desc: 'Transcribe speech from your microphone or audio files using the browser Web Speech API.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
      category: 'speech',
      href: 'pages/speech.html'
    },
    {
      id: 'utilities',
      title: 'Developer Utilities',
      desc: 'Hash generator, UUID, Base64, JSON formatter, unit converter, and QR code generator.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
      category: 'utilities',
      href: 'pages/utilities.html'
    },
    {
      id: 'currency',
      title: 'Currency Converter',
      desc: 'Convert between 30+ currencies using the free Frankfurter / ECB exchange rate API.',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
      category: 'utilities',
      href: 'pages/utilities.html#currency'
    }
  ];

  /* ---- Homepage tool grid rendering ---- */
  function renderToolGrid() {
    const grid = document.getElementById('tool-grid');
    if (!grid) return;

    const searchInput = document.getElementById('tool-search');
    const filterBtns = $$('.filter-btn');
    const noResults = document.getElementById('no-results');
    let activeCategory = 'all';
    let query = '';

    function render() {
      const tools = window.TrailKit.tools.filter(t => {
        const matchesCat = activeCategory === 'all' || t.category === activeCategory;
        const q = query.toLowerCase().trim();
        const matchesQuery = !q || t.title.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q);
        return matchesCat && matchesQuery;
      });

      grid.innerHTML = tools.map(t => `
        <a class="tool-card" href="${t.href}">
          <span class="tool-card-icon" aria-hidden="true">${t.icon}</span>
          <h3 class="tool-card-title">${t.title}</h3>
          <p class="tool-card-desc">${t.desc}</p>
          <span class="tool-card-tag">${t.category}</span>
        </a>
      `).join('');

      if (noResults) noResults.classList.toggle('hidden', tools.length > 0);
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        query = e.target.value;
        render();
      });
    }

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        activeCategory = btn.dataset.category;
        render();
      });
    });

    render();
  }

  /* ---- Scroll reveal ---- */
  function initReveal() {
    const els = $$('.reveal');
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    els.forEach(el => observer.observe(el));
  }

  /* ---- Init on DOM ready ---- */
  document.addEventListener('DOMContentLoaded', () => {
    renderToolGrid();
    initReveal();
  });
})();