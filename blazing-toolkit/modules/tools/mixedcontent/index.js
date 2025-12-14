// Tool: Mixed Content Checker
// Detect HTTP content on HTTPS pages

import { escapeHtml } from '../utils.js';

export async function initMixedContent() {
  const checkBtn = document.getElementById('btn-check-mixed');
  const resultsDiv = document.getElementById('mixed-results');

  checkBtn.addEventListener('click', async () => {
    resultsDiv.innerHTML = '<div class="loading">Analyse en cours...</div>';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const mixed = [];
          document.querySelectorAll('img[src^="http://"]').forEach(el => {
            mixed.push({ type: 'Image', url: el.src });
          });
          document.querySelectorAll('script[src^="http://"]').forEach(el => {
            mixed.push({ type: 'Script', url: el.src });
          });
          document.querySelectorAll('link[rel="stylesheet"][href^="http://"]').forEach(el => {
            mixed.push({ type: 'CSS', url: el.href });
          });
          document.querySelectorAll('iframe[src^="http://"]').forEach(el => {
            mixed.push({ type: 'Iframe', url: el.src });
          });
          return mixed;
        }
      });

      if (results && results[0] && results[0].result) {
        const mixed = results[0].result;
        if (mixed.length === 0) {
          resultsDiv.innerHTML = '<div class="mixed-success">Aucun contenu mixte detecte!</div>';
        } else {
          resultsDiv.innerHTML = mixed.map(item => `
            <div class="mixed-item">
              <div class="mixed-type">${escapeHtml(item.type)}</div>
              <div class="mixed-url">${escapeHtml(item.url)}</div>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      resultsDiv.innerHTML = '<div class="status-message error">Erreur d\'analyse</div>';
    }
  });
}
