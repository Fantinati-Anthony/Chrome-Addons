// Internationalization module
// Handles multi-language support for the extension

const I18n = (function() {
  'use strict';

  let currentLang = 'fr';
  let translations = {};
  const SUPPORTED_LANGS = ['fr', 'en', 'es', 'pt'];
  const DEFAULT_LANG = 'fr';

  // Initialize i18n
  async function init() {
    // Load saved language preference
    const data = await chrome.storage.sync.get(['language']);
    currentLang = data.language || DEFAULT_LANG;

    // Load translation file
    await loadTranslations(currentLang);

    // Apply translations to the page
    applyTranslations();

    return currentLang;
  }

  // Load translations for a specific language
  async function loadTranslations(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) {
      lang = DEFAULT_LANG;
    }

    try {
      const url = chrome.runtime.getURL(`locales/${lang}.json`);
      const response = await fetch(url);
      translations = await response.json();
      currentLang = lang;
    } catch (error) {
      console.error('Error loading translations:', error);
      // Fallback to French
      if (lang !== DEFAULT_LANG) {
        await loadTranslations(DEFAULT_LANG);
      }
    }
  }

  // Get a translation by key path (e.g., "tools.colorpicker.label")
  function t(keyPath, replacements = {}) {
    const keys = keyPath.split('.');
    let value = translations;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        // Return key path if translation not found
        return keyPath;
      }
    }

    // Handle replacements like {count}, {domain}, etc.
    if (typeof value === 'string') {
      return value.replace(/\{(\w+)\}/g, (match, key) => {
        return replacements[key] !== undefined ? replacements[key] : match;
      });
    }

    return value;
  }

  // Apply translations to elements with data-i18n attribute
  function applyTranslations() {
    // Translate text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const translation = t(key);
      if (translation !== key) {
        el.textContent = translation;
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.dataset.i18nPlaceholder;
      const translation = t(key);
      if (translation !== key) {
        el.placeholder = translation;
      }
    });

    // Translate titles
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.dataset.i18nTitle;
      const translation = t(key);
      if (translation !== key) {
        el.title = translation;
      }
    });

    // Translate values (for buttons, etc.)
    document.querySelectorAll('[data-i18n-value]').forEach(el => {
      const key = el.dataset.i18nValue;
      const translation = t(key);
      if (translation !== key) {
        el.value = translation;
      }
    });
  }

  // Change language
  async function setLanguage(lang) {
    if (!SUPPORTED_LANGS.includes(lang)) {
      lang = DEFAULT_LANG;
    }

    await chrome.storage.sync.set({ language: lang });
    await loadTranslations(lang);
    applyTranslations();

    // Dispatch event for components that need to update dynamically
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));

    return lang;
  }

  // Get current language
  function getCurrentLang() {
    return currentLang;
  }

  // Get supported languages
  function getSupportedLangs() {
    return SUPPORTED_LANGS;
  }

  // Get language name
  function getLangName(lang) {
    const names = {
      fr: 'Francais',
      en: 'English',
      es: 'Espanol',
      pt: 'Portugues'
    };
    return names[lang] || lang;
  }

  // Public API
  return {
    init,
    t,
    setLanguage,
    getCurrentLang,
    getSupportedLangs,
    getLangName,
    applyTranslations
  };
})();

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.I18n = I18n;
}
