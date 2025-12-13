// Tool: JavaScript Injection
// Execute custom JavaScript in the current page

export function initJS() {
  const jsTextarea = document.getElementById('js-code');
  const injectJsBtn = document.getElementById('btn-inject-js');

  injectJsBtn.addEventListener('click', async () => {
    const code = jsTextarea.value.trim();
    if (!code) { alert('Veuillez entrer du JavaScript'); return; }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (jsCode) => {
          try { eval(jsCode); }
          catch (e) { alert('Erreur JS: ' + e.message); }
        },
        args: [code]
      });
      injectJsBtn.textContent = 'Execute!';
      setTimeout(() => { injectJsBtn.textContent = 'Executer JS'; }, 1000);
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  });
}
