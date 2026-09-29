/* ==========================================================================
   TrailKit — Favorites & Recent Tools
   ========================================================================== */

(function () {
  'use strict';

  const FAV_KEY = 'trailkit.favorites';
  const RECENT_KEY = 'trailkit.recent';
  const MAX_RECENT = 6;

  function readList(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function writeList(key, list) {
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (_) {}
  }

  const Favorites = {
    list: function () { return readList(FAV_KEY); },
    isFavorite: function (id) { return this.list().indexOf(id) !== -1; },
    toggle: function (id) {
      const list = this.list();
      const idx = list.indexOf(id);
      if (idx === -1) list.push(id);
      else list.splice(idx, 1);
      writeList(FAV_KEY, list);
      window.TrailKitState.emit('favorites', list);
      return list;
    },
    add: function (id) {
      const list = this.list();
      if (list.indexOf(id) === -1) {
        list.push(id);
        writeList(FAV_KEY, list);
        window.TrailKitState.emit('favorites', list);
      }
    },
    remove: function (id) {
      const list = this.list().filter(function (x) { return x !== id; });
      writeList(FAV_KEY, list);
      window.TrailKitState.emit('favorites', list);
    }
  };

  const Recent = {
    list: function () { return readList(RECENT_KEY); },
    add: function (id) {
      let list = this.list().filter(function (x) { return x !== id; });
      list.unshift(id);
      if (list.length > MAX_RECENT) list = list.slice(0, MAX_RECENT);
      writeList(RECENT_KEY, list);
      window.TrailKitState.emit('recent', list);
    },
    clear: function () {
      writeList(RECENT_KEY, []);
      window.TrailKitState.emit('recent', []);
    }
  };

  window.Favorites = Favorites;
  window.Recent = Recent;
})();