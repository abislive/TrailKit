/* ==========================================================================
   TrailKit — Developer Utilities
   Hash (text + file), UUID, Base64, JSON, units, QR, currency.
   MD5 implemented in pure JS (Web Crypto does not support MD5).
   ========================================================================== */

(function () {
  'use strict';

  const formatNumber = window.TrailKit.formatNumber;
  const setLoading = window.ToolUI.setLoading;
  const showError = window.ToolUI.showError;
  const showSuccess = window.ToolUI.showSuccess;
  const clear = window.ToolUI.clear;

  /* ---------- MD5 (RFC 1321) — pure JS ---------- */
  function md5Hex(message) {
    function rotl(x, c) { return (x << c) | (x >>> (32 - c)); }
    function toHexLE(n) {
      let s = '';
      for (let i = 0; i < 4; i++) s += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
      return s;
    }
    const bytes = new TextEncoder().encode(message);
    const bitLen = bytes.length * 8;
    const withPadLen = (((bytes.length + 8) >> 6) + 1) * 64;
    const buf = new Uint8Array(withPadLen);
    buf.set(bytes);
    buf[bytes.length] = 0x80;
    const view = new DataView(buf.buffer);
    view.setUint32(withPadLen - 8, bitLen >>> 0, true);
    view.setUint32(withPadLen - 4, Math.floor(bitLen / 0x100000000) >>> 0, true);

    let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;
    const S = [
      7,12,17,22, 7,12,17,22, 7,12,17,22, 7,12,17,22,
      5, 9,14,20, 5, 9,14,20, 5, 9,14,20, 5, 9,14,20,
      4,11,16,23, 4,11,16,23, 4,11,16,23, 4,11,16,23,
      6,10,15,21, 6,10,15,21, 6,10,15,21, 6,10,15,21
    ];
    const K = new Uint32Array(64);
    for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 0x100000000) >>> 0;
    const M = new Uint32Array(16);

    for (let chunk = 0; chunk < withPadLen; chunk += 64) {
      for (let j = 0; j < 16; j++) M[j] = view.getUint32(chunk + j * 4, true);
      let A = a0, B = b0, C = c0, D = d0;
      for (let i = 0; i < 64; i++) {
        let F, g;
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * i) % 16; }
        F = (F + A + K[i] + M[g]) >>> 0;
        A = D; D = C; C = B; B = (B + rotl(F, S[i])) >>> 0;
      }
      a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
    }
    return toHexLE(a0) + toHexLE(b0) + toHexLE(c0) + toHexLE(d0);
  }

  async function webCryptoDigest(algo, data) {
    const buf = await crypto.subtle.digest(algo, data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function computeTextHashes(text) {
    const data = new TextEncoder().encode(text);
    const md5 = md5Hex(text);
    const [sha1, sha256, sha384, sha512] = await Promise.all([
      webCryptoDigest('SHA-1', data),
      webCryptoDigest('SHA-256', data),
      webCryptoDigest('SHA-384', data),
      webCryptoDigest('SHA-512', data)
    ]);
    return { md5, sha1, sha256, sha384, sha512 };
  }

  async function computeFileHashes(file) {
    const buf = await file.arrayBuffer();
    const data = new Uint8Array(buf);
    const text = await file.text();
    const md5 = md5Hex(text);
    const [sha1, sha256, sha384, sha512] = await Promise.all([
      webCryptoDigest('SHA-1', data),
      webCryptoDigest('SHA-256', data),
      webCryptoDigest('SHA-384', data),
      webCryptoDigest('SHA-512', data)
    ]);
    return { md5, sha1, sha256, sha384, sha512 };
  }

  function uuidv4() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

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

  const unitDefs = {
    length: { units: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 } },
    mass: { units: { kg: 1, g: 0.001, mg: 0.000001, t: 1000, lb: 0.45359237, oz: 0.028349523125 } },
    temperature: { special: true },
    area: { units: { m2: 1, km2: 1e6, cm2: 1e-4, ha: 10000, acre: 4046.8564224, ft2: 0.09290304, mi2: 2589988.110336 } },
    volume: { units: { l: 1, ml: 0.001, m3: 1000, gal: 3.785411784, qt: 0.946352946, floz: 0.0295735295625, cup: 0.2365882365 } },
    speed: { units: { ms: 1, kmh: 1 / 3.6, mph: 0.44704, kn: 0.514444, fts: 0.3048 } },
    data: { units: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776, bit: 0.125 } }
  };

  function convertUnit(category, from, to, value) {
    if (category === 'temperature') {
      let c;
      if (from === 'C') c = value; else if (from === 'F') c = (value - 32) * 5 / 9; else if (from === 'K') c = value - 273.15;
      else throw new Error('Unknown temperature unit');
      if (to === 'C') return c; if (to === 'F') return c * 9 / 5 + 32; if (to === 'K') return c + 273.15;
      throw new Error('Unknown temperature unit');
    }
    const def = unitDefs[category];
    if (!def) throw new Error('Unknown category');
    const ff = def.units[from], tf = def.units[to];
    if (ff == null || tf == null) throw new Error('Unknown unit');
    return value * ff / tf;
  }

  const FRANKFURTER_BASE = 'https://api.frankfurter.dev/v2';

  async function fetchCurrencies() {
    const res = await fetch(FRANKFURTER_BASE + '/currencies');
    if (!res.ok) throw new Error('Failed to load currency list');
    return res.json();
  }
  async function fetchRate(from, to) {
    const res = await fetch(FRANKFURTER_BASE + '/rate/' + from + '/' + to);
    if (!res.ok) throw new Error('Exchange rate not available for this pair.');
    const data = await res.json();
    if (typeof data.rate !== 'number') throw new Error('Exchange rate not available for this pair.');
    return { rate: data.rate, date: data.date };
  }

  function generateQr(text, size) {
    if (typeof window.qrcode === 'undefined') throw new Error('QR library not loaded. Reload the page.');
    const qr = window.qrcode(0, 'M');
    qr.addData(text);
    qr.make();
    return qr.createDataURL(size, 8);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!document.getElementById('utilities-page')) return;

    /* ================= HASH — TEXT ================= */
    const hashBtn = document.getElementById('hash-generate');
    if (hashBtn) {
      const hashInput = document.getElementById('hash-input');
      const hashOutput = document.getElementById('hash-output');
      const hashAlert = document.getElementById('hash-alert');

      hashBtn.addEventListener('click', async function () {
        clear(hashAlert);
        const text = hashInput.value;
        if (!text) { showError(hashAlert, 'Please enter some text to hash.'); return; }
        setLoading(hashBtn, true);
        try {
          const h = await computeTextHashes(text);
          const rows = [
            ['MD5', h.md5], ['SHA-1', h.sha1], ['SHA-256', h.sha256],
            ['SHA-384', h.sha384], ['SHA-512', h.sha512]
          ];
          hashOutput.innerHTML = '<div class="result-box">' + rows.map(function (r) {
            return '<div class="hash-row">' +
              '<div class="hash-row-head"><strong>' + r[0] + '</strong>' +
              '<button type="button" class="hash-copy btn btn-ghost btn-sm" data-copy="' + r[1] + '" aria-label="Copy ' + r[0] + '">Copy</button></div>' +
              '<pre>' + r[1] + '</pre></div>';
          }).join('') + '</div>';
          hashOutput.querySelectorAll('.hash-copy').forEach(function (b) {
            window.ToolUI.attachCopy(b, b.dataset.copy, 'Hash');
          });
          showSuccess(hashAlert, 'Hashes generated.');
        } catch (err) {
          console.error('[TrailKit] Hash error:', err);
          showError(hashAlert, 'Hash generation failed: ' + (err.message || 'unknown error'));
        } finally {
          setLoading(hashBtn, false);
        }
      });

      document.getElementById('hash-reset').addEventListener('click', function () {
        hashInput.value = '';
        hashOutput.innerHTML = '';
        clear(hashAlert);
      });
    }

    /* ================= HASH — FILE ================= */
    const fileBtn = document.getElementById('filehash-generate');
    if (fileBtn) {
      const fileInput = document.getElementById('filehash-input');
      const fileOutput = document.getElementById('filehash-output');
      const fileAlert = document.getElementById('filehash-alert');
      const fileDrop = document.getElementById('filehash-drop');
      let pickedFile = null;

      function setFile(file) {
        if (!file) return;
        if (file.size > 200 * 1024 * 1024) { showError(fileAlert, 'File is too large (max 200 MB).'); return; }
        pickedFile = file;
        clear(fileAlert);
        showSuccess(fileAlert, 'Selected: ' + window.TrailKit.escapeHtml(file.name) + ' (' + window.TrailKit.formatBytes(file.size) + ')');
      }

      fileInput.addEventListener('change', function (e) { setFile(e.target.files[0]); });

      if (fileDrop) {
        ['dragenter', 'dragover'].forEach(function (evt) {
          fileDrop.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); fileDrop.classList.add('dragover'); });
        });
        ['dragleave', 'drop'].forEach(function (evt) {
          fileDrop.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); fileDrop.classList.remove('dragover'); });
        });
        fileDrop.addEventListener('drop', function (e) { setFile(e.dataTransfer.files[0]); });
        fileDrop.addEventListener('click', function () { fileInput.click(); });
      }

      fileBtn.addEventListener('click', async function () {
        clear(fileAlert);
        if (!pickedFile) { showError(fileAlert, 'Please select a file first.'); return; }
        setLoading(fileBtn, true);
        fileOutput.innerHTML = '<div class="result-box"><p class="field-hint">Computing hashes…</p></div>';
        try {
          const h = await computeFileHashes(pickedFile);
          const rows = [['MD5', h.md5], ['SHA-1', h.sha1], ['SHA-256', h.sha256], ['SHA-384', h.sha384], ['SHA-512', h.sha512]];
          fileOutput.innerHTML = '<div class="result-box">' + rows.map(function (r) {
            return '<div class="hash-row">' +
              '<div class="hash-row-head"><strong>' + r[0] + '</strong>' +
              '<button type="button" class="hash-copy btn btn-ghost btn-sm" data-copy="' + r[1] + '" aria-label="Copy ' + r[0] + '">Copy</button></div>' +
              '<pre>' + r[1] + '</pre></div>';
          }).join('') + '</div>';
          fileOutput.querySelectorAll('.hash-copy').forEach(function (b) {
            window.ToolUI.attachCopy(b, b.dataset.copy, 'Hash');
          });
          showSuccess(fileAlert, 'File hashes generated.');
        } catch (err) {
          console.error('[TrailKit] File hash error:', err);
          showError(fileAlert, 'File hashing failed: ' + (err.message || 'unknown error'));
        } finally {
          setLoading(fileBtn, false);
        }
      });

      const fileReset = document.getElementById('filehash-reset');
      if (fileReset) fileReset.addEventListener('click', function () {
        pickedFile = null;
        fileInput.value = '';
        fileOutput.innerHTML = '';
        clear(fileAlert);
      });
    }

    /* ================= UUID ================= */
    const uuidBtn = document.getElementById('uuid-generate');
    if (uuidBtn) {
      uuidBtn.addEventListener('click', function () {
        const count = Math.min(Math.max(parseInt(document.getElementById('uuid-count').value, 10) || 1, 1), 50);
        const list = Array.from({ length: count }, uuidv4);
        document.getElementById('uuid-output').innerHTML = '<div class="result-box"><pre>' + list.join('\n') + '</pre></div>';
      });
      window.ToolUI.attachCopy(
        document.getElementById('uuid-copy'),
        function () { const el = document.querySelector('#uuid-output pre'); return el ? el.textContent : ''; },
        'UUIDs'
      );
      document.getElementById('uuid-reset').addEventListener('click', function () {
        document.getElementById('uuid-output').innerHTML = '';
        document.getElementById('uuid-count').value = 5;
      });
    }

    /* ================= Base64 ================= */
    const b64Input = document.getElementById('b64-input');
    if (b64Input) {
      const b64Output = document.getElementById('b64-output');
      const b64Alert = document.getElementById('b64-alert');
      document.getElementById('b64-encode').addEventListener('click', function () {
        clear(b64Alert);
        if (!b64Input.value) { showError(b64Alert, 'Enter text to encode.'); return; }
        try { b64Output.value = encodeBase64(b64Input.value); showSuccess(b64Alert, 'Encoded.'); }
        catch (_) { showError(b64Alert, 'Encoding failed.'); }
      });
      document.getElementById('b64-decode').addEventListener('click', function () {
        clear(b64Alert);
        if (!b64Input.value) { showError(b64Alert, 'Enter Base64 to decode.'); return; }
        try { b64Output.value = decodeBase64(b64Input.value.trim()); showSuccess(b64Alert, 'Decoded.'); }
        catch (_) { showError(b64Alert, 'Invalid Base64 string.'); }
      });
      document.getElementById('b64-reset').addEventListener('click', function () { b64Input.value = ''; b64Output.value = ''; clear(b64Alert); });
      window.ToolUI.attachCopy(document.getElementById('b64-copy'), function () { return b64Output.value; }, 'Base64');
    }

    /* ================= JSON ================= */
    const jsonInput = document.getElementById('json-input');
    if (jsonInput) {
      const jsonOutput = document.getElementById('json-output');
      const jsonAlert = document.getElementById('json-alert');
      document.getElementById('json-format').addEventListener('click', function () {
        clear(jsonAlert);
        if (!jsonInput.value.trim()) { showError(jsonAlert, 'Paste some JSON first.'); return; }
        try { jsonOutput.value = JSON.stringify(JSON.parse(jsonInput.value), null, 2); showSuccess(jsonAlert, 'Formatted.'); }
        catch (e) { showError(jsonAlert, 'Invalid JSON: ' + e.message); }
      });
      document.getElementById('json-minify').addEventListener('click', function () {
        clear(jsonAlert);
        if (!jsonInput.value.trim()) { showError(jsonAlert, 'Paste some JSON first.'); return; }
        try { jsonOutput.value = JSON.stringify(JSON.parse(jsonInput.value)); showSuccess(jsonAlert, 'Minified.'); }
        catch (e) { showError(jsonAlert, 'Invalid JSON: ' + e.message); }
      });
      document.getElementById('json-reset').addEventListener('click', function () { jsonInput.value = ''; jsonOutput.value = ''; clear(jsonAlert); });
      window.ToolUI.attachCopy(document.getElementById('json-copy'), function () { return jsonOutput.value; }, 'JSON');
    }

    /* ================= Unit converter ================= */
    const unitCategory = document.getElementById('unit-category');
    if (unitCategory) {
      const fromSel = document.getElementById('unit-from');
      const toSel = document.getElementById('unit-to');
      const valueInput = document.getElementById('unit-value');
      const outputBox = document.getElementById('unit-output');
      const unitAlert = document.getElementById('unit-alert');

      function populate() {
        const cat = unitCategory.value;
        const units = cat === 'temperature' ? ['C', 'F', 'K'] : Object.keys(unitDefs[cat].units);
        fromSel.innerHTML = units.map(u => '<option value="' + u + '">' + u + '</option>').join('');
        toSel.innerHTML = units.map(u => '<option value="' + u + '">' + u + '</option>').join('');
        if (units.length > 1) toSel.value = units[1];
        update();
      }
      function update() {
        clear(unitAlert);
        const val = parseFloat(valueInput.value);
        if (!Number.isFinite(val)) { outputBox.innerHTML = '<p class="field-hint">Enter a number to convert.</p>'; return; }
        try {
          const result = convertUnit(unitCategory.value, fromSel.value, toSel.value, val);
          outputBox.innerHTML = '<div class="stat-grid">' +
            '<div class="stat"><div class="stat-value">' + formatNumber(result, 6) + '</div><div class="stat-label">' + toSel.value + '</div></div>' +
            '<div class="stat"><div class="stat-value">' + formatNumber(val, 6) + '</div><div class="stat-label">' + fromSel.value + '</div></div>' +
          '</div>';
        } catch (e) { showError(unitAlert, e.message); }
      }
      unitCategory.addEventListener('change', populate);
      fromSel.addEventListener('change', update);
      toSel.addEventListener('change', update);
      valueInput.addEventListener('input', update);
      document.getElementById('unit-reset').addEventListener('click', function () { unitCategory.value = 'length'; populate(); valueInput.value = '1'; update(); });
      populate(); valueInput.value = '1'; update();
    }

    /* ================= QR ================= */
    const qrBtn = document.getElementById('qr-generate');
    if (qrBtn) {
      const qrInput = document.getElementById('qr-input');
      const qrOutput = document.getElementById('qr-output');
      const qrAlert = document.getElementById('qr-alert');
      const qrDownload = document.getElementById('qr-download');

      function run() {
        clear(qrAlert);
        const text = qrInput.value.trim();
        if (!text) { showError(qrAlert, 'Enter text or a URL to generate a QR code.'); return; }
        if (text.length > 2000) { showError(qrAlert, 'Input too long (max ~2000 chars).'); return; }

        qrOutput.innerHTML = '<div class="qr-loading" role="status" aria-live="polite">' +
          '<span class="spinner" aria-hidden="true"></span>' +
          '<span class="qr-loading-text">Generating QR code…</span></div>';
        qrDownload.disabled = true;
        setLoading(qrBtn, true);

        requestAnimationFrame(function () {
          setTimeout(function () {
            try {
              const size = parseInt(document.getElementById('qr-size').value, 10) || 256;
              const dataUrl = generateQr(text, size);
              qrOutput.innerHTML = '<img class="fade-in-up" src="' + dataUrl + '" alt="QR code" width="' + size + '" height="' + size + '" style="max-width:100%">';
              qrDownload.disabled = false;
              showSuccess(qrAlert, 'QR code generated.');
            } catch (e) {
              qrOutput.innerHTML = '';
              showError(qrAlert, e.message);
            } finally {
              setLoading(qrBtn, false);
            }
          }, 60);
        });
      }

      qrBtn.addEventListener('click', run);
      qrInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); run(); } });

      qrDownload.addEventListener('click', function () {
        const img = qrOutput.querySelector('img');
        if (!img) return;
        const a = document.createElement('a');
        a.href = img.src;
        a.download = 'qr-code.png';
        a.click();
      });

      document.getElementById('qr-reset').addEventListener('click', function () {
        qrInput.value = '';
        qrOutput.innerHTML = '';
        qrDownload.disabled = true;
        clear(qrAlert);
      });
    }

    /* ================= Currency ================= */
    const currencyForm = document.getElementById('currency-form');
    if (currencyForm) {
      const fromSel = document.getElementById('currency-from');
      const toSel = document.getElementById('currency-to');
      const amountInput = document.getElementById('currency-amount');
      const outputBox = document.getElementById('currency-output');
      const currencyAlert = document.getElementById('currency-alert');
      const convertBtn = document.getElementById('currency-convert');

      (async function () {
        try {
          const currencies = await fetchCurrencies();
          const entries = Array.isArray(currencies)
            ? currencies.map(function (c) { return [c.iso_code || c.code, c.name || c.iso_code || c.code]; })
            : Object.entries(currencies);
          entries.sort(function (a, b) { return a[0].localeCompare(b[0]); });
          const options = entries.map(function (p) { return '<option value="' + p[0] + '">' + p[0] + ' — ' + p[1] + '</option>'; }).join('');
          fromSel.innerHTML = options; toSel.innerHTML = options;
          fromSel.value = 'USD'; toSel.value = 'EUR';
        } catch (_) {
          showError(currencyAlert, 'Could not load currency list. Check your internet connection.');
        }
      })();

      currencyForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        clear(currencyAlert);
        const amount = parseFloat(amountInput.value);
        if (!Number.isFinite(amount) || amount < 0) { showError(currencyAlert, 'Please enter a valid non-negative amount.'); return; }
        if (fromSel.value === toSel.value) {
          outputBox.innerHTML = '<div class="result-box"><strong>' + amount + ' ' + fromSel.value + '</strong> = <strong>' + amount + ' ' + toSel.value + '</strong></div>';
          return;
        }
        setLoading(convertBtn, true);
        try {
          const r = await fetchRate(fromSel.value, toSel.value);
          const converted = amount * r.rate;
          outputBox.innerHTML = '<div class="result-box">' +
            '<div class="stat-grid">' +
              '<div class="stat"><div class="stat-value">' + formatNumber(converted, 2) + '</div><div class="stat-label">' + toSel.value + '</div></div>' +
              '<div class="stat"><div class="stat-value">' + formatNumber(r.rate, 4) + '</div><div class="stat-label">Rate</div></div>' +
            '</div>' +
            '<p style="margin-top:var(--space-3);font-size:0.85rem;color:var(--color-text-muted)">Rate date: ' + r.date + ' · Source: Frankfurter v2</p>' +
          '</div>';
          showSuccess(currencyAlert, 'Conversion complete.');
        } catch (err) {
          showError(currencyAlert, err.message || 'Currency conversion failed.');
        } finally {
          setLoading(convertBtn, false);
        }
      });

      document.getElementById('currency-reset').addEventListener('click', function () {
        amountInput.value = '1'; outputBox.innerHTML = ''; clear(currencyAlert);
      });
    }
  });
})();