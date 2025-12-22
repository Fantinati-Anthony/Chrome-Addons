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

      // Get page dimensions and hide fixed elements
      const pageInfo = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // Get dimensions
          const scrollHeight = Math.max(
            document.documentElement.scrollHeight,
            document.body.scrollHeight
          );
          const scrollWidth = Math.max(
            document.documentElement.scrollWidth,
            document.body.scrollWidth
          );
          const viewportHeight = window.innerHeight;
          const viewportWidth = window.innerWidth;
          const originalScrollX = window.scrollX;
          const originalScrollY = window.scrollY;
          const dpr = window.devicePixelRatio || 1;

          // Hide fixed/sticky elements temporarily
          const fixedElements = [];
          document.querySelectorAll('*').forEach(el => {
            const style = getComputedStyle(el);
            if (style.position === 'fixed' || style.position === 'sticky') {
              fixedElements.push({
                element: el,
                originalDisplay: el.style.display
              });
              el.style.display = 'none';
            }
          });

          // Store reference for cleanup
          window.__screenshotFixedElements = fixedElements;

          return {
            scrollHeight,
            scrollWidth,
            viewportHeight,
            viewportWidth,
            originalScrollX,
            originalScrollY,
            dpr
          };
        }
      });

      const info = pageInfo[0].result;
      const { scrollHeight, viewportHeight, viewportWidth, dpr } = info;

      // Calculate captures needed
      const totalCaptures = Math.ceil(scrollHeight / viewportHeight);
      const captures = [];

      statusDiv.textContent = `Capture de ${totalCaptures} sections...`;

      // Scroll and capture each section
      for (let i = 0; i < totalCaptures; i++) {
        const scrollY = i * viewportHeight;
        const isLastCapture = i === totalCaptures - 1;

        // For last capture, we need to scroll to show the bottom of the page
        const actualScrollY = isLastCapture
          ? Math.max(0, scrollHeight - viewportHeight)
          : scrollY;

        // Scroll to position
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (y) => {
            window.scrollTo({ top: y, left: 0, behavior: 'instant' });
          },
          args: [actualScrollY]
        });

        // Wait for content to render
        await new Promise(resolve => setTimeout(resolve, 200));

        // Capture current view
        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

        // Calculate crop info for this capture
        let cropY = 0;
        let cropHeight = viewportHeight * dpr;

        if (isLastCapture && totalCaptures > 1) {
          // For last capture, only take the bottom portion that wasn't captured before
          const overlap = (totalCaptures * viewportHeight) - scrollHeight;
          cropY = overlap * dpr;
          cropHeight = (viewportHeight - overlap) * dpr;
        }

        captures.push({
          dataUrl,
          cropY,
          cropHeight,
          destY: i === 0 ? 0 : (isLastCapture ? (scrollHeight - (viewportHeight - (cropY / dpr))) * dpr : scrollY * dpr)
        });

        statusDiv.textContent = `Capture ${i + 1}/${totalCaptures}...`;
      }

      // Restore page state
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (origX, origY) => {
          // Restore fixed elements
          if (window.__screenshotFixedElements) {
            window.__screenshotFixedElements.forEach(item => {
              item.element.style.display = item.originalDisplay;
            });
            delete window.__screenshotFixedElements;
          }
          // Restore scroll position
          window.scrollTo(origX, origY);
        },
        args: [info.originalScrollX, info.originalScrollY]
      });

      statusDiv.textContent = 'Assemblage de l\'image...';

      // Stitch all captures into one image
      const finalImage = await stitchFullPageCaptures(captures, viewportWidth * dpr, scrollHeight * dpr, viewportHeight * dpr);

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
          func: () => {
            if (window.__screenshotFixedElements) {
              window.__screenshotFixedElements.forEach(item => {
                item.element.style.display = item.originalDisplay;
              });
              delete window.__screenshotFixedElements;
            }
          }
        });
      } catch (e) {
        console.error('Error restoring page state:', e);
      }
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

// Stitch full page captures into a single image
async function stitchFullPageCaptures(captures, canvasWidth, canvasHeight, viewportHeightPx) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');

    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let loadedCount = 0;
    const images = [];

    if (captures.length === 0) {
      resolve(canvas.toDataURL('image/png'));
      return;
    }

    captures.forEach((capture, index) => {
      const img = new Image();
      img.onload = () => {
        images[index] = img;
        loadedCount++;

        if (loadedCount === captures.length) {
          // Draw all images in order
          let currentY = 0;

          for (let i = 0; i < captures.length; i++) {
            const cap = captures[i];
            const sourceImg = images[i];

            if (i === captures.length - 1 && captures.length > 1) {
              // Last capture - only draw the non-overlapping bottom portion
              const heightToDraw = canvasHeight - currentY;
              const sourceY = sourceImg.height - heightToDraw;

              ctx.drawImage(
                sourceImg,
                0, Math.max(0, sourceY), sourceImg.width, heightToDraw,
                0, currentY, canvasWidth, heightToDraw
              );
            } else {
              // First or middle captures - draw full viewport
              const heightToDraw = Math.min(viewportHeightPx, canvasHeight - currentY);

              ctx.drawImage(
                sourceImg,
                0, 0, sourceImg.width, heightToDraw,
                0, currentY, canvasWidth, heightToDraw
              );

              currentY += heightToDraw;
            }
          }

          resolve(canvas.toDataURL('image/png'));
        }
      };
      img.onerror = () => {
        console.error('Failed to load image:', index);
        reject(new Error('Failed to load capture ' + index));
      };
      img.src = capture.dataUrl;
    });
  });
}
