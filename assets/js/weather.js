/* ==========================================================================
   TrailKit — Weather (Open-Meteo API)
   Free public API, no API key required.
   Uses geocoding via Open-Meteo's geocoding endpoint.
   ========================================================================== */

(function () {
  'use strict';

  const $ = window.TrailKit.$;
  const showAlert = window.TrailKit.showAlert;
  const clearAlert = window.TrailKit.clearAlert;
  const formatNumber = window.TrailKit.formatNumber;

  const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast';

  const WMO_CODES = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    56: 'Light freezing drizzle', 57: 'Dense freezing drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    66: 'Light freezing rain', 67: 'Heavy freezing rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    85: 'Slight snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
  };

  function weatherLabel(code) {
    return WMO_CODES[code] || `Unknown (${code})`;
  }

  function weatherEmoji(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 48) return '🌫️';
    if (code <= 57) return '🌦️';
    if (code <= 67) return '🌧️';
    if (code <= 77) return '❄️';
    if (code <= 82) return '🌧️';
    if (code <= 86) return '🌨️';
    return '⛈️';
  }

  async function geocode(query) {
    const url = `${GEO_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Geocoding request failed');
    const data = await res.json();
    return data.results || [];
  }

  async function fetchWeather(lat, lon) {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,wind_speed_10m_max',
      timezone: 'auto',
      forecast_days: '7'
    });
    const res = await fetch(`${WEATHER_URL}?${params}`);
    if (!res.ok) throw new Error('Weather request failed');
    return res.json();
  }

  function windDirection(deg) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  function renderCurrent(container, data) {
    const c = data.current;
    const units = data.current_units;
    container.innerHTML = `
      <div class="weather-current">
        <div class="weather-main">
          <span class="weather-emoji" aria-hidden="true">${weatherEmoji(c.weather_code)}</span>
          <div>
            <div class="weather-temp">${formatNumber(c.temperature_2m, 1)}°C</div>
            <div class="weather-desc">${weatherLabel(c.weather_code)}</div>
            <div class="weather-feels">Feels like ${formatNumber(c.apparent_temperature, 1)}°C</div>
          </div>
        </div>
        <div class="stat-grid">
          <div class="stat"><div class="stat-value">${formatNumber(c.relative_humidity_2m, 0)}%</div><div class="stat-label">Humidity</div></div>
          <div class="stat"><div class="stat-value">${formatNumber(c.wind_speed_10m, 1)} ${units.wind_speed_10m}</div><div class="stat-label">Wind</div></div>
          <div class="stat"><div class="stat-value">${windDirection(c.wind_direction_10m)}</div><div class="stat-label">Direction</div></div>
          <div class="stat"><div class="stat-value">${formatNumber(c.precipitation, 1)} ${units.precipitation}</div><div class="stat-label">Precipitation</div></div>
        </div>
      </div>
    `;
  }

  function renderDaily(container, data) {
    const daily = data.daily;
    const rows = daily.time.map((t, i) => {
      const date = new Date(t + 'T12:00:00');
      const dayName = date.toLocaleDateString([], { weekday: 'short' });
      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      return `
        <div class="forecast-row">
          <div class="forecast-day">
            <strong>${dayName}</strong>
            <span>${dateStr}</span>
          </div>
          <div class="forecast-icon" aria-hidden="true">${weatherEmoji(daily.weather_code[i])}</div>
          <div class="forecast-desc">${weatherLabel(daily.weather_code[i])}</div>
          <div class="forecast-temps">
            <span class="temp-high">${formatNumber(daily.temperature_2m_max[i], 0)}°</span>
            <span class="temp-low">${formatNumber(daily.temperature_2m_min[i], 0)}°</span>
          </div>
          <div class="forecast-extra">
            <span title="Precipitation">💧 ${formatNumber(daily.precipitation_sum[i], 1)} mm</span>
            <span title="Max wind">💨 ${formatNumber(daily.wind_speed_10m_max[i], 0)} km/h</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `<div class="forecast-list">${rows}</div>`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('weather-search-form');
    if (!searchForm) return;

    const alertBox = document.getElementById('weather-alert');
    const resultsBox = document.getElementById('weather-results');
    const currentBox = document.getElementById('weather-current');
    const dailyBox = document.getElementById('weather-daily');
    const locationLabel = document.getElementById('weather-location');
    const geoList = document.getElementById('geo-results');
    const loading = document.getElementById('weather-loading');

    let selectedLocation = null;

    function setLoading(on) {
      if (loading) loading.classList.toggle('hidden', !on);
    }

    searchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlert(alertBox);
      geoList.innerHTML = '';
      resultsBox.classList.add('hidden');

      const query = document.getElementById('weather-city').value.trim();
      if (!query) {
        showAlert(alertBox, 'error', 'Please enter a city name.');
        return;
      }

      setLoading(true);
      try {
        const results = await geocode(query);
        setLoading(false);

        if (!results.length) {
          showAlert(alertBox, 'error', `No location found for "${query}". Try a different search term.`);
          return;
        }

        geoList.innerHTML = results.map((r, i) => `
          <button type="button" class="geo-item" data-index="${i}">
            <strong>${r.name}</strong>
            <span>${[r.admin1, r.country].filter(Boolean).join(', ')}</span>
            <span class="geo-coords">${formatNumber(r.latitude, 4)}, ${formatNumber(r.longitude, 4)}</span>
          </button>
        `).join('');

        geoList.querySelectorAll('.geo-item').forEach((btn, i) => {
          btn.addEventListener('click', () => {
            selectedLocation = results[i];
            document.querySelectorAll('.geo-item').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            loadWeather(selectedLocation);
          });
        });

        // Auto-select first result
        selectedLocation = results[0];
        geoList.querySelector('.geo-item').classList.add('selected');
        await loadWeather(selectedLocation);
      } catch (err) {
        setLoading(false);
        showAlert(alertBox, 'error', 'Failed to search for location. Please check your internet connection and try again.');
      }
    });

    async function loadWeather(loc) {
      clearAlert(alertBox);
      setLoading(true);
      try {
        const data = await fetchWeather(loc.latitude, loc.longitude);
        setLoading(false);
        resultsBox.classList.remove('hidden');

        locationLabel.textContent = `${loc.name}, ${[loc.admin1, loc.country].filter(Boolean).join(', ')}`;
        renderCurrent(currentBox, data);
        renderDaily(dailyBox, data);

        // Save last location
        try {
          localStorage.setItem('trailkit-weather-location', JSON.stringify(loc));
        } catch (_) { /* storage unavailable */ }
      } catch (err) {
        setLoading(false);
        showAlert(alertBox, 'error', 'Failed to load weather data. Please try again later.');
      }
    }

    // Restore last location
    try {
      const saved = localStorage.getItem('trailkit-weather-location');
      if (saved) {
        const loc = JSON.parse(saved);
        if (loc && loc.latitude != null) {
          document.getElementById('weather-city').value = loc.name || '';
          selectedLocation = loc;
          loadWeather(loc);
        }
      }
    } catch (_) { /* ignore */ }

    // Clear button
    const clearBtn = document.getElementById('weather-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        document.getElementById('weather-search-form').reset();
        geoList.innerHTML = '';
        resultsBox.classList.add('hidden');
        clearAlert(alertBox);
        try { localStorage.removeItem('trailkit-weather-location'); } catch (_) {}
      });
    }
  });
})();