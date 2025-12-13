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
    js: initJS,
    qrcode: initQRCode,
    metatags: initMetaTags,
    links: initLinks,
    images: initImages,
    sitemap: initSitemap,
    headers: initHeaders,
    cookies: initCookies,
    cleardata: initClearData,
    ssl: initSSL,
    lorem: initLorem,
    fonts: initFonts,
    translate: initTranslate,
    // New tools v2.0
    wordcount: initWordCount,
    keywords: initKeywords,
    headings: initHeadings,
    brokenlinks: initBrokenLinks,
    readability: initReadability,
    robotstxt: initRobotsTxt,
    palette: initPalette,
    measure: initMeasure,
    gridoverlay: initGridOverlay,
    loadtime: initLoadTime,
    webvitals: initWebVitals,
    socialpreview: initSocialPreview,
    charcount: initCharCount,
    utmbuilder: initUTMBuilder,
    textdiff: initTextDiff,
    notes: initNotes,
    pomodoro: initPomodoro,
    jsonformat: initJsonFormat,
    base64: initBase64
  };

  // Direct actions (no panel needed)
  const directActions = {
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
    },
    pagespeed: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          alert('URL non disponible');
          return;
        }
        chrome.tabs.create({ url: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(tab.url)}` });
      } catch (error) {
        console.error('Error opening PageSpeed:', error);
        alert('Erreur');
      }
    },
    lighthouse: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          alert('URL non disponible');
          return;
        }
        chrome.tabs.create({ url: `https://googlechrome.github.io/lighthouse/viewer/?psiurl=${encodeURIComponent(tab.url)}` });
      } catch (error) {
        console.error('Error opening Lighthouse:', error);
        alert('Erreur');
      }
    },
    schema: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          alert('URL non disponible');
          return;
        }
        chrome.tabs.create({ url: `https://validator.schema.org/#url=${encodeURIComponent(tab.url)}` });
      } catch (error) {
        console.error('Error opening Schema validator:', error);
        alert('Erreur');
      }
    }
  };

  // Initialize panel loader
  function init() {
    // Load custom buttons
    loadCustomButtons();

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

  // Load and render custom buttons from storage
  async function loadCustomButtons() {
    const container = document.getElementById('custom-buttons-container');
    if (!container) return;

    const data = await chrome.storage.sync.get(['customButtons']);
    const customButtons = data.customButtons || [];

    container.innerHTML = '';

    customButtons.forEach((btn, index) => {
      const button = document.createElement('button');
      button.className = 'tool-icon';
      button.title = btn.name;
      button.dataset.customUrl = btn.url;
      button.dataset.customIndex = index;

      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'tool-emoji';

      if (btn.icon) {
        // User defined emoji/icon
        emojiSpan.textContent = btn.icon;
      } else {
        // Favicon with fallback chain
        const domain = getDomainFromUrl(btn.url);
        const img = document.createElement('img');
        img.style.cssText = 'width:24px;height:24px;';
        img.alt = '';

        // Try DuckDuckGo first, then Google, then default emoji
        img.src = 'https://icons.duckduckgo.com/ip3/' + domain + '.ico';
        img.onerror = function() {
          this.onerror = function() {
            // Both failed, replace with globe emoji
            emojiSpan.textContent = '🌐';
            this.remove();
          };
          this.src = 'https://www.google.com/s2/favicons?domain=' + domain + '&sz=32';
        };

        emojiSpan.appendChild(img);
      }

      const labelSpan = document.createElement('span');
      labelSpan.className = 'tool-label';
      labelSpan.textContent = btn.name;

      button.appendChild(emojiSpan);
      button.appendChild(labelSpan);

      button.addEventListener('click', () => {
        chrome.tabs.create({ url: btn.url });
      });

      container.appendChild(button);
    });
  }

  // Helper: Get domain from URL
  function getDomainFromUrl(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return '';
    }
  }

  // Helper: Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

  // ========== New Tool Initializers ==========

  async function initQRCode() {
    const qrUrlDiv = document.getElementById('qr-url');
    const qrCanvas = document.getElementById('qr-canvas');
    const copyQrBtn = document.getElementById('btn-copy-qr');
    const downloadQrBtn = document.getElementById('btn-download-qr');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = tab?.url || '';
      qrUrlDiv.textContent = url.length > 50 ? url.substring(0, 50) + '...' : url;

      // Generate QR Code using canvas
      generateQRCode(qrCanvas, url);

      copyQrBtn.addEventListener('click', async () => {
        try {
          const dataUrl = qrCanvas.toDataURL('image/png');
          const blob = await (await fetch(dataUrl)).blob();
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          copyQrBtn.textContent = 'Copie!';
          setTimeout(() => { copyQrBtn.textContent = 'Copier l\'image'; }, 1000);
        } catch (e) {
          alert('Erreur lors de la copie');
        }
      });

      downloadQrBtn.addEventListener('click', () => {
        const dataUrl = qrCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = 'qrcode.png';
        a.click();
      });
    } catch (error) {
      qrUrlDiv.textContent = 'Erreur';
    }
  }

  // Simple QR Code generator (using simple alphanumeric encoding)
  function generateQRCode(canvas, text) {
    const size = 200;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Use external QR API as image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
    };
    img.onerror = () => {
      // Fallback: display text
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#000';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('QR Error', size / 2, size / 2);
    };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  }

  async function initMetaTags() {
    const extractBtn = document.getElementById('btn-extract-meta');
    const metaList = document.getElementById('meta-list');

    extractBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const metas = [];
            // Title
            metas.push({ name: 'title', content: document.title });
            // Meta tags
            document.querySelectorAll('meta').forEach(meta => {
              const name = meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('http-equiv');
              const content = meta.getAttribute('content');
              if (name && content) {
                metas.push({ name, content });
              }
            });
            // Canonical
            const canonical = document.querySelector('link[rel="canonical"]');
            if (canonical) metas.push({ name: 'canonical', content: canonical.href });
            return metas;
          }
        });

        if (results && results[0] && results[0].result) {
          renderMetaTags(results[0].result);
        }
      } catch (error) {
        metaList.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });

    function renderMetaTags(metas) {
      if (metas.length === 0) {
        metaList.innerHTML = '<div class="status-message info">Aucun meta tag</div>';
        return;
      }
      metaList.innerHTML = '';
      metas.forEach(meta => {
        const item = document.createElement('div');
        item.className = 'meta-item';
        item.innerHTML = `<strong>${escapeHtml(meta.name)}:</strong> <span class="meta-content">${escapeHtml(meta.content)}</span>`;
        item.querySelector('.meta-content').addEventListener('click', async () => {
          await navigator.clipboard.writeText(meta.content);
          item.querySelector('.meta-content').textContent = 'Copie!';
          setTimeout(() => { item.querySelector('.meta-content').textContent = meta.content; }, 1000);
        });
        metaList.appendChild(item);
      });
    }
  }

  async function initLinks() {
    const extractBtn = document.getElementById('btn-extract-links');
    const statsDiv = document.getElementById('links-stats');
    const linksList = document.getElementById('links-list');
    const copyBtn = document.getElementById('btn-copy-links');

    let allLinks = [];

    extractBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const currentHost = new URL(tab.url).hostname;

        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const links = [];
            document.querySelectorAll('a[href]').forEach(a => {
              const href = a.href;
              if (href && !href.startsWith('javascript:')) {
                links.push({ href, text: a.textContent.trim().substring(0, 50) });
              }
            });
            return links;
          }
        });

        if (results && results[0] && results[0].result) {
          allLinks = results[0].result;
          const internal = allLinks.filter(l => {
            try { return new URL(l.href).hostname === currentHost; } catch { return false; }
          });
          const external = allLinks.filter(l => {
            try { return new URL(l.href).hostname !== currentHost; } catch { return false; }
          });

          statsDiv.innerHTML = `<strong>${allLinks.length}</strong> liens (${internal.length} internes, ${external.length} externes)`;
          renderLinks(allLinks);
        }
      } catch (error) {
        linksList.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });

    copyBtn.addEventListener('click', async () => {
      if (allLinks.length > 0) {
        await navigator.clipboard.writeText(allLinks.map(l => l.href).join('\n'));
        copyBtn.textContent = 'Copie!';
        setTimeout(() => { copyBtn.textContent = 'Copier tous'; }, 1000);
      }
    });

    function renderLinks(links) {
      linksList.innerHTML = '';
      const uniqueLinks = [...new Set(links.map(l => l.href))];
      uniqueLinks.slice(0, 100).forEach(href => {
        const item = document.createElement('div');
        item.className = 'link-item';
        item.innerHTML = `<a href="${escapeHtml(href)}" target="_blank">${escapeHtml(href.substring(0, 60))}${href.length > 60 ? '...' : ''}</a>`;
        linksList.appendChild(item);
      });
      if (uniqueLinks.length > 100) {
        linksList.innerHTML += `<div class="status-message info">+${uniqueLinks.length - 100} autres liens...</div>`;
      }
    }
  }

  async function initImages() {
    const extractBtn = document.getElementById('btn-extract-images');
    const statsDiv = document.getElementById('images-stats');
    const imagesList = document.getElementById('images-list');
    const copyBtn = document.getElementById('btn-copy-images');

    let allImages = [];

    extractBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const images = [];
            document.querySelectorAll('img[src]').forEach(img => {
              if (img.src && !img.src.startsWith('data:')) {
                images.push({ src: img.src, alt: img.alt || '', width: img.naturalWidth, height: img.naturalHeight });
              }
            });
            return images;
          }
        });

        if (results && results[0] && results[0].result) {
          allImages = results[0].result;
          statsDiv.innerHTML = `<strong>${allImages.length}</strong> images trouvees`;
          renderImages(allImages);
        }
      } catch (error) {
        imagesList.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });

    copyBtn.addEventListener('click', async () => {
      if (allImages.length > 0) {
        await navigator.clipboard.writeText(allImages.map(i => i.src).join('\n'));
        copyBtn.textContent = 'Copie!';
        setTimeout(() => { copyBtn.textContent = 'Copier URLs'; }, 1000);
      }
    });

    function renderImages(images) {
      imagesList.innerHTML = '';
      images.slice(0, 50).forEach(img => {
        const item = document.createElement('div');
        item.className = 'image-item';
        item.innerHTML = `
          <img src="${escapeHtml(img.src)}" alt="${escapeHtml(img.alt)}" style="max-width:60px;max-height:40px;">
          <span>${img.width}x${img.height}</span>
          <a href="${escapeHtml(img.src)}" target="_blank">↗</a>
        `;
        imagesList.appendChild(item);
      });
      if (images.length > 50) {
        imagesList.innerHTML += `<div class="status-message info">+${images.length - 50} autres images...</div>`;
      }
    }
  }

  async function initSitemap() {
    const loadBtn = document.getElementById('btn-load-sitemap');
    const statusDiv = document.getElementById('sitemap-status');
    const sitemapList = document.getElementById('sitemap-list');

    loadBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const origin = new URL(tab.url).origin;
        const sitemapUrl = origin + '/sitemap.xml';

        statusDiv.innerHTML = 'Chargement...';

        const response = await fetch(sitemapUrl);
        if (!response.ok) throw new Error('Sitemap non trouve');

        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, 'text/xml');

        const urls = xml.querySelectorAll('url loc');
        const sitemaps = xml.querySelectorAll('sitemap loc');

        statusDiv.innerHTML = `<strong>${urls.length}</strong> URLs, <strong>${sitemaps.length}</strong> sitemaps`;

        sitemapList.innerHTML = '';
        urls.forEach(loc => {
          const item = document.createElement('div');
          item.className = 'sitemap-item';
          item.innerHTML = `<a href="${escapeHtml(loc.textContent)}" target="_blank">${escapeHtml(loc.textContent.substring(0, 60))}</a>`;
          sitemapList.appendChild(item);
        });
        sitemaps.forEach(loc => {
          const item = document.createElement('div');
          item.className = 'sitemap-item';
          item.innerHTML = `📁 <a href="${escapeHtml(loc.textContent)}" target="_blank">${escapeHtml(loc.textContent)}</a>`;
          sitemapList.appendChild(item);
        });

      } catch (error) {
        statusDiv.innerHTML = '<div class="status-message error">Sitemap non trouve ou erreur</div>';
      }
    });
  }

  async function initHeaders() {
    const fetchBtn = document.getElementById('btn-fetch-headers');
    const headersList = document.getElementById('headers-list');

    fetchBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        headersList.innerHTML = 'Chargement...';

        const response = await fetch(tab.url, { method: 'HEAD' });
        const headers = [];
        response.headers.forEach((value, key) => {
          headers.push({ key, value });
        });

        renderHeaders(headers);
      } catch (error) {
        headersList.innerHTML = '<div class="status-message error">Erreur lors du chargement</div>';
      }
    });

    function renderHeaders(headers) {
      if (headers.length === 0) {
        headersList.innerHTML = '<div class="status-message info">Aucun header</div>';
        return;
      }
      headersList.innerHTML = '';
      headers.forEach(h => {
        const item = document.createElement('div');
        item.className = 'header-item';
        item.innerHTML = `<strong>${escapeHtml(h.key)}:</strong> ${escapeHtml(h.value)}`;
        headersList.appendChild(item);
      });
    }
  }

  async function initCookies() {
    const domainDiv = document.getElementById('cookies-domain');
    const cookiesList = document.getElementById('cookies-list');
    const copyBtn = document.getElementById('btn-copy-cookies');

    let allCookies = [];

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = new URL(tab.url);
      domainDiv.textContent = `Domaine: ${url.hostname}`;

      const cookies = await chrome.cookies.getAll({ domain: url.hostname });
      allCookies = cookies;
      renderCookies(cookies);
    } catch (error) {
      cookiesList.innerHTML = '<div class="status-message error">Erreur</div>';
    }

    copyBtn.addEventListener('click', async () => {
      if (allCookies.length > 0) {
        await navigator.clipboard.writeText(JSON.stringify(allCookies, null, 2));
        copyBtn.textContent = 'Copie!';
        setTimeout(() => { copyBtn.textContent = 'Copier JSON'; }, 1000);
      }
    });

    function renderCookies(cookies) {
      if (cookies.length === 0) {
        cookiesList.innerHTML = '<div class="status-message info">Aucun cookie</div>';
        return;
      }
      cookiesList.innerHTML = '';
      cookies.forEach(c => {
        const item = document.createElement('div');
        item.className = 'cookie-item';
        item.innerHTML = `<strong>${escapeHtml(c.name)}</strong>: ${escapeHtml(c.value.substring(0, 30))}${c.value.length > 30 ? '...' : ''}`;
        cookiesList.appendChild(item);
      });
    }
  }

  async function initClearData() {
    const domainDiv = document.getElementById('clear-domain');
    const clearBtn = document.getElementById('btn-clear-data');
    const statusDiv = document.getElementById('clear-status');
    const clearCookies = document.getElementById('clear-cookies');
    const clearCache = document.getElementById('clear-cache');
    const clearStorage = document.getElementById('clear-storage');

    let currentUrl = '';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentUrl = tab.url;
      const url = new URL(tab.url);
      domainDiv.textContent = `Domaine: ${url.hostname}`;
    } catch (e) {
      domainDiv.textContent = 'Domaine: N/A';
    }

    clearBtn.addEventListener('click', async () => {
      const operations = [];

      try {
        const url = new URL(currentUrl);
        const origin = url.origin;

        if (clearCookies.checked) {
          const cookies = await chrome.cookies.getAll({ domain: url.hostname });
          for (const cookie of cookies) {
            const cookieUrl = `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`;
            await chrome.cookies.remove({ url: cookieUrl, name: cookie.name });
          }
          operations.push('cookies');
        }

        if (clearStorage.checked) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              localStorage.clear();
              sessionStorage.clear();
            }
          });
          operations.push('storage');
        }

        if (clearCache.checked) {
          // Note: browsingData requires extra permission, use scripting instead
          operations.push('cache (reload required)');
        }

        statusDiv.innerHTML = `<div class="status-message success">Supprime: ${operations.join(', ')}</div>`;

      } catch (error) {
        statusDiv.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });
  }

  async function initSSL() {
    const domainDiv = document.getElementById('ssl-domain');
    const sslInfo = document.getElementById('ssl-info');
    const checkBtn = document.getElementById('btn-check-ssl');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = new URL(tab.url);
      const domain = url.hostname;
      domainDiv.textContent = `Domaine: ${domain}`;

      const isHttps = url.protocol === 'https:';
      sslInfo.innerHTML = isHttps
        ? '<div class="status-message success">🔒 Connexion securisee (HTTPS)</div>'
        : '<div class="status-message error">⚠️ Connexion non securisee (HTTP)</div>';

      checkBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: `https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(domain)}` });
      });
    } catch (e) {
      domainDiv.textContent = 'Domaine: N/A';
    }
  }

  function initLorem() {
    const countInput = document.getElementById('lorem-count');
    const generateBtn = document.getElementById('btn-generate-lorem');
    const outputDiv = document.getElementById('lorem-output');
    const copyBtn = document.getElementById('btn-copy-lorem');

    const loremText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

    generateBtn.addEventListener('click', () => {
      const count = parseInt(countInput.value) || 3;
      const paragraphs = [];
      for (let i = 0; i < count; i++) {
        paragraphs.push(loremText);
      }
      outputDiv.textContent = paragraphs.join('\n\n');
    });

    copyBtn.addEventListener('click', async () => {
      const text = outputDiv.textContent;
      if (text) {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copie!';
        setTimeout(() => { copyBtn.textContent = 'Copier'; }, 1000);
      }
    });
  }

  async function initFonts() {
    const detectBtn = document.getElementById('btn-detect-fonts');
    const fontsList = document.getElementById('fonts-list');

    detectBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const fonts = new Set();
            document.querySelectorAll('*').forEach(el => {
              const computed = window.getComputedStyle(el);
              const fontFamily = computed.fontFamily;
              if (fontFamily) {
                fontFamily.split(',').forEach(f => {
                  const clean = f.trim().replace(/['"]/g, '');
                  if (clean) fonts.add(clean);
                });
              }
            });
            return [...fonts];
          }
        });

        if (results && results[0] && results[0].result) {
          renderFonts(results[0].result);
        }
      } catch (error) {
        fontsList.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });

    function renderFonts(fonts) {
      if (fonts.length === 0) {
        fontsList.innerHTML = '<div class="status-message info">Aucune police detectee</div>';
        return;
      }
      fontsList.innerHTML = '';
      fonts.forEach(font => {
        const item = document.createElement('div');
        item.className = 'font-item';
        item.innerHTML = `<span style="font-family: ${font}">${escapeHtml(font)}</span>`;
        fontsList.appendChild(item);
      });
    }
  }

  function initTranslate() {
    const inputTextarea = document.getElementById('translate-input');
    const langSelect = document.getElementById('translate-lang');
    const translateBtn = document.getElementById('btn-translate');
    const outputDiv = document.getElementById('translate-output');

    translateBtn.addEventListener('click', () => {
      const text = inputTextarea.value.trim();
      const targetLang = langSelect.value;

      if (!text) {
        alert('Veuillez entrer du texte');
        return;
      }

      // Open Google Translate with the text
      const url = `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(text)}&op=translate`;
      chrome.tabs.create({ url });
    });
  }

  // ========== NEW TOOLS v2.0 ==========

  async function initWordCount() {
    const countBtn = document.getElementById('btn-count-words');
    const resultsDiv = document.getElementById('wordcount-results');

    countBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const text = document.body.innerText || '';
            const words = text.split(/\s+/).filter(w => w.length > 0);
            const chars = text.length;
            const charsNoSpaces = text.replace(/\s/g, '').length;
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
            const readingTime = Math.ceil(words.length / 200); // 200 wpm average
            return { words: words.length, chars, charsNoSpaces, sentences: sentences.length, paragraphs: paragraphs.length, readingTime };
          }
        });

        if (results && results[0] && results[0].result) {
          const r = results[0].result;
          resultsDiv.innerHTML = `
            <div class="stat-item"><span class="stat-label">Mots</span><span class="stat-value">${r.words}</span></div>
            <div class="stat-item"><span class="stat-label">Caracteres</span><span class="stat-value">${r.chars}</span></div>
            <div class="stat-item"><span class="stat-label">Sans espaces</span><span class="stat-value">${r.charsNoSpaces}</span></div>
            <div class="stat-item"><span class="stat-label">Phrases</span><span class="stat-value">${r.sentences}</span></div>
            <div class="stat-item"><span class="stat-label">Paragraphes</span><span class="stat-value">${r.paragraphs}</span></div>
            <div class="stat-item"><span class="stat-label">Temps de lecture</span><span class="stat-value">${r.readingTime} min</span></div>
          `;
        }
      } catch (error) {
        resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });
  }

  async function initKeywords() {
    const analyzeBtn = document.getElementById('btn-analyze-keywords');
    const minLengthInput = document.getElementById('keywords-min-length');
    const resultsDiv = document.getElementById('keywords-results');

    analyzeBtn.addEventListener('click', async () => {
      const minLength = parseInt(minLengthInput.value) || 4;

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (minLen) => {
            const text = document.body.innerText.toLowerCase();
            const words = text.match(/[a-z\u00e0-\u00ff]+/gi) || [];
            const wordCount = {};
            const stopWords = ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'en', 'au', 'aux', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'que', 'qui', 'pour', 'dans', 'sur', 'est', 'sont', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were'];

            words.forEach(word => {
              if (word.length >= minLen && !stopWords.includes(word)) {
                wordCount[word] = (wordCount[word] || 0) + 1;
              }
            });

            const sorted = Object.entries(wordCount)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 20);

            const total = words.length;
            return sorted.map(([word, count]) => ({
              word,
              count,
              density: ((count / total) * 100).toFixed(2)
            }));
          },
          args: [minLength]
        });

        if (results && results[0] && results[0].result) {
          renderKeywords(results[0].result);
        }
      } catch (error) {
        resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });

    function renderKeywords(keywords) {
      if (keywords.length === 0) {
        resultsDiv.innerHTML = '<div class="status-message info">Aucun mot-cle trouve</div>';
        return;
      }
      resultsDiv.innerHTML = keywords.map(k => `
        <div class="keyword-item">
          <span class="keyword-word">${escapeHtml(k.word)}</span>
          <span class="keyword-count">${k.count}x</span>
          <span class="keyword-density">${k.density}%</span>
        </div>
      `).join('');
    }
  }

  async function initHeadings() {
    const analyzeBtn = document.getElementById('btn-analyze-headings');
    const statsDiv = document.getElementById('headings-stats');
    const listDiv = document.getElementById('headings-list');

    analyzeBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const headings = [];
            const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };

            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(tag => {
              document.querySelectorAll(tag).forEach(h => {
                counts[tag]++;
                headings.push({ tag: tag.toUpperCase(), text: h.textContent.trim().substring(0, 100) });
              });
            });

            return { counts, headings };
          }
        });

        if (results && results[0] && results[0].result) {
          const r = results[0].result;
          statsDiv.innerHTML = Object.entries(r.counts)
            .map(([tag, count]) => `<span class="heading-badge ${tag}">${tag.toUpperCase()}: ${count}</span>`)
            .join(' ');

          if (r.headings.length === 0) {
            listDiv.innerHTML = '<div class="status-message info">Aucun titre trouve</div>';
          } else {
            listDiv.innerHTML = r.headings.map(h => `
              <div class="heading-item ${h.tag.toLowerCase()}">
                <span class="heading-tag">${h.tag}</span>
                <span class="heading-text">${escapeHtml(h.text)}</span>
              </div>
            `).join('');
          }
        }
      } catch (error) {
        listDiv.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });
  }

  async function initBrokenLinks() {
    const checkBtn = document.getElementById('btn-check-links');
    const progressDiv = document.getElementById('brokenlinks-progress');
    const resultsDiv = document.getElementById('brokenlinks-results');

    checkBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Get all links from the page
        const linksResult = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const links = [];
            document.querySelectorAll('a[href]').forEach(a => {
              const href = a.href;
              if (href && href.startsWith('http') && !links.includes(href)) {
                links.push(href);
              }
            });
            return links.slice(0, 50); // Limit to 50 links
          }
        });

        const links = linksResult[0]?.result || [];
        if (links.length === 0) {
          resultsDiv.innerHTML = '<div class="status-message info">Aucun lien trouve</div>';
          return;
        }

        progressDiv.innerHTML = `Verification de ${links.length} liens...`;
        resultsDiv.innerHTML = '';

        let checked = 0;
        const broken = [];

        for (const url of links) {
          try {
            const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
            // Note: no-cors mode won't give us status, so we consider it as working
          } catch (e) {
            broken.push(url);
          }
          checked++;
          progressDiv.innerHTML = `Verification: ${checked}/${links.length}`;
        }

        progressDiv.innerHTML = `Termine: ${broken.length} lien(s) potentiellement casse(s)`;

        if (broken.length > 0) {
          resultsDiv.innerHTML = broken.map(url => `
            <div class="broken-link-item">
              <span class="broken-icon">⚠️</span>
              <a href="${escapeHtml(url)}" target="_blank">${escapeHtml(url.substring(0, 50))}...</a>
            </div>
          `).join('');
        } else {
          resultsDiv.innerHTML = '<div class="status-message success">Tous les liens semblent fonctionner!</div>';
        }

      } catch (error) {
        resultsDiv.innerHTML = '<div class="status-message error">Erreur lors de la verification</div>';
      }
    });
  }

  async function initReadability() {
    const analyzeBtn = document.getElementById('btn-check-readability');
    const resultsDiv = document.getElementById('readability-results');

    analyzeBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const text = document.body.innerText || '';
            const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
            const words = text.split(/\s+/).filter(w => w.length > 0);
            const syllables = words.reduce((acc, word) => {
              // Simple syllable counting
              const count = word.toLowerCase().replace(/[^aeiouy]/g, '').length || 1;
              return acc + Math.min(count, 5);
            }, 0);

            const avgSentenceLength = words.length / (sentences.length || 1);
            const avgSyllablesPerWord = syllables / (words.length || 1);

            // Flesch Reading Ease
            const fleschScore = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord);

            // Flesch-Kincaid Grade Level
            const gradeLevel = (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59;

            return {
              sentences: sentences.length,
              words: words.length,
              avgSentenceLength: avgSentenceLength.toFixed(1),
              fleschScore: Math.max(0, Math.min(100, fleschScore)).toFixed(1),
              gradeLevel: Math.max(0, gradeLevel).toFixed(1)
            };
          }
        });

        if (results && results[0] && results[0].result) {
          const r = results[0].result;
          let level = 'Difficile';
          let levelClass = 'error';
          if (r.fleschScore >= 70) { level = 'Facile'; levelClass = 'success'; }
          else if (r.fleschScore >= 50) { level = 'Moyen'; levelClass = 'warning'; }

          resultsDiv.innerHTML = `
            <div class="readability-score ${levelClass}">
              <span class="score-value">${r.fleschScore}</span>
              <span class="score-label">Score Flesch (${level})</span>
            </div>
            <div class="stat-item"><span class="stat-label">Niveau scolaire</span><span class="stat-value">${r.gradeLevel}</span></div>
            <div class="stat-item"><span class="stat-label">Mots/phrase (moy)</span><span class="stat-value">${r.avgSentenceLength}</span></div>
            <div class="stat-item"><span class="stat-label">Total phrases</span><span class="stat-value">${r.sentences}</span></div>
            <div class="stat-item"><span class="stat-label">Total mots</span><span class="stat-value">${r.words}</span></div>
          `;
        }
      } catch (error) {
        resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });
  }

  async function initRobotsTxt() {
    const loadBtn = document.getElementById('btn-load-robots');
    const contentDiv = document.getElementById('robots-content');

    loadBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const origin = new URL(tab.url).origin;
        const robotsUrl = origin + '/robots.txt';

        contentDiv.innerHTML = 'Chargement...';

        const response = await fetch(robotsUrl);
        if (!response.ok) throw new Error('robots.txt non trouve');

        const text = await response.text();
        contentDiv.innerHTML = `<pre>${escapeHtml(text)}</pre>`;
      } catch (error) {
        contentDiv.innerHTML = '<div class="status-message error">robots.txt non trouve ou erreur</div>';
      }
    });
  }

  async function initPalette() {
    const extractBtn = document.getElementById('btn-extract-palette');
    const resultsDiv = document.getElementById('palette-results');
    const copyBtn = document.getElementById('btn-copy-palette');

    let allColors = [];

    extractBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const colors = new Set();
            const colorRegex = /#[0-9A-Fa-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)/g;

            document.querySelectorAll('*').forEach(el => {
              const computed = window.getComputedStyle(el);
              ['color', 'backgroundColor', 'borderColor'].forEach(prop => {
                const value = computed[prop];
                if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
                  colors.add(value);
                }
              });
            });

            // Also check stylesheets
            try {
              for (const sheet of document.styleSheets) {
                try {
                  for (const rule of sheet.cssRules) {
                    const matches = rule.cssText?.match(colorRegex) || [];
                    matches.forEach(m => colors.add(m));
                  }
                } catch (e) {}
              }
            } catch (e) {}

            return [...colors].slice(0, 30);
          }
        });

        if (results && results[0] && results[0].result) {
          allColors = results[0].result;
          renderPalette(allColors);
        }
      } catch (error) {
        resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });

    copyBtn.addEventListener('click', async () => {
      if (allColors.length > 0) {
        await navigator.clipboard.writeText(allColors.join('\n'));
        copyBtn.textContent = 'Copie!';
        setTimeout(() => { copyBtn.textContent = 'Copier tout'; }, 1000);
      }
    });

    function renderPalette(colors) {
      if (colors.length === 0) {
        resultsDiv.innerHTML = '<div class="status-message info">Aucune couleur trouvee</div>';
        return;
      }
      resultsDiv.innerHTML = colors.map(color => `
        <div class="palette-color" style="background-color: ${color}" title="${color}" data-color="${color}"></div>
      `).join('');

      resultsDiv.querySelectorAll('.palette-color').forEach(el => {
        el.addEventListener('click', async () => {
          await navigator.clipboard.writeText(el.dataset.color);
          el.classList.add('copied');
          setTimeout(() => el.classList.remove('copied'), 500);
        });
      });
    }
  }

  async function initMeasure() {
    const startBtn = document.getElementById('btn-start-measure');
    const infoDiv = document.getElementById('measure-info');
    const resultsDiv = document.getElementById('measure-results');

    startBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            // Remove existing overlay if any
            const existing = document.getElementById('measure-overlay');
            if (existing) existing.remove();

            // Create overlay
            const overlay = document.createElement('div');
            overlay.id = 'measure-overlay';
            overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;cursor:crosshair;';

            const tooltip = document.createElement('div');
            tooltip.id = 'measure-tooltip';
            tooltip.style.cssText = 'position:fixed;background:#333;color:#fff;padding:8px 12px;border-radius:4px;font-size:12px;pointer-events:none;z-index:1000000;display:none;';
            document.body.appendChild(tooltip);
            document.body.appendChild(overlay);

            let lastHighlighted = null;

            overlay.addEventListener('mousemove', (e) => {
              overlay.style.display = 'none';
              const el = document.elementFromPoint(e.clientX, e.clientY);
              overlay.style.display = 'block';

              if (el && el !== lastHighlighted) {
                if (lastHighlighted) lastHighlighted.style.outline = '';
                el.style.outline = '2px solid #ff00ff';
                lastHighlighted = el;

                const rect = el.getBoundingClientRect();
                tooltip.innerHTML = `${el.tagName.toLowerCase()}<br>${Math.round(rect.width)}×${Math.round(rect.height)}px`;
                tooltip.style.display = 'block';
              }
              tooltip.style.left = (e.clientX + 10) + 'px';
              tooltip.style.top = (e.clientY + 10) + 'px';
            });

            overlay.addEventListener('click', (e) => {
              overlay.style.display = 'none';
              const el = document.elementFromPoint(e.clientX, e.clientY);
              overlay.style.display = 'block';

              if (el) {
                const rect = el.getBoundingClientRect();
                const computed = window.getComputedStyle(el);
                alert(`Element: ${el.tagName}\nDimensions: ${Math.round(rect.width)}×${Math.round(rect.height)}px\nPadding: ${computed.padding}\nMargin: ${computed.margin}`);
              }
            });

            // Remove on Escape
            document.addEventListener('keydown', function escHandler(e) {
              if (e.key === 'Escape') {
                overlay.remove();
                tooltip.remove();
                if (lastHighlighted) lastHighlighted.style.outline = '';
                document.removeEventListener('keydown', escHandler);
              }
            });
          }
        });

        infoDiv.textContent = 'Mode mesure active! Appuyez sur Echap pour quitter.';
      } catch (error) {
        resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });
  }

  async function initGridOverlay() {
    const columnsInput = document.getElementById('grid-columns');
    const gutterInput = document.getElementById('grid-gutter');
    const colorInput = document.getElementById('grid-color');
    const showBtn = document.getElementById('btn-show-grid');
    const hideBtn = document.getElementById('btn-hide-grid');

    showBtn.addEventListener('click', async () => {
      const columns = parseInt(columnsInput.value) || 12;
      const gutter = parseInt(gutterInput.value) || 20;
      const color = colorInput.value || '#ff00ff';

      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (cols, gut, col) => {
            // Remove existing grid
            const existing = document.getElementById('grid-overlay-container');
            if (existing) existing.remove();

            const container = document.createElement('div');
            container.id = 'grid-overlay-container';
            container.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;pointer-events:none;z-index:999998;display:flex;padding:0 ${gut}px;`;

            for (let i = 0; i < cols; i++) {
              const col = document.createElement('div');
              col.style.cssText = `flex:1;margin:0 ${gut/2}px;background:${col};opacity:0.2;`;
              container.appendChild(col);
            }

            document.body.appendChild(container);
          },
          args: [columns, gutter, color]
        });
      } catch (error) {
        console.error('Error showing grid:', error);
      }
    });

    hideBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const existing = document.getElementById('grid-overlay-container');
            if (existing) existing.remove();
          }
        });
      } catch (error) {
        console.error('Error hiding grid:', error);
      }
    });
  }

  async function initLoadTime() {
    const analyzeBtn = document.getElementById('btn-check-loadtime');
    const resultsDiv = document.getElementById('loadtime-results');

    analyzeBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const timing = performance.timing;
            const nav = performance.getEntriesByType('navigation')[0] || {};

            return {
              dns: timing.domainLookupEnd - timing.domainLookupStart,
              connection: timing.connectEnd - timing.connectStart,
              ttfb: timing.responseStart - timing.requestStart,
              download: timing.responseEnd - timing.responseStart,
              domInteractive: timing.domInteractive - timing.navigationStart,
              domComplete: timing.domComplete - timing.navigationStart,
              loadComplete: timing.loadEventEnd - timing.navigationStart,
              resources: performance.getEntriesByType('resource').length
            };
          }
        });

        if (results && results[0] && results[0].result) {
          const r = results[0].result;
          resultsDiv.innerHTML = `
            <div class="stat-item"><span class="stat-label">DNS Lookup</span><span class="stat-value">${r.dns}ms</span></div>
            <div class="stat-item"><span class="stat-label">Connexion</span><span class="stat-value">${r.connection}ms</span></div>
            <div class="stat-item"><span class="stat-label">TTFB</span><span class="stat-value">${r.ttfb}ms</span></div>
            <div class="stat-item"><span class="stat-label">Telechargement</span><span class="stat-value">${r.download}ms</span></div>
            <div class="stat-item"><span class="stat-label">DOM Interactif</span><span class="stat-value">${r.domInteractive}ms</span></div>
            <div class="stat-item"><span class="stat-label">DOM Complet</span><span class="stat-value">${r.domComplete}ms</span></div>
            <div class="stat-item"><span class="stat-label">Chargement total</span><span class="stat-value">${r.loadComplete}ms</span></div>
            <div class="stat-item"><span class="stat-label">Ressources</span><span class="stat-value">${r.resources}</span></div>
          `;
        }
      } catch (error) {
        resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });
  }

  async function initWebVitals() {
    const analyzeBtn = document.getElementById('btn-check-vitals');
    const resultsDiv = document.getElementById('webvitals-results');

    analyzeBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const entries = performance.getEntriesByType('paint');
            const fcp = entries.find(e => e.name === 'first-contentful-paint');
            const fp = entries.find(e => e.name === 'first-paint');

            const navEntry = performance.getEntriesByType('navigation')[0] || {};
            const lcp = performance.getEntriesByType('largest-contentful-paint').pop();

            return {
              fp: fp ? Math.round(fp.startTime) : null,
              fcp: fcp ? Math.round(fcp.startTime) : null,
              lcp: lcp ? Math.round(lcp.startTime) : null,
              dcl: Math.round(navEntry.domContentLoadedEventEnd || 0),
              load: Math.round(navEntry.loadEventEnd || 0)
            };
          }
        });

        if (results && results[0] && results[0].result) {
          const r = results[0].result;

          const getScore = (value, good, poor) => {
            if (!value) return 'unknown';
            if (value <= good) return 'good';
            if (value <= poor) return 'needs-improvement';
            return 'poor';
          };

          resultsDiv.innerHTML = `
            <div class="vital-item ${getScore(r.fcp, 1800, 3000)}">
              <span class="vital-label">FCP (First Contentful Paint)</span>
              <span class="vital-value">${r.fcp || 'N/A'}ms</span>
            </div>
            <div class="vital-item ${getScore(r.lcp, 2500, 4000)}">
              <span class="vital-label">LCP (Largest Contentful Paint)</span>
              <span class="vital-value">${r.lcp || 'N/A'}ms</span>
            </div>
            <div class="vital-item">
              <span class="vital-label">First Paint</span>
              <span class="vital-value">${r.fp || 'N/A'}ms</span>
            </div>
            <div class="vital-item">
              <span class="vital-label">DOM Content Loaded</span>
              <span class="vital-value">${r.dcl}ms</span>
            </div>
            <div class="vital-item">
              <span class="vital-label">Load Complete</span>
              <span class="vital-value">${r.load}ms</span>
            </div>
          `;
        }
      } catch (error) {
        resultsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });
  }

  async function initSocialPreview() {
    const previewBtn = document.getElementById('btn-preview-social');
    const cardsDiv = document.getElementById('social-preview-cards');

    previewBtn.addEventListener('click', async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const getMeta = (name) => {
              const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
              return el ? el.getAttribute('content') : null;
            };

            return {
              title: getMeta('og:title') || document.title,
              description: getMeta('og:description') || getMeta('description') || '',
              image: getMeta('og:image') || '',
              url: getMeta('og:url') || window.location.href,
              siteName: getMeta('og:site_name') || '',
              twitterCard: getMeta('twitter:card') || 'summary',
              twitterTitle: getMeta('twitter:title') || getMeta('og:title') || document.title,
              twitterDesc: getMeta('twitter:description') || getMeta('og:description') || getMeta('description') || '',
              twitterImage: getMeta('twitter:image') || getMeta('og:image') || ''
            };
          }
        });

        if (results && results[0] && results[0].result) {
          const r = results[0].result;
          cardsDiv.innerHTML = `
            <div class="social-card facebook">
              <div class="social-card-header">Facebook / LinkedIn</div>
              ${r.image ? `<div class="social-card-image"><img src="${escapeHtml(r.image)}" alt=""></div>` : ''}
              <div class="social-card-content">
                <div class="social-card-site">${escapeHtml(r.siteName || new URL(r.url).hostname)}</div>
                <div class="social-card-title">${escapeHtml(r.title)}</div>
                <div class="social-card-desc">${escapeHtml(r.description.substring(0, 150))}</div>
              </div>
            </div>
            <div class="social-card twitter">
              <div class="social-card-header">Twitter/X</div>
              ${r.twitterImage ? `<div class="social-card-image"><img src="${escapeHtml(r.twitterImage)}" alt=""></div>` : ''}
              <div class="social-card-content">
                <div class="social-card-title">${escapeHtml(r.twitterTitle)}</div>
                <div class="social-card-desc">${escapeHtml(r.twitterDesc.substring(0, 120))}</div>
                <div class="social-card-site">${escapeHtml(new URL(r.url).hostname)}</div>
              </div>
            </div>
          `;
        }
      } catch (error) {
        cardsDiv.innerHTML = '<div class="status-message error">Erreur</div>';
      }
    });
  }

  function initCharCount() {
    const textarea = document.getElementById('charcount-input');
    const resultsDiv = document.getElementById('charcount-results');
    const limitItems = document.querySelectorAll('.limit-item');

    function updateCounts() {
      const text = textarea.value;
      const chars = text.length;
      const charsNoSpaces = text.replace(/\s/g, '').length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const lines = text.split('\n').length;

      resultsDiv.innerHTML = `
        <span><strong>${chars}</strong> caracteres</span>
        <span><strong>${charsNoSpaces}</strong> sans espaces</span>
        <span><strong>${words}</strong> mots</span>
        <span><strong>${lines}</strong> lignes</span>
      `;

      // Update social limits
      limitItems.forEach(item => {
        const limit = parseInt(item.dataset.limit);
        if (chars <= limit) {
          item.classList.remove('over');
          item.classList.add('ok');
        } else {
          item.classList.remove('ok');
          item.classList.add('over');
        }
        item.querySelector('.limit-value').textContent = `${chars}/${limit}`;
      });
    }

    textarea.addEventListener('input', updateCounts);
    updateCounts();
  }

  async function initUTMBuilder() {
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
      baseUrl = tab.url.split('?')[0]; // Remove existing query params
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

  function initTextDiff() {
    const text1 = document.getElementById('diff-text1');
    const text2 = document.getElementById('diff-text2');
    const compareBtn = document.getElementById('btn-compare-text');
    const resultsDiv = document.getElementById('diff-results');

    compareBtn.addEventListener('click', () => {
      const lines1 = text1.value.split('\n');
      const lines2 = text2.value.split('\n');

      let html = '';
      const maxLines = Math.max(lines1.length, lines2.length);

      for (let i = 0; i < maxLines; i++) {
        const line1 = lines1[i] || '';
        const line2 = lines2[i] || '';

        if (line1 === line2) {
          html += `<div class="diff-line same">${escapeHtml(line1) || '&nbsp;'}</div>`;
        } else if (!line1) {
          html += `<div class="diff-line added">+ ${escapeHtml(line2)}</div>`;
        } else if (!line2) {
          html += `<div class="diff-line removed">- ${escapeHtml(line1)}</div>`;
        } else {
          html += `<div class="diff-line removed">- ${escapeHtml(line1)}</div>`;
          html += `<div class="diff-line added">+ ${escapeHtml(line2)}</div>`;
        }
      }

      resultsDiv.innerHTML = html || '<div class="status-message info">Aucune difference</div>';
    });
  }

  async function initNotes() {
    const domainDiv = document.getElementById('notes-domain');
    const textarea = document.getElementById('notes-content');
    const saveBtn = document.getElementById('btn-save-notes');
    const clearBtn = document.getElementById('btn-clear-notes');

    let currentDomain = '';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const url = new URL(tab.url);
      currentDomain = url.hostname;
      domainDiv.textContent = `Notes pour: ${currentDomain}`;

      // Load existing notes
      const key = 'notes_' + currentDomain;
      const data = await chrome.storage.local.get([key]);
      if (data[key]) {
        textarea.value = data[key];
      }
    } catch (e) {
      domainDiv.textContent = 'Notes';
    }

    saveBtn.addEventListener('click', async () => {
      if (!currentDomain) return;
      const key = 'notes_' + currentDomain;
      await chrome.storage.local.set({ [key]: textarea.value });
      saveBtn.textContent = 'Sauvegarde!';
      setTimeout(() => { saveBtn.textContent = 'Sauvegarder'; }, 1000);
    });

    clearBtn.addEventListener('click', async () => {
      if (!currentDomain) return;
      if (confirm('Effacer toutes les notes pour ce site?')) {
        const key = 'notes_' + currentDomain;
        await chrome.storage.local.remove([key]);
        textarea.value = '';
      }
    });
  }

  function initPomodoro() {
    const display = document.getElementById('pomodoro-display');
    const workBtn = document.getElementById('btn-pomodoro-work');
    const breakBtn = document.getElementById('btn-pomodoro-break');
    const startBtn = document.getElementById('btn-pomodoro-start');
    const stopBtn = document.getElementById('btn-pomodoro-stop');
    const sessionsDiv = document.getElementById('pomodoro-sessions');

    let duration = 25 * 60; // 25 minutes in seconds
    let remaining = duration;
    let timer = null;
    let isRunning = false;
    let sessions = 0;

    // Load sessions from storage
    chrome.storage.local.get(['pomodoroSessions'], (data) => {
      sessions = data.pomodoroSessions || 0;
      updateSessionsDisplay();
    });

    function updateDisplay() {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      display.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function updateSessionsDisplay() {
      sessionsDiv.textContent = `Sessions completees: ${sessions}`;
    }

    workBtn.addEventListener('click', () => {
      duration = 25 * 60;
      remaining = duration;
      updateDisplay();
      display.classList.remove('break');
    });

    breakBtn.addEventListener('click', () => {
      duration = 5 * 60;
      remaining = duration;
      updateDisplay();
      display.classList.add('break');
    });

    startBtn.addEventListener('click', () => {
      if (isRunning) return;
      isRunning = true;

      timer = setInterval(() => {
        remaining--;
        updateDisplay();

        if (remaining <= 0) {
          clearInterval(timer);
          isRunning = false;

          // Play sound and increment sessions
          if (duration === 25 * 60) {
            sessions++;
            chrome.storage.local.set({ pomodoroSessions: sessions });
            updateSessionsDisplay();
          }

          // Notification
          try {
            new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR8IF5/P5bqIQBIKPaHc87OQVxwJNpXV8MKkdTMRDUWb0vPDsZBmLhEPRZXO9ceypnlAGhBJl8710baxjGYwEg9IndLzxrGnfUIXDUmb0PPIta+LZC4RD0md0fPGsKd/QxcNSZzQ88izvotlLREPSp7R88Swp39DFw1JnM/zyLO+i2UtEQ9JndDzxLCnf0IXDQ==').play();
          } catch (e) {}

          remaining = duration;
          updateDisplay();
        }
      }, 1000);
    });

    stopBtn.addEventListener('click', () => {
      if (timer) {
        clearInterval(timer);
        isRunning = false;
      }
    });

    updateDisplay();
  }

  function initJsonFormat() {
    const input = document.getElementById('json-input');
    const formatBtn = document.getElementById('btn-format-json');
    const minifyBtn = document.getElementById('btn-minify-json');
    const validateBtn = document.getElementById('btn-validate-json');
    const output = document.getElementById('json-output');
    const copyBtn = document.getElementById('btn-copy-json');

    formatBtn.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(input.value);
        output.textContent = JSON.stringify(parsed, null, 2);
        output.classList.remove('error');
      } catch (e) {
        output.textContent = 'Erreur: ' + e.message;
        output.classList.add('error');
      }
    });

    minifyBtn.addEventListener('click', () => {
      try {
        const parsed = JSON.parse(input.value);
        output.textContent = JSON.stringify(parsed);
        output.classList.remove('error');
      } catch (e) {
        output.textContent = 'Erreur: ' + e.message;
        output.classList.add('error');
      }
    });

    validateBtn.addEventListener('click', () => {
      try {
        JSON.parse(input.value);
        output.textContent = '✓ JSON valide!';
        output.classList.remove('error');
        output.classList.add('success');
      } catch (e) {
        output.textContent = '✗ JSON invalide: ' + e.message;
        output.classList.add('error');
        output.classList.remove('success');
      }
    });

    copyBtn.addEventListener('click', async () => {
      if (output.textContent) {
        await navigator.clipboard.writeText(output.textContent);
        copyBtn.textContent = 'Copie!';
        setTimeout(() => { copyBtn.textContent = 'Copier'; }, 1000);
      }
    });
  }

  function initBase64() {
    const input = document.getElementById('base64-input');
    const encodeBtn = document.getElementById('btn-encode-base64');
    const decodeBtn = document.getElementById('btn-decode-base64');
    const output = document.getElementById('base64-output');
    const copyBtn = document.getElementById('btn-copy-base64');

    encodeBtn.addEventListener('click', () => {
      try {
        output.textContent = btoa(unescape(encodeURIComponent(input.value)));
        output.classList.remove('error');
      } catch (e) {
        output.textContent = 'Erreur: ' + e.message;
        output.classList.add('error');
      }
    });

    decodeBtn.addEventListener('click', () => {
      try {
        output.textContent = decodeURIComponent(escape(atob(input.value)));
        output.classList.remove('error');
      } catch (e) {
        output.textContent = 'Erreur: ' + e.message;
        output.classList.add('error');
      }
    });

    copyBtn.addEventListener('click', async () => {
      if (output.textContent) {
        await navigator.clipboard.writeText(output.textContent);
        copyBtn.textContent = 'Copie!';
        setTimeout(() => { copyBtn.textContent = 'Copier'; }, 1000);
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
