// Tool: Load Time Performance
// Analyze page load performance metrics

export async function initLoadTime() {
  const analyzeBtn = document.getElementById('btn-check-loadtime');
  const resultsDiv = document.getElementById('loadtime-results');

  analyzeBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const timing = performance.timing;

          return {
            dns: timing.domainLookupEnd - timing.domainLookupStart,
            connection: timing.connectEnd - timing.connectStart,
            ttfb: timing.responseStart - timing.requestStart,
            download: timing.responseEnd - timing.responseStart,
            domInteractive: timing.domInteractive - timing.navigationStart,
            domComplete: timing.domComplete - timing.navigationStart,
            loadComplete: timing.loadEventEnd - timing.navigationStart,
            resources: performance.getEntriesByType('resource').length
          };
        }
      });

      if (results && results[0] && results[0].result) {
        const r = results[0].result;
        resultsDiv.innerHTML = `
          <div class="stat-item"><span class="stat-label">DNS Lookup</span><span class="stat-value">${r.dns}ms</span></div>
          <div class="stat-item"><span class="stat-label">Connexion</span><span class="stat-value">${r.connection}ms</span></div>
          <div class="stat-item"><span class="stat-label">TTFB</span><span class="stat-value">${r.ttfb}ms</span></div>
          <div class="stat-item"><span class="stat-label">Telechargement</span><span class="stat-value">${r.download}ms</span></div>
          <div class="stat-item"><span class="stat-label">DOM Interactif</span><span class="stat-value">${r.domInteractive}ms</span></div>
          <div class="stat-item"><span class="stat-label">DOM Complet</span><span class="stat-value">${r.domComplete}ms</span></div>
          <div class="stat-item"><span class="stat-label">Chargement total</span><span class="stat-value">${r.loadComplete}ms</span></div>
          <div class="stat-item"><span class="stat-label">Ressources</span><span class="stat-value">${r.resources}</span></div>
        `;
      }
    } catch (error) {
      resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });
}
