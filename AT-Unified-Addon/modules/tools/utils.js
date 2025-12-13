// Shared utility functions for tools

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML string
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get domain from URL
 * @param {string} url - URL to parse
 * @returns {string} Domain name
 */
export function getDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

/**
 * Copy text to clipboard with feedback
 * @param {string} text - Text to copy
 * @param {HTMLElement} button - Button element to update
 * @param {string} originalText - Original button text to restore
 */
export async function copyToClipboard(text, button, originalText) {
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = 'Copie!';
    setTimeout(() => { button.textContent = originalText; }, 1000);
    return true;
  } catch (e) {
    console.error('Copy failed:', e);
    return false;
  }
}

/**
 * Get current tab info
 * @returns {Promise<chrome.tabs.Tab>} Current tab
 */
export async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Get current domain from active tab
 * @returns {Promise<string>} Current domain
 */
export async function getCurrentDomain() {
  const tab = await getCurrentTab();
  if (tab?.url) {
    return new URL(tab.url).hostname;
  }
  return '';
}
