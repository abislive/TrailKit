/* ==========================================================================
   TrailKit — Help & Onboarding
   - Floating help button → keyboard shortcuts + tips modal
   - First-visit tour tooltip (dismissible, remembered)
   - Inline sample data helpers
   ========================================================================== */

(function () {
  'use strict';

  const STORAGE_KEY = 'trailkit.onboarded.v1';

  const SHORTCUTS = [
    { desc: 'Open command palette', keys: [navigator.platform.toUpperCase().indexOf('MAC') !== -1 ? '⌘' : 'Ctrl', 'K'] },
    { desc: 'Close dialog / drawer', keys: ['Esc'] },
    { desc: 'Navigate search results', keys: ['↑', '↓'] },
    { desc: 'Open focused tool', keys: ['Enter'] }
  ];

  const TIPS = [
    { strong: 'Install as an app.', text: 'TrailKit is a PWA — use your browser\'s "Add to Home Screen" for a native app feel.' },
    { strong: 'Works offline.', text: 'After first visit, most tools keep working without a connection. Only weather and currency need the network.' },
    { strong: 'Your files never leave.', text: 'Image, PDF, and hashing tools run entirely in your browser. Nothing is uploaded.' },
    { strong: 'Pin favorites.', text: 'Tap the ☆ on any tool card to keep it at the top of your dashboard.' },
    { strong: 'Search faster.', text: 'Press Ctrl/Cmd + K (or swipe from the left edge on mobile) to find any tool instantly.' }
  ];

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (s) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
    });
  }

  /* ---- Floating help button ---- */
  function buildFab() {
    if (document.querySelector('.help-fab')) return;
    if (document.body.classList.contains('error-page-body')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'help-fab';
    btn.setAttribute('aria-label', 'Open help');
    btn.title = 'Help & shortcuts';
    btn.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    btn.addEventListener('click', openModal);
    document.body.appendChild(btn);
  }

  /* ---- Help modal ---- */
  let modalEl = null;
  function buildModal() {
    if (modalEl) return modalEl;
    modalEl = document.createElement('div');
    modalEl.className = 'help-modal';
    modalEl.setAttribute('role', 'dialog');
    modalEl.setAttribute('aria-modal', 'true');
    modalEl.setAttribute('aria-label', 'Help and tips');
    modalEl.innerHTML =
      '<div class="help-modal-backdrop" data-help-close></div>' +
      '<div class="help-modal-panel" role="document">' +
        '<button type="button" class="help-modal-close" data-help-close aria-label="Close help">×</button>' +
        '<h2>TrailKit Help</h2>' +
        '<p>Quick reference for the whole toolkit. Everything below works in any modern browser.</p>' +

        '<h3>Keyboard shortcuts</h3>' +
        '<div class="kbd-grid">' +
          SHORTCUTS.map(function (s) {
            return '<span class="kbd-desc">' + escapeHtml(s.desc) + '</span>' +
              '<span>' + s.keys.map(function (k) { return '<kbd>' + escapeHtml(k) + '</kbd>'; }).join(' ') + '</span>';
          }).join('') +
        '</div>' +

        '<h3>Tips</h3>' +
        '<ul class="help-tips">' +
          TIPS.map(function (t) {
            return '<li><strong>' + escapeHtml(t.strong) + '</strong> ' + escapeHtml(t.text) + '</li>';
          }).join('') +
        '</ul>' +

        '<h3>Getting started</h3>' +
        '<p>Use the <strong>command palette</strong> (Ctrl/Cmd + K) or the bottom navigation to open any tool. Sample data buttons are provided on every input field so you can try a tool in one tap.</p>' +
      '</div>';
    document.body.appendChild(modalEl);

    modalEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-help-close]')) closeModal();
    });
    return modalEl;
  }

  function openModal() {
    buildModal();
    modalEl.classList.add('open');
    document.body.style.overflow = 'hidden';
    const closeBtn = modalEl.querySelector('.help-modal-close');
    if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 50);
    if (typeof navigator.vibrate === 'function') { try { navigator.vibrate(8); } catch (_) {} }
  }
  function closeModal() {
    if (!modalEl) return;
    modalEl.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ---- First-visit onboarding tooltip ---- */
  function runOnboarding() {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch (_) { return; }

    // Show only on homepage
    const isHome = /\/(index\.html)?$/.test(location.pathname) || location.pathname.endsWith('/');
    if (!isHome) return;

    const grid = document.getElementById('tool-grid');
    if (!grid) return;

    setTimeout(function () {
      const card = document.createElement('div');
      card.className = 'onboarding';
      card.setAttribute('role', 'dialog');
      card.setAttribute('aria-live', 'polite');
      card.innerHTML =
        '<p class="onboarding-title">Welcome to TrailKit 👋</p>' +
        '<p class="onboarding-text">Tap any card to open a tool. Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to search. Everything runs privately in your browser.</p>' +
        '<div class="onboarding-actions">' +
          '<button type="button" class="onboarding-skip" data-onb="skip">Skip</button>' +
          '<button type="button" class="onboarding-next" data-onb="ok">Got it</button>' +
        '</div>';

      // Position it near the grid
      const rect = grid.getBoundingClientRect();
      const top = Math.max(window.scrollY + rect.top - 10, window.scrollY + 80);
      card.style.top = top + 'px';
      card.style.left = Math.max(window.scrollX + rect.left + 12, 12) + 'px';
      document.body.appendChild(card);

      function dismiss() {
        try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
        card.remove();
      }
      card.addEventListener('click', function (e) {
        const b = e.target.closest('[data-onb]');
        if (b) dismiss();
      });

      // Auto-dismiss after 12s
      setTimeout(dismiss, 12000);
    }, 600);
  }

  /* ---- Sample data engine ---- */
  // Tools register samples by adding [data-sample] buttons next to inputs.
  // Each button carries data-target (input id) and data-value (literal or JSON).
  function wireSamples() {
    document.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-sample]');
      if (!btn) return;
      e.preventDefault();
      const targetId = btn.getAttribute('data-target');
      const value = btn.getAttribute('data-value');
      const target = document.getElementById(targetId);
      if (!target) return;

      if (target.type === 'checkbox' || target.type === 'radio') {
        target.checked = true;
      } else {
        target.value = value;
      }
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      target.focus();
      if (typeof navigator.vibrate === 'function') { try { navigator.vibrate(6); } catch (_) {} }
    });
  }

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', function () {
    buildFab();
    wireSamples();
    runOnboarding();
  });

  window.Help = { open: openModal, close: closeModal };
})();