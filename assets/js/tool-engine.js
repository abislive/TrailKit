/* ==========================================================================
   TrailKit — Shared Tool Engine
   Consistent interaction model with mobile-friendly helpers.
   ========================================================================== */

(function () {
  'use strict';

  function setLoading(el, on) {
    if (!el) return;
    if (on) {
      el.classList.add('loading');
      el.disabled = true;
      el.setAttribute('aria-busy', 'true');
    } else {
      el.classList.remove('loading');
      el.disabled = false;
      el.removeAttribute('aria-busy');
    }
  }

  function showError(container, message) {
    if (!container) return;
    container.innerHTML =
      '<div class="alert alert-error" role="alert">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' +
        '<div>' + window.TrailKit.escapeHtml(message) + '</div>' +
      '</div>';
  }

  function showSuccess(container, message) {
    if (!container) return;
    container.innerHTML =
      '<div class="alert alert-success" role="status">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
        '<div>' + window.TrailKit.escapeHtml(message) + '</div>' +
      '</div>';
  }

  function showInfo(container, message) {
    if (!container) return;
    container.innerHTML =
      '<div class="alert alert-info" role="status">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' +
        '<div>' + window.TrailKit.escapeHtml(message) + '</div>' +
      '</div>';
  }

  function clear(container) { if (container) container.innerHTML = ''; }

  async function copy(text, label) {
    if (!text) { window.Notify.warn('Nothing to copy'); return false; }
    try {
      await navigator.clipboard.writeText(text);
      window.Notify.success(label ? label + ' copied to clipboard' : 'Copied to clipboard');
      if (typeof navigator.vibrate === 'function') { try { navigator.vibrate(8); } catch (_) {} }
      return true;
    } catch (_) {
      window.Notify.error('Clipboard access was denied. Please copy manually.');
      return false;
    }
  }

  function attachCopy(button, getText, label) {
    if (!button) return;
    button.addEventListener('click', async function () {
      const text = typeof getText === 'function' ? getText() : getText;
      const ok = await copy(text, label);
      if (ok) {
        const prev = button.textContent;
        button.textContent = 'Copied';
        setTimeout(function () { button.textContent = prev; }, 1200);
      }
    });
  }

  function announce(message) {
    let region = document.getElementById('trailkit-sr-live');
    if (!region) {
      region = document.createElement('div');
      region.id = 'trailkit-sr-live';
      region.className = 'sr-only';
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      document.body.appendChild(region);
    }
    region.textContent = '';
    setTimeout(function () { region.textContent = message; }, 30);
  }

  window.ToolUI = {
    setLoading: setLoading,
    showError: showError,
    showSuccess: showSuccess,
    showInfo: showInfo,
    clear: clear,
    copy: copy,
    attachCopy: attachCopy,
    announce: announce
  };
})();