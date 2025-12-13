// Tool: Grid Overlay
// Display a grid overlay on the page

export async function initGridOverlay() {
  const columnsInput = document.getElementById('grid-columns');
  const gutterInput = document.getElementById('grid-gutter');
  const colorInput = document.getElementById('grid-color');
  const showBtn = document.getElementById('btn-show-grid');
  const hideBtn = document.getElementById('btn-hide-grid');

  showBtn.addEventListener('click', async () => {
    const columns = parseInt(columnsInput.value) || 12;
    const gutter = parseInt(gutterInput.value) || 20;
    const color = colorInput.value || '#ff00ff';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (cols, gut, col) => {
          const existing = document.getElementById('grid-overlay-container');
          if (existing) existing.remove();

          const container = document.createElement('div');
          container.id = 'grid-overlay-container';
          container.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:999998;display:flex;padding:0 ${gut}px;`;

          for (let i = 0; i < cols; i++) {
            const colEl = document.createElement('div');
            colEl.style.cssText = `flex:1;margin:0 ${gut/2}px;background:${col};opacity:0.2;`;
            container.appendChild(colEl);
          }

          document.body.appendChild(container);
        },
        args: [columns, gutter, color]
      });
    } catch (error) {
      console.error('Error showing grid:', error);
    }
  });

  hideBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const existing = document.getElementById('grid-overlay-container');
          if (existing) existing.remove();
        }
      });
    } catch (error) {
      console.error('Error hiding grid:', error);
    }
  });
}
