// Tool: Screenshot Capture
// Capture screenshots of web pages (visible area, selection, or full page)

export async function initScreenshot() {
  const visibleBtn = document.getElementById('btn-screenshot-visible');
  const selectionBtn = document.getElementById('btn-screenshot-selection');
  const fullPageBtn = document.getElementById('btn-screenshot-fullpage');
  const previewContainer = document.getElementById('screenshot-preview');
  const downloadBtn = document.getElementById('btn-download-screenshot');
  const copyBtn = document.getElementById('btn-copy-screenshot');
  const statusDiv = document.getElementById('screenshot-status');

  let currentScreenshot = null;

  // Capture visible area
  visibleBtn.addEventListener('click', async () => {
    try {
      statusDiv.textContent = '';
      statusDiv.className = 'status-message info';
      statusDiv.textContent = 'Capture en cours...';

      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      currentScreenshot = dataUrl;
      displayPreview(dataUrl);
      statusDiv.textContent = 'Capture reussie!';
      statusDiv.className = 'status-message success';
    } catch (error) {
      console.error('Screenshot error:', error);
      statusDiv.textContent = 'Erreur: ' + error.message;
      statusDiv.className = 'status-message error';
    }
  });

  // Capture selection (user draws a rectangle)
  selectionBtn.addEventListener('click', async () => {
    try {
      statusDiv.textContent = 'Selectionnez une zone sur la page...';
      statusDiv.className = 'status-message info';

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Inject selection overlay script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: initSelectionCapture
      });

      // Listen for selection result
      const handleMessage = (message) => {
        if (message.type === 'screenshot-selection-complete') {
          chrome.runtime.onMessage.removeListener(handleMessage);
          captureSelection(tab.id, message.rect);
        } else if (message.type === 'screenshot-selection-cancelled') {
          chrome.runtime.onMessage.removeListener(handleMessage);
          statusDiv.textContent = 'Selection annulee';
          statusDiv.className = 'status-message info';
        }
      };

      chrome.runtime.onMessage.addListener(handleMessage);
    } catch (error) {
      console.error('Selection error:', error);
      statusDiv.textContent = 'Erreur: ' + error.message;
      statusDiv.className = 'status-message error';
    }
  });

  // Capture full page (scroll and stitch)
  fullPageBtn.addEventListener('click', async () => {
    try {
      statusDiv.textContent = 'Capture de la page complete...';
      statusDiv.className = 'status-message info';

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Get page dimensions
      const dimensions = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          return {
            scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
            scrollHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
            scrollX: window.scrollX,
            scrollY: window.scrollY,
            devicePixelRatio: window.devicePixelRatio || 1
          };
        }
      });

      const dim = dimensions[0].result;
      const dpr = dim.devicePixelRatio;

      // Calculate number of captures needed
      const numRows = Math.ceil(dim.scrollHeight / dim.viewportHeight);
      const captures = [];

      // Save original scroll position
      const originalScroll = { x: dim.scrollX, y: dim.scrollY };

      for (let row = 0; row < numRows; row++) {
        const scrollY = row * dim.viewportHeight;
        const remainingHeight = dim.scrollHeight - scrollY;
        const captureHeight = Math.min(dim.viewportHeight, remainingHeight);

        // Scroll to position
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (y) => window.scrollTo(0, y),
          args: [scrollY]
        });

        // Wait for scroll and render
        await new Promise(resolve => setTimeout(resolve, 150));

        // Capture visible area
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

        captures.push({
          dataUrl,
          y: scrollY,
          height: captureHeight,
          isLast: row === numRows - 1
        });

        statusDiv.textContent = `Capture ${row + 1}/${numRows}...`;
      }

      // Restore original scroll position
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (x, y) => window.scrollTo(x, y),
        args: [originalScroll.x, originalScroll.y]
      });

      // Stitch images together
      const stitchedImage = await stitchImages(captures, dim.viewportWidth, dim.scrollHeight, dpr);
      currentScreenshot = stitchedImage;
      displayPreview(stitchedImage);
      statusDiv.textContent = 'Capture page complete reussie!';
      statusDiv.className = 'status-message success';

    } catch (error) {
      console.error('Full page capture error:', error);
      statusDiv.textContent = 'Erreur: ' + error.message;
      statusDiv.className = 'status-message error';
    }
  });

  // Capture selected area
  async function captureSelection(tabId, rect) {
    try {
      // First capture the visible area
      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

      // Crop to selection
      const croppedImage = await cropImage(dataUrl, rect);
      currentScreenshot = croppedImage;
      displayPreview(croppedImage);
      statusDiv.textContent = 'Capture de selection reussie!';
      statusDiv.className = 'status-message success';
    } catch (error) {
      console.error('Crop error:', error);
      statusDiv.textContent = 'Erreur: ' + error.message;
      statusDiv.className = 'status-message error';
    }
  }

  // Display preview
  function displayPreview(dataUrl) {
    previewContainer.innerHTML = '';
    const img = document.createElement('img');
    img.src = dataUrl;
    img.style.maxWidth = '100%';
    img.style.maxHeight = '300px';
    img.style.borderRadius = '8px';
    img.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    previewContainer.appendChild(img);
    downloadBtn.disabled = false;
    copyBtn.disabled = false;
  }

  // Download screenshot
  downloadBtn.addEventListener('click', () => {
    if (!currentScreenshot) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const a = document.createElement('a');
    a.href = currentScreenshot;
    a.download = `screenshot-${timestamp}.png`;
    a.click();
  });

  // Copy to clipboard
  copyBtn.addEventListener('click', async () => {
    if (!currentScreenshot) return;

    try {
      const blob = await (await fetch(currentScreenshot)).blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      copyBtn.textContent = 'Copie!';
      setTimeout(() => { copyBtn.textContent = 'Copier'; }, 1500);
    } catch (error) {
      statusDiv.textContent = 'Erreur de copie: ' + error.message;
      statusDiv.className = 'status-message error';
    }
  });

  // Disable buttons initially
  downloadBtn.disabled = true;
  copyBtn.disabled = true;
}

