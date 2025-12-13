// Tool: robots.txt Viewer
// Load and display robots.txt

import { escapeHtml } from './utils.js';

export async function initRobotsTxt() {
  const loadBtn = document.getElementById('btn-load-robots');
  const contentDiv = document.getElementById('robots-content');

  loadBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const origin = new URL(tab.url).origin;
      const robotsUrl = origin + '/robots.txt';

      contentDiv.innerHTML = 'Chargement...';

      const response = await fetch(robotsUrl);
      if (!response.ok) throw new Error('robots.txt non trouve');

      const text = await response.text();
      contentDiv.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
    } catch (error) {
      contentDiv.innerHTML = '<div class="status-message error">robots.txt non trouve ou erreur</div>';
    }
  });
}
