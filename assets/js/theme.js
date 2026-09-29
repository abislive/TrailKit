/* ==========================================================================
   TrailKit — Theme Enforcer (Dark-Only)
   The application uses a permanent dark theme. This module guarantees the
   attribute is set on the root element as early as possible (before paint).
   ========================================================================== */

(function () {
  'use strict';

  const root = document.documentElement;
  if (root.getAttribute('data-theme') !== 'dark') {
    root.setAttribute('data-theme', 'dark');
  }
})();