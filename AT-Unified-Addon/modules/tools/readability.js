// Tool: Readability Score
// Calculate Flesch reading ease score

export async function initReadability() {
  const analyzeBtn = document.getElementById('btn-check-readability');
  const resultsDiv = document.getElementById('readability-results');

  analyzeBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const text = document.body.innerText || '';
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const words = text.split(/\s+/).filter(w => w.length > 0);
          const syllables = words.reduce((acc, word) => {
            const count = word.toLowerCase().replace(/[^aeiouy]/g, '').length || 1;
            return acc + Math.min(count, 5);
          }, 0);

          const avgSentenceLength = words.length / (sentences.length || 1);
          const avgSyllablesPerWord = syllables / (words.length || 1);

          const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);
          const gradeLevel = (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;

          return {
            sentences: sentences.length,
            words: words.length,
            avgSentenceLength: avgSentenceLength.toFixed(1),
            fleschScore: Math.max(0, Math.min(100, fleschScore)).toFixed(1),
            gradeLevel: Math.max(0, gradeLevel).toFixed(1)
          };
        }
      });

      if (results && results[0] && results[0].result) {
        const r = results[0].result;
        let level = 'Difficile';
        let levelClass = 'error';
        if (r.fleschScore >= 70) { level = 'Facile'; levelClass = 'success'; }
        else if (r.fleschScore >= 50) { level = 'Moyen'; levelClass = 'warning'; }

        resultsDiv.innerHTML = `
          <div class="readability-score ${levelClass}">
            <span class="score-value">${r.fleschScore}</span>
            <span class="score-label">Score Flesch (${level})</span>
          </div>
          <div class="stat-item"><span class="stat-label">Niveau scolaire</span><span class="stat-value">${r.gradeLevel}</span></div>
          <div class="stat-item"><span class="stat-label">Mots/phrase (moy)</span><span class="stat-value">${r.avgSentenceLength}</span></div>
          <div class="stat-item"><span class="stat-label">Total phrases</span><span class="stat-value">${r.sentences}</span></div>
          <div class="stat-item"><span class="stat-label">Total mots</span><span class="stat-value">${r.words}</span></div>
        `;
      }
    } catch (error) {
      resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });
}
