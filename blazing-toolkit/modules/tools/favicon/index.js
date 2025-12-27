// Tool: Favicon Extractor
// Extract and check favicons from websites

export async function initFavicon() {
  const previewDiv = document.getElementById('favicon-current');
  const extractBtn = document.getElementById('btn-extract-favicon');
  const resultsDiv = document.getElementById('favicon-results');
  const generateBtn = document.getElementById('btn-generate-favicon');

  // Import section elements
  const importInput = document.getElementById('favicon-import-input');
  const dropZone = document.getElementById('favicon-drop-zone');
  const importPreview = document.getElementById('favicon-import-preview');
  const generatedDiv = document.getElementById('favicon-generated');
  const downloadActions = document.getElementById('favicon-download-actions');
  const downloadAllPngBtn = document.getElementById('btn-download-all-png');
  const downloadIcoBtn = document.getElementById('btn-download-ico');

  // Store all generated favicons (array of objects with fileName and favicons)
  let allGeneratedFavicons = [];

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.favIconUrl) {
      previewDiv.innerHTML = `<img src="${tab.favIconUrl}" style="width:32px;height:32px;"> <img src="${tab.favIconUrl}" style="width:48px;height:48px;">`;
    } else {
      previewDiv.innerHTML = '<div class="status-message info">Aucun favicon detecte</div>';
    }
  } catch (e) {
    previewDiv.innerHTML = '<div class="status-message error">Erreur</div>';
  }

  extractBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const domain = new URL(tab.url).origin;
      const sizes = [16, 32, 48, 64, 128];
      resultsDiv.innerHTML = sizes.map(size => `
        <div class="favicon-size-item" data-url="https://www.google.com/s2/favicons?domain=${domain}&sz=${size}">
          <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=${size}" width="${Math.min(size, 48)}">
          <span>${size}x${size}</span>
        </div>
      `).join('');

      resultsDiv.querySelectorAll('.favicon-size-item').forEach(item => {
        item.addEventListener('click', () => window.open(item.dataset.url, '_blank'));
      });
    } catch (e) {
      resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });

  generateBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.create({ url: `https://realfavicongenerator.net/favicon_checker?site=${encodeURIComponent(tab.url)}` });
  });

  // Image import functionality
  dropZone.addEventListener('click', () => importInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    if (files.length > 0) {
      processImages(files);
    }
  });

  importInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      processImages(files);
    }
  });

  async function processImages(files) {
    // Clear previous results
    allGeneratedFavicons = [];
    importPreview.innerHTML = '';
    generatedDiv.innerHTML = '';

    // Process each file
    for (const file of files) {
      await processImage(file);
    }

    // Show download buttons if we have results
    if (allGeneratedFavicons.length > 0) {
      downloadActions.style.display = 'flex';
    }
  }

  function processImage(file) {
    return new Promise((resolve) => {
      const originalFileName = file.name.replace(/\.[^/.]+$/, '') || 'favicon';

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Add preview of original image
          const previewItem = document.createElement('div');
          previewItem.className = 'favicon-import-preview-item';
          previewItem.innerHTML = `<img src="${e.target.result}" alt="${originalFileName}"><span>${originalFileName}</span>`;
          importPreview.appendChild(previewItem);

          // Generate favicons in different sizes
          const sizes = [16, 32, 48, 64, 128, 180, 192, 512];
          const favicons = [];

          // Create a collapsible group for this image
          const groupDiv = document.createElement('div');
          groupDiv.className = 'favicon-group collapsed';

          const headerDiv = document.createElement('div');
          headerDiv.className = 'favicon-group-header';
          headerDiv.innerHTML = `<span class="favicon-group-toggle">▶</span><span class="favicon-group-title">${originalFileName}</span><span class="favicon-group-count">${sizes.length} tailles</span>`;

          const itemsDiv = document.createElement('div');
          itemsDiv.className = 'favicon-group-items';

          // Toggle collapse on header click
          headerDiv.addEventListener('click', () => {
            groupDiv.classList.toggle('collapsed');
          });

          groupDiv.appendChild(headerDiv);
          groupDiv.appendChild(itemsDiv);

          sizes.forEach(size => {
            const dataUrl = resizeImage(img, size);
            favicons.push({ size, dataUrl, fileName: originalFileName });

            const itemDiv = document.createElement('div');
            itemDiv.className = 'favicon-size-item downloadable';
            itemDiv.dataset.size = size;
            itemDiv.dataset.url = dataUrl;
            itemDiv.dataset.filename = originalFileName;
            itemDiv.innerHTML = `<img src="${dataUrl}" width="${Math.min(size, 48)}"><span>${size}x${size}</span>`;
            itemDiv.addEventListener('click', () => {
              downloadFile(dataUrl, `${originalFileName}-${size}x${size}.png`);
            });
            itemsDiv.appendChild(itemDiv);
          });

          generatedDiv.appendChild(groupDiv);
          allGeneratedFavicons.push({ fileName: originalFileName, favicons });

          resolve();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function resizeImage(img, size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Calculate aspect ratio to maintain proportions
    const aspectRatio = img.width / img.height;
    let drawWidth, drawHeight, offsetX, offsetY;

    if (aspectRatio > 1) {
      // Wider than tall
      drawHeight = size;
      drawWidth = size * aspectRatio;
      offsetX = (size - drawWidth) / 2;
      offsetY = 0;
    } else {
      // Taller than wide or square
      drawWidth = size;
      drawHeight = size / aspectRatio;
      offsetX = 0;
      offsetY = (size - drawHeight) / 2;
    }

    // Fill with transparent background
    ctx.clearRect(0, 0, size, size);

    // Draw centered and scaled image (crop to square)
    const sourceSize = Math.min(img.width, img.height);
    const sourceX = (img.width - sourceSize) / 2;
    const sourceY = (img.height - sourceSize) / 2;
    ctx.drawImage(img, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

    return canvas.toDataURL('image/png');
  }

  function downloadFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  downloadAllPngBtn.addEventListener('click', async () => {
    for (const group of allGeneratedFavicons) {
      for (let i = 0; i < group.favicons.length; i++) {
        const { size, dataUrl, fileName } = group.favicons[i];
        downloadFile(dataUrl, `${fileName}-${size}x${size}.png`);
        // Small delay between downloads to avoid browser conflicts
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }
  });

  downloadIcoBtn.addEventListener('click', async () => {
    for (const group of allGeneratedFavicons) {
      const icoSizes = group.favicons.filter(f => [16, 32, 48].includes(f.size));
      const icoBlob = await createIcoFile(icoSizes);
      const url = URL.createObjectURL(icoBlob);
      downloadFile(url, `${group.fileName}.ico`);
      URL.revokeObjectURL(url);
      // Small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  });

  async function createIcoFile(favicons) {
    // ICO file format implementation
    const images = await Promise.all(
      favicons.map(async ({ size, dataUrl }) => {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        return { size, data: new Uint8Array(arrayBuffer) };
      })
    );

    // Calculate total size
    const headerSize = 6;
    const dirEntrySize = 16;
    const numImages = images.length;
    let offset = headerSize + (dirEntrySize * numImages);

    const entries = [];
    const imageData = [];

    for (const img of images) {
      entries.push({
        width: img.size === 256 ? 0 : img.size,
        height: img.size === 256 ? 0 : img.size,
        colorCount: 0,
        reserved: 0,
        planes: 1,
        bitCount: 32,
        size: img.data.length,
        offset: offset
      });
      imageData.push(img.data);
      offset += img.data.length;
    }

    // Create ICO buffer
    const totalSize = offset;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // ICO header
    view.setUint16(0, 0, true); // Reserved
    view.setUint16(2, 1, true); // Type (1 = ICO)
    view.setUint16(4, numImages, true); // Number of images

    // Directory entries
    let pos = 6;
    for (const entry of entries) {
      view.setUint8(pos, entry.width);
      view.setUint8(pos + 1, entry.height);
      view.setUint8(pos + 2, entry.colorCount);
      view.setUint8(pos + 3, entry.reserved);
      view.setUint16(pos + 4, entry.planes, true);
      view.setUint16(pos + 6, entry.bitCount, true);
      view.setUint32(pos + 8, entry.size, true);
      view.setUint32(pos + 12, entry.offset, true);
      pos += 16;
    }

    // Image data
    const uint8View = new Uint8Array(buffer);
    for (const data of imageData) {
      uint8View.set(data, pos);
      pos += data.length;
    }

    return new Blob([buffer], { type: 'image/x-icon' });
  }
}
