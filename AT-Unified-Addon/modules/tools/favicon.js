// Tool: Favicon Extractor
// Extract and check favicons from websites

export async function initFavicon() {
  const previewDiv = document.getElementById('favicon-current');
  const extractBtn = document.getElementById('btn-extract-favicon');
  const resultsDiv = document.getElementById('favicon-results');
  const generateBtn = document.getElementById('btn-generate-favicon');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.favIconUrl) {
      previewDiv.innerHTML = `<img src="${tab.favIconUrl}" style="width:32px;height:32px;"> <img src="${tab.favIconUrl}" style="width:48px;height:48px;">`;
    } else {
      previewDiv.innerHTML = '<div class="status-message info">Aucun favicon detecte</div>';
    }
  } catch (e) {
    previewDiv.innerHTML = '<div class="status-message error">Erreur</div>';
  }

  extractBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const domain = new URL(tab.url).origin;
      const sizes = [16, 32, 48, 64, 128];
      resultsDiv.innerHTML = sizes.map(size => `
        <div class="favicon-size-item" data-url="https://www.google.com/s2/favicons?domain=${domain}&sz=${size}">
          <img src="https://www.google.com/s2/favicons?domain=${domain}&sz=${size}" width="${Math.min(size, 48)}">
          <span>${size}x${size}</span>
        </div>
      `).join('');

      resultsDiv.querySelectorAll('.favicon-size-item').forEach(item => {
        item.addEventListener('click', () => window.open(item.dataset.url, '_blank'));
      });
    } catch (e) {
      resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });

  generateBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.create({ url: `https://realfavicongenerator.net/favicon_checker?site=${encodeURIComponent(tab.url)}` });
  });
}
