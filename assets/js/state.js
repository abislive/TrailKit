/* ==========================================================================
   TrailKit — State Manager
   Simple pub/sub with localStorage persistence for specific keys.
   ========================================================================== */

(function () {
  'use strict';

  const listeners = {};
  const STORAGE_PREFIX = 'trailkit.state.';

  function get(key) {
    try {
      const stored = localStorage.getItem(STORAGE_PREFIX + key);
      return stored ? JSON.parse(stored) : null;
    } catch (_) {
      return null;
    }
  }

  function set(key, value) {
    try {
      if (value === null || value === undefined) {
        localStorage.removeItem(STORAGE_PREFIX + key);
      } else {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
      }
    } catch (_) {}
    emit(key, value);
  }

  function on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  }

  function off(event, callback) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(function (cb) { return cb !== callback; });
  }

  function emit(event, data) {
    if (!listeners[event]) return;
    listeners[event].forEach(function (cb) {
      try { cb(data); } catch (e) { console.error('[TrailKitState]', e); }
    });
  }

  window.TrailKitState = { get: get, set: set, on: on, off: off, emit: emit };
})();