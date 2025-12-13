// Tool: Regex Tester
// Test regular expressions

import { escapeHtml } from './utils.js';

export function initRegex() {
  const patternInput = document.getElementById('regex-pattern');
  const testTextarea = document.getElementById('regex-test');
  const gFlag = document.getElementById('regex-g');
  const iFlag = document.getElementById('regex-i');
  const mFlag = document.getElementById('regex-m');
  const testBtn = document.getElementById('btn-test-regex');
  const resultsDiv = document.getElementById('regex-results');

  testBtn.addEventListener('click', () => {
    const pattern = patternInput.value;
    const text = testTextarea.value;

    if (!pattern) {
      resultsDiv.innerHTML = '<div class="regex-no-match">Entrez une expression reguliere</div>';
      return;
    }

    try {
      let flags = '';
      if (gFlag.checked) flags += 'g';
      if (iFlag.checked) flags += 'i';
      if (mFlag.checked) flags += 'm';

      const regex = new RegExp(pattern, flags);
      const matches = text.match(regex);

      if (!matches || matches.length === 0) {
        resultsDiv.innerHTML = '<div class="regex-no-match">Aucune correspondance</div>';
      } else {
        resultsDiv.innerHTML = matches.map((m, i) => `
          <div class="regex-match"><span class="regex-match-index">[${i}]</span>${escapeHtml(m)}</div>
        `).join('');
      }
    } catch (e) {
      resultsDiv.innerHTML = `<div class="status-message error">Regex invalide: ${escapeHtml(e.message)}</div>`;
    }
  });
}
