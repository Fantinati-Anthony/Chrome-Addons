// Main popup initialization
// All modules are loaded via script tags in popup.html

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Toolkit loaded');

  // ========== APPLY CUSTOM COLORS ==========
  await applyCustomColors();

  // ========== SETTINGS BUTTON ==========
  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // ========== UPDATE SYSTEM ==========
  // UI elements for update
  const updateBadge = document.getElementById('update-badge');
  const updateBanner = document.getElementById('update-banner');
  const updateVersions = document.getElementById('update-versions');
  const downloadUpdateBtn = document.getElementById('btn-download-update');
  const dismissUpdateBtn = document.getElementById('btn-dismiss-update');

  // Check for updates
  async function checkAndShowUpdate() {
    try {
      const result = await Updater.checkForUpdate();

      if (result.hasUpdate) {
        // Show update badge
        updateBadge.classList.remove('hidden');

        // Update version text
        updateVersions.textContent = `v${result.localVersion} → v${result.remoteVersion}`;

        // Check if banner was dismissed this session
        const data = await chrome.storage.local.get(['updateDismissed', 'dismissedVersion']);
        if (!data.updateDismissed || data.dismissedVersion !== result.remoteVersion) {
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
  await checkAndShowUpdate();

  // Setup version footer
  const footer = document.getElementById('version-footer');
  if (footer) {
    const localVersion = await Updater.getLocalVersion();
    footer.innerHTML = `v${localVersion} | <a href="#" id="check-update-link">Verifier les mises a jour</a> | <a href="#" id="changelog-link">Changelog</a>`;

    // Manual check link
    document.getElementById('check-update-link').addEventListener('click', async (e) => {
      e.preventDefault();
      const link = e.target;
      link.textContent = 'Verification...';

      const result = await Updater.checkForUpdate();

      if (result.hasUpdate) {
        link.textContent = 'Mise a jour disponible!';
        updateBadge.classList.remove('hidden');
        updateBanner.classList.remove('hidden');
        updateVersions.textContent = `v${result.localVersion} → v${result.remoteVersion}`;
      } else if (result.error) {
        link.textContent = result.error;
      } else {
        link.textContent = 'A jour!';
      }

      setTimeout(() => {
        link.textContent = 'Verifier les mises a jour';
      }, 3000);
    });

    // Changelog link - opens CHANGELOG.md on GitHub
    document.getElementById('changelog-link').addEventListener('click', async (e) => {
      e.preventDefault();
      const config = await Updater.getConfig();
      const changelogUrl = `https://github.com/${config.githubUser}/${config.githubRepo}/blob/${config.githubBranch}/${config.githubPath}/CHANGELOG.md`;
      chrome.tabs.create({ url: changelogUrl });
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

  const data = await chrome.storage.sync.get(['customColors']);
  const colors = data.customColors || DEFAULT_COLORS;

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
}
