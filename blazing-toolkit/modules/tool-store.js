// Tool Store Module - Manages tool activation and catalog display

class ToolStore {
  constructor() {
    this.registry = null;
    this.activatedTools = new Set();
    this.toolLocales = new Map();
    this.currentLang = 'fr';
    this.isInitialized = false;
  }

  // Initialize the tool store
  async init() {
    if (this.isInitialized) return this;

    // Load registry
    await this.loadRegistry();

    // Load activated tools from storage
    await this.loadActivatedTools();

    // Get current language
    const data = await chrome.storage.sync.get(['language']);
    this.currentLang = data.language || 'fr';

    // Load locales for all tools (for the store display)
    await this.loadAllToolLocales();

    this.isInitialized = true;
    return this;
  }

  // Load tool registry
  async loadRegistry() {
    try {
      const response = await fetch(chrome.runtime.getURL('modules/tools/registry.json'));
      this.registry = await response.json();
    } catch (error) {
      console.error('Failed to load tool registry:', error);
      this.registry = { categories: {}, tools: {} };
    }
  }

  // Load activated tools from storage
  async loadActivatedTools() {
    const data = await chrome.storage.local.get(['activatedTools']);
    if (data.activatedTools && Array.isArray(data.activatedTools)) {
      this.activatedTools = new Set(data.activatedTools);
    }
  }

  // Save activated tools to storage
  async saveActivatedTools() {
    await chrome.storage.local.set({
      activatedTools: Array.from(this.activatedTools)
    });
  }

  // Load locale for a single tool
  async loadToolLocale(toolId) {
    try {
      const response = await fetch(
        chrome.runtime.getURL(`modules/tools/${toolId}/locales/${this.currentLang}.json`)
      );
      const locale = await response.json();
      this.toolLocales.set(toolId, locale);
      return locale;
    } catch (error) {
      // Fallback to French
      try {
        const response = await fetch(
          chrome.runtime.getURL(`modules/tools/${toolId}/locales/fr.json`)
        );
        const locale = await response.json();
        this.toolLocales.set(toolId, locale);
        return locale;
      } catch (e) {
        return { label: toolId, title: toolId, description: '' };
      }
    }
  }

  // Load locales for all tools
  async loadAllToolLocales() {
    const toolIds = Object.keys(this.registry.tools || {});
    const promises = toolIds.map(id => this.loadToolLocale(id));
    await Promise.all(promises);
  }

