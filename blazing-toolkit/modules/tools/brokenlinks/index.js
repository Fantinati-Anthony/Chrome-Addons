// Tool: Broken Links Checker
// Check for broken links on the page

import { escapeHtml } from '../utils.js';

export async function initBrokenLinks() {
  const checkBtn = document.getElementById('btn-check-links');
  const progressDiv = document.getElementById('brokenlinks-progress');
  const resultsDiv = document.getElementById('brokenlinks-results');

  checkBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const linksResult = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const links = [];
          document.querySelectorAll('a[href]').forEach(a => {
            const href = a.href;
            if (href && href.startsWith('http') && !links.includes(href)) {
              links.push(href);
            }
          });
          return links.slice(0, 50);
        }
      });

      const links = linksResult[0]?.result || [];
      if (links.length === 0) {
        resultsDiv.innerHTML = '<div class="status-message info">Aucun lien trouve</div>';
        return;
      }

      progressDiv.innerHTML = `Verification de ${links.length} liens...`;
      resultsDiv.innerHTML = '';

      let checked = 0;
      const broken = [];

      for (const url of links) {
        try {
          await fetch(url, { method: 'HEAD', mode: 'no-cors' });
        } catch (e) {
          broken.push(url);
        }
        checked++;
        progressDiv.innerHTML = `Verification: ${checked}/${links.length}`;
      }

      progressDiv.innerHTML = `Termine: ${broken.length} lien(s) potentiellement casse(s)`;

      if (broken.length > 0) {
        resultsDiv.innerHTML = broken.map(url => `
          <div class="broken-link-item">
            <span class="broken-icon">⚠️</span>
            <a href="${escapeHtml(url)}" target="_blank">${escapeHtml(url.substring(0, 50))}...</a>
          </div>
        `).join('');
      } else {
        resultsDiv.innerHTML = '<div class="status-message success">Tous les liens semblent fonctionner!</div>';
      }

    } catch (error) {
      resultsDiv.innerHTML = '<div class="status-message error">Erreur lors de la verification</div>';
    }
  });
}
