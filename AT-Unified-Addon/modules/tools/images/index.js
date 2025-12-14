// Tool: Page Images Extractor
// Extract all images from the current page

import { escapeHtml } from './utils.js';

export async function initImages() {
  const extractBtn = document.getElementById('btn-extract-images');
  const statsDiv = document.getElementById('images-stats');
  const imagesList = document.getElementById('images-list');
  const copyBtn = document.getElementById('btn-copy-images');

  let allImages = [];

  extractBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const images = [];
          document.querySelectorAll('img[src]').forEach(img => {
            if (img.src && !img.src.startsWith('data:')) {
              images.push({ src: img.src, alt: img.alt || '', width: img.naturalWidth, height: img.naturalHeight });
            }
          });
          return images;
        }
      });

      if (results && results[0] && results[0].result) {
        allImages = results[0].result;
        statsDiv.innerHTML = `<strong>${allImages.length}</strong> images trouvees`;
        renderImages(allImages);
      }
    } catch (error) {
      imagesList.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  });

  copyBtn.addEventListener('click', async () => {
    if (allImages.length > 0) {
      await navigator.clipboard.writeText(allImages.map(i => i.src).join('\n'));
      copyBtn.textContent = 'Copie!';
      setTimeout(() => { copyBtn.textContent = 'Copier URLs'; }, 1000);
    }
  });

  function renderImages(images) {
    imagesList.innerHTML = '';
    images.slice(0, 50).forEach(img => {
      const item = document.createElement('div');
      item.className = 'image-item';
      item.innerHTML = `
        <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" style="max-width:60px;max-height:40px;">
        <span>${img.width}x${img.height}</span>
        <a href="${escapeHtml(img.src)}" target="_blank">↗</a>
      `;
      imagesList.appendChild(item);
    });
    if (images.length > 50) {
      imagesList.innerHTML += `<div class="status-message info">+${images.length - 50} autres images...</div>`;
    }
  }
}
