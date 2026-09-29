/* ==========================================================================
   TrailKit — Image Toolkit
   Local processing only. Mobile: camera capture support.
   ========================================================================== */

(function () {
  'use strict';

  const showAlert = window.TrailKit.showAlert;
  const clearAlert = window.TrailKit.clearAlert;
  const formatBytes = window.TrailKit.formatBytes;
  const downloadBlob = window.TrailKit.downloadBlob;
  const setLoading = window.ToolUI.setLoading;

  let originalImage = null;
  let originalFile = null;
  let currentObjectUrl = null;

  function revokeCurrent() {
    if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); currentObjectUrl = null; }
  }

  function loadFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type.startsWith('image/')) { reject(new Error('Please select a valid image file.')); return; }
      if (file.size > 25 * 1024 * 1024) { reject(new Error('Image is too large. Maximum size is 25 MB.')); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () { revokeCurrent(); currentObjectUrl = url; resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load the image.')); };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate image.'));
      }, type, quality);
    });
  }

  function drawTransformed(img, opts) {
    const width = opts.width || img.naturalWidth;
    const height = opts.height || img.naturalHeight;
    const rotate = opts.rotate || 0;
    const crop = opts.crop || null;

    const sx = crop ? crop.x : 0;
    const sy = crop ? crop.y : 0;
    const sw = crop ? crop.w : img.naturalWidth;
    const sh = crop ? crop.h : img.naturalHeight;

    const rotated = rotate % 180 !== 0;
    const outW = Math.max(1, Math.round(width));
    const outH = Math.max(1, Math.round(height));
    const canvasW = rotated ? outH : outW;
    const canvasH = rotated ? outW : outH;

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.drawImage(img, sx, sy, sw, sh, -outW / 2, -outH / 2, outW, outH);
    ctx.restore();

    return canvas;
  }

  function updatePreview(canvas) {
    const preview = document.getElementById('img-preview');
    if (!preview) return;
    preview.innerHTML = '';
    canvas.style.maxWidth = '100%';
    canvas.style.maxHeight = '360px';
    preview.appendChild(canvas);
  }

  function showInfo(img, file) {
    const box = document.getElementById('img-info');
    if (!box) return;
    box.innerHTML =
      '<div class="stat-grid">' +
        '<div class="stat"><div class="stat-value">' + img.naturalWidth + '</div><div class="stat-label">Width (px)</div></div>' +
        '<div class="stat"><div class="stat-value">' + img.naturalHeight + '</div><div class="stat-label">Height (px)</div></div>' +
        '<div class="stat"><div class="stat-value">' + formatBytes(file.size) + '</div><div class="stat-label">File size</div></div>' +
        '<div class="stat"><div class="stat-value">' + (file.type || 'unknown').replace('image/', '').toUpperCase() + '</div><div class="stat-label">Format</div></div>' +
      '</div>';
  }

  function resetAll() {
    originalImage = null;
    originalFile = null;
    revokeCurrent();
    const preview = document.getElementById('img-preview');
    if (preview) preview.innerHTML = '<p class="field-hint">No image loaded. Choose a file to begin.</p>';
    const info = document.getElementById('img-info');
    if (info) info.innerHTML = '';
    const fileInput = document.getElementById('img-file');
    if (fileInput) fileInput.value = '';
    ['resize-w', 'resize-h', 'crop-x', 'crop-y', 'crop-w', 'crop-h'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const rot = document.getElementById('rotate-angle');
    if (rot) rot.value = '90';
    const q = document.getElementById('quality-range');
    if (q) { q.value = '0.9'; document.getElementById('quality-value').textContent = '90%'; }
    clearAlert(document.getElementById('img-alert'));
    clearAlert(document.getElementById('img-output-alert'));
  }

  function requireImage(alertBox) {
    if (!originalImage) { showAlert(alertBox, 'error', 'Please load an image first.'); return false; }
    return true;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const page = document.getElementById('image-tools-page');
    if (!page) return;

    const fileInput = document.getElementById('img-file');
    const dropzone = document.getElementById('img-dropzone');
    const alertBox = document.getElementById('img-alert');
    const outputAlert = document.getElementById('img-output-alert');

    async function ingest(file) {
      clearAlert(alertBox);
      try {
        const img = await loadFile(file);
        originalImage = img;
        originalFile = file;
        showInfo(img, file);
        const rw = document.getElementById('resize-w');
        const rh = document.getElementById('resize-h');
        if (rw) rw.value = img.naturalWidth;
        if (rh) rh.value = img.naturalHeight;
        const cw = document.getElementById('crop-w');
        const ch = document.getElementById('crop-h');
        if (cw) cw.value = img.naturalWidth;
        if (ch) ch.value = img.naturalHeight;
        updatePreview(drawTransformed(img, {}));
      } catch (err) {
        showAlert(alertBox, 'error', err.message);
      }
    }

    fileInput.addEventListener('change', function (e) { if (e.target.files[0]) ingest(e.target.files[0]); });

    if (dropzone) {
      ['dragenter', 'dragover'].forEach(function (evt) {
        dropzone.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('dragover'); });
      });
      ['dragleave', 'drop'].forEach(function (evt) {
        dropzone.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('dragover'); });
      });
      dropzone.addEventListener('drop', function (e) { if (e.dataTransfer.files[0]) ingest(e.dataTransfer.files[0]); });
      dropzone.addEventListener('click', function () { fileInput.click(); });
    }

    const tabBtns = document.querySelectorAll('#img-tabs .tab-btn');
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        tabBtns.forEach(function (b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        document.querySelectorAll('#image-tools-page .tab-panel').forEach(function (p) { p.classList.remove('active'); });
        const target = document.getElementById(btn.dataset.tab);
        if (target) target.classList.add('active');
      });
    });

    const qRange = document.getElementById('quality-range');
    const qValue = document.getElementById('quality-value');
    if (qRange && qValue) {
      qRange.addEventListener('input', function () { qValue.textContent = Math.round(qRange.value * 100) + '%'; });
    }

    const resizeBtn = document.getElementById('resize-apply');
    if (resizeBtn) {
      resizeBtn.addEventListener('click', async function () {
        if (!requireImage(alertBox)) return;
        const w = parseInt(document.getElementById('resize-w').value, 10);
        const h = parseInt(document.getElementById('resize-h').value, 10);
        if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) { showAlert(alertBox, 'error', 'Please enter valid dimensions.'); return; }
        if (w > 12000 || h > 12000) { showAlert(alertBox, 'error', 'Dimensions too large.'); return; }
        setLoading(resizeBtn, true);
        try {
          const canvas = drawTransformed(originalImage, { width: w, height: h });
          updatePreview(canvas);
          const blob = await canvasToBlob(canvas, 'image/png');
          downloadBlob(blob, 'resized-' + w + 'x' + h + '.png');
          showAlert(outputAlert, 'success', 'Resized and downloaded (' + w + '×' + h + ' px).');
        } catch (err) { showAlert(alertBox, 'error', err.message); }
        finally { setLoading(resizeBtn, false); }
      });
    }

    const compressBtn = document.getElementById('compress-apply');
    if (compressBtn) {
      compressBtn.addEventListener('click', async function () {
        if (!requireImage(alertBox)) return;
        const format = document.getElementById('compress-format').value;
        const quality = parseFloat(qRange.value);
        setLoading(compressBtn, true);
        try {
          const canvas = drawTransformed(originalImage, {});
          const type = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
          const blob = await canvasToBlob(canvas, type, quality);
          updatePreview(canvas);
          const ext = format === 'jpeg' ? 'jpg' : format;
          downloadBlob(blob, 'compressed.' + ext);
          const saved = originalFile.size - blob.size;
          const pct = originalFile.size > 0 ? Math.round((saved / originalFile.size) * 100) : 0;
          showAlert(outputAlert, 'success', 'Compressed to ' + formatBytes(blob.size) + (pct > 0 ? ' (' + pct + '% smaller)' : '') + '.');
        } catch (err) { showAlert(alertBox, 'error', err.message); }
        finally { setLoading(compressBtn, false); }
      });
    }

    const rotateBtn = document.getElementById('rotate-apply');
    if (rotateBtn) {
      rotateBtn.addEventListener('click', async function () {
        if (!requireImage(alertBox)) return;
        const angle = parseInt(document.getElementById('rotate-angle').value, 10) || 0;
        setLoading(rotateBtn, true);
        try {
          const canvas = drawTransformed(originalImage, { rotate: angle });
          updatePreview(canvas);
          const blob = await canvasToBlob(canvas, 'image/png');
          downloadBlob(blob, 'rotated-' + angle + 'deg.png');
          showAlert(outputAlert, 'success', 'Rotated ' + angle + '°.');
        } catch (err) { showAlert(alertBox, 'error', err.message); }
        finally { setLoading(rotateBtn, false); }
      });
    }

    const cropBtn = document.getElementById('crop-apply');
    if (cropBtn) {
      cropBtn.addEventListener('click', async function () {
        if (!requireImage(alertBox)) return;
        const x = parseInt(document.getElementById('crop-x').value, 10) || 0;
        const y = parseInt(document.getElementById('crop-y').value, 10) || 0;
        const w = parseInt(document.getElementById('crop-w').value, 10);
        const h = parseInt(document.getElementById('crop-h').value, 10);
        if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) { showAlert(alertBox, 'error', 'Please enter valid crop dimensions.'); return; }
        if (x < 0 || y < 0 || x + w > originalImage.naturalWidth || y + h > originalImage.naturalHeight) {
          showAlert(alertBox, 'error', 'Crop region exceeds image bounds.');
          return;
        }
        setLoading(cropBtn, true);
        try {
          const canvas = drawTransformed(originalImage, { width: w, height: h, crop: { x: x, y: y, w: w, h: h } });
          updatePreview(canvas);
          const blob = await canvasToBlob(canvas, 'image/png');
          downloadBlob(blob, 'cropped-' + w + 'x' + h + '.png');
          showAlert(outputAlert, 'success', 'Cropped to ' + w + '×' + h + ' px.');
        } catch (err) { showAlert(alertBox, 'error', err.message); }
        finally { setLoading(cropBtn, false); }
      });
    }

    document.getElementById('img-reset').addEventListener('click', resetAll);
  });
})();