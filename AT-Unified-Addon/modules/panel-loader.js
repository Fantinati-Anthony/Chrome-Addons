// Panel Loader - Handles dynamic loading of tool panels
// Loads content only when needed for better performance

const PanelLoader = (function() {
  'use strict';

  const gridView = document.getElementById('grid-view');
  const toolPanel = document.getElementById('tool-panel');
  const panelTitle = document.getElementById('panel-title');
  const panelContent = document.getElementById('panel-content');
  const backBtn = document.getElementById('btn-back');

  // Tool initializers - called after template is loaded
  const toolInitializers = {
    colorpicker: initColorPicker,
    downloads: initDownloads,
    emails: initEmails,
    speech: initSpeech,
    bookmarks: initBookmarks,
    folders: initFolders,
    history: initHistory,
    resize: initResize,
    css: initCSS,
    js: initJS
  };

  // Direct actions (no panel needed)
  const directActions = {
    link1: async () => {
      const data = await chrome.storage.sync.get(['link1Url']);
      const url = data.link1Url;
      if (url) {
        chrome.tabs.create({ url });
      } else {
        alert('URL non configuree. Allez dans les options pour configurer ce lien.');
      }
    },
    link2: async () => {
      const data = await chrome.storage.sync.get(['link2Url']);
      const url = data.link2Url;
      if (url) {
        chrome.tabs.create({ url });
      } else {
        alert('URL non configuree. Allez dans les options pour configurer ce lien.');
      }
    },
    desktop: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url || !tab.title) {
          alert('Impossible de recuperer les informations de l\'onglet');
          return;
        }
        const sanitizedTitle = tab.title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
        const shortcutContent = `[InternetShortcut]\nURL=${tab.url}`;
        const base64Content = btoa(shortcutContent);
        const dataUrl = `data:application/octet-stream;base64,${base64Content}`;
        chrome.downloads.download({
          url: dataUrl,
          filename: `${sanitizedTitle}.url`,
          saveAs: true
        });
      } catch (error) {
        console.error('Error creating desktop shortcut:', error);
        alert('Erreur lors de la creation du raccourci');
      }
    },
    whois: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          alert('URL non disponible');
          return;
        }
        const url = new URL(tab.url);
        const domain = url.hostname;
        chrome.tabs.create({ url: `https://who.is/whois/${domain}` });
      } catch (error) {
        console.error('Error opening whois:', error);
        alert('Erreur');
      }
    },
    dnschecker: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          alert('URL non disponible');
          return;
        }
        const url = new URL(tab.url);
        const domain = url.hostname;
        chrome.tabs.create({ url: `https://dnschecker.org/all-dns-records-of-domain.php?query=${encodeURIComponent(domain)}&rtype=ALL&dns=google` });
      } catch (error) {
        console.error('Error opening DNS checker:', error);
        alert('Erreur');
      }
    },
    mailtester: () => {
      chrome.tabs.create({ url: 'https://www.mail-tester.com/' });
    }
  };

  // Initialize panel loader
  function init() {
    // Attach click handlers to tool icons
    document.querySelectorAll('.tool-icon').forEach(icon => {
      icon.addEventListener('click', () => {
        const tool = icon.dataset.tool;
        const action = icon.dataset.action;
        const title = icon.dataset.title;

        if (action === 'direct' && directActions[tool]) {
          directActions[tool]();
        } else {
          openPanel(tool, title);
        }
      });
    });

    // Back button
    backBtn.addEventListener('click', closePanel);
  }

  // Open a tool panel
  function openPanel(toolId, title) {
    const template = document.getElementById(`tpl-${toolId}`);
    if (!template) {
      console.error(`Template not found: tpl-${toolId}`);
      return;
    }

    // Clone template content
    const content = template.content.cloneNode(true);

    // Clear and insert content
    panelContent.innerHTML = '';
    panelContent.appendChild(content);

    // Set title
    panelTitle.textContent = title || toolId;

    // Show panel, hide grid
    gridView.classList.add('hidden');
    toolPanel.classList.remove('hidden');

    // Initialize tool functionality
    if (toolInitializers[toolId]) {
      toolInitializers[toolId]();
    }
  }

  // Close panel and return to grid
  function closePanel() {
    toolPanel.classList.add('hidden');
    gridView.classList.remove('hidden');
    panelContent.innerHTML = '';
  }

  // ========== Tool Initializers ==========

  function initColorPicker() {
    const pickColorBtn = document.getElementById('btn-pick-color');
    const colorList = document.getElementById('color-list');
    const clearColorsBtn = document.getElementById('btn-clear-colors');

    loadColors();

    pickColorBtn.addEventListener('click', async () => {
      if (!window.EyeDropper) {
        alert('Votre navigateur ne supporte pas l\'API EyeDropper');
        return;
      }
      try {
        const eyeDropper = new EyeDropper();
        const result = await eyeDropper.open();
        const color = result.sRGBHex.toUpperCase();
        await navigator.clipboard.writeText(color);
        chrome.storage.local.get(['colors'], (data) => {
          const colors = data.colors || [];
          if (!colors.includes(color)) {
            colors.unshift(color);
            chrome.storage.local.set({ colors }, loadColors);
          }
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error picking color:', error);
        }
      }
    });

    clearColorsBtn.addEventListener('click', () => {
      chrome.storage.local.set({ colors: [] }, loadColors);
    });

    function loadColors() {
      // Load colors and link1Url for analyze feature
      chrome.storage.local.get(['colors'], (localData) => {
        chrome.storage.sync.get(['link1Url'], (syncData) => {
          const colors = localData.colors || [];
          const baseUrl = syncData.link1Url || '';
          renderColors(colors, baseUrl);
        });
      });
    }

    function renderColors(colors, baseUrl) {
      colorList.innerHTML = '';
      if (colors.length === 0) {
        colorList.innerHTML = '<div class="status-message info">Aucune couleur</div>';
        return;
      }
      colors.forEach((color, index) => {
        const item = document.createElement('div');
        item.className = 'color-item';

        // Build analyze link only if baseUrl is configured
        const analyzeLink = baseUrl
          ? `<a class="color-link" href="${baseUrl}/outils/analyses-couleurs?couleur=${encodeURIComponent(color)}" target="_blank">Analyser</a>`
          : '';

        item.innerHTML = `
          <div class="color-badge" style="background-color: ${color}"></div>
          <span class="color-hex" data-color="${color}">${color}</span>
          ${analyzeLink}
          <button class="color-delete" data-index="${index}">X</button>
        `;
        colorList.appendChild(item);
      });

      colorList.querySelectorAll('.color-hex').forEach(el => {
        el.addEventListener('click', async () => {
          const color = el.dataset.color;
          await navigator.clipboard.writeText(color);
          el.textContent = 'Copie!';
          setTimeout(() => { el.textContent = color; }, 1000);
        });
      });

      colorList.querySelectorAll('.color-delete').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index);
          chrome.storage.local.get(['colors'], (data) => {
            const colors = data.colors || [];
            colors.splice(index, 1);
            chrome.storage.local.set({ colors }, loadColors);
          });
        });
      });
    }
  }

  function initDownloads() {
    const urlsTextarea = document.getElementById('dl-urls');
    const concurrentInput = document.getElementById('dl-concurrent');
    const downloadBtn = document.getElementById('btn-download');
    const logDiv = document.getElementById('dl-log');

    let downloadQueue = [];
    let activeDownloads = 0;

    downloadBtn.addEventListener('click', () => {
      const urls = urlsTextarea.value.split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0 && (url.startsWith('http://') || url.startsWith('https://')));

      if (urls.length === 0) {
        alert('Aucune URL valide trouvee');
        return;
      }

      const maxConcurrent = parseInt(concurrentInput.value) || 3;
      downloadQueue = [...urls];
      activeDownloads = 0;
      logDiv.innerHTML = '';
      log(`Demarrage: ${urls.length} fichier(s)...`);

      for (let i = 0; i < Math.min(maxConcurrent, downloadQueue.length); i++) {
        processNextDownload(maxConcurrent);
      }
    });

    function processNextDownload(maxConcurrent) {
      if (downloadQueue.length === 0 || activeDownloads >= maxConcurrent) return;
      const url = downloadQueue.shift();
      activeDownloads++;

      chrome.downloads.download({ url }, (downloadId) => {
        if (chrome.runtime.lastError) {
          log(`Erreur: ${url.substring(0, 30)}...`);
        } else {
          log(`OK: ${url.substring(0, 40)}...`);
        }
        activeDownloads--;
        if (downloadQueue.length > 0) {
          processNextDownload(maxConcurrent);
        } else if (activeDownloads === 0) {
          log('Termine!');
        }
      });
    }

    function log(message) {
      const line = document.createElement('div');
      line.textContent = message;
      logDiv.appendChild(line);
      logDiv.scrollTop = logDiv.scrollHeight;
    }
  }

  function initEmails() {
    const extractBtn = document.getElementById('btn-extract-emails');
    const emailCount = document.getElementById('email-count');
    const emailList = document.getElementById('email-list');
    const copyLinesBtn = document.getElementById('btn-copy-emails-lines');
    const copySemicolonBtn = document.getElementById('btn-copy-emails-semicolon');
    const clearBtn = document.getElementById('btn-clear-emails');

    let extractedEmails = [];

    chrome.storage.local.get(['emails'], (data) => {
      if (data.emails && data.emails.length > 0) {
        extractedEmails = data.emails;
        renderEmails();
      }
    });

    extractBtn.addEventListener('click', extractEmails);
    copyLinesBtn.addEventListener('click', () => {
      if (extractedEmails.length > 0) {
        navigator.clipboard.writeText(extractedEmails.join('\n'));
        copyLinesBtn.textContent = 'Copie!';
        setTimeout(() => { copyLinesBtn.textContent = 'Copier (lignes)'; }, 1000);
      }
    });
    copySemicolonBtn.addEventListener('click', () => {
      if (extractedEmails.length > 0) {
        navigator.clipboard.writeText(extractedEmails.join(';'));
        copySemicolonBtn.textContent = 'Copie!';
        setTimeout(() => { copySemicolonBtn.textContent = 'Copier (;)'; }, 1000);
      }
    });
    clearBtn.addEventListener('click', () => {
      extractedEmails = [];
      chrome.storage.local.set({ emails: [] });
      renderEmails();
    });

    async function extractEmails() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
            const pageContent = document.documentElement.innerHTML;
            const matches = pageContent.match(emailRegex) || [];
            return [...new Set(matches)];
          }
        });
        if (results && results[0] && results[0].result) {
          extractedEmails = results[0].result;
          chrome.storage.local.set({ emails: extractedEmails });
          renderEmails();
        }
      } catch (error) {
        console.error('Error extracting emails:', error);
        emailList.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    }

    function renderEmails() {
      emailCount.textContent = `${extractedEmails.length} email(s)`;
      emailList.textContent = extractedEmails.length > 0 ? extractedEmails.join('\n') : '';
    }
  }

  function initSpeech() {
    const voiceSelect = document.getElementById('voice-select');
    const saveVoiceBtn = document.getElementById('btn-save-voice');

    function loadVoices() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        voiceSelect.innerHTML = '';
        voices.forEach((voice) => {
          const option = document.createElement('option');
          option.value = voice.name;
          option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' *' : ''}`;
          voiceSelect.appendChild(option);
        });
        chrome.storage.sync.get(['selectedVoice'], (data) => {
          if (data.selectedVoice) voiceSelect.value = data.selectedVoice;
        });
      }
    }

    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    loadVoices();

    saveVoiceBtn.addEventListener('click', () => {
      const selectedVoice = voiceSelect.value;
      if (selectedVoice) {
        chrome.storage.sync.set({ selectedVoice }, () => {
          saveVoiceBtn.textContent = 'Sauvegarde!';
          setTimeout(() => { saveVoiceBtn.textContent = 'Sauvegarder la voix'; }, 1000);
        });
      }
    });
  }

  async function initBookmarks() {
    const bookmarksDiv = document.getElementById('domain-bookmarks');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url) {
        bookmarksDiv.innerHTML = '<div class="status-message info">URL non disponible</div>';
        return;
      }

      const url = new URL(tab.url);
      const domain = url.hostname;
      const rootDomain = domain.split('.').slice(-2).join('.');

      chrome.bookmarks.getTree((tree) => {
        const matchingBookmarks = [];

        function search(nodes) {
          for (const node of nodes) {
            if (node.url) {
              try {
                const bookmarkUrl = new URL(node.url);
                const bookmarkDomain = bookmarkUrl.hostname;
                const bookmarkRootDomain = bookmarkDomain.split('.').slice(-2).join('.');
                if (bookmarkDomain === domain || bookmarkRootDomain === rootDomain) {
                  matchingBookmarks.push(node);
                }
              } catch (e) {}
            }
            if (node.children) search(node.children);
          }
        }

        search(tree);
        renderBookmarks(matchingBookmarks, domain);
      });
    } catch (error) {
      bookmarksDiv.innerHTML = '<div class="status-message error">Erreur</div>';
    }

    function renderBookmarks(bookmarks, domain) {
      if (bookmarks.length === 0) {
        bookmarksDiv.innerHTML = `<div class="status-message info">Aucun favori pour ${domain}</div>`;
        return;
      }
      bookmarksDiv.innerHTML = '';
      bookmarks.forEach(b => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `<span class="item-title">${b.title || b.url}</span><button class="visit-btn" data-url="${b.url}">→</button>`;
        bookmarksDiv.appendChild(item);
      });
      bookmarksDiv.querySelectorAll('.visit-btn').forEach(btn => {
        btn.addEventListener('click', () => chrome.tabs.create({ url: btn.dataset.url }));
      });
    }
  }

  function initFolders() {
    const foldersDiv = document.getElementById('bookmark-folders');

    chrome.bookmarks.getSubTree('1', (results) => {
      if (!results || !results[0]) {
        foldersDiv.innerHTML = '<div class="status-message info">Barre de favoris vide</div>';
        return;
      }
      const folders = (results[0].children || []).filter(item => item.children);
      if (folders.length === 0) {
        foldersDiv.innerHTML = '<div class="status-message info">Aucun dossier</div>';
        return;
      }
      foldersDiv.innerHTML = '';
      folders.forEach(folder => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `<span class="item-title">📁 ${folder.title}</span><button class="visit-btn" data-id="${folder.id}">→</button>`;
        foldersDiv.appendChild(item);
      });
      foldersDiv.querySelectorAll('.visit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          chrome.tabs.create({ url: `chrome://bookmarks/?id=${btn.dataset.id}` });
        });
      });
    });
  }

  function initHistory() {
    const loadHistoryBtn = document.getElementById('btn-load-history');
    const historyDiv = document.getElementById('domain-history');

    loadHistoryBtn.addEventListener('click', loadDomainHistory);

    async function loadDomainHistory() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          historyDiv.innerHTML = '<div class="status-message info">URL non disponible</div>';
          return;
        }

        const url = new URL(tab.url);
        const domain = url.hostname;

        chrome.history.search({ text: domain, maxResults: 20 }, (results) => {
          const filtered = results.filter(item => {
            try {
              const itemUrl = new URL(item.url);
              return itemUrl.hostname === domain || itemUrl.hostname.endsWith('.' + domain);
            } catch (e) { return false; }
          });

          if (filtered.length === 0) {
            historyDiv.innerHTML = `<div class="status-message info">Aucun historique</div>`;
            return;
          }

          historyDiv.innerHTML = '';
          filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `<span class="item-title">${item.title || item.url}</span><button class="visit-btn" data-url="${item.url}">→</button>`;
            historyDiv.appendChild(div);
          });

          historyDiv.querySelectorAll('.visit-btn').forEach(btn => {
            btn.addEventListener('click', () => chrome.tabs.create({ url: btn.dataset.url }));
          });
        });
      } catch (error) {
        historyDiv.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    }
  }

  function initResize() {
    document.querySelectorAll('.resize-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const width = parseInt(btn.dataset.width);
        const height = parseInt(btn.dataset.height);
        chrome.windows.getCurrent((window) => {
          chrome.windows.update(window.id, { width, height });
        });
      });
    });
  }

  async function initCSS() {
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

  function initJS() {
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

  // Public API
  return { init, openPanel, closePanel };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  PanelLoader.init();
});
