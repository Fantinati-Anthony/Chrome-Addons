// Tools Index - Central export for all tool modules
// This file provides a single import point for all tools

// Utility functions (shared across tools)
export * from './utils.js';

// Tool initializers - organized by category
// ============================================

// === COLOR & DESIGN ===
export { initColorPicker } from './colorpicker.js';
export { initColorConvert } from './colorconvert.js';
export { initPalette } from './palette.js';
export { initMeasure } from './measure.js';
export { initGridOverlay } from './gridoverlay.js';

// === BROWSER TOOLS ===
export { initDownloads } from './downloads.js';
export { initBookmarks } from './bookmarks.js';
export { initFolders } from './folders.js';
export { initHistory } from './history.js';
export { initResize } from './resize.js';
export { initCookies } from './cookies.js';
export { initClearData } from './cleardata.js';

// === PAGE ANALYSIS ===
export { initCSS } from './css.js';
export { initJS } from './js.js';
export { initMetaTags } from './metatags.js';
export { initLinks } from './links.js';
export { initImages } from './images.js';
export { initHeaders } from './headers.js';
export { initFonts } from './fonts.js';
export { initHeadings } from './headings.js';

// === SEO TOOLS ===
export { initSitemap } from './sitemap.js';
export { initKeywords } from './keywords.js';
export { initBrokenLinks } from './brokenlinks.js';
export { initReadability } from './readability.js';
export { initRobotsTxt } from './robotstxt.js';
export { initSocialPreview } from './socialpreview.js';

// === SECURITY & PERFORMANCE ===
export { initSSL } from './ssl.js';
export { initMixedContent } from './mixedcontent.js';
export { initAccessibility } from './accessibility.js';
export { initLoadTime } from './loadtime.js';
export { initWebVitals } from './webvitals.js';

// === GENERATORS & CONVERTERS ===
export { initQRCode } from './qrcode.js';
export { initLorem } from './lorem.js';
export { initJsonFormat } from './jsonformat.js';
export { initBase64 } from './base64.js';
export { initHashGen } from './hashgen.js';
export { initUrlEncoder } from './urlencoder.js';
export { initPasswordGen } from './passwordgen.js';
export { initFavicon } from './favicon.js';

// === TEXT TOOLS ===
export { initWordCount } from './wordcount.js';
export { initCharCount } from './charcount.js';
export { initTextDiff } from './textdiff.js';
export { initTranslate } from './translate.js';
export { initSpeech } from './speech.js';
export { initRegex } from './regex.js';

// === MARKETING & UTILITIES ===
export { initEmails } from './emails.js';
export { initUTMBuilder } from './utmbuilder.js';
export { initRedirect } from './redirect.js';

// === PRODUCTIVITY ===
export { initNotes } from './notes.js';
export { initPomodoro } from './pomodoro.js';

// === NETWORK TOOLS ===
export { initMyIP } from './myip.js';
export { initRemoteDesktop } from './remotedesktop.js';

