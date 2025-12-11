// Main popup initialization
// All modules are loaded via script tags in popup.html

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Toolkit loaded');

  // ========== SETTINGS BUTTON ==========
  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // ========== QUICK LINKS CONFIG ==========
  const link1Label = document.getElementById('link1-label');
  const link2Label = document.getElementById('link2-label');
  const quickLink2 = document.getElementById('quick-link-2');

  // Load quick link labels from storage
  async function loadQuickLinks() {
    const data = await chrome.storage.sync.get(['link1Name', 'link1Url', 'link2Name', 'link2Url']);

    // Update labels
    if (link1Label) {
      link1Label.textContent = data.link1Name || 'Lien 1';
    }
    if (link2Label) {
      link2Label.textContent = data.link2Name || 'BO';
    }

    // Hide link2 if no URL configured
    if (quickLink2 && !data.link2Url) {
      quickLink2.style.display = 'none';
    } else if (quickLink2) {
      quickLink2.style.display = '';
    }
  }

  await loadQuickLinks();

  // ========== FIRST LAUNCH SETUP ==========
  const setupModal = document.getElementById('setup-modal');
  const saveSetupBtn = document.getElementById('btn-save-setup');
  const skipSetupBtn = document.getElementById('btn-skip-setup');

  // Check if first launch
  const configData = await chrome.storage.sync.get(['linksConfigured']);

  if (!configData.linksConfigured && setupModal) {
    setupModal.classList.remove('hidden');

    // Save setup
    saveSetupBtn.addEventListener('click', async () => {
      const link1Name = document.getElementById('setup-link1-name').value.trim() || 'Lien 1';
      const link1Url = document.getElementById('setup-link1-url').value.trim();
      const link2Name = document.getElementById('setup-link2-name').value.trim() || 'BO';
      const link2Url = document.getElementById('setup-link2-url').value.trim();

      await chrome.storage.sync.set({
        link1Name,
        link1Url,
        link2Name,
        link2Url,
        linksConfigured: true
      });

      setupModal.classList.add('hidden');
      await loadQuickLinks();
    });

    // Skip setup
    skipSetupBtn.addEventListener('click', async () => {
      await chrome.storage.sync.set({ linksConfigured: true });
      setupModal.classList.add('hidden');
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
