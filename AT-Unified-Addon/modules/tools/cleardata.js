// Tool: Clear Site Data
// Clear cookies, cache, and local storage for the current domain

export async function initClearData() {
  const clearBtn = document.getElementById('btn-clear-data');
  const checkCookies = document.getElementById('clear-cookies');
  const checkCache = document.getElementById('clear-cache');
  const checkStorage = document.getElementById('clear-storage');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    const domain = url.hostname;

    clearBtn.addEventListener('click', async () => {
      try {
        // Clear cookies
        if (checkCookies.checked) {
          const cookies = await chrome.cookies.getAll({ domain });
          for (const cookie of cookies) {
            await chrome.cookies.remove({ url: `${url.protocol}//${cookie.domain}${cookie.path}`, name: cookie.name });
          }
        }

        // Clear storage (localStorage/sessionStorage)
        if (checkStorage.checked) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              localStorage.clear();
              sessionStorage.clear();
            }
          });
        }

        // Cache requires page reload
        if (checkCache.checked) {
          // Note: Cache clearing through browsingData API
          await chrome.browsingData.removeCache({ origins: [url.origin] });
        }

        clearBtn.textContent = 'Efface!';
        setTimeout(() => { clearBtn.textContent = 'Effacer les donnees'; }, 1000);

      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Erreur: ' + error.message);
      }
    });
  } catch (error) {
    console.error('Error initializing clear data:', error);
  }
}
