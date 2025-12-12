// AT Unified Toolkit - Version Check

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
    var self = this;
    var currentVersion = self.getLocalVersion();

    return new Promise(function(resolve) {
      var xhr = new XMLHttpRequest();
      var url = 'https://raw.githubusercontent.com/Fantinati-Anthony/Chrome-Addons/main/AT-Unified-Addon/version.json';

      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status === 200) {
            try {
              var info = JSON.parse(xhr.responseText);
              var remoteVer = info.version;
              var hasNew = self.isNewer(remoteVer, currentVersion);
              resolve({
                hasUpdate: hasNew,
                localVersion: currentVersion,
                remoteVersion: remoteVer,
                changelog: info.changelog
              });
            } catch (e) {
              resolve({ hasUpdate: false, localVersion: currentVersion, error: 'Erreur de lecture' });
            }
          } else {
            resolve({ hasUpdate: false, localVersion: currentVersion, error: 'Erreur reseau' });
          }
        }
      };

      xhr.open('GET', url, true);
      xhr.send();
    });
  },

  isNewer: function(remote, local) {
    var r = remote.split('.').map(Number);
    var l = local.split('.').map(Number);
    for (var i = 0; i < 3; i++) {
      if ((r[i] || 0) > (l[i] || 0)) return true;
      if ((r[i] || 0) < (l[i] || 0)) return false;
    }
    return false;
  },

  init: function() {}
};
