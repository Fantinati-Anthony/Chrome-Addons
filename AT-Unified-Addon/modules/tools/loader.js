// Tool Loader - Modular and scalable tool loading system
// Only loads tools that have been activated by the user

class ToolLoader {
  constructor() {
    this.registry = null;
    this.activatedTools = new Set();
    this.loadedTools = new Map();
    this.toolLocales = new Map();
    this.currentLang = 'fr';
  }

  // Initialize the loader
  async init() {
    // Load registry
    await this.loadRegistry();

    // Load activated tools from storage
    await this.loadActivatedTools();

    // Get current language
    const data = await chrome.storage.sync.get(['language']);
    this.currentLang = data.language || 'fr';

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

    // Load the tool
    await this.loadTool(toolId);

    return true;
  }

  // Deactivate a tool
  async deactivateTool(toolId) {
    this.activatedTools.delete(toolId);
    await this.saveActivatedTools();

    // Unload the tool
    this.loadedTools.delete(toolId);
    this.toolLocales.delete(toolId);

    return true;
  }

  // Load a single tool's locale
  async loadToolLocale(toolId) {
    if (this.toolLocales.has(toolId)) {
      return this.toolLocales.get(toolId);
    }

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
        console.warn(`No locale found for tool ${toolId}`);
        return null;
      }
    }
  }

  // Load a single tool's changelog
  async loadToolChangelog(toolId) {
    try {
      const response = await fetch(
        chrome.runtime.getURL(`modules/tools/${toolId}/changelog.json`)
      );
      return await response.json();
    } catch (error) {
      console.warn(`No changelog found for tool ${toolId}`);
      return null;
    }
  }

  // Load a single tool module
  async loadTool(toolId) {
    if (this.loadedTools.has(toolId)) {
      return this.loadedTools.get(toolId);
    }

    try {
      const toolInfo = this.registry.tools[toolId];
      if (!toolInfo) {
        throw new Error(`Tool ${toolId} not in registry`);
      }

      // Load locale for the tool
      await this.loadToolLocale(toolId);

      // If tool has a panel, dynamically import its module
      if (toolInfo.hasPanel) {
        const module = await import(
          chrome.runtime.getURL(`modules/tools/${toolId}/index.js`)
        );
        this.loadedTools.set(toolId, module);
        return module;
      }

      return null;
    } catch (error) {
      console.error(`Failed to load tool ${toolId}:`, error);
      return null;
    }
  }

  // Load all activated tools
  async loadActivatedToolsModules() {
    const promises = Array.from(this.activatedTools).map(toolId =>
      this.loadTool(toolId)
    );
    await Promise.all(promises);
  }

  // Get tool info from registry
  getToolInfo(toolId) {
    return this.registry.tools[toolId] || null;
  }

  // Get all tools in a category
  getToolsByCategory(category) {
    return Object.entries(this.registry.tools)
      .filter(([_, info]) => info.category === category)
      .map(([id, info]) => ({ id, ...info }));
  }

  // Get all categories
  getCategories() {
    return Object.entries(this.registry.categories)
      .sort((a, b) => a[1].order - b[1].order)
      .map(([id, info]) => ({ id, ...info }));
  }

  // Get all available tools (not activated)
  getAvailableTools() {
    return Object.entries(this.registry.tools)
      .filter(([id]) => !this.activatedTools.has(id))
      .map(([id, info]) => ({ id, ...info }));
  }

  // Get activated tools list
  getActivatedToolsList() {
    return Array.from(this.activatedTools)
      .filter(id => this.registry.tools[id])
      .map(id => ({ id, ...this.registry.tools[id] }));
  }

  // Get tool locale string
  getToolLocaleString(toolId, key) {
    const locale = this.toolLocales.get(toolId);
    if (locale && locale[key]) {
      return locale[key];
    }
    return null;
  }

  // Set current language and reload locales
  async setLanguage(lang) {
    this.currentLang = lang;
    this.toolLocales.clear();

    // Reload locales for activated tools
    const promises = Array.from(this.activatedTools).map(toolId =>
      this.loadToolLocale(toolId)
    );
    await Promise.all(promises);
  }
}

// Export singleton instance
export const toolLoader = new ToolLoader();
export default toolLoader;
