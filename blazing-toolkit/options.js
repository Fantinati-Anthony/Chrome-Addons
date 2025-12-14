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

  // ========== GENERAL SETTINGS (TITLE + LANGUAGE) ==========
  const popupTitleInput = document.getElementById('popup-title-input');
  const languageSelect = document.getElementById('language-select');
  const saveGeneralBtn = document.getElementById('btn-save-general');
  const generalStatus = document.getElementById('general-status');

  // Load saved settings
  chrome.storage.sync.get(['popupTitle', 'language'], (data) => {
    if (data.popupTitle && popupTitleInput) {
      popupTitleInput.value = data.popupTitle;
    }
    if (data.language && languageSelect) {
      languageSelect.value = data.language;
    }
  });

  // Save general settings
  if (saveGeneralBtn) {
    saveGeneralBtn.addEventListener('click', () => {
      const title = popupTitleInput.value.trim() || 'Toolkit';
      const language = languageSelect.value || 'fr';
      chrome.storage.sync.set({ popupTitle: title, language: language }, () => {
        showStatus(generalStatus, 'Parametres sauvegardes!', 'success');
      });
    });
  }

  // ========== MODULE MANAGEMENT ==========
  const moduleCheckboxes = document.querySelectorAll('[data-module]');
  const enableAllBtn = document.getElementById('btn-enable-all-modules');
  const disableAllBtn = document.getElementById('btn-disable-all-modules');
  const saveModulesBtn = document.getElementById('btn-save-modules');
  const modulesStatus = document.getElementById('modules-status');

  // Load saved module states
  loadModuleStates();

  function loadModuleStates() {
    chrome.storage.sync.get(['enabledModules'], (data) => {
      const modules = data.enabledModules || {};
      moduleCheckboxes.forEach(checkbox => {
        const moduleId = checkbox.dataset.module;
        // Default to enabled if not specified
        checkbox.checked = modules[moduleId] !== false;
      });
    });
  }

  // Enable all modules
  if (enableAllBtn) {
    enableAllBtn.addEventListener('click', () => {
      moduleCheckboxes.forEach(cb => cb.checked = true);
    });
  }

  // Disable all modules
  if (disableAllBtn) {
    disableAllBtn.addEventListener('click', () => {
      moduleCheckboxes.forEach(cb => cb.checked = false);
    });
  }

  // Save modules
  if (saveModulesBtn) {
    saveModulesBtn.addEventListener('click', () => {
      const modules = {};
      moduleCheckboxes.forEach(checkbox => {
        modules[checkbox.dataset.module] = checkbox.checked;
      });
      chrome.storage.sync.set({ enabledModules: modules }, () => {
        showStatus(modulesStatus, 'Modules sauvegardes!', 'success');
      });
    });
  }

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

  // ========== BUTTON SIZE ==========
  const buttonSizeSlider = document.getElementById('button-size');
  const buttonSizeValue = document.getElementById('button-size-value');
  const sizePreviewBtn = document.getElementById('size-preview-btn');
  const saveSizeBtn = document.getElementById('btn-save-size');
  const resetSizeBtn = document.getElementById('btn-reset-size');
  const sizeStatus = document.getElementById('size-status');

  function updateSizeDisplay() {
    if (buttonSizeValue && buttonSizeSlider) {
      const percent = Math.round(parseFloat(buttonSizeSlider.value) * 100);
      buttonSizeValue.textContent = percent + '%';

      // Update preview
      if (sizePreviewBtn) {
        const size = parseFloat(buttonSizeSlider.value);
        sizePreviewBtn.style.padding = `${12 * size}px ${8 * size}px`;
        sizePreviewBtn.querySelector('span:first-child').style.fontSize = `${24 * size}px`;
        sizePreviewBtn.querySelector('span:last-child').style.fontSize = `${10 * size}px`;
      }
    }
  }

  if (buttonSizeSlider) {
    buttonSizeSlider.addEventListener('input', updateSizeDisplay);
  }

  // Load saved size
  chrome.storage.sync.get(['buttonSize'], (data) => {
    const size = data.buttonSize || 1;
    if (buttonSizeSlider) buttonSizeSlider.value = size;
    updateSizeDisplay();
  });

  // Save size
  if (saveSizeBtn) {
    saveSizeBtn.addEventListener('click', () => {
      const size = parseFloat(buttonSizeSlider.value);
      chrome.storage.sync.set({ buttonSize: size }, () => {
        showStatus(sizeStatus, 'Taille sauvegardee!', 'success');
      });
    });
  }

  // Reset size
  if (resetSizeBtn) {
    resetSizeBtn.addEventListener('click', () => {
      if (buttonSizeSlider) buttonSizeSlider.value = 1;
      updateSizeDisplay();
      chrome.storage.sync.set({ buttonSize: 1 }, () => {
        showStatus(sizeStatus, 'Taille reinitialisee!', 'success');
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
        <div class="btn-order-controls">
          <button class="btn-move-up" data-index="${index}" title="Monter" ${index === 0 ? 'disabled' : ''}>▲</button>
          <button class="btn-move-down" data-index="${index}" title="Descendre" ${index === customButtons.length - 1 ? 'disabled' : ''}>▼</button>
        </div>
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

    // Add event listeners for move up
    buttonsList.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        if (index > 0) {
          const temp = customButtons[index];
          customButtons[index] = customButtons[index - 1];
          customButtons[index - 1] = temp;
          saveButtons();
          renderButtons();
        }
      });
    });

    // Add event listeners for move down
    buttonsList.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        if (index < customButtons.length - 1) {
          const temp = customButtons[index];
          customButtons[index] = customButtons[index + 1];
          customButtons[index + 1] = temp;
          saveButtons();
          renderButtons();
        }
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
        version: '2.0',
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

  // ========== REORDER CATEGORIES AND TOOLS ==========
  const CATEGORIES_CONFIG = {
    network: { emoji: '🖥️', name: 'Reseau & Remote', tools: ['myip', 'remotedesktop', 'speedtest', 'ping', 'traceroute', 'portscan', 'dnslookup'] },
    domainDns: { emoji: '🌐', name: 'Domaine & DNS', tools: ['whois', 'dnschecker', 'mailtester', 'ssl'] },
    seoAnalysis: { emoji: '📊', name: 'SEO & Analyse', tools: ['metatags', 'links', 'images', 'sitemap', 'pagespeed', 'lighthouse', 'keywords', 'headings', 'brokenlinks', 'readability', 'robotstxt', 'schema', 'socialpreview', 'mobiletest'] },
    development: { emoji: '💻', name: 'Developpement', tools: ['resize', 'css', 'js', 'headers', 'lorem', 'fonts', 'cookies', 'mixedcontent', 'accessibility', 'loadtime', 'webvitals'] },
    social: { emoji: '📱', name: 'Social & Marketing', tools: ['charcount', 'utmbuilder', 'textdiff', 'redirect'] },
    browser: { emoji: '🌍', name: 'Navigateur', tools: ['bookmarks', 'folders', 'history', 'downloads', 'cleardata'] },
    design: { emoji: '🎨', name: 'Design & Medias', tools: ['colorpicker', 'colorconvert', 'palette', 'measure', 'gridoverlay', 'favicon'] },
    utilities: { emoji: '🛠️', name: 'Utilitaires', tools: ['desktop', 'qrcode', 'emails', 'speech', 'translate', 'notes', 'pomodoro', 'jsonformat', 'base64', 'hashgen', 'urlencoder', 'passwordgen', 'regex', 'wordcount'] }
  };

  const TOOLS_CONFIG = {
    myip: '🌐 Mon IP', remotedesktop: '🖥️ Remote Desktop', speedtest: '⚡ Speed Test', ping: '📡 Ping', traceroute: '🔀 Traceroute', portscan: '🔌 Port Scan', dnslookup: '🔍 DNS Lookup',
    whois: '🔍 Whois', dnschecker: '🌐 DNS Checker', mailtester: '✉️ Mail Tester', ssl: '🔒 SSL/TLS',
    metatags: '🏷️ Meta Tags', links: '🔗 Liens', images: '🖼️ Images', sitemap: '🗺️ Sitemap', pagespeed: '⚡ PageSpeed', lighthouse: '🔦 Lighthouse', keywords: '🔑 Mots-cles', headings: '📑 Titres H1-H6', brokenlinks: '🔗 Liens casses', readability: '📖 Lisibilite', robotstxt: '🤖 robots.txt', schema: '📋 Schema.org', socialpreview: '📱 Apercu social', mobiletest: '📱 Test Mobile',
    resize: '📐 Resize', css: '🎭 CSS Injection', js: '⚡ JS Injection', headers: '📋 Headers', lorem: '📝 Lorem Ipsum', fonts: '🔤 Fonts', cookies: '🍪 Cookies', mixedcontent: '🔀 Mixed Content', accessibility: '♿ Accessibilite', loadtime: '⏱️ Temps de chargement', webvitals: '📊 Web Vitals',
    charcount: '🔢 Compteur caracteres', utmbuilder: '🏷️ UTM Builder', textdiff: '📝 Comparateur texte', redirect: '↪️ Redirect Checker',
    bookmarks: '⭐ Favoris', folders: '📁 Dossiers', history: '🕐 Historique', downloads: '📥 Downloads', cleardata: '🧹 Clear Data',
    colorpicker: '🎨 Color Picker', colorconvert: '🔄 Convertisseur couleurs', palette: '🎨 Palette', measure: '📏 Mesure', gridoverlay: '📐 Grille overlay', favicon: '🖼️ Favicon',
    desktop: '🖥️ Raccourci Bureau', qrcode: '📱 QR Code', emails: '📧 Emails', speech: '🔊 Synthese Vocale', translate: '🌍 Traducteur', notes: '📝 Notes', pomodoro: '🍅 Pomodoro', jsonformat: '📋 JSON Format', base64: '🔐 Base64', hashgen: '🔒 Hash Gen', urlencoder: '🔗 URL Encoder', passwordgen: '🔑 Password Gen', regex: '🔍 Regex', wordcount: '📊 Compteur mots'
  };

  const DEFAULT_CATEGORY_ORDER = ['network', 'domainDns', 'seoAnalysis', 'development', 'social', 'browser', 'design', 'utilities'];

  let categoryOrder = [...DEFAULT_CATEGORY_ORDER];
  let toolOrder = {};

  // Initialize default tool order
  Object.keys(CATEGORIES_CONFIG).forEach(cat => {
    toolOrder[cat] = [...CATEGORIES_CONFIG[cat].tools];
  });

  // Load saved order
  chrome.storage.sync.get(['categoryOrder', 'toolOrder'], (data) => {
    if (data.categoryOrder && Array.isArray(data.categoryOrder)) {
      categoryOrder = data.categoryOrder;
    }
    if (data.toolOrder && typeof data.toolOrder === 'object') {
      toolOrder = { ...toolOrder, ...data.toolOrder };
    }
    renderReorderUI();
  });

  function renderReorderUI() {
    const container = document.getElementById('reorder-container');
    if (!container) return;

    container.innerHTML = '';

    categoryOrder.forEach((catId, catIndex) => {
      const cat = CATEGORIES_CONFIG[catId];
      if (!cat) return;

      const catEl = document.createElement('div');
      catEl.className = 'reorder-category';
      catEl.dataset.category = catId;

      const tools = toolOrder[catId] || cat.tools;

      catEl.innerHTML = `
        <div class="reorder-category-header">
          <div class="reorder-arrows">
            <button class="btn-cat-up" ${catIndex === 0 ? 'disabled' : ''}>▲</button>
            <button class="btn-cat-down" ${catIndex === categoryOrder.length - 1 ? 'disabled' : ''}>▼</button>
          </div>
          <span class="reorder-category-title">${cat.emoji} ${cat.name}</span>
          <span class="reorder-category-toggle">▼</span>
        </div>
        <div class="reorder-tools">
          ${tools.map((toolId, toolIndex) => `
            <div class="reorder-tool" data-tool="${toolId}">
              <div class="reorder-arrows">
                <button class="btn-tool-up" ${toolIndex === 0 ? 'disabled' : ''}>▲</button>
                <button class="btn-tool-down" ${toolIndex === tools.length - 1 ? 'disabled' : ''}>▼</button>
              </div>
              <span class="reorder-tool-name">${TOOLS_CONFIG[toolId] || toolId}</span>
            </div>
          `).join('')}
        </div>
      `;

      // Category expand/collapse
      const header = catEl.querySelector('.reorder-category-header');
      header.addEventListener('click', (e) => {
        if (e.target.closest('.reorder-arrows')) return;
        catEl.classList.toggle('expanded');
      });

      // Category up/down
      catEl.querySelector('.btn-cat-up').addEventListener('click', (e) => {
        e.stopPropagation();
        if (catIndex > 0) {
          [categoryOrder[catIndex - 1], categoryOrder[catIndex]] = [categoryOrder[catIndex], categoryOrder[catIndex - 1]];
          renderReorderUI();
        }
      });

      catEl.querySelector('.btn-cat-down').addEventListener('click', (e) => {
        e.stopPropagation();
        if (catIndex < categoryOrder.length - 1) {
          [categoryOrder[catIndex], categoryOrder[catIndex + 1]] = [categoryOrder[catIndex + 1], categoryOrder[catIndex]];
          renderReorderUI();
        }
      });

      // Tool up/down
      catEl.querySelectorAll('.reorder-tool').forEach((toolEl, toolIndex) => {
        const toolId = toolEl.dataset.tool;

        toolEl.querySelector('.btn-tool-up').addEventListener('click', (e) => {
          e.stopPropagation();
          const tools = toolOrder[catId];
          if (toolIndex > 0) {
            [tools[toolIndex - 1], tools[toolIndex]] = [tools[toolIndex], tools[toolIndex - 1]];
            renderReorderUI();
            // Re-expand this category
            setTimeout(() => {
              document.querySelector(`[data-category="${catId}"]`)?.classList.add('expanded');
            }, 0);
          }
        });

        toolEl.querySelector('.btn-tool-down').addEventListener('click', (e) => {
          e.stopPropagation();
          const tools = toolOrder[catId];
          if (toolIndex < tools.length - 1) {
            [tools[toolIndex], tools[toolIndex + 1]] = [tools[toolIndex + 1], tools[toolIndex]];
            renderReorderUI();
            // Re-expand this category
            setTimeout(() => {
              document.querySelector(`[data-category="${catId}"]`)?.classList.add('expanded');
            }, 0);
          }
        });
      });

      container.appendChild(catEl);
    });
  }

  // Save order
  const saveOrderBtn = document.getElementById('btn-save-order');
  const resetOrderBtn = document.getElementById('btn-reset-order');
  const orderStatus = document.getElementById('order-status');

  if (saveOrderBtn) {
    saveOrderBtn.addEventListener('click', () => {
      chrome.storage.sync.set({ categoryOrder, toolOrder }, () => {
        showStatus(orderStatus, 'Ordre sauvegarde! Rechargez le popup pour voir les changements.', 'success');
      });
    });
  }

  if (resetOrderBtn) {
    resetOrderBtn.addEventListener('click', () => {
      categoryOrder = [...DEFAULT_CATEGORY_ORDER];
      Object.keys(CATEGORIES_CONFIG).forEach(cat => {
        toolOrder[cat] = [...CATEGORIES_CONFIG[cat].tools];
      });
      chrome.storage.sync.remove(['categoryOrder', 'toolOrder'], () => {
        renderReorderUI();
        showStatus(orderStatus, 'Ordre reinitialise!', 'success');
      });
    });
  }
});
