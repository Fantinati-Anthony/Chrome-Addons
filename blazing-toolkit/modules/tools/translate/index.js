// Tool: Translator
// Open Google Translate with user text

export function initTranslate() {
  const inputTextarea = document.getElementById('translate-input');
  const langSelect = document.getElementById('translate-lang');
  const translateBtn = document.getElementById('btn-translate');

  translateBtn.addEventListener('click', () => {
    const text = inputTextarea.value.trim();
    const targetLang = langSelect.value;

    if (!text) {
      alert('Veuillez entrer du texte');
      return;
    }

    // Open Google Translate with the text
    const url = `https://translate.google.com/?sl=auto&tl=${targetLang}&text=${encodeURIComponent(text)}&op=translate`;
    chrome.tabs.create({ url });
  });
}
