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

  // Activate all tools
  async activateAllTools() {
    const allToolIds = Object.keys(this.registry.tools || {});
    for (const toolId of allToolIds) {
      this.activatedTools.add(toolId);
    }
    await this.saveActivatedTools();
    return true;
  }

  // Activate all tools in a specific category
  async activateCategoryTools(categoryId) {
    const allTools = this.registry.tools || {};
    for (const [toolId, toolInfo] of Object.entries(allTools)) {
      if (toolInfo.category === categoryId) {
        this.activatedTools.add(toolId);
      }
    }
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

  // Render the tool store content
  renderStoreContent(container, searchQuery = '') {
    container.innerHTML = '';

    const categories = this.getSortedCategories();
    const toolsByCategory = this.getToolsByCategory();

    for (const category of categories) {
      const categoryTools = toolsByCategory[category.id] || [];

      // Filter by search query
      const filteredTools = searchQuery
        ? categoryTools.filter(tool => {
            const locale = tool.locale;
            const searchLower = searchQuery.toLowerCase();
            return (
              tool.id.toLowerCase().includes(searchLower) ||
              locale.label?.toLowerCase().includes(searchLower) ||
              locale.title?.toLowerCase().includes(searchLower) ||
              locale.description?.toLowerCase().includes(searchLower)
            );
          })
        : categoryTools;

      if (filteredTools.length === 0) continue;

      const categoryEl = document.createElement('div');
      // Expand categories when searching, collapse by default otherwise
      const isCollapsed = !searchQuery;
      categoryEl.className = `store-category ${isCollapsed ? 'collapsed' : ''}`;
      categoryEl.dataset.collapsed = isCollapsed ? 'true' : 'false';
      categoryEl.innerHTML = `
        <div class="store-category-header">
          <span class="category-toggle">▼</span>
          <span class="category-emoji">${category.emoji}</span>
          <span class="category-name">${this.getCategoryLabel(category.id)}</span>
          <span class="category-tools-count">(${filteredTools.length})</span>
          <button class="btn-activate-category" data-category="${category.id}" title="Activer tous les outils de cette catégorie">Activer tout</button>
        </div>
        <div class="store-tools-grid" data-category="${category.id}"></div>
      `;

      const toolsGrid = categoryEl.querySelector('.store-tools-grid');

      for (const tool of filteredTools) {
        const toolEl = this.createToolItem(tool);
        toolsGrid.appendChild(toolEl);
      }

      container.appendChild(categoryEl);
    }
  }

  // Get category label (uses i18n if available)
  getCategoryLabel(categoryId) {
    if (typeof I18n !== 'undefined') {
      const key = `categories.${categoryId}`;
      const translated = I18n.t(key);
      if (translated !== key) return translated;
    }

    // Fallback labels
    const fallbacks = {
      design: 'Design',
      browser: 'Browser',
      analysis: 'Analysis',
      seo: 'SEO',
      security: 'Security',
      generators: 'Generators',
      text: 'Text',
      marketing: 'Marketing',
      productivity: 'Productivity',
      network: 'Network'
    };

    return fallbacks[categoryId] || categoryId;
  }

  // Create a tool item element for the store
  createToolItem(tool) {
    const div = document.createElement('div');
    div.className = `store-tool-item ${tool.activated ? 'activated' : ''}`;
    div.dataset.toolId = tool.id;

    const emoji = this.getToolEmoji(tool.id);
    const locale = tool.locale;

    div.innerHTML = `
      <div class="store-tool-icon">${emoji}</div>
      <div class="store-tool-info">
        <div class="store-tool-name">${locale.title || locale.label || tool.id}</div>
        <div class="store-tool-description">${locale.description || ''}</div>
      </div>
      <div class="store-tool-actions">
        <button class="store-tool-toggle ${tool.activated ? 'remove' : 'add'}"
                data-action="${tool.activated ? 'remove' : 'add'}"
                data-tool-id="${tool.id}">
          ${tool.activated ? this.getTranslation('toolStore.remove') : this.getTranslation('toolStore.add')}
        </button>
        <button class="store-tool-info-btn" data-tool-id="${tool.id}" title="${this.getTranslation('toolStore.info')}">ℹ</button>
      </div>
    `;

    return div;
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

  // Get translation helper
  getTranslation(key) {
    if (typeof I18n !== 'undefined') {
      const translated = I18n.t(key);
      if (translated !== key) return translated;
    }

    // Fallback
    const fallbacks = {
      'toolStore.add': 'Add',
      'toolStore.remove': 'Remove',
      'toolStore.info': 'Info'
    };
    return fallbacks[key] || key;
  }

  // Setup event listeners for the store
  setupEventListeners() {
    const storeModal = document.getElementById('tool-store-modal');
    const addToolsBtn = document.getElementById('btn-add-tools');
    const closeStoreBtn = document.getElementById('btn-close-store');
    const storeSearch = document.getElementById('store-search');
    const storeContent = document.getElementById('tool-store-content');
    const changelogModal = document.getElementById('changelog-modal');
    const closeChangelogBtn = document.getElementById('btn-close-changelog');
    const activateAllBtn = document.getElementById('btn-activate-all-tools');

    // Open store
    if (addToolsBtn) {
      addToolsBtn.addEventListener('click', () => {
        this.openStore();
      });
    }

    // Close store (with reload)
    if (closeStoreBtn) {
      closeStoreBtn.addEventListener('click', () => {
        this.closeStore();
        // Reload extension after closing
        setTimeout(() => {
          chrome.runtime.reload();
        }, 300);
      });
    }

    // Close on overlay click (with reload)
    if (storeModal) {
      storeModal.addEventListener('click', (e) => {
        if (e.target === storeModal) {
          this.closeStore();
          // Reload extension after closing
          setTimeout(() => {
            chrome.runtime.reload();
          }, 300);
        }
      });
    }

    // Global "Activate all tools" button
    if (activateAllBtn) {
      activateAllBtn.addEventListener('click', async () => {
        await this.activateAllTools();
        // Update UI
        if (storeContent) {
          this.renderStoreContent(storeContent, storeSearch?.value || '');
          this.setupToolItemListeners();
        }
        // Refresh the main grid
        if (typeof refreshToolGrid === 'function') {
          refreshToolGrid();
        }
      });
    }

    // Search
    if (storeSearch && storeContent) {
      storeSearch.addEventListener('input', (e) => {
        this.renderStoreContent(storeContent, e.target.value);
        this.setupToolItemListeners();
      });
    }

    // Tool actions (using delegation)
    if (storeContent) {
      storeContent.addEventListener('click', async (e) => {
        const toggleBtn = e.target.closest('.store-tool-toggle');
        const infoBtn = e.target.closest('.store-tool-info-btn');
        const activateCategoryBtn = e.target.closest('.btn-activate-category');

        if (toggleBtn) {
          const toolId = toggleBtn.dataset.toolId;
          const action = toggleBtn.dataset.action;

          if (action === 'add') {
            await this.activateTool(toolId);
          } else {
            await this.deactivateTool(toolId);
          }

          // Update UI
          this.renderStoreContent(storeContent, storeSearch?.value || '');
          this.setupToolItemListeners();

          // Refresh the main grid
          if (typeof refreshToolGrid === 'function') {
            refreshToolGrid();
          }
        }

        if (infoBtn) {
          const toolId = infoBtn.dataset.toolId;
          this.showChangelog(toolId);
        }

        // Toggle category collapse (click on header but not on button)
        const categoryHeader = e.target.closest('.store-category-header');
        if (categoryHeader && !activateCategoryBtn) {
          const categoryEl = categoryHeader.closest('.store-category');
          if (categoryEl) {
            const isCollapsed = categoryEl.dataset.collapsed === 'true';
            categoryEl.dataset.collapsed = isCollapsed ? 'false' : 'true';
            categoryEl.classList.toggle('collapsed', !isCollapsed);
          }
        }

        // Activate all tools in category
        if (activateCategoryBtn) {
          const categoryId = activateCategoryBtn.dataset.category;
          await this.activateCategoryTools(categoryId);
          // Update UI
          this.renderStoreContent(storeContent, storeSearch?.value || '');
          this.setupToolItemListeners();
          // Refresh the main grid
          if (typeof refreshToolGrid === 'function') {
            refreshToolGrid();
          }
        }
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

  // Open the store modal
  openStore() {
    const storeModal = document.getElementById('tool-store-modal');
    const storeContent = document.getElementById('tool-store-content');
    const storeSearch = document.getElementById('store-search');

    if (storeModal) {
      storeModal.classList.remove('hidden');
      setTimeout(() => {
        storeModal.classList.add('visible');
      }, 10);
    }

    if (storeContent) {
      this.renderStoreContent(storeContent, '');
      this.setupToolItemListeners();
    }

    if (storeSearch) {
      storeSearch.value = '';
      storeSearch.focus();
    }
  }

  // Close the store modal
  closeStore() {
    const storeModal = document.getElementById('tool-store-modal');

    if (storeModal) {
      storeModal.classList.remove('visible');
      setTimeout(() => {
        storeModal.classList.add('hidden');
      }, 300);
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

  // Setup tool item listeners (for hover effects, etc.)
  setupToolItemListeners() {
    // Can add additional listeners here if needed
  }
}

// Export singleton
const toolStore = new ToolStore();
window.toolStore = toolStore;
