// Tool: Color Picker
// Allows picking colors from the screen using EyeDropper API

export function initColorPicker() {
  const pickColorBtn = document.getElementById('btn-pick-color');
  const colorList = document.getElementById('color-list');
  const clearColorsBtn = document.getElementById('btn-clear-colors');

  loadColors();

  pickColorBtn.addEventListener('click', async () => {
    if (!window.EyeDropper) {
      alert('Votre navigateur ne supporte pas l\'API EyeDropper');
      return;
    }
    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      const color = result.sRGBHex.toUpperCase();
      await navigator.clipboard.writeText(color);
      chrome.storage.local.get(['colors'], (data) => {
        const colors = data.colors || [];
        if (!colors.includes(color)) {
          colors.unshift(color);
          chrome.storage.local.set({ colors }, loadColors);
        }
      });
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error picking color:', error);
      }
    }
  });

  clearColorsBtn.addEventListener('click', () => {
    chrome.storage.local.set({ colors: [] }, loadColors);
  });

  function loadColors() {
    chrome.storage.local.get(['colors'], (localData) => {
      chrome.storage.sync.get(['link1Url'], (syncData) => {
        const colors = localData.colors || [];
        const baseUrl = syncData.link1Url || '';
        renderColors(colors, baseUrl);
      });
    });
  }

  function renderColors(colors, baseUrl) {
    colorList.innerHTML = '';
    if (colors.length === 0) {
      colorList.innerHTML = '<div class="status-message info">Aucune couleur</div>';
      return;
    }
    colors.forEach((color, index) => {
      const item = document.createElement('div');
      item.className = 'color-item';

      const analyzeLink = baseUrl
        ? `<a class="color-link" href="${baseUrl}/outils/analyses-couleurs?couleur=${encodeURIComponent(color)}" target="_blank">Analyser</a>`
        : '';

      item.innerHTML = `
        <div class="color-badge" style="background-color: ${color}"></div>
        <span class="color-hex" data-color="${color}">${color}</span>
        ${analyzeLink}
        <button class="color-delete" data-index="${index}">X</button>
      `;
      colorList.appendChild(item);
    });

    colorList.querySelectorAll('.color-hex').forEach(el => {
      el.addEventListener('click', async () => {
        const color = el.dataset.color;
        await navigator.clipboard.writeText(color);
        el.textContent = 'Copie!';
        setTimeout(() => { el.textContent = color; }, 1000);
      });
    });

    colorList.querySelectorAll('.color-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index);
        chrome.storage.local.get(['colors'], (data) => {
          const colors = data.colors || [];
          colors.splice(index, 1);
          chrome.storage.local.set({ colors }, loadColors);
        });
      });
    });
  }
}
