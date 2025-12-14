// Tool: Hash Generator
// Generate SHA-256, SHA-512, SHA-1 hashes

export function initHashGen() {
  const input = document.getElementById('hash-input');
  const sha256Btn = document.getElementById('btn-hash-sha256');
  const sha512Btn = document.getElementById('btn-hash-sha512');
  const sha1Btn = document.getElementById('btn-hash-sha1');
  const md5Btn = document.getElementById('btn-hash-md5');
  const output = document.getElementById('hash-output');
  const copyBtn = document.getElementById('btn-copy-hash');

  async function computeHash(algorithm, text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  sha256Btn.addEventListener('click', async () => {
    const hash = await computeHash('SHA-256', input.value);
    output.innerHTML = `<div class="hash-type">SHA-256</div>${hash}`;
  });

  sha512Btn.addEventListener('click', async () => {
    const hash = await computeHash('SHA-512', input.value);
    output.innerHTML = `<div class="hash-type">SHA-512</div>${hash}`;
  });

  sha1Btn.addEventListener('click', async () => {
    const hash = await computeHash('SHA-1', input.value);
    output.innerHTML = `<div class="hash-type">SHA-1</div>${hash}`;
  });

  md5Btn.addEventListener('click', () => {
    output.innerHTML = '<div class="hash-type">MD5</div><div class="status-message info">MD5 non disponible (utilisez SHA-256)</div>';
  });

  copyBtn.addEventListener('click', async () => {
    const hashText = output.textContent.replace(/^(MD5|SHA-1|SHA-256|SHA-512)/, '').trim();
    if (hashText && !hashText.includes('non disponible')) {
      await navigator.clipboard.writeText(hashText);
      copyBtn.textContent = 'Copie!';
      setTimeout(() => { copyBtn.textContent = 'Copier'; }, 1000);
    }
  });
}