// Tool registry for dynamic initialization
export const toolRegistry = {
  // Color & Design
  'color-picker': { init: () => import('./colorpicker.js').then(m => m.initColorPicker()) },
  'color-convert': { init: () => import('./colorconvert.js').then(m => m.initColorConvert()) },
  'palette': { init: () => import('./palette.js').then(m => m.initPalette()) },
  'measure': { init: () => import('./measure.js').then(m => m.initMeasure()) },
  'grid-overlay': { init: () => import('./gridoverlay.js').then(m => m.initGridOverlay()) },

  // Browser Tools
  'downloads': { init: () => import('./downloads.js').then(m => m.initDownloads()) },
  'bookmarks': { init: () => import('./bookmarks.js').then(m => m.initBookmarks()) },
  'folders': { init: () => import('./folders.js').then(m => m.initFolders()) },
  'history': { init: () => import('./history.js').then(m => m.initHistory()) },
  'resize': { init: () => import('./resize.js').then(m => m.initResize()) },
  'cookies': { init: () => import('./cookies.js').then(m => m.initCookies()) },
  'clear-data': { init: () => import('./cleardata.js').then(m => m.initClearData()) },

  // Page Analysis
  'css': { init: () => import('./css.js').then(m => m.initCSS()) },
  'js': { init: () => import('./js.js').then(m => m.initJS()) },
  'meta-tags': { init: () => import('./metatags.js').then(m => m.initMetaTags()) },
  'links': { init: () => import('./links.js').then(m => m.initLinks()) },
  'images': { init: () => import('./images.js').then(m => m.initImages()) },
  'headers': { init: () => import('./headers.js').then(m => m.initHeaders()) },
  'fonts': { init: () => import('./fonts.js').then(m => m.initFonts()) },
  'headings': { init: () => import('./headings.js').then(m => m.initHeadings()) },

  // SEO Tools
  'sitemap': { init: () => import('./sitemap.js').then(m => m.initSitemap()) },
  'keywords': { init: () => import('./keywords.js').then(m => m.initKeywords()) },
  'broken-links': { init: () => import('./brokenlinks.js').then(m => m.initBrokenLinks()) },
  'readability': { init: () => import('./readability.js').then(m => m.initReadability()) },
  'robots-txt': { init: () => import('./robotstxt.js').then(m => m.initRobotsTxt()) },
  'social-preview': { init: () => import('./socialpreview.js').then(m => m.initSocialPreview()) },

  // Security & Performance
  'ssl': { init: () => import('./ssl.js').then(m => m.initSSL()) },
  'mixed-content': { init: () => import('./mixedcontent.js').then(m => m.initMixedContent()) },
  'accessibility': { init: () => import('./accessibility.js').then(m => m.initAccessibility()) },
  'load-time': { init: () => import('./loadtime.js').then(m => m.initLoadTime()) },
  'web-vitals': { init: () => import('./webvitals.js').then(m => m.initWebVitals()) },

  // Generators & Converters
  'qr-code': { init: () => import('./qrcode.js').then(m => m.initQRCode()) },
  'lorem': { init: () => import('./lorem.js').then(m => m.initLorem()) },
  'json-format': { init: () => import('./jsonformat.js').then(m => m.initJsonFormat()) },
  'base64': { init: () => import('./base64.js').then(m => m.initBase64()) },
  'hash-gen': { init: () => import('./hashgen.js').then(m => m.initHashGen()) },
  'url-encoder': { init: () => import('./urlencoder.js').then(m => m.initUrlEncoder()) },
  'password-gen': { init: () => import('./passwordgen.js').then(m => m.initPasswordGen()) },
  'favicon': { init: () => import('./favicon.js').then(m => m.initFavicon()) },

  // Text Tools
  'word-count': { init: () => import('./wordcount.js').then(m => m.initWordCount()) },
  'char-count': { init: () => import('./charcount.js').then(m => m.initCharCount()) },
  'text-diff': { init: () => import('./textdiff.js').then(m => m.initTextDiff()) },
  'translate': { init: () => import('./translate.js').then(m => m.initTranslate()) },
  'speech': { init: () => import('./speech.js').then(m => m.initSpeech()) },
  'regex': { init: () => import('./regex.js').then(m => m.initRegex()) },

  // Marketing & Utilities
  'emails': { init: () => import('./emails.js').then(m => m.initEmails()) },
  'utm-builder': { init: () => import('./utmbuilder.js').then(m => m.initUTMBuilder()) },
  'redirect': { init: () => import('./redirect.js').then(m => m.initRedirect()) },

  // Productivity
  'notes': { init: () => import('./notes.js').then(m => m.initNotes()) },
  'pomodoro': { init: () => import('./pomodoro.js').then(m => m.initPomodoro()) },

  // Network Tools
  'my-ip': { init: () => import('./myip.js').then(m => m.initMyIP()) },
  'remote-desktop': { init: () => import('./remotedesktop.js').then(m => m.initRemoteDesktop()) }
};

// Helper to initialize a tool by panel ID
export async function initToolByPanelId(panelId) {
  const tool = toolRegistry[panelId];
  if (tool) {
    await tool.init();
  }
}
