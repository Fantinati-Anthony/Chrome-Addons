// Tool: Window Resize
// Resize browser window to preset dimensions

export function initResize() {
  document.querySelectorAll('.resize-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const width = parseInt(btn.dataset.width);
      const height = parseInt(btn.dataset.height);
      chrome.windows.getCurrent((window) => {
        chrome.windows.update(window.id, { width, height });
      });
    });
  });
}
