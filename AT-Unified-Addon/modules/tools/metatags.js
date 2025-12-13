// Tool: Meta Tags Extractor
// Extract and display meta tags from the current page

import { escapeHtml } from './utils.js';

export async function initMetaTags() {
  const extractBtn = document.getElementById('btn-extract-meta');
  const metaList = document.getElementById('meta-list');

  extractBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const metas = [];
          // Title
          metas.push({ name: 'title', content: document.title });
          // Meta tags
          document.querySelectorAll('meta').forEach(meta => {
            const name = meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('http-equiv');
            const content = meta.getAttribute('content');
            if (name && content) {
              metas.push({ name, content });
            }
          });
          // Canonical
          const canonical = document.querySelector('link[rel="canonical"]');
          if (canonical) metas.push({ name: 'canonical', content: canonical.href });
          return metas;
        }
      });

      if (results && results[0] && results[0].result) {
        renderMetaTags(results[0].result);
      }
    } catch (error) {
      metaList.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });

  function renderMetaTags(metas) {
    if (metas.length === 0) {
      metaList.innerHTML = '<div class="status-message info">Aucun meta tag</div>';
      return;
    }
    metaList.innerHTML = '';
    metas.forEach(meta => {
      const item = document.createElement('div');
      item.className = 'meta-item';
      item.innerHTML = `<strong>${escapeHtml(meta.name)}:</strong> <span class="meta-content">${escapeHtml(meta.content)}</span>`;
      item.querySelector('.meta-content').addEventListener('click', async () => {
        await navigator.clipboard.writeText(meta.content);
        item.querySelector('.meta-content').textContent = 'Copie!';
        setTimeout(() => { item.querySelector('.meta-content').textContent = meta.content; }, 1000);
      });
      metaList.appendChild(item);
    });
  }
}
