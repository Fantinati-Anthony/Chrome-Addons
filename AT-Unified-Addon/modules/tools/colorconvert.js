// Tool: Color Converter
// Convert colors between HEX, RGB, RGBA, HSL formats

export function initColorConvert() {
  const colorInput = document.getElementById('color-input');
  const colorVisual = document.getElementById('color-visual');
  const convertBtn = document.getElementById('btn-convert-color');
  const resultsDiv = document.getElementById('color-results');

  colorVisual.addEventListener('input', () => {
    colorInput.value = colorVisual.value;
  });

  convertBtn.addEventListener('click', () => {
    let color = colorInput.value.trim();
    let r, g, b;

    if (color.match(/^#?[0-9a-f]{6}$/i)) {
      color = color.replace('#', '');
      r = parseInt(color.substr(0, 2), 16);
      g = parseInt(color.substr(2, 2), 16);
      b = parseInt(color.substr(4, 2), 16);
    } else if (color.match(/^#?[0-9a-f]{3}$/i)) {
      color = color.replace('#', '');
      r = parseInt(color[0] + color[0], 16);
      g = parseInt(color[1] + color[1], 16);
      b = parseInt(color[2] + color[2], 16);
    } else if (color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i)) {
      const match = color.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
    } else {
      resultsDiv.innerHTML = '<div class="status-message error">Format non reconnu</div>';
      return;
    }

    const hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
    const rgb = `rgb(${r}, ${g}, ${b})`;
    const rgba = `rgba(${r}, ${g}, ${b}, 1)`;

    const rN = r / 255, gN = g / 255, bN = b / 255;
    const max = Math.max(rN, gN, bN), min = Math.min(rN, gN, bN);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case rN: h = ((gN - bN) / d + (gN < bN ? 6 : 0)) / 6; break;
        case gN: h = ((bN - rN) / d + 2) / 6; break;
        case bN: h = ((rN - gN) / d + 4) / 6; break;
      }
    }
    const hsl = `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;

    colorVisual.value = hex;

    resultsDiv.innerHTML = `
      <div class="color-format-item"><span class="format-name">HEX</span><span class="format-value" data-copy="${hex}">${hex}</span></div>
      <div class="color-format-item"><span class="format-name">RGB</span><span class="format-value" data-copy="${rgb}">${rgb}</span></div>
      <div class="color-format-item"><span class="format-name">RGBA</span><span class="format-value" data-copy="${rgba}">${rgba}</span></div>
      <div class="color-format-item"><span class="format-name">HSL</span><span class="format-value" data-copy="${hsl}">${hsl}</span></div>
    `;

    resultsDiv.querySelectorAll('.format-value').forEach(el => {
      el.addEventListener('click', async () => {
        await navigator.clipboard.writeText(el.dataset.copy);
        el.textContent = 'Copie!';
        setTimeout(() => { el.textContent = el.dataset.copy; }, 1000);
      });
    });
  });
}
