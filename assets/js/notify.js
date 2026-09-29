/* ==========================================================================
   TrailKit — Toast Notifications
   ========================================================================== */

(function () {
  'use strict';

  let container = null;

  function ensureContainer() {
    if (container) return container;
    container = document.createElement('div');
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
    return container;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (s) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s];
    });
  }

  function remove(toast) {
    if (!toast.parentNode) return;
    toast.classList.remove('toast-in');
    toast.classList.add('toast-out');
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }

  function show(message, type, duration) {
    if (!message) return;
    const c = ensureContainer();
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.setAttribute('role', 'status');
    toast.innerHTML =
      '<div class="toast-message">' + escapeHtml(message) + '</div>' +
      '<button type="button" class="toast-close" aria-label="Close notification">×</button>';
    c.appendChild(toast);

    const closeBtn = toast.querySelector('.toast-close');
    const timeout = setTimeout(function () { remove(toast); }, duration || 4000);

    closeBtn.addEventListener('click', function () {
      clearTimeout(timeout);
      remove(toast);
    });

    requestAnimationFrame(function () { toast.classList.add('toast-in'); });
  }

  window.Notify = {
    success: function (msg, dur) { show(msg, 'success', dur); },
    error: function (msg, dur) { show(msg, 'error', dur); },
    info: function (msg, dur) { show(msg, 'info', dur); },
    warn: function (msg, dur) { show(msg, 'warning', dur); }
  };
})();