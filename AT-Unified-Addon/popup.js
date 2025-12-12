// Main popup initialization
// All modules are loaded via script tags in popup.html

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Toolkit loaded');

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