  // Load a tool's changelog
  async loadToolChangelog(toolId) {
    try {
      const response = await fetch(
        chrome.runtime.getURL(`modules/tools/${toolId}/changelog.json`)
      );
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  // Check if a tool is activated
  isToolActivated(toolId) {
    return this.activatedTools.has(toolId);
  }

  // Activate a tool
  async activateTool(toolId) {
    if (!this.registry.tools[toolId]) {
      console.warn(`Tool ${toolId} not found in registry`);
      return false;
    }

    this.activatedTools.add(toolId);
    await this.saveActivatedTools();
    return true;
  }

  // Deactivate a tool
  async deactivateTool(toolId) {
    this.activatedTools.delete(toolId);
    await this.saveActivatedTools();
    return true;
  }

  // Get tool info
  getToolInfo(toolId) {
    return this.registry.tools[toolId] || null;
  }

  // Get tool locale
  getToolLocale(toolId) {
    return this.toolLocales.get(toolId) || { label: toolId, title: toolId, description: '' };
  }

  // Get tools grouped by category
  getToolsByCategory() {
    const categories = {};

    for (const [toolId, toolInfo] of Object.entries(this.registry.tools || {})) {
      const category = toolInfo.category || 'utilities';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push({
        id: toolId,
        ...toolInfo,
        locale: this.getToolLocale(toolId),
        activated: this.isToolActivated(toolId)
      });
    }

    return categories;
  }

  // Get category info
  getCategoryInfo(categoryId) {
    return this.registry.categories?.[categoryId] || { emoji: '📦', order: 99 };
  }

  // Get all categories sorted by order
  getSortedCategories() {
    return Object.entries(this.registry.categories || {})
      .sort((a, b) => a[1].order - b[1].order)
      .map(([id, info]) => ({ id, ...info }));
  }

  // Get activated tools list
  getActivatedToolsList() {
    return Array.from(this.activatedTools)
      .filter(id => this.registry.tools[id])
      .map(id => ({
        id,
        ...this.registry.tools[id],
        locale: this.getToolLocale(id)
      }));
  }

  // Get tool emoji
  getToolEmoji(toolId) {
    const emojis = {
      colorpicker: '🎨', colorconvert: '🔄', palette: '🖌️', measure: '📏',
      gridoverlay: '⊞', favicon: '🖼️', downloads: '📥', bookmarks: '⭐',
      folders: '📁', history: '🕐', resize: '📐', cookies: '🍪',
      cleardata: '🧹', css: '🎭', js: '⚡', metatags: '🏷️',
      links: '🔗', images: '🖼️', headers: '📋', fonts: '🔤',
      headings: '📑', sitemap: '🗺️', keywords: '🔑', brokenlinks: '🔗',
      readability: '📖', robotstxt: '🤖', socialpreview: '👁️', ssl: '🔒',
      mixedcontent: '🔀', accessibility: '♿', loadtime: '⏱️', webvitals: '💓',
      qrcode: '📱', lorem: '📝', jsonformat: '{}', base64: '🔐',
      hashgen: '#️⃣', urlencoder: '🔗', passwordgen: '🔑', wordcount: '📝',
      charcount: '🔢', textdiff: '↔️', translate: '🌍', speech: '🔊',
      regex: '🔣', emails: '📧', utmbuilder: '🔗', redirect: '↪️',
      notes: '📋', pomodoro: '🍅', myip: '📍', remotedesktop: '🖥️',
      desktop: '🖥️', whois: '🔍', dnschecker: '🌐', mailtester: '✉️',
      pagespeed: '⚡', lighthouse: '🔦', schema: '🏷️', speedtest: '⚡',
      ping: '📶', traceroute: '🛤️', portscan: '🔌', dnslookup: '🔎',
      mobiletest: '📱'
    };
    return emojis[toolId] || '🔧';
  }

  // Setup event listeners
  setupEventListeners() {
    const addToolsBtn = document.getElementById('btn-add-tools');
    const changelogModal = document.getElementById('changelog-modal');
    const closeChangelogBtn = document.getElementById('btn-close-changelog');

    // Open options page - modules section
    if (addToolsBtn) {
      addToolsBtn.addEventListener('click', () => {
        const optionsUrl = chrome.runtime.getURL('options.html#section-modules');
        chrome.tabs.create({ url: optionsUrl });
      });
    }

    // Close changelog
    if (closeChangelogBtn) {
      closeChangelogBtn.addEventListener('click', () => {
        this.closeChangelog();
      });
    }

    if (changelogModal) {
      changelogModal.addEventListener('click', (e) => {
        if (e.target === changelogModal) {
          this.closeChangelog();
        }
      });
    }
  }

  // Show changelog for a tool
  async showChangelog(toolId) {
    const modal = document.getElementById('changelog-modal');
    const emojiEl = document.getElementById('changelog-emoji');
    const nameEl = document.getElementById('changelog-name');
    const descEl = document.getElementById('changelog-description');
    const versionEl = document.getElementById('changelog-current-version');
    const listEl = document.getElementById('changelog-list');

    if (!modal) return;

    const locale = this.getToolLocale(toolId);
    const changelog = await this.loadToolChangelog(toolId);

    // Populate modal
    if (emojiEl) emojiEl.textContent = this.getToolEmoji(toolId);
    if (nameEl) nameEl.textContent = locale.title || locale.label || toolId;
    if (descEl) descEl.textContent = locale.description || '';
    if (versionEl) versionEl.textContent = `v${changelog?.version || '1.0.0'}`;

    if (listEl && changelog?.changelog) {
      listEl.innerHTML = changelog.changelog.map(entry => `
        <li class="changelog-item">
          <span class="changelog-version">v${entry.version}</span>
          <div class="changelog-details">
            <div class="changelog-date">${entry.date}</div>
            <span class="changelog-type ${entry.type}">${entry.type}</span>
            <span class="changelog-message">${entry.messages?.[this.currentLang] || entry.messages?.fr || ''}</span>
          </div>
        </li>
      `).join('');
    }

    // Show modal
    modal.classList.add('visible');
  }

  // Close changelog modal
  closeChangelog() {
    const modal = document.getElementById('changelog-modal');
    if (modal) {
      modal.classList.remove('visible');
    }
  }
}

// Export singleton
const toolStore = new ToolStore();
window.toolStore = toolStore;
