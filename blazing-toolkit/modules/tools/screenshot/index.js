// Tool: Screenshot Capture
// Capture screenshots of web pages (visible area, selection, element, or full page)

// Rate-limited capture with retry logic
let lastCaptureTime = 0;
const MIN_CAPTURE_INTERVAL = 1500; // 1.5 seconds between captures

async function rateLimitedCapture() {
  const now = Date.now();
  const timeSinceLastCapture = now - lastCaptureTime;

  if (timeSinceLastCapture < MIN_CAPTURE_INTERVAL) {
    await new Promise(r => setTimeout(r, MIN_CAPTURE_INTERVAL - timeSinceLastCapture));
  }

  // Retry logic for rate limit errors
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      lastCaptureTime = Date.now();
      return dataUrl;
    } catch (error) {
      if (error.message.includes('MAX_CAPTURE') && attempt < 2) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1))); // 2s, 4s backoff
        continue;
      }
      throw error;
    }
  }
}

// Show loader overlay on page
async function showPageLoader(tabId, message = 'Capture en cours...', current = null, total = null) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: (msg, cur, tot) => {
      let loader = document.getElementById('screenshot-page-loader');
      if (!loader) {
        loader = document.createElement('div');
        loader.id = 'screenshot-page-loader';
        loader.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        document.body.appendChild(loader);
      }

      const progress = cur && tot ? `<div style="font-size: 14px; color: #888; margin-top: 8px;">Section ${cur}/${tot}</div>` : '';

      loader.innerHTML = `
        <div style="
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255,255,255,0.1);
          border-top-color: #4285f4;
          border-radius: 50%;
          animation: screenshot-spin 1s linear infinite;
        "></div>
        <div style="color: white; font-size: 18px; margin-top: 20px; text-align: center;">
          ${msg}
        </div>
        ${progress}
        <div style="color: #888; font-size: 13px; margin-top: 15px;">
          Merci de ne rien toucher
        </div>
        <style>
          @keyframes screenshot-spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;
      loader.style.display = 'flex';
    },
    args: [message, current, total]
  });
}

// Hide loader overlay on page
async function hidePageLoader(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const loader = document.getElementById('screenshot-page-loader');
      if (loader) {
        loader.style.display = 'none';
      }
    }
  });
}

// Remove loader overlay completely
async function removePageLoader(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const loader = document.getElementById('screenshot-page-loader');
      if (loader) {
        loader.remove();
      }
    }
  });
}

export async function initScreenshot() {
  const visibleBtn = document.getElementById('btn-screenshot-visible');
  const selectionBtn = document.getElementById('btn-screenshot-selection');
  const elementBtn = document.getElementById('btn-screenshot-element');
  const fullPageBtn = document.getElementById('btn-screenshot-fullpage');
  const markdownBtn = document.getElementById('btn-screenshot-markdown');
  const previewContainer = document.getElementById('screenshot-preview');
  const markdownOutput = document.getElementById('markdown-output');
  const markdownResult = document.getElementById('markdown-result');
  const downloadBtn = document.getElementById('btn-download-screenshot');
  const copyBtn = document.getElementById('btn-copy-screenshot');
  const copyMarkdownBtn = document.getElementById('btn-copy-markdown');
  const statusDiv = document.getElementById('screenshot-status');

  let currentScreenshot = null;
  let currentMarkdown = null;

  // Capture visible area
  visibleBtn.addEventListener('click', async () => {
    try {
      statusDiv.textContent = '';
      statusDiv.className = 'status-message info';
      statusDiv.textContent = 'Capture en cours...';

      const dataUrl = await rateLimitedCapture();
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
  // Uses scrollIntoView to ensure element is visible before each capture
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
          dpr: window.devicePixelRatio || 1
        })
      });

      const { width: vpWidth, height: vpHeight, dpr } = viewport;
      const { width, height } = elementRect;

      // If element fits in viewport, scroll to it and capture
      if (width <= vpWidth && height <= vpHeight) {
        // Show loader
        await showPageLoader(tabId, 'Capture en cours...', 1, 1);

        // Scroll element into view using the data attribute
        await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const element = document.querySelector('[data-screenshot-target]');
            if (element) {
              element.scrollIntoView({ block: 'start', inline: 'start', behavior: 'instant' });
            }
          }
        });
        await new Promise(r => setTimeout(r, 300));

        // Hide loader for capture
        await hidePageLoader(tabId);
        await new Promise(r => setTimeout(r, 100));

        const dataUrl = await rateLimitedCapture();

        // Remove loader completely
        await removePageLoader(tabId);

        // Get element's current viewport position after scroll
        const [{ result: currentRect }] = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const element = document.querySelector('[data-screenshot-target]');
            if (element) {
              const rect = element.getBoundingClientRect();
              return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
            }
            return null;
          }
        });

        if (!currentRect) {
          throw new Error('Element non trouve');
        }

        // Crop to element bounds
        const cropRect = {
          x: Math.max(0, currentRect.x) * dpr,
          y: Math.max(0, currentRect.y) * dpr,
          width: currentRect.width * dpr,
          height: currentRect.height * dpr
        };

        const croppedImage = await cropImage(dataUrl, cropRect);
        currentScreenshot = croppedImage;
        displayPreview(croppedImage);
        statusDiv.textContent = 'Capture element reussie!';
        statusDiv.className = 'status-message success';

        // Clean up the data attribute
        await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const element = document.querySelector('[data-screenshot-target]');
            if (element) element.removeAttribute('data-screenshot-target');
          }
        });
        return;
      }

      // Element is larger than viewport - need to scroll and stitch
      const sectionsY = Math.ceil(height / vpHeight);
      const totalSections = sectionsY;

      // Show initial loader
      await showPageLoader(tabId, 'Preparation...', 0, totalSections);

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

      // For each vertical section, use scrollIntoView with a virtual anchor
      for (let sectionIdx = 0; sectionIdx < sectionsY; sectionIdx++) {
        // Show loader with progress
        await showPageLoader(tabId, 'Capture en cours...', sectionIdx + 1, totalSections);

        // Create a virtual anchor at the target position and scrollIntoView
        await chrome.scripting.executeScript({
          target: { tabId },
          func: (sectionIndex, vpH) => {
            const element = document.querySelector('[data-screenshot-target]');
            if (!element) return { success: false };

            const rect = element.getBoundingClientRect();
            const elemTop = rect.top + window.scrollY;
            const elemLeft = rect.left + window.scrollX;

            // Calculate target scroll position to show this section
            const targetScrollY = elemTop + (sectionIndex * vpH);

            // Try multiple scroll methods
            // Method 1: window.scrollTo
            window.scrollTo({
              top: targetScrollY,
              left: elemLeft,
              behavior: 'instant'
            });

            // Method 2: If element has a scrollable parent, scroll that too
            let parent = element.parentElement;
            while (parent && parent !== document.body) {
              const style = window.getComputedStyle(parent);
              if (style.overflow === 'auto' || style.overflow === 'scroll' ||
                  style.overflowY === 'auto' || style.overflowY === 'scroll') {
                // Found scrollable parent - scroll it
                const parentRect = parent.getBoundingClientRect();
                const elemRelativeTop = elemTop - (parentRect.top + window.scrollY);
                parent.scrollTop = elemRelativeTop + (sectionIndex * vpH);
                break;
              }
              parent = parent.parentElement;
            }

            return { success: true };
          },
          args: [sectionIdx, vpHeight]
        });

        await new Promise(r => setTimeout(r, 300)); // Wait for scroll to settle

        // Hide loader for capture
        await hidePageLoader(tabId);
        await new Promise(r => setTimeout(r, 100));

        // Capture visible area
        const dataUrl = await rateLimitedCapture();

        // Get element's current position in viewport
        const [{ result: elemPos }] = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => {
            const element = document.querySelector('[data-screenshot-target]');
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            return {
              elemLeft: rect.left,
              elemTop: rect.top,
              elemWidth: rect.width,
              elemHeight: rect.height,
              vpWidth: window.innerWidth,
              vpHeight: window.innerHeight
            };
          }
        });

        if (!elemPos) {
          throw new Error('Element non trouve pendant la capture');
        }

        // Calculate what part of element is visible in this capture
        // The crop position in the screenshot
        const cropX = Math.max(0, elemPos.elemLeft);
        const cropY = Math.max(0, elemPos.elemTop);

        // Width to capture (capped at element width and viewport)
        const cropW = Math.min(width, vpWidth - cropX, elemPos.elemWidth);

        // For last section, only capture remaining height
        const isLast = sectionIdx === sectionsY - 1;
        const remainingHeight = height - (sectionIdx * vpHeight);
        const cropH = isLast ? Math.min(remainingHeight, vpHeight - cropY) : Math.min(vpHeight - cropY, vpHeight);

        captures.push({
          dataUrl,
          sectionIndex: sectionIdx,
          cropX,
          cropY,
          cropW,
          cropH,
          vpHeight,
          isLast,
          elementWidth: width,
          elementHeight: height
        });

        statusDiv.textContent = `Capture: ${sectionIdx + 1}/${totalSections}...`;
      }

      // Show assembling loader
      await showPageLoader(tabId, 'Assemblage en cours...');

      // Restore fixed elements and clean up
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          if (window.__screenshotFixedElements) {
            window.__screenshotFixedElements.forEach(({ el, display }) => {
              el.style.display = display || '';
            });
            delete window.__screenshotFixedElements;
          }
          // Clean up the data attribute
          const element = document.querySelector('[data-screenshot-target]');
          if (element) element.removeAttribute('data-screenshot-target');
        }
      });

      statusDiv.textContent = 'Assemblage...';

      // Stitch captures using section index
      const finalDataUrl = await stitchElementCaptures(captures, width, height, vpHeight, dpr);

      // Remove loader
      await removePageLoader(tabId);

      currentScreenshot = finalDataUrl;
      displayPreview(finalDataUrl);
      statusDiv.textContent = 'Capture element reussie!';
      statusDiv.className = 'status-message success';

    } catch (error) {
      console.error('Element capture error:', error);
      statusDiv.textContent = 'Erreur: ' + error.message;
      statusDiv.className = 'status-message error';

      // Remove loader and restore fixed elements on error
      try {
        await removePageLoader(tabId);
      } catch (e) { /* ignore */ }
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
            const element = document.querySelector('[data-screenshot-target]');
            if (element) element.removeAttribute('data-screenshot-target');
          }
        });
      } catch (e) { /* ignore */ }
    }
  }

  // Stitch element captures - load all images first, then draw by section index
  async function stitchElementCaptures(captures, width, height, vpHeight, dpr) {
    // Load all images first using Promise.all
    const loadImage = (dataUrl) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = dataUrl;
      });
    };

    const images = await Promise.all(captures.map(c => loadImage(c.dataUrl)));

    // Create canvas and draw all sections
    const canvas = document.createElement('canvas');
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');

    // Draw each section at its intended position (by section index)
    captures.forEach((capture, index) => {
      const img = images[index];
      // Position in final canvas based on section index
      const destY = capture.sectionIndex * vpHeight * dpr;

      // How much height to draw for this section
      const isLast = capture.isLast;
      const sectionHeight = isLast ? (height - capture.sectionIndex * vpHeight) : vpHeight;

      // Draw from crop position in source to section position in dest
      ctx.drawImage(
        img,
        capture.cropX * dpr, capture.cropY * dpr,
        capture.cropW * dpr, Math.min(sectionHeight * dpr, capture.cropH * dpr),
        0, destY,
        capture.cropW * dpr, Math.min(sectionHeight * dpr, capture.cropH * dpr)
      );
    });

    return canvas.toDataURL('image/png');
  }

  // Capture full page using scroll and stitch
  fullPageBtn.addEventListener('click', async () => {
    let tabId = null;
    try {
      statusDiv.textContent = 'Capture page complete en cours...';
      statusDiv.className = 'status-message info';

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = tab.id;

      // Get page dimensions
      const [{ result: dimensions }] = await chrome.scripting.executeScript({
        target: { tabId },
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

      // Show initial loader
      await showPageLoader(tabId, 'Preparation...', 0, totalSections);

      statusDiv.textContent = `Capture: 0/${totalSections} sections...`;

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

      // Scroll to top
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => window.scrollTo(0, 0)
      });
      await new Promise(r => setTimeout(r, 200)); // Wait for scroll to settle

      // Capture each section
      const captures = [];
      for (let i = 0; i < totalSections; i++) {
        // Show loader with progress
        await showPageLoader(tabId, 'Capture en cours...', i + 1, totalSections);

        const scrollY = i * viewportHeight;

        await chrome.scripting.executeScript({
          target: { tabId },
          func: (y) => window.scrollTo(0, y),
          args: [scrollY]
        });
        await new Promise(r => setTimeout(r, 200)); // Wait for scroll to settle

        // Hide loader for capture
        await hidePageLoader(tabId);
        await new Promise(r => setTimeout(r, 100));

        const dataUrl = await rateLimitedCapture();
        const isLast = i === totalSections - 1;

        // Use intended position (i * viewportHeight) not actual scroll
        // This ensures sections are placed correctly even if scroll is limited
        captures.push({
          dataUrl,
          sectionIndex: i,
          viewportHeight,
          captureHeight: isLast ? (scrollHeight - scrollY) : viewportHeight,
          isLast
        });

        statusDiv.textContent = `Capture: ${i + 1}/${totalSections} sections...`;
      }

      // Show assembling loader
      await showPageLoader(tabId, 'Assemblage en cours...');

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
          window.scrollTo(0, 0);
        }
      });

      statusDiv.textContent = 'Assemblage...';

      const finalDataUrl = await stitchImages(captures, scrollWidth, scrollHeight, viewportHeight, dpr);

      // Remove loader
      await removePageLoader(tabId);

      currentScreenshot = finalDataUrl;
      displayPreview(finalDataUrl);
      statusDiv.textContent = 'Capture page complete reussie!';
      statusDiv.className = 'status-message success';

    } catch (error) {
      console.error('Full page capture error:', error);
      statusDiv.textContent = 'Erreur: ' + error.message;
      statusDiv.className = 'status-message error';

      // Remove loader on error
      if (tabId) {
        try {
          await removePageLoader(tabId);
        } catch (e) { /* ignore */ }
      }

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

  // Stitch full page images - load all images first, then draw
  async function stitchImages(captures, pageWidth, pageHeight, viewportHeight, dpr) {
    // Load all images first using Promise.all
    const loadImage = (dataUrl) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = dataUrl;
      });
    };

    const images = await Promise.all(captures.map(c => loadImage(c.dataUrl)));

    // Create canvas and draw all sections
    const canvas = document.createElement('canvas');
    canvas.width = pageWidth * dpr;
    canvas.height = pageHeight * dpr;
    const ctx = canvas.getContext('2d');

    // Draw each section at its intended position
    captures.forEach((capture, index) => {
      const img = images[index];
      // Use section index * viewport height for positioning
      const destY = capture.sectionIndex * capture.viewportHeight * dpr;
      const sourceHeight = capture.isLast ? capture.captureHeight * dpr : img.height;

      ctx.drawImage(
        img,
        0, 0, img.width, sourceHeight,
        0, destY, img.width, sourceHeight
      );
    });

    return canvas.toDataURL('image/png');
  }

  // Capture selected area
  async function captureSelection(tabId, rect) {
    try {
      const dataUrl = await rateLimitedCapture();
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

  // Markdown capture - select element and convert HTML to Markdown via API
  markdownBtn.addEventListener('click', async () => {
    try {
      // Hide image preview, show markdown output
      previewContainer.style.display = 'none';
      markdownOutput.style.display = 'none';
      copyMarkdownBtn.style.display = 'none';
      downloadBtn.disabled = true;
      copyBtn.disabled = true;

      statusDiv.textContent = 'Selectionnez un element pour convertir en Markdown...';
      statusDiv.className = 'status-message info';

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: initMarkdownSelector
      });

      const handleMessage = async (message) => {
        if (message.type === 'markdown-element-selected') {
          chrome.runtime.onMessage.removeListener(handleMessage);
          await convertToMarkdown(message.html, message.text);
        } else if (message.type === 'markdown-element-cancelled') {
          chrome.runtime.onMessage.removeListener(handleMessage);
          statusDiv.textContent = 'Selection annulee';
          statusDiv.className = 'status-message info';
        }
      };

      chrome.runtime.onMessage.addListener(handleMessage);
    } catch (error) {
      console.error('Markdown error:', error);
      statusDiv.textContent = 'Erreur: ' + error.message;
      statusDiv.className = 'status-message error';
    }
  });

  // Convert HTML to Markdown using OpenAI API
  async function convertToMarkdown(html, text) {
    let tabId = null;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = tab.id;

      statusDiv.textContent = 'Conversion en Markdown...';
      statusDiv.className = 'status-message info';

      // Show loader on page
      await showPageLoader(tabId, 'Conversion en Markdown...');

      // Get API key from storage
      const data = await chrome.storage.sync.get(['openaiApiKey']);
      const apiKey = data.openaiApiKey;

      if (!apiKey) {
        await removePageLoader(tabId);
        statusDiv.textContent = 'Cle API OpenAI non configuree. Allez dans les options.';
        statusDiv.className = 'status-message error';
        return;
      }

      // Call OpenAI API
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Tu es un expert en conversion HTML vers Markdown. Convertis le contenu HTML fourni en Markdown propre et bien structure. Garde la structure semantique (titres, listes, liens, images, tableaux, etc.). Ne rajoute pas de commentaires, retourne uniquement le Markdown.'
            },
            {
              role: 'user',
              content: `Convertis ce HTML en Markdown:\n\n${html}`
            }
          ],
          temperature: 0.3,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Erreur API');
      }

      const result = await response.json();
      const markdown = result.choices[0]?.message?.content || '';

      // Remove loader
      await removePageLoader(tabId);

      // Display result
      currentMarkdown = markdown;
      markdownResult.value = markdown;
      markdownOutput.style.display = 'block';
      copyMarkdownBtn.style.display = 'inline-block';
      previewContainer.style.display = 'none';

      statusDiv.textContent = 'Markdown genere!';
      statusDiv.className = 'status-message success';

    } catch (error) {
      console.error('API error:', error);
      // Remove loader on error
      if (tabId) {
        try {
          await removePageLoader(tabId);
        } catch (e) { /* ignore */ }
      }
      statusDiv.textContent = 'Erreur API: ' + error.message;
      statusDiv.className = 'status-message error';
    }
  }

  // Copy Markdown to clipboard
  copyMarkdownBtn.addEventListener('click', async () => {
    if (!currentMarkdown) return;
    try {
      await navigator.clipboard.writeText(currentMarkdown);
      copyMarkdownBtn.textContent = 'Copie!';
      setTimeout(() => { copyMarkdownBtn.textContent = 'Copier MD'; }, 1500);
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

  // Clean up any previous screenshot target
  const previousTarget = document.querySelector('[data-screenshot-target]');
  if (previousTarget) previousTarget.removeAttribute('data-screenshot-target');

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

    // Mark the element with a data attribute so we can find it later
    currentElement.setAttribute('data-screenshot-target', 'true');

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

// Content script: Markdown element selector
function initMarkdownSelector() {
  const existingOverlay = document.getElementById('markdown-element-overlay');
  if (existingOverlay) existingOverlay.remove();

  const overlay = document.createElement('div');
  overlay.id = 'markdown-element-overlay';
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
  highlightBox.id = 'markdown-highlight-box';
  highlightBox.style.cssText = `
    position: fixed;
    border: 3px solid #10b981;
    background: rgba(16, 185, 129, 0.1);
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
  instructions.innerHTML = 'Cliquez sur l\'element a convertir en Markdown<br><small style="opacity:0.7">Appuyez sur Echap pour annuler</small>';
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

    // Get element's HTML and text content
    const html = currentElement.outerHTML;
    const text = currentElement.innerText;

    cleanup();
    chrome.runtime.sendMessage({ type: 'markdown-element-selected', html, text });
  };

  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      cleanup();
      chrome.runtime.sendMessage({ type: 'markdown-element-cancelled' });
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
