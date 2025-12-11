// Options page script
document.addEventListener('DOMContentLoaded', () => {
  // ========== DEFAULT VALUES ==========
  const DEFAULT_COLORS = {
    bgColor: '#f5f5f5',
    textColor: '#333333',
    primaryColor: '#3498db',
    primaryHover: '#2980b9',
    secondaryColor: '#2c3e50',
    buttonBg: '#ffffff',
    buttonText: '#666666',
    panelBg: '#ffffff',
    borderColor: '#eeeeee',
    successColor: '#27ae60',
    errorColor: '#e74c3c'
  };

  const POPULAR_EMOJIS = [
    '🏠', '🏢', '💼', '📊', '📈', '🔧', '⚙️', '🛠️',
    '🌐', '🔗', '📧', '📩', '💬', '📱', '💻', '🖥️',
    '📁', '📂', '📄', '📝', '✏️', '🔍', '🔎', '📌',
    '⭐', '🌟', '💡', '🎯', '🚀', '🎨', '🎭', '🎪',
    '🛒', '🛍️', '💳', '💰', '📦', '🎁', '🔒', '🔑',
    '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍'
  ];

  // ========== COLOR CUSTOMIZATION ==========
  const colorInputs = {
    bgColor: document.getElementById('color-bg'),
    textColor: document.getElementById('color-text'),
    primaryColor: document.getElementById('color-primary'),
    primaryHover: document.getElementById('color-primary-hover'),
    secondaryColor: document.getElementById('color-secondary'),
    buttonBg: document.getElementById('color-button-bg'),
    buttonText: document.getElementById('color-button-text'),
    panelBg: document.getElementById('color-panel-bg'),
    borderColor: document.getElementById('color-border'),
    successColor: document.getElementById('color-success'),
    errorColor: document.getElementById('color-error')
  };

  const saveColorsBtn = document.getElementById('btn-save-colors');
  const resetColorsBtn = document.getElementById('btn-reset-colors');
  const colorsStatus = document.getElementById('colors-status');

  // Load saved colors
  chrome.storage.sync.get(['customColors'], (data) => {
    const colors = data.customColors || DEFAULT_COLORS;
    Object.keys(colorInputs).forEach(key => {
      if (colorInputs[key] && colors[key]) {
        colorInputs[key].value = colors[key];
      }
    });
  });

  // Save colors
  saveColorsBtn.addEventListener('click', () => {
    const colors = {};
    Object.keys(colorInputs).forEach(key => {
      colors[key] = colorInputs[key].value;
    });
    chrome.storage.sync.set({ customColors: colors }, () => {
      showStatus(colorsStatus, 'Couleurs sauvegardees!', 'success');
    });
  });

  // Reset colors
  resetColorsBtn.addEventListener('click', () => {
    Object.keys(colorInputs).forEach(key => {
      colorInputs[key].value = DEFAULT_COLORS[key];
    });
    chrome.storage.sync.set({ customColors: DEFAULT_COLORS }, () => {
      showStatus(colorsStatus, 'Couleurs reinitialisees!', 'success');
    });
  });

  // ========== BORDER RADIUS ==========
  const DEFAULT_RADIUS = {
    radiusSmall: 4,
    radiusMedium: 8,
    radiusLarge: 12
  };

  const radiusSmall = document.getElementById('radius-small');
  const radiusMedium = document.getElementById('radius-medium');
  const radiusLarge = document.getElementById('radius-large');
  const radiusSmallValue = document.getElementById('radius-small-value');
  const radiusMediumValue = document.getElementById('radius-medium-value');
  const radiusLargeValue = document.getElementById('radius-large-value');
  const saveRadiusBtn = document.getElementById('btn-save-radius');
  const resetRadiusBtn = document.getElementById('btn-reset-radius');
  const radiusStatus = document.getElementById('radius-status');

  // Update value display on slider change
  function updateRadiusDisplay() {
    if (radiusSmallValue) radiusSmallValue.textContent = radiusSmall.value + 'px';
    if (radiusMediumValue) radiusMediumValue.textContent = radiusMedium.value + 'px';
    if (radiusLargeValue) radiusLargeValue.textContent = radiusLarge.value + 'px';
  }

  if (radiusSmall) radiusSmall.addEventListener('input', updateRadiusDisplay);
  if (radiusMedium) radiusMedium.addEventListener('input', updateRadiusDisplay);
  if (radiusLarge) radiusLarge.addEventListener('input', updateRadiusDisplay);

  // Load saved radius
  chrome.storage.sync.get(['customRadius'], (data) => {
    const radius = data.customRadius || DEFAULT_RADIUS;
    if (radiusSmall) radiusSmall.value = radius.radiusSmall;
    if (radiusMedium) radiusMedium.value = radius.radiusMedium;
    if (radiusLarge) radiusLarge.value = radius.radiusLarge;
    updateRadiusDisplay();
  });

  // Save radius
  if (saveRadiusBtn) {
    saveRadiusBtn.addEventListener('click', () => {
      const radius = {
        radiusSmall: parseInt(radiusSmall.value),
        radiusMedium: parseInt(radiusMedium.value),
        radiusLarge: parseInt(radiusLarge.value)
      };
      chrome.storage.sync.set({ customRadius: radius }, () => {
        showStatus(radiusStatus, 'Arrondis sauvegardes!', 'success');
      });
    });
  }

  // Reset radius
  if (resetRadiusBtn) {
    resetRadiusBtn.addEventListener('click', () => {
      if (radiusSmall) radiusSmall.value = DEFAULT_RADIUS.radiusSmall;
      if (radiusMedium) radiusMedium.value = DEFAULT_RADIUS.radiusMedium;
      if (radiusLarge) radiusLarge.value = DEFAULT_RADIUS.radiusLarge;
      updateRadiusDisplay();
      chrome.storage.sync.set({ customRadius: DEFAULT_RADIUS }, () => {
        showStatus(radiusStatus, 'Arrondis reinitialises!', 'success');
      });
    });
  }

  // ========== DYNAMIC BUTTONS ==========
  const buttonsList = document.getElementById('buttons-list');
  const newBtnName = document.getElementById('new-btn-name');
  const newBtnUrl = document.getElementById('new-btn-url');
  const newBtnIcon = document.getElementById('new-btn-icon');
  const addButtonBtn = document.getElementById('btn-add-button');
  const buttonsStatus = document.getElementById('buttons-status');
  const emojiPickerBtn = document.getElementById('btn-emoji-picker');
  const emojiPicker = document.getElementById('emoji-picker');

  let customButtons = [];

  // Initialize emoji picker
  initEmojiPicker();

  // Load saved buttons
  loadButtons();

  function initEmojiPicker() {
    const emojiGrid = emojiPicker.querySelector('.emoji-grid');
    emojiGrid.innerHTML = '';
    POPULAR_EMOJIS.forEach(emoji => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'emoji-btn';
      btn.textContent = emoji;
      btn.addEventListener('click', () => {
        newBtnIcon.value = emoji;
        emojiPicker.classList.remove('show');
      });
      emojiGrid.appendChild(btn);
    });
  }

  emojiPickerBtn.addEventListener('click', () => {
    emojiPicker.classList.toggle('show');
  });

  // Close emoji picker when clicking outside
  document.addEventListener('click', (e) => {
    if (!emojiPicker.contains(e.target) && e.target !== emojiPickerBtn) {
      emojiPicker.classList.remove('show');
    }
  });

  function loadButtons() {
    chrome.storage.sync.get(['customButtons'], (data) => {
      customButtons = data.customButtons || [];
      renderButtons();
    });
  }

  function saveButtons() {
    chrome.storage.sync.set({ customButtons }, () => {
      showStatus(buttonsStatus, 'Boutons sauvegardes!', 'success');
    });
  }

  function renderButtons() {
    buttonsList.innerHTML = '';
    if (customButtons.length === 0) {
      buttonsList.innerHTML = '<p style="color: #999; font-size: 13px; text-align: center; padding: 20px;">Aucun bouton personnalise. Ajoutez-en un ci-dessous!</p>';
      return;
    }

    customButtons.forEach((btn, index) => {
      const item = document.createElement('div');
      item.className = 'button-item';
      item.innerHTML = `
        <input type="text" value="${escapeHtml(btn.name)}" data-field="name" data-index="${index}" placeholder="Nom">
        <input type="url" value="${escapeHtml(btn.url)}" data-field="url" data-index="${index}" placeholder="URL">
        <div class="btn-icon-preview" title="${btn.icon ? 'Emoji' : 'Favicon automatique'}">
          ${btn.icon ? btn.icon : `<img src="https://www.google.com/s2/favicons?domain=${getDomain(btn.url)}&sz=32" alt="favicon">`}
        </div>
        <button class="btn-delete" data-index="${index}" title="Supprimer">X</button>
      `;
      buttonsList.appendChild(item);
    });

    // Add event listeners for editing
    buttonsList.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        const field = e.target.dataset.field;
        customButtons[index][field] = e.target.value;
        saveButtons();
        if (field === 'url') {
          renderButtons(); // Re-render to update favicon
        }
      });
    });

    // Add event listeners for delete
    buttonsList.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        customButtons.splice(index, 1);
        saveButtons();
        renderButtons();
      });
    });
  }

  // Add new button
  addButtonBtn.addEventListener('click', () => {
    const name = newBtnName.value.trim();
    const url = newBtnUrl.value.trim();
    const icon = newBtnIcon.value.trim();

    if (!name) {
      showStatus(buttonsStatus, 'Veuillez entrer un nom', 'error');
      return;
    }

    if (!url) {
      showStatus(buttonsStatus, 'Veuillez entrer une URL', 'error');
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      showStatus(buttonsStatus, 'URL invalide', 'error');
      return;
    }

    customButtons.push({ name, url, icon });
    saveButtons();
    renderButtons();

    // Clear form
    newBtnName.value = '';
    newBtnUrl.value = '';
    newBtnIcon.value = '';
  });

  // ========== EXPORT/IMPORT ==========
  const exportBtn = document.getElementById('btn-export');
  const importTrigger = document.getElementById('btn-import-trigger');
  const importFile = document.getElementById('import-file');
  const exportStatus = document.getElementById('export-status');

  exportBtn.addEventListener('click', async () => {
    try {
      const syncData = await chrome.storage.sync.get(null);
      const localData = await chrome.storage.local.get(['colors', 'emails']);

      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        sync: syncData,
        local: {
          colors: localData.colors,
          emails: localData.emails
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `at-toolkit-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      showStatus(exportStatus, 'Reglages exportes avec succes!', 'success');
    } catch (error) {
      showStatus(exportStatus, 'Erreur lors de l\'export: ' + error.message, 'error');
    }
  });

  importTrigger.addEventListener('click', () => {
    importFile.click();
  });

  importFile.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || !data.sync) {
        throw new Error('Format de fichier invalide');
      }

      // Import sync data
      if (data.sync) {
        await chrome.storage.sync.set(data.sync);
      }

      // Import local data
      if (data.local) {
        await chrome.storage.local.set(data.local);
      }

      showStatus(exportStatus, 'Reglages importes avec succes! Rechargez la page.', 'success');

      // Reload the page to apply changes
      setTimeout(() => {
        location.reload();
      }, 1500);

    } catch (error) {
      showStatus(exportStatus, 'Erreur lors de l\'import: ' + error.message, 'error');
    }

    // Reset file input
    importFile.value = '';
  });

  // ========== GITHUB UPDATE CACHE ==========
  const forceUpdateBtn = document.getElementById('btn-force-update');
  const githubStatus = document.getElementById('github-status');

  if (forceUpdateBtn) {
    forceUpdateBtn.addEventListener('click', async () => {
      await chrome.storage.local.remove(['lastUpdateCheck', 'hasUpdate', 'remoteVersion', 'updateDismissed', 'dismissedVersion']);
      showStatus(githubStatus, 'Cache MAJ efface. Ouvrez le popup pour verifier les mises a jour.', 'success');
    });
  }

  // ========== OPENAI API KEY ==========
  const apiKeyInput = document.getElementById('api-key');
  const showApiKeyCheckbox = document.getElementById('show-api-key');
  const saveApiKeyBtn = document.getElementById('btn-save-api-key');
  const apiKeyStatus = document.getElementById('api-key-status');

  // Load API key
  chrome.storage.sync.get(['openaiApiKey'], (data) => {
    if (data.openaiApiKey) {
      apiKeyInput.value = data.openaiApiKey;
    }
  });

  showApiKeyCheckbox.addEventListener('change', () => {
    apiKeyInput.type = showApiKeyCheckbox.checked ? 'text' : 'password';
  });

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

  // ========== DING SETTINGS ==========
  const enableDingCheckbox = document.getElementById('enable-ding');
  const dingVolumeSlider = document.getElementById('ding-volume');
  const saveDingBtn = document.getElementById('btn-save-ding');
  const dingStatus = document.getElementById('ding-status');

  // Load ding settings
  chrome.storage.sync.get(['enableDing', 'dingVolume'], (data) => {
    if (typeof data.enableDing === 'boolean') {
      enableDingCheckbox.checked = data.enableDing;
    }
    if (typeof data.dingVolume === 'number') {
      dingVolumeSlider.value = data.dingVolume;
    }
  });

  saveDingBtn.addEventListener('click', () => {
    const enableDing = enableDingCheckbox.checked;
    const dingVolume = parseInt(dingVolumeSlider.value);

    chrome.storage.sync.set({ enableDing, dingVolume }, () => {
      showStatus(dingStatus, 'Parametres de notification sauvegardes!', 'success');
    });
  });

  // ========== CLEAR ALL DATA ==========
  const clearAllBtn = document.getElementById('btn-clear-all');
  const clearStatus = document.getElementById('clear-status');

  clearAllBtn.addEventListener('click', () => {
    if (confirm('Etes-vous sur de vouloir effacer toutes les donnees? Cette action est irreversible.')) {
      chrome.storage.sync.clear(() => {
        chrome.storage.local.clear(() => {
          showStatus(clearStatus, 'Toutes les donnees ont ete effacees. Rechargez la page.', 'success');
          setTimeout(() => {
            location.reload();
          }, 1500);
        });
      });
    }
  });

  // ========== UTILITY FUNCTIONS ==========
  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = 'status ' + type;
    element.style.display = 'block';

    setTimeout(() => {
      element.style.display = 'none';
    }, 5000);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return '';
    }
  }
});
