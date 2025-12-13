// Tool: Element Measure
// Measure element dimensions on the page

export async function initMeasure() {
  const startBtn = document.getElementById('btn-start-measure');
  const infoDiv = document.getElementById('measure-info');

  startBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const existing = document.getElementById('measure-overlay');
          if (existing) existing.remove();

          const overlay = document.createElement('div');
          overlay.id = 'measure-overlay';
          overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;cursor:crosshair;';

          const tooltip = document.createElement('div');
          tooltip.id = 'measure-tooltip';
          tooltip.style.cssText = 'position:fixed;background:#333;color:#fff;padding:8px 12px;border-radius:4px;font-size:12px;pointer-events:none;z-index:1000000;display:none;';
          document.body.appendChild(tooltip);
          document.body.appendChild(overlay);

          let lastHighlighted = null;

          overlay.addEventListener('mousemove', (e) => {
            overlay.style.display = 'none';
            const el = document.elementFromPoint(e.clientX, e.clientY);
            overlay.style.display = 'block';

            if (el && el !== lastHighlighted) {
              if (lastHighlighted) lastHighlighted.style.outline = '';
              el.style.outline = '2px solid #ff00ff';
              lastHighlighted = el;

              const rect = el.getBoundingClientRect();
              tooltip.innerHTML = `${el.tagName.toLowerCase()}<br>${Math.round(rect.width)}×${Math.round(rect.height)}px`;
              tooltip.style.display = 'block';
            }
            tooltip.style.left = (e.clientX + 10) + 'px';
            tooltip.style.top = (e.clientY + 10) + 'px';
          });

          overlay.addEventListener('click', (e) => {
            overlay.style.display = 'none';
            const el = document.elementFromPoint(e.clientX, e.clientY);
            overlay.style.display = 'block';

            if (el) {
              const rect = el.getBoundingClientRect();
              const computed = window.getComputedStyle(el);
              alert(`Element: ${el.tagName}\nDimensions: ${Math.round(rect.width)}×${Math.round(rect.height)}px\nPadding: ${computed.padding}\nMargin: ${computed.margin}`);
            }
          });

          document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
              overlay.remove();
              tooltip.remove();
              if (lastHighlighted) lastHighlighted.style.outline = '';
              document.removeEventListener('keydown', escHandler);
            }
          });
        }
      });

      infoDiv.textContent = 'Mode mesure active! Appuyez sur Echap pour quitter.';
    } catch (error) {
      infoDiv.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });
}
