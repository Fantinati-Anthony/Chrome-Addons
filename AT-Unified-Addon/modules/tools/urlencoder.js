// Tool: URL Encoder/Decoder
// Encode and decode URL strings

export function initUrlEncoder() {
  const input = document.getElementById('url-input');
  const encodeBtn = document.getElementById('btn-url-encode');
  const decodeBtn = document.getElementById('btn-url-decode');
  const output = document.getElementById('url-output');
  const copyBtn = document.getElementById('btn-copy-url');

  encodeBtn.addEventListener('click', () => {
    output.textContent = encodeURIComponent(input.value);
  });

  decodeBtn.addEventListener('click', () => {
    try {
      output.textContent = decodeURIComponent(input.value);
    } catch (e) {
      output.textContent = 'Erreur: ' + e.message;
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
