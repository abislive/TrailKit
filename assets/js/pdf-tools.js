/* ==========================================================================
   TrailKit — Images to PDF
   Uses jsPDF (loaded from CDN in the HTML page).
   All processing happens locally in the browser.
   ========================================================================== */

(function () {
  'use strict';

  const $ = window.TrailKit.$;
  const showAlert = window.TrailKit.showAlert;
  const clearAlert = window.TrailKit.clearAlert;
  const formatBytes = window.TrailKit.formatBytes;
  const downloadBlob = window.TrailKit.downloadBlob;

  let items = []; // { id, file, img, objectUrl }

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  function revokeItem(item) {
    if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
    item.objectUrl = null;
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error(`"${file.name}" is not a supported image file.`));
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        reject(new Error(`"${file.name}" is larger than 25 MB.`));
        return;
      }
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => resolve({ img, url });
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error(`Could not load "${file.name}". The file may be corrupted.`));
      };
      img.src = url;
    });
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

    grid.innerHTML = items.map((item, i) => `
      <div class="image-item" data-id="${item.id}">
        <span class="image-item-index">${i + 1}</span>
        <img src="${item.objectUrl}" alt="Image ${i + 1} preview">
        <div class="image-item-actions">
          <button type="button" data-action="up" data-id="${item.id}" aria-label="Move image ${i + 1} up" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button type="button" data-action="down" data-id="${item.id}" aria-label="Move image ${i + 1} down" ${i === items.length - 1 ? 'disabled' : ''}>↓</button>
          <button type="button" data-action="remove" data-id="${item.id}" aria-label="Remove image ${i + 1}">✕</button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const idx = items.findIndex(it => it.id === id);
        if (idx === -1) return;
        const action = btn.dataset.action;
        if (action === 'up' && idx > 0) {
          [items[idx - 1], items[idx]] = [items[idx], items[idx - 1]];
        } else if (action === 'down' && idx < items.length - 1) {
          [items[idx + 1], items[idx]] = [items[idx], items[idx + 1]];
        } else if (action === 'remove') {
          revokeItem(items[idx]);
          items.splice(idx, 1);
        }
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
      // Skip duplicates by name + size + lastModified
      const dup = items.some(it =>
        it.file.name === file.name &&
        it.file.size === file.size &&
        it.file.lastModified === file.lastModified
      );
      if (dup) {
        errors.push(`"${file.name}" is already in the list (duplicate skipped).`);
        continue;
      }
      try {
        const { img, url } = await loadImage(file);
        items.push({ id: uid(), file, img, objectUrl: url });
        added++;
      } catch (err) {
        errors.push(err.message);
      }
    }

    renderList();

    if (errors.length) {
      showAlert(alertBox, 'warning', errors.map(e => escapeHtml(e)).join('<br>'));
    } else if (added > 0) {
      showAlert(alertBox, 'success', `Added ${added} image${added > 1 ? 's' : ''}.`);
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, s => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[s]));
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

    if (!items.length) {
      showAlert(alertBox, 'error', 'Please add at least one image before generating a PDF.');
      return;
    }
    if (typeof window.jspdf === 'undefined' && typeof window.jsPDF === 'undefined') {
      showAlert(alertBox, 'error', 'PDF library (jsPDF) failed to load. Please check your internet connection and reload the page.');
      return;
    }

    const { jsPDF } = window.jspdf || window;
    const pageSize = document.getElementById('pdf-page-size').value;
    const orientation = document.getElementById('pdf-orientation').value;
    const margin = parseInt(document.getElementById('pdf-margin').value, 10) || 0;
    const nameInput = document.getElementById('pdf-name').value.trim() || 'trailkit-document';

    const btn = document.getElementById('pdf-generate');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      let pdf = null;
      const pageDims = {
        a4: { w: 210, h: 297 },
        letter: { w: 215.9, h: 279.4 },
        fit: null
      };

      for (let i = 0; i < items.length; i++) {
        const { img } = items[i];

        // Use a canvas to normalize image (handles formats like WebP not directly supported by jsPDF)
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

        let pageW, pageH, imgW, imgH;

        if (pageSize === 'fit') {
          // Page matches image aspect ratio, in points (1 px = 0.75 pt at 96dpi)
          pageW = Math.max(1, img.naturalWidth * 0.75);
          pageH = Math.max(1, img.naturalHeight * 0.75);
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

        if (i === 0) {
          pdf = new jsPDF({ orientation: orient, unit: 'mm', format: format });
        } else {
          pdf.addPage(format, orient);
        }

        const x = (pageW - imgW) / 2;
        const y = (pageH - imgH) / 2;
        pdf.addImage(dataUrl, 'JPEG', x, y, imgW, imgH);
      }

      const blob = pdf.output('blob');
      downloadBlob(blob, `${nameInput}.pdf`);
      showAlert(outputAlert, 'success', `PDF generated with ${items.length} page${items.length > 1 ? 's' : ''} (${formatBytes(blob.size)}).`);
    } catch (err) {
      showAlert(alertBox, 'error', 'PDF generation failed: ' + (err.message || 'Unknown error.'));
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.getElementById('pdf-tools-page');
    if (!page) return;

    const fileInput = document.getElementById('pdf-file');
    const dropzone = document.getElementById('pdf-dropzone');

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) addFiles(e.target.files);
      e.target.value = '';
    });

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
      dropzone.addEventListener('drop', (e) => {
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
      });
      dropzone.addEventListener('click', () => fileInput.click());
    }

    document.getElementById('pdf-generate').addEventListener('click', generatePdf);
    document.getElementById('pdf-reset').addEventListener('click', resetAll);
    document.getElementById('pdf-clear').addEventListener('click', resetAll);
  });
})();