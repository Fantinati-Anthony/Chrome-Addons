// Tool: Word Counter
// Count words, characters, sentences on the page

export async function initWordCount() {
  const countBtn = document.getElementById('btn-count-words');
  const resultsDiv = document.getElementById('wordcount-results');

  countBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const text = document.body.innerText || '';
          const words = text.split(/\s+/).filter(w => w.length > 0);
          const chars = text.length;
          const charsNoSpaces = text.replace(/\s/g, '').length;
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
          const readingTime = Math.ceil(words.length / 200); // 200 wpm average
          return { words: words.length, chars, charsNoSpaces, sentences: sentences.length, paragraphs: paragraphs.length, readingTime };
        }
      });

      if (results && results[0] && results[0].result) {
        const r = results[0].result;
        resultsDiv.innerHTML = `
          <div class="stat-item"><span class="stat-label">Mots</span><span class="stat-value">${r.words}</span></div>
          <div class="stat-item"><span class="stat-label">Caracteres</span><span class="stat-value">${r.chars}</span></div>
          <div class="stat-item"><span class="stat-label">Sans espaces</span><span class="stat-value">${r.charsNoSpaces}</span></div>
          <div class="stat-item"><span class="stat-label">Phrases</span><span class="stat-value">${r.sentences}</span></div>
          <div class="stat-item"><span class="stat-label">Paragraphes</span><span class="stat-value">${r.paragraphs}</span></div>
          <div class="stat-item"><span class="stat-label">Temps de lecture</span><span class="stat-value">${r.readingTime} min</span></div>
        `;
      }
    } catch (error) {
      resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });
}
