/* ==========================================================================
   TrailKit — Weather (Open-Meteo) + Geolocation
   Renders a responsive grid of multi-day forecast cards with staggered
   entrance animations and rich per-day metrics.
   ========================================================================== */

(function () {
  'use strict';

  const showError = window.ToolUI.showError;
  const showSuccess = window.ToolUI.showSuccess;
  const clear = window.ToolUI.clear;
  const formatNumber = window.TrailKit.formatNumber;
  const escapeHtml = window.TrailKit.escapeHtml;

  const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

  const WMO = {
    0:  { label: 'Clear sky',                emoji: '☀️' },
    1:  { label: 'Mainly clear',             emoji: '🌤️' },
    2:  { label: 'Partly cloudy',            emoji: '⛅' },
    3:  { label: 'Overcast',                 emoji: '☁️' },
    45: { label: 'Fog',                      emoji: '🌫️' },
    48: { label: 'Depositing rime fog',      emoji: '🌫️' },
    51: { label: 'Light drizzle',            emoji: '🌦️' },
    53: { label: 'Moderate drizzle',         emoji: '🌦️' },
    55: { label: 'Dense drizzle',            emoji: '🌧️' },
    56: { label: 'Light freezing drizzle',   emoji: '🌨️' },
    57: { label: 'Dense freezing drizzle',   emoji: '🌨️' },
    61: { label: 'Slight rain',              emoji: '🌧️' },
    63: { label: 'Moderate rain',            emoji: '🌧️' },
    65: { label: 'Heavy rain',               emoji: '🌧️' },
    66: { label: 'Light freezing rain',      emoji: '🌨️' },
    67: { label: 'Heavy freezing rain',      emoji: '🌨️' },
    71: { label: 'Slight snow',              emoji: '🌨️' },
    73: { label: 'Moderate snow',            emoji: '❄️' },
    75: { label: 'Heavy snow',               emoji: '❄️' },
    77: { label: 'Snow grains',              emoji: '❄️' },
    80: { label: 'Slight rain showers',      emoji: '🌦️' },
    81: { label: 'Moderate rain showers',    emoji: '🌧️' },
    82: { label: 'Violent rain showers',     emoji: '⛈️' },
    85: { label: 'Slight snow showers',      emoji: '🌨️' },
    86: { label: 'Heavy snow showers',       emoji: '❄️' },
    95: { label: 'Thunderstorm',             emoji: '⛈️' },
    96: { label: 'Thunderstorm, slight hail', emoji: '⛈️' },
    99: { label: 'Thunderstorm, heavy hail',  emoji: '⛈️' }
  };

  function weatherLabel(code) {
    const e = WMO[code];
    return e ? e.label : 'Unknown (' + code + ')';
  }
  function weatherEmoji(code) {
    const e = WMO[code];
    return e ? e.emoji : '🌡️';
  }

  function windDirection(deg) {
    const d = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return d[Math.round(deg / 22.5) % 16];
  }

  function formatTime(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (_) { return '—'; }
  }

  function formatDay(dateStr, index) {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    try {
      return new Date(dateStr + 'T12:00:00').toLocaleDateString([], { weekday: 'long' });
    } catch (_) { return dateStr; }
  }

  function formatShortDate(dateStr) {
    try {
      return new Date(dateStr + 'T12:00:00')
        .toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (_) { return dateStr; }
  }

  async function geocode(query) {
    const res = await fetch(GEO_URL + '?name=' + encodeURIComponent(query) + '&count=5&language=en&format=json');
    if (!res.ok) throw new Error('Geocoding request failed');
    const data = await res.json();
    return data.results || [];
  }

  async function fetchWeather(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,uv_index',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max,uv_index_max',
      timezone: 'auto',
      forecast_days: '7'
    });
    const res = await fetch(WEATHER_URL + '?' + params.toString());
    if (!res.ok) throw new Error('Weather request failed');
    return res.json();
  }

  function renderCurrent(loc, data) {
    const c = data.current;
    const units = data.current_units || {};

    const locEl = document.getElementById('weather-location');
    if (locEl) {
      locEl.innerHTML =
        '<strong>' + escapeHtml(loc.name) + '</strong>' +
        (loc.admin1 ? ', ' + escapeHtml(loc.admin1) : '') +
        (loc.country ? ', ' + escapeHtml(loc.country) : '') +
        '<span class="weather-coords">' +
          formatNumber(loc.latitude, 4) + '° ' + (loc.latitude >= 0 ? 'N' : 'S') + ' · ' +
          formatNumber(Math.abs(loc.longitude), 4) + '° ' + (loc.longitude >= 0 ? 'E' : 'W') +
        '</span>';
    }

    const cur = document.getElementById('weather-current');
    if (!cur) return;
    cur.innerHTML =
      '<div class="weather-main">' +
        '<span class="weather-emoji" aria-hidden="true">' + weatherEmoji(c.weather_code) + '</span>' +
        '<div>' +
          '<div class="weather-temp">' + formatNumber(c.temperature_2m, 1) + '°C</div>' +
          '<div class="weather-desc">' + escapeHtml(weatherLabel(c.weather_code)) + '</div>' +
          '<div class="weather-feels">Feels like ' + formatNumber(c.apparent_temperature, 1) + '°C</div>' +
        '</div>' +
      '</div>' +
      '<div class="stat-grid">' +
        '<div class="stat"><div class="stat-value">' + formatNumber(c.relative_humidity_2m, 0) + '%</div><div class="stat-label">Humidity</div></div>' +
        '<div class="stat"><div class="stat-value">' + formatNumber(c.wind_speed_10m, 1) + ' ' + (units.wind_speed_10m || 'km/h') + '</div><div class="stat-label">Wind · ' + windDirection(c.wind_direction_10m) + '</div></div>' +
        '<div class="stat"><div class="stat-value">' + formatNumber(c.precipitation, 1) + ' ' + (units.precipitation || 'mm') + '</div><div class="stat-label">Precipitation</div></div>' +
        '<div class="stat"><div class="stat-value">' + (c.uv_index != null ? formatNumber(c.uv_index, 1) : '—') + '</div><div class="stat-label">UV index</div></div>' +
      '</div>';
  }

  function renderDaily(data) {
    const host = document.getElementById('weather-daily');
    if (!host) return;
    const d = data.daily;
    if (!d || !d.time || !d.time.length) {
      host.innerHTML = '<p class="field-hint">No daily forecast available.</p>';
      return;
    }

    const cards = d.time.map(function (t, i) {
      const code = d.weather_code[i];
      return '' +
        '<article class="forecast-card" style="--stagger:' + i + '" aria-label="' + escapeHtml(formatDay(t, i)) + ' forecast">' +
          '<header class="forecast-card-day">' +
            '<span>' + escapeHtml(formatDay(t, i)) + '</span>' +
            '<span>' + escapeHtml(formatShortDate(t)) + '</span>' +
          '</header>' +
          '<div class="forecast-card-icon" aria-hidden="true">' + weatherEmoji(code) + '</div>' +
          '<div class="forecast-card-desc">' + escapeHtml(weatherLabel(code)) + '</div>' +
          '<div class="forecast-card-temps">' +
            '<span class="temp-high">' + formatNumber(d.temperature_2m_max[i], 0) + '°</span>' +
            '<span class="temp-low">' + formatNumber(d.temperature_2m_min[i], 0) + '°</span>' +
          '</div>' +
          '<div class="forecast-card-extra">' +
            '<span>💧 ' + formatNumber(d.precipitation_sum[i], 1) + ' mm</span>' +
            '<span>💨 ' + formatNumber(d.wind_speed_10m_max[i], 0) + ' km/h</span>' +
            '<span>🌅 ' + formatTime(d.sunrise && d.sunrise[i]) + '</span>' +
            '<span>🌇 ' + formatTime(d.sunset && d.sunset[i]) + '</span>' +
          '</div>' +
        '</article>';
    }).join('');

    host.innerHTML = '<div class="forecast-grid">' + cards + '</div>';

    // Trigger the staggered entrance on the next frame
    requestAnimationFrame(function () {
      host.querySelectorAll('.forecast-card').forEach(function (card) {
        card.classList.add('forecast-card-in');
      });
    });
  }

  function getBrowserLocation() {
    return new Promise(function (resolve, reject) {
      if (!('geolocation' in navigator)) {
        reject(new Error('Geolocation not supported.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        function (pos) {
          resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        },
        function (err) {
          const messages = {
            1: 'Location permission was denied.',
            2: 'Your location is currently unavailable.',
            3: 'Location request timed out.'
          };
          reject(new Error(messages[err.code] || 'Unable to determine your location.'));
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 }
      );
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('weather-search-form');
    if (!form) return;

    const alertBox   = document.getElementById('weather-alert');
    const results    = document.getElementById('weather-results');
    const geoList    = document.getElementById('geo-results');
    const loading    = document.getElementById('weather-loading');
    const geoBtn     = document.getElementById('weather-geolocate');
    const clearBtn   = document.getElementById('weather-clear');

    let requestToken = 0;

    function setLoading(on) {
      if (loading) loading.classList.toggle('hidden', !on);
    }

    async function loadWeather(loc) {
      const token = ++requestToken;
      clear(alertBox);
      setLoading(true);
      try {
        const data = await fetchWeather(loc.latitude, loc.longitude);
        if (token !== requestToken) return; // stale response, ignore
        setLoading(false);
        results.classList.remove('hidden');
        renderCurrent(loc, data);
        renderDaily(data);
        try {
          window.TrailKitState.set('lastWeather', {
            name: loc.name,
            country: loc.country || '',
            admin1: loc.admin1 || '',
            latitude: loc.latitude,
            longitude: loc.longitude
          });
        } catch (_) {}
        showSuccess(alertBox, 'Weather updated for ' + loc.name + '.');
      } catch (err) {
        if (token !== requestToken) return;
        setLoading(false);
        if (!navigator.onLine) {
          showError(alertBox, 'You appear to be offline. Weather requires an internet connection.');
        } else {
          showError(alertBox, 'Weather service is temporarily unavailable.');
        }
        console.error('[TrailKit] Weather error:', err);
      }
    }

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      clear(alertBox);
      geoList.innerHTML = '';
      results.classList.add('hidden');
      const q = document.getElementById('weather-city').value.trim();
      if (!q) { showError(alertBox, 'Please enter a city name.'); return; }

      setLoading(true);
      try {
        const list = await geocode(q);
        setLoading(false);
        if (!list.length) {
          showError(alertBox, 'No location found for "' + q + '".');
          return;
        }
        geoList.innerHTML = list.map(function (r, i) {
          return '<button type="button" class="geo-item" data-index="' + i + '">' +
            '<strong>' + escapeHtml(r.name) + '</strong>' +
            '<span>' + escapeHtml([r.admin1, r.country].filter(Boolean).join(', ')) + '</span>' +
            '<span class="geo-coords">' + formatNumber(r.latitude, 4) + '°, ' + formatNumber(r.longitude, 4) + '°</span>' +
          '</button>';
        }).join('');

        geoList.querySelectorAll('.geo-item').forEach(function (btn, i) {
          btn.addEventListener('click', function () {
            geoList.querySelectorAll('.geo-item').forEach(function (b) { b.classList.remove('selected'); });
            btn.classList.add('selected');
            loadWeather(list[i]);
          });
        });
        geoList.querySelector('.geo-item').classList.add('selected');
        await loadWeather(list[0]);
      } catch (err) {
        setLoading(false);
        if (!navigator.onLine) showError(alertBox, 'You appear to be offline.');
        else showError(alertBox, 'Location search failed.');
        console.error('[TrailKit] Geocode error:', err);
      }
    });

    if (geoBtn) {
      geoBtn.addEventListener('click', async function () {
        clear(alertBox);
        geoList.innerHTML = '';
        results.classList.add('hidden');
        try {
          const pos = await getBrowserLocation();
          await loadWeather({
            name: 'Your location',
            country: '',
            admin1: '',
            latitude: pos.latitude,
            longitude: pos.longitude
          });
        } catch (err) {
          showError(alertBox, err.message);
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        requestToken++;
        form.reset();
        geoList.innerHTML = '';
        results.classList.add('hidden');
        clear(alertBox);
        try { window.TrailKitState.set('lastWeather', null); } catch (_) {}
      });
    }

    try {
      const last = window.TrailKitState.get('lastWeather');
      if (last && Number.isFinite(last.latitude)) {
        document.getElementById('weather-city').value = last.name || '';
        loadWeather(last);
      }
    } catch (_) {}
  });
})();