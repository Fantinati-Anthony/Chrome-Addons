// Main popup initialization
// All modules are loaded via script tags in popup.html

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Toolkit loaded');

  // ========== INITIALIZE I18N ==========
  if (typeof I18n !== 'undefined') {
    await I18n.init();
  }

  // ========== APPLY CUSTOM COLORS ==========
  await applyCustomColors();

  // ========== APPLY CUSTOM TITLE ==========
  const popupTitleEl = document.getElementById('popup-title');
  if (popupTitleEl) {
    const data = await chrome.storage.sync.get(['popupTitle']);
    if (data.popupTitle) {
      popupTitleEl.textContent = data.popupTitle;
    }
  }

  // ========== APPLY MODULE VISIBILITY ==========
  await applyModuleVisibility();

  // ========== CATEGORY COLLAPSE/EXPAND ==========
  initCategoryHeaders();

  // ========== SETTINGS BUTTON ==========
  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // ========== RELOAD BUTTON ==========
  const reloadBtn = document.getElementById('btn-reload');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      chrome.runtime.reload();
    });
  }

  // ========== UPDATE SYSTEM ==========
  // UI elements for update
  const updateBadge = document.getElementById('update-badge');
  const updateBanner = document.getElementById('update-banner');
  const updateVersions = document.getElementById('update-versions');
  const downloadUpdateBtn = document.getElementById('btn-download-update');
  const dismissUpdateBtn = document.getElementById('btn-dismiss-update');

  // Check for updates from storage (background.js handles the actual check)
  async function checkAndShowUpdate() {
    try {
      const data = await chrome.storage.local.get(['hasUpdate', 'remoteVersion', 'updateDismissed', 'dismissedVersion']);
      const localVersion = chrome.runtime.getManifest().version;

      if (data.hasUpdate && data.remoteVersion) {
        // Show update badge
        updateBadge.classList.remove('hidden');

        // Update version text
        updateVersions.textContent = `v${localVersion} → v${data.remoteVersion}`;

        // Check if banner was dismissed this session
        if (!data.updateDismissed || data.dismissedVersion !== data.remoteVersion) {
          updateBanner.classList.remove('hidden');
        }
      } else {
        updateBadge.classList.add('hidden');
        updateBanner.classList.add('hidden');
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }

  // Badge click - show banner
  if (updateBadge) {
    updateBadge.addEventListener('click', () => {
      updateBanner.classList.remove('hidden');
    });
  }

  // Download button - now triggers auto-update
  if (downloadUpdateBtn) {
    downloadUpdateBtn.addEventListener('click', () => {
      AutoUpdater.startUpdate();
    });
  }

  // Dismiss button
  if (dismissUpdateBtn) {
    dismissUpdateBtn.addEventListener('click', async () => {
      updateBanner.classList.add('hidden');

      // Remember dismissal for this version
      const data = await chrome.storage.local.get(['remoteVersion']);
      chrome.storage.local.set({
        updateDismissed: true,
        dismissedVersion: data.remoteVersion
      });
    });
  }

  // Check for updates on popup open
  try {
    await checkAndShowUpdate();
  } catch (e) {
    console.log('Update check skipped:', e.message);
  }

  // Setup version footer
  const footer = document.getElementById('version-footer');
  if (footer) {
    const localVersion = chrome.runtime.getManifest().version;
    const checkText = typeof I18n !== 'undefined' ? I18n.t('app.version') : 'Verifier les mises a jour';
    const changelogText = typeof I18n !== 'undefined' ? I18n.t('app.changelog') : 'Changelog';
    footer.innerHTML = `v${localVersion} | <a href="#" id="check-update-link">Verifier les mises a jour</a> | <a href="#" id="changelog-link">Changelog</a>`;

    // Manual check link - triggers background check and updates UI
    document.getElementById('check-update-link').addEventListener('click', async (e) => {
      e.preventDefault();
      const link = e.target;
      link.textContent = 'Verification...';

      // Ask background to check
      chrome.runtime.sendMessage({ type: 'checkForUpdates' }, async (response) => {
        if (response && response.hasUpdate) {
          link.textContent = 'MAJ disponible!';
          checkAndShowUpdate();
        } else {
          link.textContent = 'A jour!';
        }
        setTimeout(() => {
          link.textContent = 'Verifier les mises a jour';
        }, 3000);
      });
    });

    // Changelog link - opens CHANGELOG.md on GitHub
    document.getElementById('changelog-link').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://github.com/Fantinati-Anthony/Chrome-Addons/blob/main/AT-Unified-Addon/CHANGELOG.md' });
    });
  }
});

