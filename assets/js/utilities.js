/* ==========================================================================
   TrailKit — Developer Utilities
   Hash generator, UUID, Base64, JSON formatter, unit converter,
   QR code generator, and currency converter (Frankfurter API v2).
   ========================================================================== */

(function () {
  'use strict';

  const $ = window.TrailKit.$;
  const showAlert = window.TrailKit.showAlert;
  const clearAlert = window.TrailKit.clearAlert;
  const downloadBlob = window.TrailKit.downloadBlob;

  /* ---- Hash generation using Web Crypto ---- */
  async function digest(algo, text) {
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const hash = await crypto.subtle.digest(algo, data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /* ---- UUID v4 ---- */
  function uuidv4() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /* ---- Base64 (UTF-8 safe) ---- */
  function encodeBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => { binary += String.fromCharCode(b); });
    return btoa(binary);
  }
  function decodeBase64(b64) {
    const binary = atob(b64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  /* ---- JSON formatter ---- */
  function formatJson(str, indent) {
    const obj = JSON.parse(str);
    return JSON.stringify(obj, null, indent);
  }

  /* ---- Unit conversions ---- */
  const unitDefs = {
    length: {
      base: 'm',
      units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 }
    },
    mass: {
      base: 'kg',
      units: { kg: 1, g: 0.001, mg: 0.000001, t: 1000, lb: 0.45359237, oz: 0.028349523125 }
    },
    temperature: {
      special: true
    },
    area: {
      base: 'm2',
      units: { m2: 1, km2: 1e6, cm2: 1e-4, ha: 10000, acre: 4046.8564224, ft2: 0.09290304, mi2: 2589988.110336 }
    },
    volume: {
      base: 'l',
      units: { l: 1, ml: 0.001, m3: 1000, gal: 3.785411784, qt: 0.946352946, floz: 0.0295735295625, cup: 0.2365882365 }
    },
    speed: {
      base: 'ms',
      units: { ms: 1, kmh: 1 / 3.6, mph: 0.44704, kn: 0.514444, fts: 0.3048 }
    },
    data: {
      base: 'B',
      units: { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, bit: 0.125 }
    }
  };

  function convertUnit(category, from, to, value) {
    if (category === 'temperature') {
      // Convert to Celsius first
      let c;
      if (from === 'C') c = value;
      else if (from === 'F') c = (value - 32) * 5 / 9;
      else if (from === 'K') c = value - 273.15;
      else throw new Error('Unknown temperature unit');
      if (to === 'C') return c;
      if (to === 'F') return c * 9 / 5 + 32;
      if (to === 'K') return c + 273.15;
      throw new Error('Unknown temperature unit');
    }
    const def = unitDefs[category];
    if (!def) throw new Error('Unknown category');
    const fromFactor = def.units[from];
    const toFactor = def.units[to];
    if (fromFactor == null || toFactor == null) throw new Error('Unknown unit');
    return value * fromFactor / toFactor;
  }

  /* ---- Currency (Frankfurter API v2 — free, no key) ---- */
  const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v2';

  async function fetchCurrencies() {
    const res = await fetch(`${FRANKFURTER_BASE}/currencies`);
    if (!res.ok) throw new Error('Failed to load currency list');
    return res.json();
  }

  async function fetchRate(from, to) {
    const res = await fetch(`${FRANKFURTER_BASE}/rate/${from}/${to}`);
    if (!res.ok) {
      // Try to surface the API error message if present
      let msg = 'Exchange rate not available for this pair.';
      try {
        const err = await res.json();
        if (err && err.message) msg = err.message;
      } catch (_) { /* ignore parse error */ }
      throw new Error(msg);
    }
    const data = await res.json();
    if (typeof data.rate !== 'number') {
      throw new Error('Exchange rate not available for this pair.');
    }
    return { rate: data.rate, date: data.date };
  }

  /* ---- QR code generation ---- */
  function generateQr(text, size) {
    // Minimal QR generator (numeric/byte mode, version auto) — uses the well-known
    // qrcode-generator algorithm adapted for browser use.
    // For robustness and full feature support we use the qrcode-generator library
    // loaded via CDN in the HTML page. If it failed to load we show an error.
    if (typeof window.qrcode === 'undefined') {
      throw new Error('QR code library failed to load. Please check your internet connection and reload the page.');
    }
    const qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createDataURL(size, 8);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.getElementById('utilities-page');
    if (!page) return;

    /* ---------- HASH ---------- */
    const hashBtn = document.getElementById('hash-generate');
    if (hashBtn) {
      hashBtn.addEventListener('click', async () => {
        const alertBox = document.getElementById('hash-alert');
        clearAlert(alertBox);
        const text = document.getElementById('hash-input').value;
        if (!text) {
          showAlert(alertBox, 'error', 'Please enter some text to hash.');
          return;
        }
        try {
          const [md5, sha1, sha256, sha512] = await Promise.all([
            digest('MD5', text),
            digest('SHA-1', text),
            digest('SHA-256', text),
            digest('SHA-512', text)
          ]);
          document.getElementById('hash-output').innerHTML = `
            <div class="result-box">
              <div style="margin-bottom:8px"><strong>MD5</strong><pre>${md5}</pre></div>
              <div style="margin-bottom:8px"><strong>SHA-1</strong><pre>${sha1}</pre></div>
              <div style="margin-bottom:8px"><strong>SHA-256</strong><pre>${sha256}</pre></div>
              <div><strong>SHA-512</strong><pre>${sha512}</pre></div>
            </div>
          `;
        } catch (err) {
          showAlert(alertBox, 'error', 'Hashing failed: ' + err.message);
        }
      });
      document.getElementById('hash-reset').addEventListener('click', () => {
        document.getElementById('hash-input').value = '';
        document.getElementById('hash-output').innerHTML = '';
        clearAlert(document.getElementById('hash-alert'));
      });
    }

    /* ---------- UUID ---------- */
    const uuidBtn = document.getElementById('uuid-generate');
    if (uuidBtn) {
      uuidBtn.addEventListener('click', () => {
        const count = Math.min(Math.max(parseInt(document.getElementById('uuid-count').value, 10) || 1, 1), 50);
        const list = Array.from({ length: count }, () => uuidv4());
        document.getElementById('uuid-output').innerHTML = `<div class="result-box"><pre>${list.join('\n')}</pre></div>`;
        document.getElementById('uuid-count').value = count;
      });
      document.getElementById('uuid-copy').addEventListener('click', async () => {
        const text = document.querySelector('#uuid-output pre')?.textContent || '';
        if (!text) return;
        try { await navigator.clipboard.writeText(text); } catch (_) {}
      });
      document.getElementById('uuid-reset').addEventListener('click', () => {
        document.getElementById('uuid-output').innerHTML = '';
        document.getElementById('uuid-count').value = 5;
      });
    }

    /* ---------- BASE64 ---------- */
    const b64Encode = document.getElementById('b64-encode');
    const b64Decode = document.getElementById('b64-decode');
    const b64Input = document.getElementById('b64-input');
    const b64Output = document.getElementById('b64-output');
    const b64Alert = document.getElementById('b64-alert');

    if (b64Encode) {
      b64Encode.addEventListener('click', () => {
        clearAlert(b64Alert);
        if (!b64Input.value) { showAlert(b64Alert, 'error', 'Enter text to encode.'); return; }
        try { b64Output.value = encodeBase64(b64Input.value); } catch (e) { showAlert(b64Alert, 'error', 'Encoding failed.'); }
      });
      b64Decode.addEventListener('click', () => {
        clearAlert(b64Alert);
        if (!b64Input.value) { showAlert(b64Alert, 'error', 'Enter Base64 to decode.'); return; }
        try { b64Output.value = decodeBase64(b64Input.value.trim()); } catch (e) { showAlert(b64Alert, 'error', 'Invalid Base64 string.'); }
      });
      document.getElementById('b64-reset').addEventListener('click', () => {
        b64Input.value = ''; b64Output.value = ''; clearAlert(b64Alert);
      });
      document.getElementById('b64-copy').addEventListener('click', async () => {
        if (b64Output.value) { try { await navigator.clipboard.writeText(b64Output.value); } catch (_) {} }
      });
    }

    /* ---------- JSON ---------- */
    const jsonFormat = document.getElementById('json-format');
    if (jsonFormat) {
      const jsonInput = document.getElementById('json-input');
      const jsonOutput = document.getElementById('json-output');
      const jsonAlert = document.getElementById('json-alert');
      jsonFormat.addEventListener('click', () => {
        clearAlert(jsonAlert);
        const str = jsonInput.value.trim();
        if (!str) { showAlert(jsonAlert, 'error', 'Paste some JSON first.'); return; }
        try {
          jsonOutput.value = formatJson(str, 2);
          showAlert(jsonAlert, 'success', 'JSON formatted successfully.');
        } catch (e) {
          showAlert(jsonAlert, 'error', 'Invalid JSON: ' + e.message);
        }
      });
      document.getElementById('json-minify').addEventListener('click', () => {
        clearAlert(jsonAlert);
        const str = jsonInput.value.trim();
        if (!str) { showAlert(jsonAlert, 'error', 'Paste some JSON first.'); return; }
        try {
          jsonOutput.value = JSON.stringify(JSON.parse(str));
          showAlert(jsonAlert, 'success', 'JSON minified.');
        } catch (e) { showAlert(jsonAlert, 'error', 'Invalid JSON: ' + e.message); }
      });
      document.getElementById('json-reset').addEventListener('click', () => {
        jsonInput.value = ''; jsonOutput.value = ''; clearAlert(jsonAlert);
      });
      document.getElementById('json-copy').addEventListener('click', async () => {
        if (jsonOutput.value) { try { await navigator.clipboard.writeText(jsonOutput.value); } catch (_) {} }
      });
    }

    /* ---------- UNIT CONVERTER ---------- */
    const unitCategory = document.getElementById('unit-category');
    if (unitCategory) {
      const fromSel = document.getElementById('unit-from');
      const toSel = document.getElementById('unit-to');
      const valueInput = document.getElementById('unit-value');
      const outputBox = document.getElementById('unit-output');
      const unitAlert = document.getElementById('unit-alert');

      function populateUnits() {
        const cat = unitCategory.value;
        let units;
        if (cat === 'temperature') units = ['C', 'F', 'K'];
        else units = Object.keys(unitDefs[cat].units);

        fromSel.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
        toSel.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
        // Pick a sensible default pair
        if (units.length > 1) {
          toSel.value = units[1];
        }
        updateUnitResult();
      }

      function updateUnitResult() {
        clearAlert(unitAlert);
        const val = parseFloat(valueInput.value);
        if (!Number.isFinite(val)) {
          outputBox.innerHTML = '<p class="field-hint">Enter a number to convert.</p>';
          return;
        }
        try {
          const result = convertUnit(unitCategory.value, fromSel.value, toSel.value, val);
          outputBox.innerHTML = `
            <div class="stat-grid">
              <div class="stat"><div class="stat-value">${window.TrailKit.formatNumber(result, 6)}</div><div class="stat-label">${toSel.value}</div></div>
              <div class="stat"><div class="stat-value">${window.TrailKit.formatNumber(val, 6)}</div><div class="stat-label">${fromSel.value}</div></div>
            </div>
            <p style="margin-top:var(--space-3);font-size:0.9rem;color:var(--color-text-muted)">${window.TrailKit.formatNumber(val, 6)} ${fromSel.value} = ${window.TrailKit.formatNumber(result, 6)} ${toSel.value}</p>
          `;
        } catch (e) {
          showAlert(unitAlert, 'error', e.message);
        }
      }

      unitCategory.addEventListener('change', populateUnits);
      fromSel.addEventListener('change', updateUnitResult);
      toSel.addEventListener('change', updateUnitResult);
      valueInput.addEventListener('input', updateUnitResult);
      document.getElementById('unit-reset').addEventListener('click', () => {
        unitCategory.value = 'length';
        populateUnits();
        valueInput.value = '1';
        updateUnitResult();
      });

      populateUnits();
      valueInput.value = '1';
      updateUnitResult();
    }

    /* ---------- QR CODE ---------- */
    const qrBtn = document.getElementById('qr-generate');
    if (qrBtn) {
      qrBtn.addEventListener('click', () => {
        const alertBox = document.getElementById('qr-alert');
        clearAlert(alertBox);
        const text = document.getElementById('qr-input').value;
        if (!text.trim()) { showAlert(alertBox, 'error', 'Enter text or a URL to generate a QR code.'); return; }
        const size = parseInt(document.getElementById('qr-size').value, 10) || 256;
        try {
          const dataUrl = generateQr(text, size);
          const box = document.getElementById('qr-output');
          box.innerHTML = `<img src="${dataUrl}" alt="Generated QR code" width="${size}" height="${size}" style="max-width:100%">`;
          document.getElementById('qr-download').disabled = false;
        } catch (e) {
          showAlert(alertBox, 'error', e.message);
        }
      });
      document.getElementById('qr-download').addEventListener('click', () => {
        const img = document.querySelector('#qr-output img');
        if (!img) return;
        const a = document.createElement('a');
        a.href = img.src;
        a.download = 'qr-code.png';
        a.click();
      });
      document.getElementById('qr-reset').addEventListener('click', () => {
        document.getElementById('qr-input').value = '';
        document.getElementById('qr-output').innerHTML = '';
        document.getElementById('qr-download').disabled = true;
        clearAlert(document.getElementById('qr-alert'));
      });
    }

    /* ---------- CURRENCY (Frankfurter v2) ---------- */
    const currencyForm = document.getElementById('currency-form');
    if (currencyForm) {
      const fromSel = document.getElementById('currency-from');
      const toSel = document.getElementById('currency-to');
      const amountInput = document.getElementById('currency-amount');
      const outputBox = document.getElementById('currency-output');
      const currencyAlert = document.getElementById('currency-alert');

      (async () => {
        try {
          const currencies = await fetchCurrencies();
          // v2 /currencies returns a map of code -> name (or an array of objects).
          // Normalise to an array of [code, name] pairs.
          let entries;
          if (Array.isArray(currencies)) {
            entries = currencies.map(c => [c.iso_code || c.code, c.name || c.iso_code || c.code]);
          } else {
            entries = Object.entries(currencies);
          }
          entries.sort((a, b) => a[0].localeCompare(b[0]));
          const options = entries.map(([code, name]) => `<option value="${code}">${code} — ${name}</option>`).join('');
          fromSel.innerHTML = options;
          toSel.innerHTML = options;
          fromSel.value = 'USD';
          toSel.value = 'EUR';
        } catch (e) {
          showAlert(currencyAlert, 'error', 'Could not load currency list. Check your internet connection.');
        }
      })();

      currencyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAlert(currencyAlert);
        const amount = parseFloat(amountInput.value);
        if (!Number.isFinite(amount) || amount < 0) {
          showAlert(currencyAlert, 'error', 'Please enter a valid non-negative amount.');
          return;
        }
        if (fromSel.value === toSel.value) {
          outputBox.innerHTML = `<div class="result-box"><strong>${amount} ${fromSel.value}</strong> = <strong>${amount} ${toSel.value}</strong></div>`;
          return;
        }
        const btn = document.getElementById('currency-convert');
        btn.classList.add('loading');
        btn.disabled = true;
        try {
          const { rate, date } = await fetchRate(fromSel.value, toSel.value);
          const converted = amount * rate;
          outputBox.innerHTML = `
            <div class="result-box">
              <div class="stat-grid">
                <div class="stat"><div class="stat-value">${window.TrailKit.formatNumber(converted, 2)}</div><div class="stat-label">${toSel.value}</div></div>
                <div class="stat"><div class="stat-value">${window.TrailKit.formatNumber(rate, 4)}</div><div class="stat-label">Rate</div></div>
              </div>
              <p style="margin-top:var(--space-3);font-size:0.85rem;color:var(--color-text-muted)">${amount} ${fromSel.value} = ${window.TrailKit.formatNumber(converted, 2)} ${toSel.value} · Rate date: ${date} · Source: Frankfurter v2</p>
            </div>
          `;
          showAlert(currencyAlert, 'success', 'Conversion complete.');
        } catch (err) {
          showAlert(currencyAlert, 'error', err.message || 'Currency conversion failed.');
        } finally {
          btn.classList.remove('loading');
          btn.disabled = false;
        }
      });

      document.getElementById('currency-reset').addEventListener('click', () => {
        amountInput.value = '1';
        outputBox.innerHTML = '';
        clearAlert(currencyAlert);
      });
    }
  });
})();