// Tool: Cookies Viewer
// Display and export cookies for the current domain

import { escapeHtml } from './utils.js';

export async function initCookies() {
  const domainDiv = document.getElementById('cookies-domain');
  const cookiesList = document.getElementById('cookies-list');
  const copyBtn = document.getElementById('btn-copy-cookies');

  let allCookies = [];

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    domainDiv.textContent = `Domaine: ${url.hostname}`;

    const cookies = await chrome.cookies.getAll({ domain: url.hostname });
    allCookies = cookies;
    renderCookies(cookies);
  } catch (error) {
    cookiesList.innerHTML = '<div class="status-message error">Erreur</div>';
  }

  copyBtn.addEventListener('click', async () => {
    if (allCookies.length > 0) {
      await navigator.clipboard.writeText(JSON.stringify(allCookies, null, 2));
      copyBtn.textContent = 'Copie!';
      setTimeout(() => { copyBtn.textContent = 'Copier JSON'; }, 1000);
    }
  });

  function renderCookies(cookies) {
    if (cookies.length === 0) {
      cookiesList.innerHTML = '<div class="status-message info">Aucun cookie</div>';
      return;
    }
    cookiesList.innerHTML = '';
    cookies.forEach(c => {
      const item = document.createElement('div');
      item.className = 'cookie-item';
      item.innerHTML = `
        <strong>${escapeHtml(c.name)}</strong>
        <span class="cookie-value">${escapeHtml(c.value.substring(0, 30))}${c.value.length > 30 ? '...' : ''}</span>
      `;
      cookiesList.appendChild(item);
    });
  }
}
