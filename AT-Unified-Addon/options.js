// Options page script
document.addEventListener('DOMContentLoaded', () => {
  // Quick links elements
  const link1NameInput = document.getElementById('link1-name');
  const link1UrlInput = document.getElementById('link1-url');
  const link2NameInput = document.getElementById('link2-name');
  const link2UrlInput = document.getElementById('link2-url');
  const saveLinksBtn = document.getElementById('btn-save-links');
  const updateFaviconBtn = document.getElementById('btn-update-favicon');
  const linksStatus = document.getElementById('links-status');

  // GitHub status element
  const githubStatus = document.getElementById('github-status');

  // OpenAI settings elements
  const apiKeyInput = document.getElementById('api-key');
  const showApiKeyCheckbox = document.getElementById('show-api-key');
  const saveApiKeyBtn = document.getElementById('btn-save-api-key');
  const apiKeyStatus = document.getElementById('api-key-status');

  // Ding settings elements
  const enableDingCheckbox = document.getElementById('enable-ding');
  const dingVolumeSlider = document.getElementById('ding-volume');
  const saveDingBtn = document.getElementById('btn-save-ding');
  const dingStatus = document.getElementById('ding-status');

  // Clear data elements
  const clearAllBtn = document.getElementById('btn-clear-all');
  const clearStatus = document.getElementById('clear-status');

  // Default config values
  const DEFAULT_QUICK_LINKS = {
    link1Name: 'Lien 1',
    link1Url: '',
    link2Name: 'Lien 2',
    link2Url: ''
  };

  // Load all saved settings
  chrome.storage.sync.get([
    'link1Name', 'link1Url', 'link2Name', 'link2Url',
    'openaiApiKey', 'enableDing', 'dingVolume'
  ], (data) => {
    // Quick links settings
    link1NameInput.value = data.link1Name || DEFAULT_QUICK_LINKS.link1Name;
    link1UrlInput.value = data.link1Url || DEFAULT_QUICK_LINKS.link1Url;
    link2NameInput.value = data.link2Name || DEFAULT_QUICK_LINKS.link2Name;
    link2UrlInput.value = data.link2Url || DEFAULT_QUICK_LINKS.link2Url;

    // OpenAI settings
    if (data.openaiApiKey) {
      apiKeyInput.value = data.openaiApiKey;
    }

    // Ding settings
    if (typeof data.enableDing === 'boolean') {
      enableDingCheckbox.checked = data.enableDing;
    }
    if (typeof data.dingVolume === 'number') {
      dingVolumeSlider.value = data.dingVolume;
    }
  });

  // Save quick links
  saveLinksBtn.addEventListener('click', () => {
    const config = {
      link1Name: link1NameInput.value.trim() || DEFAULT_QUICK_LINKS.link1Name,
      link1Url: link1UrlInput.value.trim(),
      link2Name: link2NameInput.value.trim() || DEFAULT_QUICK_LINKS.link2Name,
      link2Url: link2UrlInput.value.trim()
    };

    chrome.storage.sync.set(config, () => {
      showStatus(linksStatus, 'Liens rapides sauvegardes!', 'success');
      // Mark as configured
      chrome.storage.sync.set({ linksConfigured: true });
    });
  });

  // Update favicon as extension icon
  updateFaviconBtn.addEventListener('click', async () => {
    const url = link1UrlInput.value.trim();

    if (!url) {
      showStatus(linksStatus, 'Veuillez entrer une URL pour le Lien 1', 'error');
      return;
    }

    updateFaviconBtn.disabled = true;
    updateFaviconBtn.textContent = 'Chargement...';

    try {
      // Extract domain from URL
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      // Use Google's favicon service (works for most sites)
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

      // Fetch favicon as blob
      const response = await fetch(faviconUrl);
      if (!response.ok) throw new Error('Impossible de recuperer le favicon');

      const blob = await response.blob();

      // Convert to base64 data URL
      const reader = new FileReader();
      reader.onload = async function() {
        const dataUrl = reader.result;

        // Create different sizes for the icon
        const sizes = [16, 32, 48, 128];
        const imageData = {};

        for (const size of sizes) {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          const img = new Image();
          img.src = dataUrl;

          await new Promise((resolve) => {
            img.onload = () => {
              ctx.drawImage(img, 0, 0, size, size);
              resolve();
            };
          });

          imageData[size] = ctx.getImageData(0, 0, size, size);
        }

        // Set the extension icon
        chrome.action.setIcon({ imageData });

        // Store favicon data for persistence
        chrome.storage.local.set({ customFavicon: dataUrl });

        showStatus(linksStatus, 'Icone mise a jour avec succes!', 'success');
        updateFaviconBtn.disabled = false;
        updateFaviconBtn.textContent = 'Mettre a jour l\'icone';
      };

      reader.readAsDataURL(blob);

    } catch (error) {
      console.error('Favicon error:', error);
      showStatus(linksStatus, 'Erreur: ' + error.message, 'error');
      updateFaviconBtn.disabled = false;
      updateFaviconBtn.textContent = 'Mettre a jour l\'icone';
    }
  });

  // Reset update cache button
  const forceUpdateBtn = document.getElementById('btn-force-update');
  if (forceUpdateBtn) {
    forceUpdateBtn.addEventListener('click', async () => {
      await chrome.storage.local.remove(['lastUpdateCheck', 'hasUpdate', 'remoteVersion', 'updateDismissed', 'dismissedVersion']);
      showStatus(githubStatus, 'Cache MAJ efface. Ouvrez le popup pour verifier les mises a jour.', 'success');
    });
  }

  // Toggle API key visibility
  showApiKeyCheckbox.addEventListener('change', () => {
    apiKeyInput.type = showApiKeyCheckbox.checked ? 'text' : 'password';
  });

  // Save API key
  saveApiKeyBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
      showStatus(apiKeyStatus, 'Veuillez entrer une cle API', 'error');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      showStatus(apiKeyStatus, 'La cle API doit commencer par "sk-"', 'error');
      return;
    }

    chrome.storage.sync.set({ openaiApiKey: apiKey }, () => {
      showStatus(apiKeyStatus, 'Cle API sauvegardee avec succes!', 'success');
    });
  });

  // Save ding settings
  saveDingBtn.addEventListener('click', () => {
    const enableDing = enableDingCheckbox.checked;
    const dingVolume = parseInt(dingVolumeSlider.value);

    chrome.storage.sync.set({ enableDing, dingVolume }, () => {
      showStatus(dingStatus, 'Parametres de notification sauvegardes!', 'success');
    });
  });

  // Clear all data
  clearAllBtn.addEventListener('click', () => {
    if (confirm('Etes-vous sur de vouloir effacer toutes les donnees? Cette action est irreversible.')) {
      chrome.storage.sync.clear(() => {
        chrome.storage.local.clear(() => {
          showStatus(clearStatus, 'Toutes les donnees ont ete effacees.', 'success');

          // Reset form to defaults
          link1NameInput.value = DEFAULT_QUICK_LINKS.link1Name;
          link1UrlInput.value = DEFAULT_QUICK_LINKS.link1Url;
          link2NameInput.value = DEFAULT_QUICK_LINKS.link2Name;
          link2UrlInput.value = DEFAULT_QUICK_LINKS.link2Url;

          apiKeyInput.value = '';
          enableDingCheckbox.checked = true;
          dingVolumeSlider.value = 50;
        });
      });
    }
  });

  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = 'status ' + type;
    element.style.display = 'block';

    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }
});
