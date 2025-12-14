// Speech Synthesis content script
// Patches the global speechSynthesis API to use saved voice preference

(function() {
  'use strict';

  let selectedVoiceName = null;

  // Load saved voice preference
  chrome.storage.sync.get(['selectedVoice'], (data) => {
    if (data.selectedVoice) {
      selectedVoiceName = data.selectedVoice;
      patchSpeechSynthesis();
    }
  });

  // Listen for changes to voice preference
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'sync' && changes.selectedVoice) {
      selectedVoiceName = changes.selectedVoice.newValue;
      console.log('AT Toolkit: Voice preference updated to', selectedVoiceName);
    }
  });

  // Patch the speechSynthesis.speak function
  function patchSpeechSynthesis() {
    if (!window.speechSynthesis) return;

    const originalSpeak = window.speechSynthesis.speak.bind(window.speechSynthesis);

    window.speechSynthesis.speak = function(utterance) {
      if (selectedVoiceName && utterance) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.name === selectedVoiceName);

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      return originalSpeak(utterance);
    };

    console.log('AT Toolkit: Speech synthesis patched with voice preference');
  }

  // Patch when voices are loaded
  if (window.speechSynthesis) {
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = () => {
        if (selectedVoiceName) {
          patchSpeechSynthesis();
        }
      };
    }
  }
})();
