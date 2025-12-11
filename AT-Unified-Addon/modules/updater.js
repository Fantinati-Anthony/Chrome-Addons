// Version checker for AT Unified Toolkit
// Uses public GitHub raw files (no API)

var Updater = {
  getLocalVersion: function() {
    return chrome.runtime.getManifest().version;
  },

  getConfig: function() {
    return {
      githubUser: 'Fantinati-Anthony',
      githubRepo: 'Chrome-Addons',
      githubBranch: 'main',
      githubPath: 'AT-Unified-Addon'
    };
  },

  checkForUpdate: async function() {
    var config = this.getConfig();
    var localVersion = this.getLocalVersion();

    // Public raw URL - no API (with cache buster)
    var url = 'https://raw.githubusercontent.com/'
      + config.githubUser + '/'
      + config.githubRepo + '/'
      + config.githubBranch + '/'
      + config.githubPath + '/version.json'
      + '?t=' + Date.now();

    try {
      var response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        return { hasUpdate: false, error: 'Erreur reseau' };
      }

      var data = await response.json();
      var remoteVersion = data.version;

      await chrome.storage.local.set({ remoteVersion: remoteVersion });

      var hasUpdate = this.compareVersions(remoteVersion, localVersion) > 0;

      return {
        hasUpdate: hasUpdate,
        localVersion: localVersion,
        remoteVersion: remoteVersion
      };
    } catch (err) {
      return { hasUpdate: false, error: 'Verification impossible' };
    }
  },

  compareVersions: function(v1, v2) {
    var parts1 = v1.split('.').map(Number);
    var parts2 = v2.split('.').map(Number);

    for (var i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      var p1 = parts1[i] || 0;
      var p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  },

  init: function() {}
};
