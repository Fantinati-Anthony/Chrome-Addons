// Tool: Text Diff Comparison
// Compare two texts line by line

import { escapeHtml } from '../utils.js';

export function initTextDiff() {
  const text1 = document.getElementById('diff-text1');
  const text2 = document.getElementById('diff-text2');
  const compareBtn = document.getElementById('btn-compare-text');
  const resultsDiv = document.getElementById('diff-results');

  compareBtn.addEventListener('click', () => {
    const lines1 = text1.value.split('\n');
    const lines2 = text2.value.split('\n');

    let html = '';
    const maxLines = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLines; i++) {
      const line1 = lines1[i] || '';
      const line2 = lines2[i] || '';

      if (line1 === line2) {
        html += `<div class="diff-line same">${escapeHtml(line1) || '&nbsp;'}</div>`;
      } else if (!line1) {
        html += `<div class="diff-line added">+ ${escapeHtml(line2)}</div>`;
      } else if (!line2) {
        html += `<div class="diff-line removed">- ${escapeHtml(line1)}</div>`;
      } else {
        html += `<div class="diff-line removed">- ${escapeHtml(line1)}</div>`;
        html += `<div class="diff-line added">+ ${escapeHtml(line2)}</div>`;
      }
    }

    resultsDiv.innerHTML = html || '<div class="status-message info">Aucune difference</div>';
  });
}
