// Tool: Accessibility Checker
// Basic accessibility analysis

import { escapeHtml } from './utils.js';

export async function initAccessibility() {
  const checkBtn = document.getElementById('btn-check-a11y');
  const resultsDiv = document.getElementById('a11y-results');

  checkBtn.addEventListener('click', async () => {
    resultsDiv.innerHTML = '<div class="loading">Analyse en cours...</div>';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const issues = { errors: [], warnings: [], passes: [] };

          const imgsWithoutAlt = document.querySelectorAll('img:not([alt])');
          if (imgsWithoutAlt.length > 0) {
            issues.errors.push(`${imgsWithoutAlt.length} image(s) sans attribut alt`);
          } else {
            issues.passes.push('Toutes les images ont un alt');
          }

          const h1Count = document.querySelectorAll('h1').length;
          if (h1Count === 0) {
            issues.warnings.push('Aucune balise H1');
          } else if (h1Count > 1) {
            issues.warnings.push(`${h1Count} balises H1 (recommande: 1)`);
          } else {
            issues.passes.push('Hierarchie H1 correcte');
          }

          if (!document.documentElement.lang) {
            issues.warnings.push('Attribut lang manquant sur <html>');
          } else {
            issues.passes.push(`Langue: ${document.documentElement.lang}`);
          }

          return issues;
        }
      });

      if (results && results[0] && results[0].result) {
        const issues = results[0].result;
        const score = Math.max(0, 100 - (issues.errors.length * 15) - (issues.warnings.length * 5));
        let scoreClass = score >= 80 ? 'good' : score >= 50 ? 'medium' : 'bad';

        let html = `<div class="a11y-score ${scoreClass}"><span class="score-value">${score}/100</span></div>`;

        if (issues.errors.length > 0) {
          html += '<div class="a11y-section"><h4>Erreurs</h4>';
          issues.errors.forEach(e => {
            html += `<div class="a11y-item error"><span class="a11y-icon">❌</span><span class="a11y-text">${escapeHtml(e)}</span></div>`;
          });
          html += '</div>';
        }

        if (issues.warnings.length > 0) {
          html += '<div class="a11y-section"><h4>Avertissements</h4>';
          issues.warnings.forEach(w => {
            html += `<div class="a11y-item warning"><span class="a11y-icon">⚠️</span><span class="a11y-text">${escapeHtml(w)}</span></div>`;
          });
          html += '</div>';
        }

        if (issues.passes.length > 0) {
          html += '<div class="a11y-section"><h4>OK</h4>';
          issues.passes.forEach(p => {
            html += `<div class="a11y-item pass"><span class="a11y-icon">✅</span><span class="a11y-text">${escapeHtml(p)}</span></div>`;
          });
          html += '</div>';
        }

        resultsDiv.innerHTML = html;
      }
    } catch (error) {
      resultsDiv.innerHTML = '<div class="status-message error">Erreur d\'analyse</div>';
    }
  });
}
