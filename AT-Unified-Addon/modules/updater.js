// AT Unified Toolkit - Version Display

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

  checkForUpdate: function() {
    var v = this.getLocalVersion();
    return Promise.resolve({
      hasUpdate: false,
      localVersion: v,
      manualCheck: true
    });
  },

  init: function() {}
};
