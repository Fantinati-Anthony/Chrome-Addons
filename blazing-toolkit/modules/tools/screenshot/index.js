// Tool: Screenshot Capture
// Capture screenshots of web pages (visible area, selection, element, or full page)

export async function initScreenshot() {
  const visibleBtn = document.getElementById('btn-screenshot-visible');
  const selectionBtn = document.getElementById('btn-screenshot-selection');
  const elementBtn = document.getElementById('btn-screenshot-element');
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

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: initSelectionCapture
      });

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

  // Capture element using scroll and stitch
  elementBtn.addEventListener('click', async () => {
    try {
      statusDiv.textContent = 'Cliquez sur un element a capturer...';
      statusDiv.className = 'status-message info';

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: initElementSelector
      });

      const handleMessage = async (message) => {
        if (message.type === 'screenshot-element-selected') {
          chrome.runtime.onMessage.removeListener(handleMessage);
          await captureElement(tab.id, message.elementRect, statusDiv);
        } else if (message.type === 'screenshot-element-cancelled') {
          chrome.runtime.onMessage.removeListener(handleMessage);
          statusDiv.textContent = 'Selection annulee';
          statusDiv.className = 'status-message info';
        }
      };

      chrome.runtime.onMessage.addListener(handleMessage);
    } catch (error) {
      console.error('Element capture error:', error);
      statusDiv.textContent = 'Erreur: ' + error.message;
      statusDiv.className = 'status-message error';
    }
  });

  // Capture element by scrolling and stitching
  async function captureElement(tabId, elementRect, statusDiv) {
    try {
      statusDiv.textContent = 'Capture element en cours...';
      statusDiv.className = 'status-message info';

      // Get viewport dimensions
      const [{ result: viewport }] = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => ({
          width: window.innerWidth,
          height: window.innerHeight,
          dpr: window.devicePixelRatio || 1,
          scrollX: window.scrollX,
          scrollY: window.scrollY
        })
      });

      const { width: vpWidth, height: vpHeight, dpr } = viewport;
      const { top, left, width, height } = elementRect;

      // If element fits in viewport, just capture and crop
      if (width <= vpWidth && height <= vpHeight) {
        // Scroll to make element visible
        await chrome.scripting.executeScript({
          target: { tabId },
          func: (t, l) => window.scrollTo(l, t),
          args: [top, left]
        });
        await new Promise(r => setTimeout(r, 1100)); // Chrome rate limit: 1 capture/sec

        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

        // Get actual scroll position
        const [{ result: scrollPos }] = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => ({ x: window.scrollX, y: window.scrollY })
        });

        // Crop to element bounds
        const cropRect = {
          x: (left - scrollPos.x) * dpr,
          y: (top - scrollPos.y) * dpr,
          width: width * dpr,
          height: height * dpr
        };

        const croppedImage = await cropImage(dataUrl, cropRect);
        currentScreenshot = croppedImage;
        displayPreview(croppedImage);
        statusDiv.textContent = 'Capture element reussie!';
        statusDiv.className = 'status-message success';
        return;
      }

      // Element is larger than viewport - need to scroll and stitch
      const sectionsX = Math.ceil(width / vpWidth);
      const sectionsY = Math.ceil(height / vpHeight);
      const totalSections = sectionsX * sectionsY;

      // Hide fixed elements
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          window.__screenshotFixedElements = [];
          document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' || style.position === 'sticky') {
              window.__screenshotFixedElements.push({ el, display: el.style.display });
              el.style.display = 'none';
            }
          });
        }
      });

      const captures = [];
      let captureCount = 0;

      for (let y = 0; y < sectionsY; y++) {
        for (let x = 0; x < sectionsX; x++) {
          const scrollX = left + (x * vpWidth);
          const scrollY = top + (y * vpHeight);

          // Scroll to position
          await chrome.scripting.executeScript({
            target: { tabId },
            func: (sx, sy) => window.scrollTo(sx, sy),
            args: [scrollX, scrollY]
          });
          await new Promise(r => setTimeout(r, 1100)); // Chrome rate limit: 1 capture/sec

          // Get actual scroll position
          const [{ result: actualScroll }] = await chrome.scripting.executeScript({
            target: { tabId },
            func: () => ({ x: window.scrollX, y: window.scrollY })
          });

          // Capture visible area
          const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

          // Calculate what portion of this capture belongs to the element
          const captureLeft = Math.max(0, left - actualScroll.x);
          const captureTop = Math.max(0, top - actualScroll.y);
          const captureRight = Math.min(vpWidth, left + width - actualScroll.x);
          const captureBottom = Math.min(vpHeight, top + height - actualScroll.y);

          captures.push({
            dataUrl,
            destX: Math.max(0, actualScroll.x - left),
            destY: Math.max(0, actualScroll.y - top),
            srcX: captureLeft,
            srcY: captureTop,
            srcWidth: captureRight - captureLeft,
            srcHeight: captureBottom - captureTop
          });

          captureCount++;
          statusDiv.textContent = `Capture: ${captureCount}/${totalSections}...`;
        }
      }

      // Restore fixed elements
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          if (window.__screenshotFixedElements) {
            window.__screenshotFixedElements.forEach(({ el, display }) => {
              el.style.display = display || '';
            });
            delete window.__screenshotFixedElements;
          }
        }
      });

      statusDiv.textContent = 'Assemblage...';

      // Stitch captures
      const finalDataUrl = await stitchElementCaptures(captures, width, height, dpr);
      currentScreenshot = finalDataUrl;
      displayPreview(finalDataUrl);
      statusDiv.textContent = 'Capture element reussie!';
      statusDiv.className = 'status-message success';

    } catch (error) {
      console.error('Element capture error:', error);
      statusDiv.textContent = 'Erreur: ' + error.message;
      statusDiv.className = 'status-message error';

      // Restore fixed elements on error
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            if (window.__screenshotFixedElements) {
              window.__screenshotFixedElements.forEach(({ el, display }) => {
                el.style.display = display || '';
              });
              delete window.__screenshotFixedElements;
            }
          }
        });
      } catch (e) { /* ignore */ }
    }
  }

  // Stitch element captures
  async function stitchElementCaptures(captures, width, height, dpr) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');

      let loadedCount = 0;
      const images = [];

      captures.forEach((capture, index) => {
        const img = new Image();
        img.onload = () => {
          images[index] = { img, capture };
          loadedCount++;

          if (loadedCount === captures.length) {
            images.forEach(({ img, capture }) => {
              ctx.drawImage(
                img,
                capture.srcX * dpr, capture.srcY * dpr,
                capture.srcWidth * dpr, capture.srcHeight * dpr,
                capture.destX * dpr, capture.destY * dpr,
                capture.srcWidth * dpr, capture.srcHeight * dpr
              );
            });
            resolve(canvas.toDataURL('image/png'));
          }
        };
        img.onerror = reject;
        img.src = capture.dataUrl;
      });
    });
  }

  // Capture full page using scroll and stitch
  fullPageBtn.addEventListener('click', async () => {
    try {
      statusDiv.textContent = 'Capture page complete en cours...';
      statusDiv.className = 'status-message info';

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Get page dimensions
      const [{ result: dimensions }] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => ({
          scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
          scrollHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight,
          dpr: window.devicePixelRatio || 1
        })
      });

      const { scrollWidth, scrollHeight, viewportWidth, viewportHeight, dpr } = dimensions;
      const totalSections = Math.ceil(scrollHeight / viewportHeight);

      statusDiv.textContent = `Capture: 0/${totalSections} sections...`;

      // Hide fixed elements
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          window.__screenshotFixedElements = [];
          document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' || style.position === 'sticky') {
              window.__screenshotFixedElements.push({ el, display: el.style.display });
              el.style.display = 'none';
            }
          });
        }
      });

      // Scroll to top
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.scrollTo(0, 0)
      });
      await new Promise(r => setTimeout(r, 1100)); // Chrome rate limit: 1 capture/sec

      // Capture each section
      const captures = [];
      for (let i = 0; i < totalSections; i++) {
        const scrollY = i * viewportHeight;

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (y) => window.scrollTo(0, y),
          args: [scrollY]
        });
        await new Promise(r => setTimeout(r, 1100)); // Chrome rate limit: 1 capture/sec

        const [{ result: actualScrollY }] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.scrollY
        });

        const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
        const isLast = i === totalSections - 1;

        captures.push({
          dataUrl,
          scrollY: actualScrollY,
          captureHeight: isLast ? (scrollHeight - scrollY) : viewportHeight,
          isLast
        });

        statusDiv.textContent = `Capture: ${i + 1}/${totalSections} sections...`;
      }

      // Restore fixed elements
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (window.__screenshotFixedElements) {
            window.__screenshotFixedElements.forEach(({ el, display }) => {
              el.style.display = display || '';
            });
            delete window.__screenshotFixedElements;
          }
          window.scrollTo(0, 0);
        }
      });

      statusDiv.textContent = 'Assemblage...';

      const finalDataUrl = await stitchImages(captures, scrollWidth, scrollHeight, viewportHeight, dpr);
      currentScreenshot = finalDataUrl;
      displayPreview(finalDataUrl);
      statusDiv.textContent = 'Capture page complete reussie!';
      statusDiv.className = 'status-message success';

    } catch (error) {
      console.error('Full page capture error:', error);
      statusDiv.textContent = 'Erreur: ' + error.message;
      statusDiv.className = 'status-message error';

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if (window.__screenshotFixedElements) {
              window.__screenshotFixedElements.forEach(({ el, display }) => {
                el.style.display = display || '';
              });
              delete window.__screenshotFixedElements;
            }
          }
        });
      } catch (e) { /* ignore */ }
    }
  });

  // Stitch full page images
  async function stitchImages(captures, pageWidth, pageHeight, viewportHeight, dpr) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = pageWidth * dpr;
      canvas.height = pageHeight * dpr;
      const ctx = canvas.getContext('2d');

      let loadedCount = 0;
      const images = [];

      captures.forEach((capture, index) => {
        const img = new Image();
        img.onload = () => {
          images[index] = { img, capture };
          loadedCount++;

          if (loadedCount === captures.length) {
            images.forEach(({ img, capture }) => {
              const destY = capture.scrollY * dpr;
              const sourceHeight = capture.isLast ? capture.captureHeight * dpr : img.height;

              ctx.drawImage(
                img,
                0, 0, img.width, sourceHeight,
                0, destY, img.width, sourceHeight
              );
            });
            resolve(canvas.toDataURL('image/png'));
          }
        };
        img.onerror = reject;
        img.src = capture.dataUrl;
      });
    });
  }

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

