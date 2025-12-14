// Tool: Headings Analyzer
// Analyze H1-H6 structure on the page

import { escapeHtml } from '../utils.js';

export async function initHeadings() {
  const analyzeBtn = document.getElementById('btn-analyze-headings');
  const statsDiv = document.getElementById('headings-stats');
  const listDiv = document.getElementById('headings-list');

  analyzeBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const headings = [];
          const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };

          ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
            document.querySelectorAll(tag).forEach(h => {
              counts[tag]++;
              headings.push({ tag: tag.toUpperCase(), text: h.textContent.trim().substring(0, 100) });
            });
          });

          return { counts, headings };
        }
      });

      if (results && results[0] && results[0].result) {
        const r = results[0].result;
        statsDiv.innerHTML = Object.entries(r.counts)
          .map(([tag, count]) => `<span class="heading-badge ${tag}">${tag.toUpperCase()}: ${count}</span>`)
          .join(' ');

        if (r.headings.length === 0) {
          listDiv.innerHTML = '<div class="status-message info">Aucun titre trouve</div>';
        } else {
          listDiv.innerHTML = r.headings.map(h => `
            <div class="heading-item ${h.tag.toLowerCase()}">
              <span class="heading-tag">${h.tag}</span>
              <span class="heading-text">${escapeHtml(h.text)}</span>
            </div>
          `).join('');
        }
      }
    } catch (error) {
      listDiv.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });
}
