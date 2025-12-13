// Tool: Speech Synthesis
// Select and save preferred voice for text-to-speech

export function initSpeech() {
  const voiceSelect = document.getElementById('voice-select');
  const saveVoiceBtn = document.getElementById('btn-save-voice');

  function loadVoices() {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      voiceSelect.innerHTML = '';
      voices.forEach((voice) => {
        const option = document.createElement('option');
        option.value = voice.name;
        option.textContent = `${voice.name} (${voice.lang})${voice.default ? ' *' : ''}`;
        voiceSelect.appendChild(option);
      });
      chrome.storage.sync.get(['selectedVoice'], (data) => {
        if (data.selectedVoice) voiceSelect.value = data.selectedVoice;
      });
    }
  }

  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  loadVoices();

  saveVoiceBtn.addEventListener('click', () => {
    const selectedVoice = voiceSelect.value;
    if (selectedVoice) {
      chrome.storage.sync.set({ selectedVoice }, () => {
        saveVoiceBtn.textContent = 'Sauvegarde!';
        setTimeout(() => { saveVoiceBtn.textContent = 'Sauvegarder la voix'; }, 1000);
      });
    }
  });
}
