// Version checker for AT Unified Toolkit
// Simple update checker using GitHub API

const Updater = (function() {
  'use strict';

  // Configuration
  const CONFIG = {
    owner: 'Fantinati-Anthony',
    repo: 'Chrome-Addons',
    branch: 'main',
    path: 'AT-Unified-Addon',
    checkInterval: 3600000
  };

  // Get version URL (GitHub API - more trusted by antivirus)
  const VERSION_URL = 'https://api.github.com/repos/' + CONFIG.owner + '/' + CONFIG.repo + '/contents/' + CONFIG.path + '/version.json?ref=' + CONFIG.branch;

  // Get local version
  async function getLocalVersion() {
    return chrome.runtime.getManifest().version;
  }

  // Fetch remote version
  async function getRemoteVersion() {
    try {
      const response = await fetch(VERSION_URL, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      });

      if (!response.ok) return null;

      const data = await response.json();
      // GitHub API returns content in base64
      const content = atob(data.content);
      return JSON.parse(content);
    } catch (e) {
      console.log('Update check error:', e.message);
      return null;
    }
  }

  // Compare versions
  function isNewer(remote, local) {
    const r = remote.split('.').map(Number);
    const l = local.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if ((r[i] || 0) > (l[i] || 0)) return true;
      if ((r[i] || 0) < (l[i] || 0)) return false;
    }
    return false;
  }

  // Check for update
  async function checkForUpdate() {
    const localVersion = await getLocalVersion();
    const remoteData = await getRemoteVersion();

    if (!remoteData) {
      return { hasUpdate: false, error: 'Verification impossible' };
    }

    const hasUpdate = isNewer(remoteData.version, localVersion);

    chrome.storage.local.set({
      lastUpdateCheck: Date.now(),
      remoteVersion: remoteData.version,
      hasUpdate: hasUpdate
    });

    return {
      hasUpdate: hasUpdate,
      localVersion: localVersion,
      remoteVersion: remoteData.version,
      changelog: remoteData.changelog,
      releaseDate: remoteData.releaseDate
    };
  }

  // Open download page
  function downloadUpdate() {
    const url = 'https://github.com/' + CONFIG.owner + '/' + CONFIG.repo + '/tree/' + CONFIG.branch + '/' + CONFIG.path;
    chrome.tabs.create({ url: url });
  }

  // Download ZIP
  function downloadZip() {
    const url = 'https://github.com/' + CONFIG.owner + '/' + CONFIG.repo + '/archive/refs/heads/' + CONFIG.branch + '.zip';
    chrome.downloads.download({ url: url, saveAs: true });
  }

  // Get config
  function getConfig() {
    return {
      githubUser: CONFIG.owner,
      githubRepo: CONFIG.repo,
      githubBranch: CONFIG.branch,
      githubPath: CONFIG.path
    };
  }

  // Initialize
  async function init() {
    const data = await chrome.storage.local.get(['lastUpdateCheck']);
    const now = Date.now();

    if (!data.lastUpdateCheck || (now - data.lastUpdateCheck) > CONFIG.checkInterval) {
      await checkForUpdate();
    }
  }

  return {
    checkForUpdate: checkForUpdate,
    downloadUpdate: downloadUpdate,
    downloadZip: downloadZip,
    getLocalVersion: getLocalVersion,
    getConfig: getConfig,
    init: init
  };
})();

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() { Updater.init(); });
} else {
  Updater.init();
}
