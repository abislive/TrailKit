/* ==========================================================================
   TrailKit — Image Toolkit
   Local processing only: resize, compress, convert, rotate, crop, inspect.
   ========================================================================== */

(function () {
  'use strict';

  const $ = window.TrailKit.$;
  const showAlert = window.TrailKit.showAlert;
  const clearAlert = window.TrailKit.clearAlert;
  const formatBytes = window.TrailKit.formatBytes;
  const downloadBlob = window.TrailKit.downloadBlob;

  let originalImage = null;   // HTMLImageElement
  let originalFile = null;    // File
  let currentObjectUrl = null;

  function revokeCurrent() {
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
  }

  function loadFile(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        reject(new Error('Please select a valid image file (JPEG, PNG, WebP, GIF, or BMP).'));
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        reject(new Error('Image is too large. Maximum size is 25 MB.'));
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        revokeCurrent();
        currentObjectUrl = url;
        resolve(img);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Could not load the image. The file may be corrupted or in an unsupported format.'));
      };
      img.src = url;
    });
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to generate image. The browser could not encode the requested format.'));
      }, type, quality);
    });
  }

  function drawTransformed(img, opts) {
    const {
      width = img.naturalWidth,
      height = img.naturalHeight,
      rotate = 0,
      crop = null,
      flipH = false,
      flipV = false
    } = opts;

    // Crop source rectangle (in original coordinates)
    const sx = crop ? crop.x : 0;
    const sy = crop ? crop.y : 0;
    const sw = crop ? crop.w : img.naturalWidth;
    const sh = crop ? crop.h : img.naturalHeight;

    // Output canvas: account for rotation
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
    // Move to center, rotate, then draw centered
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
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
    box.innerHTML = `
      <div class="stat-grid">
        <div class="stat"><div class="stat-value">${img.naturalWidth}</div><div class="stat-label">Width (px)</div></div>
        <div class="stat"><div class="stat-value">${img.naturalHeight}</div><div class="stat-label">Height (px)</div></div>
        <div class="stat"><div class="stat-value">${formatBytes(file.size)}</div><div class="stat-label">File size</div></div>
        <div class="stat"><div class="stat-value">${(file.type || 'unknown').replace('image/', '').toUpperCase()}</div><div class="stat-label">Format</div></div>
        <div class="stat"><div class="stat-value">${window.TrailKit.formatNumber(img.naturalWidth / img.naturalHeight, 3)}</div><div class="stat-label">Aspect ratio</div></div>
        <div class="stat"><div class="stat-value">${window.TrailKit.formatNumber((img.naturalWidth * img.naturalHeight) / 1e6, 2)} MP</div><div class="stat-label">Megapixels</div></div>
      </div>
    `;
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
    ['resize-w', 'resize-h', 'crop-x', 'crop-y', 'crop-w', 'crop-h'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const rot = document.getElementById('rotate-angle');
    if (rot) rot.value = '0';
    const q = document.getElementById('quality-range');
    if (q) { q.value = '0.9'; document.getElementById('quality-value').textContent = '90%'; }
    clearAlert(document.getElementById('img-alert'));
    clearAlert(document.getElementById('img-output-alert'));
  }

  function requireImage(alertBox) {
    if (!originalImage) {
      showAlert(alertBox, 'error', 'Please load an image first.');
      return false;
    }
    return true;
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.getElementById('image-tools-page');
    if (!page) return;

    const fileInput = document.getElementById('img-file');
    const dropzone = document.getElementById('img-dropzone');
    const alertBox = document.getElementById('img-alert');
    const outputAlert = document.getElementById('img-output-alert');

    /* File selection */
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      clearAlert(alertBox);
      try {
        const img = await loadFile(file);
        originalImage = img;
        originalFile = file;
        showInfo(img, file);
        // default resize values
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
    });

    /* Drag & drop */
    if (dropzone) {
      ['dragenter', 'dragover'].forEach(evt => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('dragover');
        });
      });
      ['dragleave', 'drop'].forEach(evt => {
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('dragover');
        });
      });
      dropzone.addEventListener('drop', async (e) => {
        const file = e.dataTransfer.files[0];
        if (!file) return;
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
      });
      dropzone.addEventListener('click', () => fileInput.click());
    }

    /* Tabs */
    const tabBtns = document.querySelectorAll('#img-tabs .tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('#img-tabs ~ .tab-panel, .tab-panel').forEach(p => {
          if (p.closest('#image-tools-page')) p.classList.remove('active');
        });
        const target = document.getElementById(btn.dataset.tab);
        if (target) target.classList.add('active');
      });
    });

    /* Quality slider */
    const qRange = document.getElementById('quality-range');
    const qValue = document.getElementById('quality-value');
    if (qRange && qValue) {
      qRange.addEventListener('input', () => {
        qValue.textContent = Math.round(qRange.value * 100) + '%';
      });
    }

    /* Resize & download */
    const resizeBtn = document.getElementById('resize-apply');
    if (resizeBtn) {
      resizeBtn.addEventListener('click', async () => {
        if (!requireImage(alertBox)) return;
        const w = parseInt(document.getElementById('resize-w').value, 10);
        const h = parseInt(document.getElementById('resize-h').value, 10);
        if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) {
          showAlert(alertBox, 'error', 'Please enter valid width and height (minimum 1 px).');
          return;
        }
        if (w > 12000 || h > 12000) {
          showAlert(alertBox, 'error', 'Dimensions too large. Maximum 12000 px per side.');
          return;
        }
        try {
          const canvas = drawTransformed(originalImage, { width: w, height: h });
          updatePreview(canvas);
          const blob = await canvasToBlob(canvas, 'image/png');
          downloadBlob(blob, `resized-${w}x${h}.png`);
          showAlert(outputAlert, 'success', `Resized image downloaded (${w}×${h} px, ${formatBytes(blob.size)}).`);
        } catch (err) {
          showAlert(alertBox, 'error', err.message);
        }
      });
    }

    /* Compress & convert */
    const compressBtn = document.getElementById('compress-apply');
    if (compressBtn) {
      compressBtn.addEventListener('click', async () => {
        if (!requireImage(alertBox)) return;
        const format = document.getElementById('compress-format').value;
        const quality = parseFloat(qRange.value);
        try {
          const canvas = drawTransformed(originalImage, {});
          const type = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
          const blob = await canvasToBlob(canvas, type, quality);
          updatePreview(canvas);
          const ext = format === 'jpeg' ? 'jpg' : format;
          downloadBlob(blob, `compressed.${ext}`);
          const saved = originalFile.size - blob.size;
          const pct = originalFile.size > 0 ? Math.round((saved / originalFile.size) * 100) : 0;
          showAlert(outputAlert, 'success', `Compressed to ${formatBytes(blob.size)} (${pct > 0 ? pct + '% smaller' : 'size similar'}).`);
        } catch (err) {
          showAlert(alertBox, 'error', err.message);
        }
      });
    }

    /* Rotate */
    const rotateBtn = document.getElementById('rotate-apply');
    if (rotateBtn) {
      rotateBtn.addEventListener('click', async () => {
        if (!requireImage(alertBox)) return;
        const angle = parseInt(document.getElementById('rotate-angle').value, 10) || 0;
        try {
          const canvas = drawTransformed(originalImage, { rotate: angle });
          updatePreview(canvas);
          const blob = await canvasToBlob(canvas, 'image/png');
          downloadBlob(blob, `rotated-${angle}deg.png`);
          showAlert(outputAlert, 'success', `Rotated ${angle}° and downloaded.`);
        } catch (err) {
          showAlert(alertBox, 'error', err.message);
        }
      });
    }

    /* Crop */
    const cropBtn = document.getElementById('crop-apply');
    if (cropBtn) {
      cropBtn.addEventListener('click', async () => {
        if (!requireImage(alertBox)) return;
        const x = parseInt(document.getElementById('crop-x').value, 10) || 0;
        const y = parseInt(document.getElementById('crop-y').value, 10) || 0;
        const w = parseInt(document.getElementById('crop-w').value, 10);
        const h = parseInt(document.getElementById('crop-h').value, 10);
        if (!Number.isFinite(w) || !Number.isFinite(h) || w < 1 || h < 1) {
          showAlert(alertBox, 'error', 'Please enter valid crop width and height.');
          return;
        }
        if (x < 0 || y < 0 || x + w > originalImage.naturalWidth || y + h > originalImage.naturalHeight) {
          showAlert(alertBox, 'error', `Crop region is outside the image bounds (${originalImage.naturalWidth}×${originalImage.naturalHeight}).`);
          return;
        }
        try {
          const canvas = drawTransformed(originalImage, { width: w, height: h, crop: { x, y, w, h } });
          updatePreview(canvas);
          const blob = await canvasToBlob(canvas, 'image/png');
          downloadBlob(blob, `cropped-${w}x${h}.png`);
          showAlert(outputAlert, 'success', `Cropped to ${w}×${h} px and downloaded.`);
        } catch (err) {
          showAlert(alertBox, 'error', err.message);
        }
      });
    }

    /* Reset */
    const resetBtn = document.getElementById('img-reset');
    if (resetBtn) resetBtn.addEventListener('click', resetAll);
  });
})();