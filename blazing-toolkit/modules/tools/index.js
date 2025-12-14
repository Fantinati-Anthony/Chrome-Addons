// Main index file that re-exports all tool initializers
// This file is required by panel-loader.js

// Utilities
export { escapeHtml, getDomainFromUrl, copyToClipboard, getCurrentTab, getCurrentDomain } from './utils.js';

// Color & Design Tools
export { initColorPicker } from './colorpicker/index.js';
export { initColorConvert } from './colorconvert/index.js';
export { initPalette } from './palette/index.js';
export { initMeasure } from './measure/index.js';
export { initGridOverlay } from './gridoverlay/index.js';

// Browser Tools
export { initDownloads } from './downloads/index.js';
export { initBookmarks } from './bookmarks/index.js';
export { initFolders } from './folders/index.js';
export { initHistory } from './history/index.js';
export { initResize } from './resize/index.js';
export { initCookies } from './cookies/index.js';
export { initClearData } from './cleardata/index.js';

// Page Analysis Tools
export { initCSS } from './css/index.js';
export { initJS } from './js/index.js';
export { initMetaTags } from './metatags/index.js';
export { initLinks } from './links/index.js';
export { initImages } from './images/index.js';
export { initHeaders } from './headers/index.js';
export { initFonts } from './fonts/index.js';
export { initHeadings } from './headings/index.js';

// SEO Tools
export { initSitemap } from './sitemap/index.js';
export { initKeywords } from './keywords/index.js';
export { initBrokenLinks } from './brokenlinks/index.js';
export { initReadability } from './readability/index.js';
export { initRobotsTxt } from './robotstxt/index.js';
export { initSocialPreview } from './socialpreview/index.js';

// Security & Performance Tools
export { initSSL } from './ssl/index.js';
export { initMixedContent } from './mixedcontent/index.js';
export { initAccessibility } from './accessibility/index.js';
export { initLoadTime } from './loadtime/index.js';
export { initWebVitals } from './webvitals/index.js';

// Generators & Converters
export { initQRCode } from './qrcode/index.js';
export { initLorem } from './lorem/index.js';
export { initJsonFormat } from './jsonformat/index.js';
export { initBase64 } from './base64/index.js';
export { initHashGen } from './hashgen/index.js';
export { initUrlEncoder } from './urlencoder/index.js';
export { initPasswordGen } from './passwordgen/index.js';
export { initFavicon } from './favicon/index.js';

// Text Tools
export { initWordCount } from './wordcount/index.js';
export { initCharCount } from './charcount/index.js';
export { initTextDiff } from './textdiff/index.js';
export { initTranslate } from './translate/index.js';
export { initSpeech } from './speech/index.js';
export { initRegex } from './regex/index.js';

// Marketing & Utilities
export { initEmails } from './emails/index.js';
export { initUTMBuilder } from './utmbuilder/index.js';
export { initRedirect } from './redirect/index.js';

// Productivity Tools
export { initNotes } from './notes/index.js';
export { initPomodoro } from './pomodoro/index.js';

// Network Tools
export { initMyIP } from './myip/index.js';
export { initRemoteDesktop } from './remotedesktop/index.js';
