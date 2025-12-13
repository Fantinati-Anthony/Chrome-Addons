// Tool: Domain History
// Shows browser history for the current domain

export function initHistory() {
  const loadHistoryBtn = document.getElementById('btn-load-history');
  const historyDiv = document.getElementById('domain-history');

  loadHistoryBtn.addEventListener('click', loadDomainHistory);

  async function loadDomainHistory() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        historyDiv.innerHTML = '<div class="status-message info">URL non disponible</div>';
        return;
      }

      const url = new URL(tab.url);
      const domain = url.hostname;

      chrome.history.search({ text: domain, maxResults: 20 }, (results) => {
        const filtered = results.filter(item => {
          try {
            const itemUrl = new URL(item.url);
            return itemUrl.hostname === domain || itemUrl.hostname.endsWith('.' + domain);
          } catch (e) { return false; }
        });

        if (filtered.length === 0) {
          historyDiv.innerHTML = `<div class="status-message info">Aucun historique</div>`;
          return;
        }

        historyDiv.innerHTML = '';
        filtered.forEach(item => {
          const div = document.createElement('div');
          div.className = 'list-item';
          div.innerHTML = `<span class="item-title">${item.title || item.url}</span><button class="visit-btn" data-url="${item.url}">→</button>`;
          historyDiv.appendChild(div);
        });

        historyDiv.querySelectorAll('.visit-btn').forEach(btn => {
          btn.addEventListener('click', () => chrome.tabs.create({ url: btn.dataset.url }));
        });
      });
    } catch (error) {
      historyDiv.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  }
}
