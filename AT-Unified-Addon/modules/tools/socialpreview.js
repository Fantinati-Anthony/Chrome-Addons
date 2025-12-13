// Tool: Social Preview
// Preview Open Graph and Twitter Card meta tags

import { escapeHtml } from './utils.js';

export async function initSocialPreview() {
  const previewBtn = document.getElementById('btn-preview-social');
  const cardsDiv = document.getElementById('social-preview-cards');

  previewBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const getMeta = (name) => {
            const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
            return el ? el.getAttribute('content') : null;
          };

          return {
            title: getMeta('og:title') || document.title,
            description: getMeta('og:description') || getMeta('description') || '',
            image: getMeta('og:image') || '',
            url: getMeta('og:url') || window.location.href,
            siteName: getMeta('og:site_name') || '',
            twitterCard: getMeta('twitter:card') || 'summary',
            twitterTitle: getMeta('twitter:title') || getMeta('og:title') || document.title,
            twitterDesc: getMeta('twitter:description') || getMeta('og:description') || getMeta('description') || '',
            twitterImage: getMeta('twitter:image') || getMeta('og:image') || ''
          };
        }
      });

      if (results && results[0] && results[0].result) {
        const r = results[0].result;
        cardsDiv.innerHTML = `
          <div class="social-card facebook">
            <div class="social-card-header">Facebook / LinkedIn</div>
            ${r.image ? `<div class="social-card-image"><img src="${escapeHtml(r.image)}" alt=""></div>` : ''}
            <div class="social-card-content">
              <div class="social-card-site">${escapeHtml(r.siteName || new URL(r.url).hostname)}</div>
              <div class="social-card-title">${escapeHtml(r.title)}</div>
              <div class="social-card-desc">${escapeHtml(r.description.substring(0, 150))}</div>
            </div>
          </div>
          <div class="social-card twitter">
            <div class="social-card-header">Twitter/X</div>
            ${r.twitterImage ? `<div class="social-card-image"><img src="${escapeHtml(r.twitterImage)}" alt=""></div>` : ''}
            <div class="social-card-content">
              <div class="social-card-title">${escapeHtml(r.twitterTitle)}</div>
              <div class="social-card-desc">${escapeHtml(r.twitterDesc.substring(0, 120))}</div>
              <div class="social-card-site">${escapeHtml(new URL(r.url).hostname)}</div>
            </div>
          </div>
        `;
      }
    } catch (error) {
      cardsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });
}
