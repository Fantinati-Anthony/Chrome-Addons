// Tool: Font Detector
// Detect fonts used on the current page

import { escapeHtml } from '../utils.js';

export async function initFonts() {
  const detectBtn = document.getElementById('btn-detect-fonts');
  const fontsList = document.getElementById('fonts-list');

  detectBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const fonts = new Set();
          document.querySelectorAll('*').forEach(el => {
            const computed = window.getComputedStyle(el);
            const fontFamily = computed.fontFamily;
            if (fontFamily) {
              fontFamily.split(',').forEach(f => {
                const clean = f.trim().replace(/['"]/g, '');
                if (clean) fonts.add(clean);
              });
            }
          });
          return [...fonts];
        }
      });

      if (results && results[0] && results[0].result) {
        renderFonts(results[0].result);
      }
    } catch (error) {
      fontsList.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });

  function renderFonts(fonts) {
    if (fonts.length === 0) {
      fontsList.innerHTML = '<div class="status-message info">Aucune police detectee</div>';
      return;
    }
    fontsList.innerHTML = '';
    fonts.forEach(font => {
      const item = document.createElement('div');
      item.className = 'font-item';
      item.innerHTML = `<span style="font-family: ${font}">${escapeHtml(font)}</span>`;
      fontsList.appendChild(item);
    });
  }
}
