// Tool: Sitemap Loader
// Load and display sitemap.xml from the current domain

import { escapeHtml } from '../utils.js';

export async function initSitemap() {
  const loadBtn = document.getElementById('btn-load-sitemap');
  const statusDiv = document.getElementById('sitemap-status');
  const sitemapList = document.getElementById('sitemap-list');

  loadBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const origin = new URL(tab.url).origin;
      const sitemapUrl = origin + '/sitemap.xml';

      statusDiv.innerHTML = 'Chargement...';

      const response = await fetch(sitemapUrl);
      if (!response.ok) throw new Error('Sitemap non trouve');

      const text = await response.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');

      const urls = xml.querySelectorAll('url loc');
      const sitemaps = xml.querySelectorAll('sitemap loc');

      statusDiv.innerHTML = `<strong>${urls.length}</strong> URLs, <strong>${sitemaps.length}</strong> sitemaps`;

      sitemapList.innerHTML = '';
      urls.forEach(loc => {
        const item = document.createElement('div');
        item.className = 'sitemap-item';
        item.innerHTML = `<a href="${escapeHtml(loc.textContent)}" target="_blank">${escapeHtml(loc.textContent.substring(0, 60))}</a>`;
        sitemapList.appendChild(item);
      });
      sitemaps.forEach(loc => {
        const item = document.createElement('div');
        item.className = 'sitemap-item';
        item.innerHTML = `📁 <a href="${escapeHtml(loc.textContent)}" target="_blank">${escapeHtml(loc.textContent)}</a>`;
        sitemapList.appendChild(item);
      });

    } catch (error) {
      statusDiv.innerHTML = '<div class="status-message error">Sitemap non trouve ou erreur</div>';
    }
  });
}
