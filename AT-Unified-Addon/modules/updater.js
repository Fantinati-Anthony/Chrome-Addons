// Version checker for AT Unified Toolkit
// Checks version.json on GitHub to notify user of available updates

const Updater = (function() {
  'use strict';

  // Repository information (hardcoded for security)
  const REPO_OWNER = 'Fantinati-Anthony';
  const REPO_NAME = 'Chrome-Addons';
  const REPO_BRANCH = 'main';
  const ADDON_PATH = 'AT-Unified-Addon';
  const CHECK_INTERVAL = 3600000; // 1 hour

  // Build version file URL
  function buildVersionUrl() {
    const base = 'https://raw.githubusercontent.com';
    const path = `${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${ADDON_PATH}/version.json`;
    return `${base}/${path}?t=${Date.now()}`;
  }

  // Build download URL for updates
  function buildDownloadUrl() {
    return `https://download-directory.github.io/?url=https://github.com/${REPO_OWNER}/${REPO_NAME}/tree/${REPO_BRANCH}/${ADDON_PATH}`;
  }

  // Compare semantic versions (returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal)
  function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }

  // Get current local version from manifest
  async function getLocalVersion() {
    const manifest = chrome.runtime.getManifest();
    return manifest.version;
  }

  // Fetch remote version from GitHub (public repo only)
  async function getRemoteVersion() {
    try {
      const url = buildVersionUrl();
      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Fichier version.json introuvable');
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Version check failed:', error);
      return null;
    }
  }

  // Check for updates
  async function checkForUpdate() {
    const localVersion = await getLocalVersion();
    const remoteData = await getRemoteVersion();

    if (!remoteData) {
      return {
        hasUpdate: false,
        error: 'Impossible de verifier les mises a jour'
      };
    }

    const hasUpdate = compareVersions(remoteData.version, localVersion) > 0;

    // Store last check time
    chrome.storage.local.set({
      lastUpdateCheck: Date.now(),
      remoteVersion: remoteData.version,
      hasUpdate: hasUpdate
    });

    return {
      hasUpdate,
      localVersion,
      remoteVersion: remoteData.version,
      changelog: remoteData.changelog,
      releaseDate: remoteData.releaseDate
    };
  }

  // Download update (opens download page)
  async function downloadUpdate() {
    chrome.tabs.create({ url: buildDownloadUrl() });
  }

  // Download full repo ZIP
  async function downloadZip() {
    const zipUrl = `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/${REPO_BRANCH}.zip`;
    chrome.downloads.download({
      url: zipUrl,
      filename: `${REPO_NAME}-${REPO_BRANCH}.zip`,
      saveAs: true
    });
  }

  // Reload extension
  function reloadExtension() {
    chrome.runtime.reload();
  }

  // Initialize - check on startup if needed
  async function init() {
    const data = await chrome.storage.local.get(['lastUpdateCheck', 'hasUpdate']);
    const now = Date.now();

    if (!data.lastUpdateCheck || (now - data.lastUpdateCheck) > CHECK_INTERVAL) {
      await checkForUpdate();
    }
  }

  // Get config info (for debugging)
  async function getConfig() {
    return {
      githubUser: REPO_OWNER,
      githubRepo: REPO_NAME,
      githubBranch: REPO_BRANCH,
      githubPath: ADDON_PATH,
      githubPrivate: false,
      githubToken: ''
    };
  }

  return {
    checkForUpdate,
    downloadUpdate,
    downloadZip,
    reloadExtension,
    getLocalVersion,
    getConfig,
    init
  };
})();

// Auto-initialize when loaded
document.addEventListener('DOMContentLoaded', () => {
  Updater.init();
});
