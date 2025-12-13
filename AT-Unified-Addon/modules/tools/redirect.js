// Tool: Redirect Checker
// Check URL redirects via wheregoes.com

export async function initRedirect() {
  const urlDiv = document.getElementById('redirect-url');
  const checkBtn = document.getElementById('btn-check-redirect');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      urlDiv.textContent = tab.url.substring(0, 50) + (tab.url.length > 50 ? '...' : '');
    }
  } catch (e) {
    urlDiv.textContent = 'URL non disponible';
  }

  checkBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) return;
      chrome.tabs.create({ url: `https://wheregoes.com/retracer.php?url=${encodeURIComponent(tab.url)}` });
    } catch (error) {
      console.error('Redirect check error:', error);
    }
  });
}
