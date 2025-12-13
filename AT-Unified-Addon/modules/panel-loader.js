// Panel Loader - Handles dynamic loading of tool panels
// Loads content only when needed for better performance
// Refactored to use modular tool imports

// Import all tool initializers from modular structure
import {
  // Utils
  escapeHtml,
  getDomainFromUrl,
  // Color & Design
  initColorPicker,
  initColorConvert,
  initPalette,
  initMeasure,
  initGridOverlay,
  // Browser Tools
  initDownloads,
  initBookmarks,
  initFolders,
  initHistory,
  initResize,
  initCookies,
  initClearData,
  // Page Analysis
  initCSS,
  initJS,
  initMetaTags,
  initLinks,
  initImages,
  initHeaders,
  initFonts,
  initHeadings,
  // SEO Tools
  initSitemap,
  initKeywords,
  initBrokenLinks,
  initReadability,
  initRobotsTxt,
  initSocialPreview,
  // Security & Performance
  initSSL,
  initMixedContent,
  initAccessibility,
  initLoadTime,
  initWebVitals,
  // Generators & Converters
  initQRCode,
  initLorem,
  initJsonFormat,
  initBase64,
  initHashGen,
  initUrlEncoder,
  initPasswordGen,
  initFavicon,
  // Text Tools
  initWordCount,
  initCharCount,
  initTextDiff,
  initTranslate,
  initSpeech,
  initRegex,
  // Marketing & Utilities
  initEmails,
  initUTMBuilder,
  initRedirect,
  // Productivity
  initNotes,
  initPomodoro,
  // Network Tools
  initMyIP,
  initRemoteDesktop
} from './tools/index.js';

const PanelLoader = (function() {
  'use strict';

  const gridView = document.getElementById('grid-view');
  const toolPanel = document.getElementById('tool-panel');
  const panelTitle = document.getElementById('panel-title');
  const panelContent = document.getElementById('panel-content');
  const backBtn = document.getElementById('btn-back');

  // Tool initializers - mapped to imported functions
  const toolInitializers = {
    // Color & Design
    colorpicker: initColorPicker,
    colorconvert: initColorConvert,
    palette: initPalette,
    measure: initMeasure,
    gridoverlay: initGridOverlay,
    // Browser Tools
    downloads: initDownloads,
    bookmarks: initBookmarks,
    folders: initFolders,
    history: initHistory,
    resize: initResize,
    cookies: initCookies,
    cleardata: initClearData,
    // Page Analysis
    css: initCSS,
    js: initJS,
    metatags: initMetaTags,
    links: initLinks,
    images: initImages,
    headers: initHeaders,
    fonts: initFonts,
    headings: initHeadings,
    // SEO Tools
    sitemap: initSitemap,
    keywords: initKeywords,
    brokenlinks: initBrokenLinks,
    readability: initReadability,
    robotstxt: initRobotsTxt,
    socialpreview: initSocialPreview,
    // Security & Performance
    ssl: initSSL,
    mixedcontent: initMixedContent,
    accessibility: initAccessibility,
    loadtime: initLoadTime,
    webvitals: initWebVitals,
    // Generators & Converters
    qrcode: initQRCode,
    lorem: initLorem,
    jsonformat: initJsonFormat,
    base64: initBase64,
    hashgen: initHashGen,
    urlencoder: initUrlEncoder,
    passwordgen: initPasswordGen,
    favicon: initFavicon,
    // Text Tools
    wordcount: initWordCount,
    charcount: initCharCount,
    textdiff: initTextDiff,
    translate: initTranslate,
    speech: initSpeech,
    regex: initRegex,
    // Marketing & Utilities
    emails: initEmails,
    utmbuilder: initUTMBuilder,
    redirect: initRedirect,
    // Productivity
    notes: initNotes,
    pomodoro: initPomodoro,
    // Network Tools
    myip: initMyIP,
    remotedesktop: initRemoteDesktop
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
    },
    // New direct actions v3.0
    speedtest: () => {
      chrome.tabs.create({ url: 'https://www.speedtest.net/' });
    },
    ping: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          alert('URL non disponible');
          return;
        }
        const domain = new URL(tab.url).hostname;
        chrome.tabs.create({ url: `https://ping.eu/ping/?host=${encodeURIComponent(domain)}` });
      } catch (error) {
        alert('Erreur');
      }
    },
    traceroute: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          alert('URL non disponible');
          return;
        }
        const domain = new URL(tab.url).hostname;
        chrome.tabs.create({ url: `https://ping.eu/traceroute/?host=${encodeURIComponent(domain)}` });
      } catch (error) {
        alert('Erreur');
      }
    },
    portscan: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          alert('URL non disponible');
          return;
        }
        const domain = new URL(tab.url).hostname;
        chrome.tabs.create({ url: `https://ping.eu/port-chk/?host=${encodeURIComponent(domain)}` });
      } catch (error) {
        alert('Erreur');
      }
    },
    dnslookup: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          alert('URL non disponible');
          return;
        }
        const domain = new URL(tab.url).hostname;
        chrome.tabs.create({ url: `https://mxtoolbox.com/SuperTool.aspx?action=dns%3a${encodeURIComponent(domain)}&run=toolpage` });
      } catch (error) {
        alert('Erreur');
      }
    },
    mobiletest: async () => {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url) {
          alert('URL non disponible');
          return;
        }
        chrome.tabs.create({ url: `https://search.google.com/test/mobile-friendly?url=${encodeURIComponent(tab.url)}` });
      } catch (error) {
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

  // Public API
  return { init, openPanel, closePanel };
})();

// Export for ES modules
export { PanelLoader };

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  PanelLoader.init();
});