// Content script function for selection
function initSelectionCapture() {
  // Remove existing overlay if any
  const existingOverlay = document.getElementById('screenshot-selection-overlay');
  if (existingOverlay) existingOverlay.remove();

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'screenshot-selection-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.3);
    cursor: crosshair;
    z-index: 2147483647;
  `;

  // Selection box
  const selectionBox = document.createElement('div');
  selectionBox.style.cssText = `
    position: fixed;
    border: 2px dashed #fff;
    background: rgba(66, 133, 244, 0.2);
    pointer-events: none;
    display: none;
  `;
  overlay.appendChild(selectionBox);

  // Instructions
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px 20px;
    border-radius: 8px;
    font-family: sans-serif;
    font-size: 14px;
    z-index: 2147483648;
  `;
  instructions.textContent = 'Dessinez un rectangle pour capturer. Appuyez sur Echap pour annuler.';
  overlay.appendChild(instructions);

  let isDrawing = false;
  let startX, startY;
  const dpr = window.devicePixelRatio || 1;

  overlay.addEventListener('mousedown', (e) => {
    isDrawing = true;
    startX = e.clientX;
    startY = e.clientY;
    selectionBox.style.display = 'block';
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.width = '0';
    selectionBox.style.height = '0';
  });

  overlay.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const currentX = e.clientX;
    const currentY = e.clientY;

    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  });

  overlay.addEventListener('mouseup', (e) => {
    if (!isDrawing) return;
    isDrawing = false;

    const endX = e.clientX;
    const endY = e.clientY;

    const rect = {
      x: Math.min(startX, endX) * dpr,
      y: Math.min(startY, endY) * dpr,
      width: Math.abs(endX - startX) * dpr,
      height: Math.abs(endY - startY) * dpr
    };

    overlay.remove();

    if (rect.width > 10 && rect.height > 10) {
      chrome.runtime.sendMessage({ type: 'screenshot-selection-complete', rect });
    } else {
      chrome.runtime.sendMessage({ type: 'screenshot-selection-cancelled' });
    }
  });

  // Cancel on Escape
  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      overlay.remove();
      document.removeEventListener('keydown', handleKeydown);
      chrome.runtime.sendMessage({ type: 'screenshot-selection-cancelled' });
    }
  };
  document.addEventListener('keydown', handleKeydown);

  document.body.appendChild(overlay);
}

// Crop image to selection rectangle
async function cropImage(dataUrl, rect) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = rect.width;
      canvas.height = rect.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

// Stitch multiple screenshots together for full page capture
async function stitchImages(captures, viewportWidth, totalHeight, dpr) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = viewportWidth * dpr;
    canvas.height = totalHeight * dpr;
    const ctx = canvas.getContext('2d');

    let loadedCount = 0;
    const images = [];

    captures.forEach((capture, index) => {
      const img = new Image();
      img.onload = () => {
        images[index] = img;
        loadedCount++;

        if (loadedCount === captures.length) {
          // Draw all images
          let currentY = 0;
          captures.forEach((cap, i) => {
            const sourceHeight = cap.isLast ?
              (cap.height * dpr) :
              (images[i].height);

            const sourceY = cap.isLast ?
              (images[i].height - cap.height * dpr) :
              0;

            ctx.drawImage(
              images[i],
              0, sourceY, images[i].width, sourceHeight,
              0, currentY, canvas.width, sourceHeight
            );

            currentY += cap.height * dpr;
          });

          resolve(canvas.toDataURL('image/png'));
        }
      };
      img.onerror = reject;
      img.src = capture.dataUrl;
    });
  });
}
