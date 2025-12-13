// Tool: Base64 Encoder/Decoder
// Encode and decode Base64

export function initBase64() {
  const input = document.getElementById('base64-input');
  const encodeBtn = document.getElementById('btn-encode-base64');
  const decodeBtn = document.getElementById('btn-decode-base64');
  const output = document.getElementById('base64-output');
  const copyBtn = document.getElementById('btn-copy-base64');

  encodeBtn.addEventListener('click', () => {
    try {
      output.textContent = btoa(unescape(encodeURIComponent(input.value)));
      output.classList.remove('error');
    } catch (e) {
      output.textContent = 'Erreur: ' + e.message;
      output.classList.add('error');
    }
  });

  decodeBtn.addEventListener('click', () => {
    try {
      output.textContent = decodeURIComponent(escape(atob(input.value)));
      output.classList.remove('error');
    } catch (e) {
      output.textContent = 'Erreur: ' + e.message;
      output.classList.add('error');
    }
  });

  copyBtn.addEventListener('click', async () => {
    if (output.textContent) {
      await navigator.clipboard.writeText(output.textContent);
      copyBtn.textContent = 'Copie!';
      setTimeout(() => { copyBtn.textContent = 'Copier'; }, 1000);
    }
  });
}
