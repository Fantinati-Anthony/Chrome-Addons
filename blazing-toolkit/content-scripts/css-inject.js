// CSS Inject content script
// Automatically applies saved CSS for the current domain

(function() {
  'use strict';

  const hostname = window.location.hostname;

  // Load and apply saved CSS for this domain
  chrome.storage.sync.get([hostname], (data) => {
    if (data[hostname]) {
      const style = document.createElement('style');
      style.id = 'at-toolkit-injected-css';
      style.textContent = data[hostname];
      document.head.appendChild(style);
      console.log('AT Toolkit: Custom CSS applied for', hostname);
    }
  });

  // Listen for storage changes to update CSS in real-time
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes[hostname]) {
      let style = document.getElementById('at-toolkit-injected-css');

      if (changes[hostname].newValue) {
        if (!style) {
          style = document.createElement('style');
          style.id = 'at-toolkit-injected-css';
          document.head.appendChild(style);
        }
        style.textContent = changes[hostname].newValue;
        console.log('AT Toolkit: Custom CSS updated for', hostname);
      } else if (style) {
        style.remove();
        console.log('AT Toolkit: Custom CSS removed for', hostname);
      }
    }
  });
})();