// Content script: Element selector
function initElementSelector() {
  const existingOverlay = document.getElementById('screenshot-element-overlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'screenshot-element-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 2147483646;
    cursor: crosshair;
  `;

  const highlightBox = document.createElement('div');
  highlightBox.id = 'screenshot-highlight-box';
  highlightBox.style.cssText = `
    position: fixed;
    border: 3px solid #4285f4;
    background: rgba(66, 133, 244, 0.1);
    pointer-events: none;
    z-index: 2147483647;
    display: none;
    box-sizing: border-box;
  `;
  document.body.appendChild(highlightBox);

  const instructions = document.createElement('div');
  instructions.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.85);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    font-size: 14px;
    z-index: 2147483648;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  instructions.innerHTML = 'Survolez et cliquez sur l\'element a capturer<br><small style="opacity:0.7">Appuyez sur Echap pour annuler</small>';
  overlay.appendChild(instructions);

  let currentElement = null;

  const handleMouseMove = (e) => {
    overlay.style.pointerEvents = 'none';
    const element = document.elementFromPoint(e.clientX, e.clientY);
    overlay.style.pointerEvents = 'auto';

    if (element && element !== overlay && element !== highlightBox && !overlay.contains(element)) {
      currentElement = element;
      const rect = element.getBoundingClientRect();
      highlightBox.style.display = 'block';
      highlightBox.style.left = rect.left + 'px';
      highlightBox.style.top = rect.top + 'px';
      highlightBox.style.width = rect.width + 'px';
      highlightBox.style.height = rect.height + 'px';
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentElement) return;

    // Get element's absolute position on page (not just viewport)
    const rect = currentElement.getBoundingClientRect();
    const elementRect = {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    };

    cleanup();
    chrome.runtime.sendMessage({ type: 'screenshot-element-selected', elementRect });
  };

  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      cleanup();
      chrome.runtime.sendMessage({ type: 'screenshot-element-cancelled' });
    }
  };

  const cleanup = () => {
    overlay.remove();
    highlightBox.remove();
    document.removeEventListener('keydown', handleKeydown);
  };

  overlay.addEventListener('mousemove', handleMouseMove);
  overlay.addEventListener('click', handleClick);
  document.addEventListener('keydown', handleKeydown);

  document.body.appendChild(overlay);
}

// Content script: Selection capture
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
    const left = Math.min(startX, e.clientX);
    const top = Math.min(startY, e.clientY);
    const width = Math.abs(e.clientX - startX);
    const height = Math.abs(e.clientY - startY);

    selectionBox.style.left = left + 'px';
    selectionBox.style.top = top + 'px';
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
  });

  overlay.addEventListener('mouseup', (e) => {
    if (!isDrawing) return;
    isDrawing = false;

    const rect = {
      x: Math.min(startX, e.clientX) * dpr,
      y: Math.min(startY, e.clientY) * dpr,
      width: Math.abs(e.clientX - startX) * dpr,
      height: Math.abs(e.clientY - startY) * dpr
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

// Crop image to rectangle
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
