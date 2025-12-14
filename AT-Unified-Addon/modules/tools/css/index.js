// Tool: CSS Injection
// Inject custom CSS into the current page

export async function initCSS() {
  const cssDomainDiv = document.getElementById('css-domain');
  const cssTextarea = document.getElementById('css-code');
  const injectCssBtn = document.getElementById('btn-inject-css');

  let currentDomain = '';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      const url = new URL(tab.url);
      currentDomain = url.hostname;
      cssDomainDiv.textContent = `Domaine: ${currentDomain}`;

      chrome.storage.sync.get([currentDomain], (data) => {
        if (data[currentDomain]) cssTextarea.value = data[currentDomain];
      });
    }
  } catch (e) {
    cssDomainDiv.textContent = 'Domaine: N/A';
  }

  injectCssBtn.addEventListener('click', async () => {
    const css = cssTextarea.value.trim();
    if (!css) { alert('Veuillez entrer du CSS'); return; }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (currentDomain) chrome.storage.sync.set({ [currentDomain]: css });
      await chrome.scripting.insertCSS({ target: { tabId: tab.id }, css });
      injectCssBtn.textContent = 'Injecte!';
      setTimeout(() => { injectCssBtn.textContent = 'Injecter CSS'; }, 1000);
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  });
}
