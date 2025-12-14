// Module Configuration
// Defines categories, tools, and their properties

const ModuleConfig = (function() {
  'use strict';

  // Tool definitions with categories
  const TOOL_DEFINITIONS = {
    // Domain & DNS
    whois: { category: 'domainDns', emoji: '🔍', action: 'direct', defaultEnabled: true },
    dnschecker: { category: 'domainDns', emoji: '🌐', action: 'direct', defaultEnabled: true },
    mailtester: { category: 'domainDns', emoji: '✉️', action: 'direct', defaultEnabled: true },
    ssl: { category: 'domainDns', emoji: '🔒', action: 'panel', defaultEnabled: true },

    // SEO & Analysis
    metatags: { category: 'seoAnalysis', emoji: '🏷️', action: 'panel', defaultEnabled: true },
    links: { category: 'seoAnalysis', emoji: '🔗', action: 'panel', defaultEnabled: true },
    images: { category: 'seoAnalysis', emoji: '🖼️', action: 'panel', defaultEnabled: true },
    sitemap: { category: 'seoAnalysis', emoji: '🗺️', action: 'panel', defaultEnabled: true },
    pagespeed: { category: 'seoAnalysis', emoji: '⚡', action: 'direct', defaultEnabled: true },
    lighthouse: { category: 'seoAnalysis', emoji: '🔦', action: 'direct', defaultEnabled: true },

    // Development
    resize: { category: 'development', emoji: '📐', action: 'panel', defaultEnabled: true },
    css: { category: 'development', emoji: '🎭', action: 'panel', defaultEnabled: true },
    js: { category: 'development', emoji: '⚡', action: 'panel', defaultEnabled: true },
    headers: { category: 'development', emoji: '📋', action: 'panel', defaultEnabled: true },
    lorem: { category: 'development', emoji: '📝', action: 'panel', defaultEnabled: true },
    fonts: { category: 'development', emoji: '🔤', action: 'panel', defaultEnabled: true },

    // Browser
    bookmarks: { category: 'browser', emoji: '⭐', action: 'panel', defaultEnabled: true },
    folders: { category: 'browser', emoji: '📁', action: 'panel', defaultEnabled: true },
    history: { category: 'browser', emoji: '🕐', action: 'panel', defaultEnabled: true },
    cookies: { category: 'browser', emoji: '🍪', action: 'panel', defaultEnabled: true },
    cleardata: { category: 'browser', emoji: '🧹', action: 'panel', defaultEnabled: true },

    // Utilities
    desktop: { category: 'utilities', emoji: '🖥️', action: 'direct', defaultEnabled: true },
    colorpicker: { category: 'utilities', emoji: '🎨', action: 'panel', defaultEnabled: true },
    downloads: { category: 'utilities', emoji: '📥', action: 'panel', defaultEnabled: true },
    emails: { category: 'utilities', emoji: '📧', action: 'panel', defaultEnabled: true },
    speech: { category: 'utilities', emoji: '🔊', action: 'panel', defaultEnabled: true },
    qrcode: { category: 'utilities', emoji: '📱', action: 'panel', defaultEnabled: true },
    translate: { category: 'utilities', emoji: '🌍', action: 'panel', defaultEnabled: true }
  };

  // Category order for display
  const CATEGORY_ORDER = [
    'customLinks',
    'domainDns',
    'seoAnalysis',
    'development',
    'browser',
    'utilities'
  ];

  // Category emojis for headers
  const CATEGORY_EMOJIS = {
    customLinks: '🔗',
    domainDns: '🌐',
    seoAnalysis: '📊',
    development: '💻',
    browser: '🌍',
    utilities: '🛠️'
  };

  // Get all tool IDs
  function getAllToolIds() {
    return Object.keys(TOOL_DEFINITIONS);
  }

  // Get tool definition
  function getTool(toolId) {
    return TOOL_DEFINITIONS[toolId] || null;
  }

  // Get tools by category
  function getToolsByCategory(category) {
    return Object.entries(TOOL_DEFINITIONS)
      .filter(([id, tool]) => tool.category === category)
      .map(([id, tool]) => ({ id, ...tool }));
  }

  // Get all categories
  function getCategories() {
    return CATEGORY_ORDER;
  }

  // Get category emoji
  function getCategoryEmoji(category) {
    return CATEGORY_EMOJIS[category] || '📦';
  }

  // Get default enabled modules
  function getDefaultEnabledModules() {
    const modules = {};
    Object.entries(TOOL_DEFINITIONS).forEach(([id, tool]) => {
      modules[id] = tool.defaultEnabled;
    });
    return modules;
  }

  // Load enabled modules from storage
  async function loadEnabledModules() {
    const data = await chrome.storage.sync.get(['enabledModules']);
    if (data.enabledModules) {
      // Merge with defaults to handle new modules
      const defaults = getDefaultEnabledModules();
      return { ...defaults, ...data.enabledModules };
    }
    return getDefaultEnabledModules();
  }

  // Save enabled modules to storage
  async function saveEnabledModules(modules) {
    await chrome.storage.sync.set({ enabledModules: modules });
  }

  // Check if a module is enabled
  async function isModuleEnabled(toolId) {
    const modules = await loadEnabledModules();
    return modules[toolId] !== false;
  }

  // Public API
  return {
    TOOL_DEFINITIONS,
    CATEGORY_ORDER,
    CATEGORY_EMOJIS,
    getAllToolIds,
    getTool,
    getToolsByCategory,
    getCategories,
    getCategoryEmoji,
    getDefaultEnabledModules,
    loadEnabledModules,
    saveEnabledModules,
    isModuleEnabled
  };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.ModuleConfig = ModuleConfig;
}
