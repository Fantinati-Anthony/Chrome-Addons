// Tool: Core Web Vitals
// Measure FCP, LCP, and other vital metrics

export async function initWebVitals() {
  const analyzeBtn = document.getElementById('btn-check-vitals');
  const resultsDiv = document.getElementById('webvitals-results');

  analyzeBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const entries = performance.getEntriesByType('paint');
          const fcp = entries.find(e => e.name === 'first-contentful-paint');
          const fp = entries.find(e => e.name === 'first-paint');

          const navEntry = performance.getEntriesByType('navigation')[0] || {};
          const lcp = performance.getEntriesByType('largest-contentful-paint').pop();

          return {
            fp: fp ? Math.round(fp.startTime) : null,
            fcp: fcp ? Math.round(fcp.startTime) : null,
            lcp: lcp ? Math.round(lcp.startTime) : null,
            dcl: Math.round(navEntry.domContentLoadedEventEnd || 0),
            load: Math.round(navEntry.loadEventEnd || 0)
          };
        }
      });

      if (results && results[0] && results[0].result) {
        const r = results[0].result;

        const getScore = (value, good, poor) => {
          if (!value) return 'unknown';
          if (value <= good) return 'good';
          if (value <= poor) return 'needs-improvement';
          return 'poor';
        };

        resultsDiv.innerHTML = `
          <div class="vital-item ${getScore(r.fcp, 1800, 3000)}">
            <span class="vital-label">FCP (First Contentful Paint)</span>
            <span class="vital-value">${r.fcp || 'N/A'}ms</span>
          </div>
          <div class="vital-item ${getScore(r.lcp, 2500, 4000)}">
            <span class="vital-label">LCP (Largest Contentful Paint)</span>
            <span class="vital-value">${r.lcp || 'N/A'}ms</span>
          </div>
          <div class="vital-item">
            <span class="vital-label">First Paint</span>
            <span class="vital-value">${r.fp || 'N/A'}ms</span>
          </div>
          <div class="vital-item">
            <span class="vital-label">DOM Content Loaded</span>
            <span class="vital-value">${r.dcl}ms</span>
          </div>
          <div class="vital-item">
            <span class="vital-label">Load Complete</span>
            <span class="vital-value">${r.load}ms</span>
          </div>
        `;
      }
    } catch (error) {
      resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });
}