// ========== CATEGORY HEADERS ==========
function initCategoryHeaders() {
  document.querySelectorAll('.category-header').forEach(header => {
    header.addEventListener('click', () => {
      const isCollapsed = header.dataset.collapsed === 'true';
      header.dataset.collapsed = isCollapsed ? 'false' : 'true';

      // Save collapsed state
      const categoryId = header.closest('.category-section').id;
      saveCollapsedState(categoryId, !isCollapsed);
    });
  });

  // Load saved collapsed states
  loadCollapsedStates();
}

async function loadCollapsedStates() {
  const data = await chrome.storage.local.get(['collapsedCategories']);
  const collapsed = data.collapsedCategories || {};

  Object.keys(collapsed).forEach(categoryId => {
    const section = document.getElementById(categoryId);
    if (section && collapsed[categoryId]) {
      const header = section.querySelector('.category-header');
      if (header) {
        header.dataset.collapsed = 'true';
      }
    }
  });
}

async function saveCollapsedState(categoryId, isCollapsed) {
  const data = await chrome.storage.local.get(['collapsedCategories']);
  const collapsed = data.collapsedCategories || {};
  collapsed[categoryId] = isCollapsed;
  await chrome.storage.local.set({ collapsedCategories: collapsed });
}

// ========== MODULE VISIBILITY ==========
async function applyModuleVisibility() {
  // Load enabled modules
  const data = await chrome.storage.sync.get(['enabledModules']);
  const enabledModules = data.enabledModules || {};

  // Apply visibility to tool icons
  document.querySelectorAll('.tool-icon[data-tool]').forEach(icon => {
    const toolId = icon.dataset.tool;
    // If module is explicitly disabled (false), hide it
    if (enabledModules[toolId] === false) {
      icon.style.display = 'none';
    }
  });

  // Hide empty categories (except custom links)
  document.querySelectorAll('.category-section').forEach(section => {
    const categoryId = section.id;
    if (categoryId === 'category-customLinks') return; // Skip custom links

    const grid = section.querySelector('.tools-grid');
    if (!grid) return;

    const visibleTools = grid.querySelectorAll('.tool-icon:not([style*="display: none"])');
    if (visibleTools.length === 0) {
      section.classList.add('hidden');
    } else {
      section.classList.remove('hidden');
    }
  });

  // Handle custom links category visibility
  const customLinksSection = document.getElementById('category-customLinks');
  if (customLinksSection) {
    const data = await chrome.storage.sync.get(['customButtons']);
    const customButtons = data.customButtons || [];
    if (customButtons.length === 0) {
      customLinksSection.classList.add('hidden');
    } else {
      customLinksSection.classList.remove('hidden');
    }
  }
}

// ========== CUSTOM COLORS ==========
async function applyCustomColors() {
  const DEFAULT_COLORS = {
    bgColor: '#f5f5f5',
    textColor: '#333333',
    primaryColor: '#3498db',
    primaryHover: '#2980b9',
    secondaryColor: '#2c3e50',
    buttonBg: '#ffffff',
    buttonText: '#666666',
    panelBg: '#ffffff',
    borderColor: '#eeeeee',
    successColor: '#27ae60',
    errorColor: '#e74c3c'
  };

  const DEFAULT_RADIUS = {
    radiusSmall: 4,
    radiusMedium: 8,
    radiusLarge: 12
  };

  const data = await chrome.storage.sync.get(['customColors', 'customRadius']);
  const colors = data.customColors || DEFAULT_COLORS;
  const radius = data.customRadius || DEFAULT_RADIUS;

  // Apply colors to CSS variables
  const root = document.documentElement;
  root.style.setProperty('--bg-color', colors.bgColor);
  root.style.setProperty('--text-color', colors.textColor);
  root.style.setProperty('--primary-color', colors.primaryColor);
  root.style.setProperty('--primary-hover', colors.primaryHover);
  root.style.setProperty('--secondary-color', colors.secondaryColor);
  root.style.setProperty('--button-bg', colors.buttonBg);
  root.style.setProperty('--button-text', colors.buttonText);
  root.style.setProperty('--panel-bg', colors.panelBg);
  root.style.setProperty('--border-color', colors.borderColor);
  root.style.setProperty('--success-color', colors.successColor);
  root.style.setProperty('--error-color', colors.errorColor);

  // Apply border radius
  root.style.setProperty('--radius-small', radius.radiusSmall + 'px');
  root.style.setProperty('--radius-medium', radius.radiusMedium + 'px');
  root.style.setProperty('--radius-large', radius.radiusLarge + 'px');
}
