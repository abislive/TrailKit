/* ==========================================================================
   TrailKit — Images to PDF (jsPDF from CDN)
   ========================================================================== */

(function () {
  'use strict';

  const showAlert = window.TrailKit.showAlert;
  const clearAlert = window.TrailKit.clearAlert;
  const formatBytes = window.TrailKit.formatBytes;
  const downloadBlob = window.TrailKit.downloadBlob;
  const setLoading = window.ToolUI.setLoading;

  let items = [];

  function uid() { return Math.random().toString(36).slice(2, 10); }
  function revokeItem(item) { if (item.objectUrl) URL.revokeObjectURL(item.objectUrl); item.objectUrl = null; }

  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file.type.startsWith('image/')) { reject(new Error('"' + file.name + '" is not a supported image.')); return; }
      if (file.size > 25 * 1024 * 1024) { reject(new Error('"' + file.name + '" is larger than 25 MB.')); return; }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () { resolve({ img: img, url: url }); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Could not load "' + file.name + '".')); };
      img.src = url;
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (s) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s]; });
  }

  function renderList() {
    const grid = document.getElementById('pdf-image-grid');
    const empty = document.getElementById('pdf-empty');
    const count = document.getElementById('pdf-count');
    if (!grid) return;
    if (count) count.textContent = items.length;

    if (!items.length) {
      grid.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      return;
    }
    if (empty) empty.classList.add('hidden');

    grid.innerHTML = items.map(function (item, i) {
      return '<div class="image-item" data-id="' + item.id + '">' +
        '<span class="image-item-index">' + (i + 1) + '</span>' +
        '<img src="' + item.objectUrl + '" alt="Image ' + (i + 1) + '">' +
        '<div class="image-item-actions">' +
          '<button type="button" data-action="up" data-id="' + item.id + '" aria-label="Move up" ' + (i === 0 ? 'disabled' : '') + '>↑</button>' +
          '<button type="button" data-action="down" data-id="' + item.id + '" aria-label="Move down" ' + (i === items.length - 1 ? 'disabled' : '') + '>↓</button>' +
          '<button type="button" data-action="remove" data-id="' + item.id + '" aria-label="Remove">✕</button>' +
        '</div>' +
      '</div>';
    }).join('');

    grid.querySelectorAll('button[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const id = btn.dataset.id;
        const idx = items.findIndex(function (it) { return it.id === id; });
        if (idx === -1) return;
        const action = btn.dataset.action;
        if (action === 'up' && idx > 0) { const t = items[idx - 1]; items[idx - 1] = items[idx]; items[idx] = t; }
        else if (action === 'down' && idx < items.length - 1) { const t = items[idx + 1]; items[idx + 1] = items[idx]; items[idx] = t; }
        else if (action === 'remove') { revokeItem(items[idx]); items.splice(idx, 1); }
        renderList();
      });
    });
  }

  async function addFiles(fileList) {
    const alertBox = document.getElementById('pdf-alert');
    clearAlert(alertBox);
    const files = Array.from(fileList);
    if (!files.length) return;

    const errors = [];
    let added = 0;

    for (const file of files) {
      const dup = items.some(function (it) {
        return it.file.name === file.name && it.file.size === file.size && it.file.lastModified === file.lastModified;
      });
      if (dup) { errors.push('"' + file.name + '" is already in the list.'); continue; }
      try {
        const loaded = await loadImage(file);
        items.push({ id: uid(), file: file, img: loaded.img, objectUrl: loaded.url });
        added++;
      } catch (err) { errors.push(err.message); }
    }

    renderList();
    if (errors.length) showAlert(alertBox, 'warning', errors.join(' '));
    else if (added > 0) showAlert(alertBox, 'success', 'Added ' + added + ' image' + (added > 1 ? 's' : '') + '.');
  }

  function resetAll() {
    items.forEach(revokeItem);
    items = [];
    renderList();
    clearAlert(document.getElementById('pdf-alert'));
    clearAlert(document.getElementById('pdf-output-alert'));
    const nameInput = document.getElementById('pdf-name');
    if (nameInput) nameInput.value = 'trailkit-document';
    const fileInput = document.getElementById('pdf-file');
    if (fileInput) fileInput.value = '';
  }

  async function generatePdf() {
    const alertBox = document.getElementById('pdf-alert');
    const outputAlert = document.getElementById('pdf-output-alert');
    clearAlert(alertBox);
    clearAlert(outputAlert);

    if (!items.length) { showAlert(alertBox, 'error', 'Please add at least one image.'); return; }
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
      showAlert(alertBox, 'error', 'PDF library failed to load. Check your internet connection.');
      return;
    }

    const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    const pageSize = document.getElementById('pdf-page-size').value;
    const orientation = document.getElementById('pdf-orientation').value;
    const margin = parseInt(document.getElementById('pdf-margin').value, 10) || 0;
    const nameInput = (document.getElementById('pdf-name').value.trim() || 'trailkit-document');

    const btn = document.getElementById('pdf-generate');
    setLoading(btn, true);

    try {
      let pdf = null;
      const pageDims = { a4: { w: 210, h: 297 }, letter: { w: 215.9, h: 279.4 } };

      for (let i = 0; i < items.length; i++) {
        const img = items[i].img;
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        let pageW, pageH, imgW, imgH;
        if (pageSize === 'fit') {
          // Convert image pixels to mm at 96 DPI (standard CSS pixels)
          const pxToMm = 25.4 / 96;
          pageW = Math.max(1, img.naturalWidth * pxToMm);
          pageH = Math.max(1, img.naturalHeight * pxToMm);
          imgW = pageW;
          imgH = pageH;
        } else {
          const base = pageDims[pageSize] || pageDims.a4;
          const isLandscape = orientation === 'landscape';
          pageW = isLandscape ? base.h : base.w;
          pageH = isLandscape ? base.w : base.h;
          const availW = pageW - margin * 2;
          const availH = pageH - margin * 2;
          const scale = Math.min(availW / img.naturalWidth, availH / img.naturalHeight);
          imgW = img.naturalWidth * scale;
          imgH = img.naturalHeight * scale;
        }

        const orient = pageW > pageH ? 'landscape' : 'portrait';
        const format = pageSize === 'fit' ? [pageW, pageH] : pageSize;

        if (i === 0) pdf = new jsPDFCtor({ orientation: orient, unit: 'mm', format: format });
        else pdf.addPage(format, orient);

        const x = (pageW - imgW) / 2;
        const y = (pageH - imgH) / 2;
        pdf.addImage(dataUrl, 'JPEG', x, y, imgW, imgH);
      }

      const blob = pdf.output('blob');
      downloadBlob(blob, nameInput + '.pdf');
      showAlert(outputAlert, 'success', 'PDF generated with ' + items.length + ' page' + (items.length > 1 ? 's' : '') + ' (' + formatBytes(blob.size) + ').');
    } catch (err) {
      console.error('[TrailKit] PDF error:', err);
      showAlert(alertBox, 'error', 'PDF generation failed: ' + (err.message || 'Unknown error.'));
    } finally {
      setLoading(btn, false);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const page = document.getElementById('pdf-tools-page');
    if (!page) return;

    const fileInput = document.getElementById('pdf-file');
    const dropzone = document.getElementById('pdf-dropzone');

    fileInput.addEventListener('change', function (e) { if (e.target.files.length) addFiles(e.target.files); e.target.value = ''; });

    if (dropzone) {
      ['dragenter', 'dragover'].forEach(function (evt) {
        dropzone.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.add('dragover'); });
      });
      ['dragleave', 'drop'].forEach(function (evt) {
        dropzone.addEventListener(evt, function (e) { e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('dragover'); });
      });
      dropzone.addEventListener('drop', function (e) { if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); });
      dropzone.addEventListener('click', function () { fileInput.click(); });
    }

    document.getElementById('pdf-generate').addEventListener('click', generatePdf);
    document.getElementById('pdf-reset').addEventListener('click', resetAll);
    document.getElementById('pdf-clear').addEventListener('click', resetAll);
  });
})();