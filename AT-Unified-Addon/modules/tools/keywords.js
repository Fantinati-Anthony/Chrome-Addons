// Tool: Keyword Density Analyzer
// Analyze keyword frequency on the page

import { escapeHtml } from './utils.js';

export async function initKeywords() {
  const analyzeBtn = document.getElementById('btn-analyze-keywords');
  const minLengthInput = document.getElementById('keywords-min-length');
  const resultsDiv = document.getElementById('keywords-results');

  analyzeBtn.addEventListener('click', async () => {
    const minLength = parseInt(minLengthInput.value) || 4;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (minLen) => {
          const text = document.body.innerText.toLowerCase();
          const words = text.match(/[a-z\u00e0-\u00ff]+/gi) || [];
          const wordCount = {};
          const stopWords = ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'au', 'aux', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'que', 'qui', 'pour', 'dans', 'sur', 'est', 'sont', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were'];

          words.forEach(word => {
            if (word.length >= minLen && !stopWords.includes(word)) {
              wordCount[word] = (wordCount[word] || 0) + 1;
            }
          });

          const sorted = Object.entries(wordCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20);

          const total = words.length;
          return sorted.map(([word, count]) => ({
            word,
            count,
            density: ((count / total) * 100).toFixed(2)
          }));
        },
        args: [minLength]
      });

      if (results && results[0] && results[0].result) {
        renderKeywords(results[0].result);
      }
    } catch (error) {
      resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });

  function renderKeywords(keywords) {
    if (keywords.length === 0) {
      resultsDiv.innerHTML = '<div class="status-message info">Aucun mot-cle trouve</div>';
      return;
    }
    resultsDiv.innerHTML = keywords.map(k => `
      <div class="keyword-item">
        <span class="keyword-word">${escapeHtml(k.word)}</span>
        <span class="keyword-count">${k.count}x</span>
        <span class="keyword-density">${k.density}%</span>
      </div>
    `).join('');
  }
}
