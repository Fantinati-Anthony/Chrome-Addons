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
      statusDiv.textContent = 'Preparation de la capture...';
      statusDiv.className = 'status-message info';

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Step 1: Get page info and prepare page
      const pageInfo = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: preparePageForCapture
      });

      const info = pageInfo[0].result;
      const { totalHeight, viewportHeight, viewportWidth, originalScrollY, dpr } = info;

      // Calculate number of captures needed
      const numCaptures = Math.ceil(totalHeight / viewportHeight);
      const captures = [];

      statusDiv.textContent = `Defilement et capture: 0/${numCaptures}`;

      // Step 2: Scroll to top first
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.scrollTo(0, 0)
      });
      await sleep(100);

      // Step 3: Capture each viewport section
      for (let i = 0; i < numCaptures; i++) {
        const targetScrollY = i * viewportHeight;

        // Scroll to position
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (y) => {
            window.scrollTo(0, y);
          },
          args: [targetScrollY]
        });

        // Wait for scroll to complete and content to render
        await sleep(300);

        // Get actual scroll position
        const scrollResult = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.scrollY
        });
        const actualScrollY = scrollResult[0].result;

        // Capture visible area
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

        captures.push({
          dataUrl,
          scrollY: actualScrollY,
          index: i
        });

        statusDiv.textContent = `Defilement et capture: ${i + 1}/${numCaptures}`;
      }

      // Step 4: Restore page state
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: restorePageAfterCapture,
        args: [originalScrollY]
      });

      statusDiv.textContent = 'Assemblage de l\'image finale...';

      // Step 5: Stitch all captures into one image
      const finalImage = await stitchCaptures(captures, viewportWidth, viewportHeight, totalHeight, dpr);

      currentScreenshot = finalImage;
      displayPreview(finalImage);
      statusDiv.textContent = 'Capture page complete reussie!';
      statusDiv.className = 'status-message success';

    } catch (error) {
      console.error('Full page capture error:', error);
      statusDiv.textContent = 'Erreur: ' + error.message;
      statusDiv.className = 'status-message error';

      // Try to restore page state on error
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: restorePageAfterCapture,
          args: [0]
        });
      } catch (e) {
        console.error('Error restoring page state:', e);
      }
    }
  });

  // Capture selected area
  async function captureSelection(tabId, rect) {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
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

// Helper: sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Content script: Prepare page for capture
function preparePageForCapture() {
  // Get dimensions
  const totalHeight = Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.clientHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  );
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;
  const originalScrollY = window.scrollY;
  const dpr = window.devicePixelRatio || 1;

  // Hide fixed/sticky elements
  const fixedElements = [];
  const allElements = document.querySelectorAll('*');
  allElements.forEach(el => {
    const style = window.getComputedStyle(el);
    if (style.position === 'fixed' || style.position === 'sticky') {
      fixedElements.push({
        element: el,
        originalVisibility: el.style.visibility,
        originalDisplay: el.style.display
      });
      el.style.visibility = 'hidden';
    }
  });

  // Store for restoration
  window.__screenshotState = {
    fixedElements,
    originalScrollY
  };

  return {
    totalHeight,
    viewportHeight,
    viewportWidth,
    originalScrollY,
    dpr
  };
}

// Content script: Restore page after capture
function restorePageAfterCapture(scrollY) {
  if (window.__screenshotState) {
    // Restore fixed elements
    window.__screenshotState.fixedElements.forEach(item => {
      item.element.style.visibility = item.originalVisibility;
      item.element.style.display = item.originalDisplay;
    });
    delete window.__screenshotState;
  }
  // Restore scroll position
  window.scrollTo(0, scrollY);
}

// Content script function for selection
function initSelectionCapture() {
  const existingOverlay = document.getElementById('screenshot-selection-overlay');
  if (existingOverlay) existingOverlay.remove();

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

  const selectionBox = document.createElement('div');
  selectionBox.style.cssText = `
    position: fixed;
    border: 2px dashed #fff;
    background: rgba(66, 133, 244, 0.2);
    pointer-events: none;
    display: none;
  `;
  overlay.appendChild(selectionBox);

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

// Stitch captures into final image
async function stitchCaptures(captures, viewportWidth, viewportHeight, totalHeight, dpr) {
  // Load all images first
  const images = await Promise.all(captures.map(cap => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ img, scrollY: cap.scrollY, index: cap.index });
      img.onerror = reject;
      img.src = cap.dataUrl;
    });
  }));

  // Create final canvas
  const canvas = document.createElement('canvas');
  const canvasWidth = Math.round(viewportWidth * dpr);
  const canvasHeight = Math.round(totalHeight * dpr);
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Sort images by scroll position
  images.sort((a, b) => a.scrollY - b.scrollY);

  // Draw each capture at its correct position
  for (let i = 0; i < images.length; i++) {
    const { img, scrollY } = images[i];
    const isLast = i === images.length - 1;

    // Calculate destination Y position
    const destY = Math.round(scrollY * dpr);

    // Calculate how much of this capture to use
    let sourceHeight = img.height;
    let sourceY = 0;
    let drawHeight = sourceHeight;

    if (isLast) {
      // For last capture, only draw the remaining height
      const remainingHeight = canvasHeight - destY;
      if (remainingHeight < img.height) {
        // We need to take from the bottom of the capture
        sourceY = img.height - remainingHeight;
        sourceHeight = remainingHeight;
        drawHeight = remainingHeight;
      }
    } else {
      // For non-last captures, draw full viewport height
      drawHeight = Math.min(img.height, canvasHeight - destY);
      sourceHeight = drawHeight;
    }

    ctx.drawImage(
      img,
      0, sourceY, img.width, sourceHeight,
      0, destY, canvasWidth, drawHeight
    );
  }

  return canvas.toDataURL('image/png');
}
