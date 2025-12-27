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

  // Store all generated favicons (array of objects with fileName, favicons, and options)
  let allGeneratedFavicons = [];
  // Store image data for regeneration
  let imageDataStore = [];

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
    imageDataStore = [];
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
      const imageIndex = imageDataStore.length;

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Store image data for regeneration
          imageDataStore.push({
            img: img,
            fileName: originalFileName,
            bgColor: '',
            borderRadius: 0
          });

          // Add preview of original image
          const previewItem = document.createElement('div');
          previewItem.className = 'favicon-import-preview-item';
          previewItem.innerHTML = `<img src="${e.target.result}" alt="${originalFileName}"><span>${originalFileName}</span>`;
          importPreview.appendChild(previewItem);

          // Generate favicons in different sizes
          const sizes = [16, 32, 48, 64, 128, 180, 192, 512];

          // Create a collapsible group for this image
          const groupDiv = document.createElement('div');
          groupDiv.className = 'favicon-group collapsed';
          groupDiv.dataset.index = imageIndex;

          const headerDiv = document.createElement('div');
          headerDiv.className = 'favicon-group-header';
          headerDiv.innerHTML = `<span class="favicon-group-toggle">▶</span><span class="favicon-group-title">${originalFileName}</span><span class="favicon-group-count">${sizes.length} tailles</span>`;

          // Options container
          const optionsDiv = document.createElement('div');
          optionsDiv.className = 'favicon-group-options';
          optionsDiv.innerHTML = `
            <div class="favicon-option">
              <label data-i18n="favicon.bgColor">Couleur de fond</label>
              <div class="favicon-option-row">
                <input type="checkbox" class="favicon-bg-enabled" title="Activer la couleur de fond">
                <input type="color" class="favicon-bg-color" value="#ffffff" disabled>
              </div>
            </div>
            <div class="favicon-option">
              <label data-i18n="favicon.borderRadius">Border radius</label>
              <div class="favicon-option-row">
                <input type="range" class="favicon-border-radius" min="0" max="50" value="0">
                <span class="favicon-radius-value">0%</span>
              </div>
            </div>
          `;

          const itemsDiv = document.createElement('div');
          itemsDiv.className = 'favicon-group-items';

          // Toggle collapse on header click
          headerDiv.addEventListener('click', (e) => {
            if (!e.target.closest('.favicon-group-options')) {
              groupDiv.classList.toggle('collapsed');
            }
          });

          // Options event listeners
          const bgEnabledCheckbox = optionsDiv.querySelector('.favicon-bg-enabled');
          const bgColorInput = optionsDiv.querySelector('.favicon-bg-color');
          const borderRadiusInput = optionsDiv.querySelector('.favicon-border-radius');
          const radiusValueSpan = optionsDiv.querySelector('.favicon-radius-value');

          bgEnabledCheckbox.addEventListener('change', () => {
            bgColorInput.disabled = !bgEnabledCheckbox.checked;
            imageDataStore[imageIndex].bgColor = bgEnabledCheckbox.checked ? bgColorInput.value : '';
            regenerateFavicons(imageIndex, groupDiv, sizes);
          });

          bgColorInput.addEventListener('input', () => {
            if (bgEnabledCheckbox.checked) {
              imageDataStore[imageIndex].bgColor = bgColorInput.value;
              regenerateFavicons(imageIndex, groupDiv, sizes);
            }
          });

          borderRadiusInput.addEventListener('input', () => {
            const value = parseInt(borderRadiusInput.value);
            radiusValueSpan.textContent = `${value}%`;
            imageDataStore[imageIndex].borderRadius = value;
            regenerateFavicons(imageIndex, groupDiv, sizes);
          });

          // Prevent options clicks from toggling collapse
          optionsDiv.addEventListener('click', (e) => {
            e.stopPropagation();
          });

          groupDiv.appendChild(headerDiv);
          groupDiv.appendChild(optionsDiv);
          groupDiv.appendChild(itemsDiv);

          // Generate initial favicons
          generateFaviconsForGroup(imageIndex, itemsDiv, sizes);

          generatedDiv.appendChild(groupDiv);

          resolve();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function generateFaviconsForGroup(imageIndex, itemsDiv, sizes) {
    const imageData = imageDataStore[imageIndex];
    const favicons = [];

    itemsDiv.innerHTML = '';

    sizes.forEach(size => {
      const dataUrl = resizeImage(imageData.img, size, imageData.bgColor, imageData.borderRadius);
      favicons.push({ size, dataUrl, fileName: imageData.fileName });

      const itemDiv = document.createElement('div');
      itemDiv.className = 'favicon-size-item downloadable';
      itemDiv.dataset.size = size;
      itemDiv.dataset.url = dataUrl;
      itemDiv.dataset.filename = imageData.fileName;
      itemDiv.innerHTML = `<img src="${dataUrl}" width="${Math.min(size, 48)}"><span>${size}x${size}</span>`;
      itemDiv.addEventListener('click', () => {
        downloadFile(dataUrl, `${imageData.fileName}-${size}x${size}.png`);
      });
      itemsDiv.appendChild(itemDiv);
    });

    // Update allGeneratedFavicons
    const existingIndex = allGeneratedFavicons.findIndex(g => g.fileName === imageData.fileName);
    if (existingIndex >= 0) {
      allGeneratedFavicons[existingIndex].favicons = favicons;
    } else {
      allGeneratedFavicons.push({ fileName: imageData.fileName, favicons });
    }
  }

  function regenerateFavicons(imageIndex, groupDiv, sizes) {
    const itemsDiv = groupDiv.querySelector('.favicon-group-items');
    generateFaviconsForGroup(imageIndex, itemsDiv, sizes);
  }

  function resizeImage(img, size, bgColor = '', borderRadius = 0) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Calculate border radius in pixels
    const radiusPx = (borderRadius / 100) * (size / 2);

    // Draw background with border radius if color is set
    if (bgColor) {
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, radiusPx);
      ctx.fillStyle = bgColor;
      ctx.fill();
    }

    // Create clipping path for border radius
    if (borderRadius > 0) {
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, radiusPx);
      ctx.clip();
    }

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
