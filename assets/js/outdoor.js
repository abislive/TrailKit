/* ==========================================================================
   TrailKit — Outdoor & Navigation Tools
   Inspired by Trail Sense concepts: distance, bearing, sunrise/sunset,
   and offline altitude estimation via pressure.
   ========================================================================== */

(function () {
  'use strict';

  const $ = window.TrailKit.$;
  const showAlert = window.TrailKit.showAlert;
  const clearAlert = window.TrailKit.clearAlert;
  const formatNumber = window.TrailKit.formatNumber;

  /* ---- Haversine distance ---- */
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /* ---- Initial bearing ---- */
  function bearing(lat1, lon1, lat2, lon2) {
    const toRad = d => d * Math.PI / 180;
    const toDeg = r => r * 180 / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x = Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
              Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  function compassDirection(deg) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  /* ---- Sunrise / sunset (NOAA approximation) ---- */
  function sunTimes(lat, lon, date) {
    const rad = Math.PI / 180;
    const dayMs = 86400000;
    const J1970 = 2440588;
    const J2000 = 2451545;
    const e = rad * 23.4397;

    const toJulian = d => d / dayMs - 0.5 + J1970;
    const fromJulian = j => new Date((j + 0.5 - J1970) * dayMs);
    const toDays = d => toJulian(d) - J2000;

    const solarMeanAnomaly = d => rad * (357.5291 + 0.98560028 * d);
    const eclipticLongitude = M => M + rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M)) + rad * 102.9372 + Math.PI;
    const declination = l => Math.asin(Math.sin(l) * Math.sin(e));
    const julianCycle = (d, lw) => Math.round(d - 0.0009 - lw / (2 * Math.PI));
    const approxTransit = (Ht, lw, n) => 0.0009 + (lw / (2 * Math.PI)) + n + Ht;
    const solarTransitJ = (ds, M, L) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
    const hourAngle = (h, phi, d) => Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));
    const observerAngle = h => -2.076 * Math.sqrt(h) / 60;

    const lw = rad * -lon;
    const phi = rad * lat;
    const d = toDays(date);
    const n = julianCycle(d, lw);
    const ds = approxTransit(0, lw, n);
    const M = solarMeanAnomaly(ds);
    const L = eclipticLongitude(M);
    const dec = declination(L);
    const Jnoon = solarTransitJ(ds, M, L);
    const h0 = observerAngle(0);
    const Jset = solarTransitJ(approxTransit(hourAngle(h0, phi, dec), lw, n), M, L);
    const Jrise = Jnoon - (Jset - Jnoon);

    return {
      sunrise: fromJulian(Jrise),
      sunset: fromJulian(Jset),
      solarNoon: fromJulian(Jnoon)
    };
  }

  function fmtTime(date) {
    if (!(date instanceof Date) || isNaN(date)) return '—';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function fmtDuration(ms) {
    if (!Number.isFinite(ms) || ms < 0) return '—';
    const h = Math.floor(ms / 3600000);
    const m = Math.round((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  /* ---- Altitude from pressure ---- */
  function altitudeFromPressure(pressureHpa, seaLevelHpa = 1013.25) {
    return 44330 * (1 - Math.pow(pressureHpa / seaLevelHpa, 0.1903));
  }

  /* ---- Init ---- */
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('outdoor-page')) return;

    /* Distance calculator */
    const distForm = document.getElementById('distance-form');
    if (distForm) {
      distForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const alertBox = document.getElementById('distance-alert');
        clearAlert(alertBox);

        const lat1 = parseFloat(document.getElementById('d-lat1').value);
        const lon1 = parseFloat(document.getElementById('d-lon1').value);
        const lat2 = parseFloat(document.getElementById('d-lat2').value);
        const lon2 = parseFloat(document.getElementById('d-lon2').value);

        if ([lat1, lon1, lat2, lon2].some(v => !Number.isFinite(v))) {
          showAlert(alertBox, 'error', 'Please enter valid numeric coordinates for all fields.');
          return;
        }
        if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
          showAlert(alertBox, 'error', 'Latitude must be between -90 and 90.');
          return;
        }
        if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
          showAlert(alertBox, 'error', 'Longitude must be between -180 and 180.');
          return;
        }

        const km = haversine(lat1, lon1, lat2, lon2);
        const brg = bearing(lat1, lon1, lat2, lon2);

        document.getElementById('d-result').innerHTML = `
          <div class="stat-grid">
            <div class="stat"><div class="stat-value">${formatNumber(km, 3)}</div><div class="stat-label">km</div></div>
            <div class="stat"><div class="stat-value">${formatNumber(km * 0.621371, 3)}</div><div class="stat-label">miles</div></div>
            <div class="stat"><div class="stat-value">${formatNumber(brg, 1)}°</div><div class="stat-label">bearing</div></div>
            <div class="stat"><div class="stat-value">${compassDirection(brg)}</div><div class="stat-label">direction</div></div>
          </div>
        `;
        showAlert(alertBox, 'success', `Distance: ${formatNumber(km, 3)} km (${formatNumber(km * 0.621371, 3)} mi), bearing ${formatNumber(brg, 1)}° ${compassDirection(brg)}.`);
      });

      document.getElementById('distance-reset').addEventListener('click', () => {
        distForm.reset();
        document.getElementById('d-result').innerHTML = '';
        clearAlert(document.getElementById('distance-alert'));
      });
    }

    /* Sun times */
    const sunForm = document.getElementById('sun-form');
    if (sunForm) {
      // Default to today
      const dateInput = document.getElementById('sun-date');
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);

      sunForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const alertBox = document.getElementById('sun-alert');
        clearAlert(alertBox);

        const lat = parseFloat(document.getElementById('sun-lat').value);
        const lon = parseFloat(document.getElementById('sun-lon').value);
        const dateVal = document.getElementById('sun-date').value;

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          showAlert(alertBox, 'error', 'Please enter valid latitude and longitude.');
          return;
        }
        if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
          showAlert(alertBox, 'error', 'Coordinates out of range.');
          return;
        }
        if (!dateVal) {
          showAlert(alertBox, 'error', 'Please select a date.');
          return;
        }

        const date = new Date(dateVal + 'T12:00:00Z');
        if (isNaN(date)) {
          showAlert(alertBox, 'error', 'Invalid date.');
          return;
        }

        const { sunrise, sunset, solarNoon } = sunTimes(lat, lon, date);
        const dayLength = sunset - sunrise;

        document.getElementById('sun-result').innerHTML = `
          <div class="stat-grid">
            <div class="stat"><div class="stat-value">${fmtTime(sunrise)}</div><div class="stat-label">Sunrise</div></div>
            <div class="stat"><div class="stat-value">${fmtTime(solarNoon)}</div><div class="stat-label">Solar Noon</div></div>
            <div class="stat"><div class="stat-value">${fmtTime(sunset)}</div><div class="stat-label">Sunset</div></div>
            <div class="stat"><div class="stat-value">${fmtDuration(dayLength)}</div><div class="stat-label">Day length</div></div>
          </div>
          <p class="field-hint" style="margin-top:var(--space-3)">Times are in your local timezone. Calculations use NOAA's simplified solar position algorithm.</p>
        `;
        showAlert(alertBox, 'success', 'Sun times calculated. Note: these are approximations and may differ by a few minutes at extreme latitudes.');
      });

      document.getElementById('sun-reset').addEventListener('click', () => {
        sunForm.reset();
        document.getElementById('sun-date').value = new Date().toISOString().slice(0, 10);
        document.getElementById('sun-result').innerHTML = '';
        clearAlert(document.getElementById('sun-alert'));
      });
    }

    /* Altitude estimator */
    const altForm = document.getElementById('altitude-form');
    if (altForm) {
      altForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const alertBox = document.getElementById('altitude-alert');
        clearAlert(alertBox);

        const pressure = parseFloat(document.getElementById('alt-pressure').value);
        const seaLevel = parseFloat(document.getElementById('alt-sealevel').value) || 1013.25;

        if (!Number.isFinite(pressure) || pressure <= 0) {
          showAlert(alertBox, 'error', 'Please enter a valid pressure value in hPa.');
          return;
        }
        if (!Number.isFinite(seaLevel) || seaLevel <= 0) {
          showAlert(alertBox, 'error', 'Please enter a valid sea-level pressure.');
          return;
        }

        const alt = altitudeFromPressure(pressure, seaLevel);
        document.getElementById('altitude-result').innerHTML = `
          <div class="stat-grid">
            <div class="stat"><div class="stat-value">${formatNumber(alt, 1)}</div><div class="stat-label">meters</div></div>
            <div class="stat"><div class="stat-value">${formatNumber(alt * 3.28084, 1)}</div><div class="stat-label">feet</div></div>
            <div class="stat"><div class="stat-value">${formatNumber(pressure, 1)}</div><div class="stat-label">Pressure (hPa)</div></div>
            <div class="stat"><div class="stat-value">${formatNumber(seaLevel, 1)}</div><div class="stat-label">Sea level (hPa)</div></div>
          </div>
        `;
        showAlert(alertBox, 'success', 'Altitude estimated from barometric pressure. This is an approximation — real altitude depends on local weather conditions.');
      });

      document.getElementById('altitude-reset').addEventListener('click', () => {
        altForm.reset();
        document.getElementById('altitude-result').innerHTML = '';
        clearAlert(document.getElementById('altitude-alert'));
      });
    }
  });
})();