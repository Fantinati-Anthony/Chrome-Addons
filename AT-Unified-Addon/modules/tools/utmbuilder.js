// Tool: UTM Builder
// Generate URLs with UTM parameters

import { escapeHtml } from './utils.js';

export async function initUTMBuilder() {
  const baseUrlDiv = document.getElementById('utm-base-url');
  const sourceInput = document.getElementById('utm-source');
  const mediumInput = document.getElementById('utm-medium');
  const campaignInput = document.getElementById('utm-campaign');
  const termInput = document.getElementById('utm-term');
  const contentInput = document.getElementById('utm-content');
  const generateBtn = document.getElementById('btn-generate-utm');
  const resultDiv = document.getElementById('utm-result');
  const copyBtn = document.getElementById('btn-copy-utm');

  let baseUrl = '';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    baseUrl = tab.url.split('?')[0];
    baseUrlDiv.textContent = baseUrl.length > 50 ? baseUrl.substring(0, 50) + '...' : baseUrl;
  } catch (e) {
    baseUrlDiv.textContent = 'URL non disponible';
  }

  generateBtn.addEventListener('click', () => {
    const params = new URLSearchParams();

    if (sourceInput.value) params.set('utm_source', sourceInput.value);
    if (mediumInput.value) params.set('utm_medium', mediumInput.value);
    if (campaignInput.value) params.set('utm_campaign', campaignInput.value);
    if (termInput.value) params.set('utm_term', termInput.value);
    if (contentInput.value) params.set('utm_content', contentInput.value);

    const fullUrl = baseUrl + (params.toString() ? '?' + params.toString() : '');
    resultDiv.innerHTML = `<a href="${escapeHtml(fullUrl)}" target="_blank">${escapeHtml(fullUrl)}</a>`;
  });

  copyBtn.addEventListener('click', async () => {
    const link = resultDiv.querySelector('a');
    if (link) {
      await navigator.clipboard.writeText(link.href);
      copyBtn.textContent = 'Copie!';
      setTimeout(() => { copyBtn.textContent = 'Copier'; }, 1000);
    }
  });
}
