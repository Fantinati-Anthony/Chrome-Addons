// Tool: Color Palette Extractor
// Extract colors used on the page

export async function initPalette() {
  const extractBtn = document.getElementById('btn-extract-palette');
  const resultsDiv = document.getElementById('palette-results');
  const copyBtn = document.getElementById('btn-copy-palette');

  let allColors = [];

  extractBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const colors = new Set();
          const colorRegex = /#[0-9A-Fa-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)/g;

          document.querySelectorAll('*').forEach(el => {
            const computed = window.getComputedStyle(el);
            ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
              const value = computed[prop];
              if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
                colors.add(value);
              }
            });
          });

          try {
            for (const sheet of document.styleSheets) {
              try {
                for (const rule of sheet.cssRules) {
                  const matches = rule.cssText?.match(colorRegex) || [];
                  matches.forEach(m => colors.add(m));
                }
              } catch (e) {}
            }
          } catch (e) {}

          return [...colors].slice(0, 30);
        }
      });

      if (results && results[0] && results[0].result) {
        allColors = results[0].result;
        renderPalette(allColors);
      }
    } catch (error) {
      resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });

  copyBtn.addEventListener('click', async () => {
    if (allColors.length > 0) {
      await navigator.clipboard.writeText(allColors.join('\n'));
      copyBtn.textContent = 'Copie!';
      setTimeout(() => { copyBtn.textContent = 'Copier tout'; }, 1000);
    }
  });

  function renderPalette(colors) {
    if (colors.length === 0) {
      resultsDiv.innerHTML = '<div class="status-message info">Aucune couleur trouvee</div>';
      return;
    }
    resultsDiv.innerHTML = colors.map(color => `
      <div class="palette-color" style="background-color: ${color}" title="${color}" data-color="${color}"></div>
    `).join('');

    resultsDiv.querySelectorAll('.palette-color').forEach(el => {
      el.addEventListener('click', async () => {
        await navigator.clipboard.writeText(el.dataset.color);
        el.classList.add('copied');
        setTimeout(() => el.classList.remove('copied'), 500);
      });
    });
  }
}
