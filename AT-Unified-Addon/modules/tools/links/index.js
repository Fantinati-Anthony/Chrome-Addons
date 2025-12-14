// Tool: Page Links Extractor
// Extract all links from the current page

import { escapeHtml } from './utils.js';

export async function initLinks() {
  const extractBtn = document.getElementById('btn-extract-links');
  const statsDiv = document.getElementById('links-stats');
  const linksList = document.getElementById('links-list');
  const copyBtn = document.getElementById('btn-copy-links');

  let allLinks = [];

  extractBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentHost = new URL(tab.url).hostname;

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const links = [];
          document.querySelectorAll('a[href]').forEach(a => {
            const href = a.href;
            if (href && !href.startsWith('javascript:')) {
              links.push({ href, text: a.textContent.trim().substring(0, 50) });
            }
          });
          return links;
        }
      });

      if (results && results[0] && results[0].result) {
        allLinks = results[0].result;
        const internal = allLinks.filter(l => {
          try { return new URL(l.href).hostname === currentHost; } catch { return false; }
        });
        const external = allLinks.filter(l => {
          try { return new URL(l.href).hostname !== currentHost; } catch { return false; }
        });

        statsDiv.innerHTML = `<strong>${allLinks.length}</strong> liens (${internal.length} internes, ${external.length} externes)`;
        renderLinks(allLinks);
      }
    } catch (error) {
      linksList.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });

  copyBtn.addEventListener('click', async () => {
    if (allLinks.length > 0) {
      await navigator.clipboard.writeText(allLinks.map(l => l.href).join('\n'));
      copyBtn.textContent = 'Copie!';
      setTimeout(() => { copyBtn.textContent = 'Copier tous'; }, 1000);
    }
  });

  function renderLinks(links) {
    linksList.innerHTML = '';
    const uniqueLinks = [...new Set(links.map(l => l.href))];
    uniqueLinks.slice(0, 100).forEach(href => {
      const item = document.createElement('div');
      item.className = 'link-item';
      item.innerHTML = `<a href="${escapeHtml(href)}" target="_blank">${escapeHtml(href.substring(0, 60))}${href.length > 60 ? '...' : ''}</a>`;
      linksList.appendChild(item);
    });
    if (uniqueLinks.length > 100) {
      linksList.innerHTML += `<div class="status-message info">+${uniqueLinks.length - 100} autres liens...</div>`;
    }
  }
}
