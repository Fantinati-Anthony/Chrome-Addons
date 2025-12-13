// Tool: HTTP Headers
// Fetch and display HTTP headers from the current page

import { escapeHtml } from './utils.js';

export async function initHeaders() {
  const fetchBtn = document.getElementById('btn-fetch-headers');
  const headersList = document.getElementById('headers-list');

  fetchBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      headersList.innerHTML = 'Chargement...';

      const response = await fetch(tab.url, { method: 'HEAD' });
      const headers = [];
      response.headers.forEach((value, key) => {
        headers.push({ key, value });
      });

      renderHeaders(headers);
    } catch (error) {
      headersList.innerHTML = '<div class="status-message error">Erreur lors du chargement</div>';
    }
  });

  function renderHeaders(headers) {
    if (headers.length === 0) {
      headersList.innerHTML = '<div class="status-message info">Aucun header</div>';
      return;
    }
    headersList.innerHTML = '';
    headers.forEach(h => {
      const item = document.createElement('div');
      item.className = 'header-item';
      item.innerHTML = `<strong>${escapeHtml(h.key)}:</strong> ${escapeHtml(h.value)}`;
      headersList.appendChild(item);
    });
  }
}
