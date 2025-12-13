// Tool: JSON Formatter
// Format, minify, and validate JSON

export function initJsonFormat() {
  const input = document.getElementById('json-input');
  const formatBtn = document.getElementById('btn-format-json');
  const minifyBtn = document.getElementById('btn-minify-json');
  const validateBtn = document.getElementById('btn-validate-json');
  const output = document.getElementById('json-output');
  const copyBtn = document.getElementById('btn-copy-json');

  formatBtn.addEventListener('click', () => {
    try {
      const parsed = JSON.parse(input.value);
      output.textContent = JSON.stringify(parsed, null, 2);
      output.classList.remove('error');
    } catch (e) {
      output.textContent = 'Erreur: ' + e.message;
      output.classList.add('error');
    }
  });

  minifyBtn.addEventListener('click', () => {
    try {
      const parsed = JSON.parse(input.value);
      output.textContent = JSON.stringify(parsed);
      output.classList.remove('error');
    } catch (e) {
      output.textContent = 'Erreur: ' + e.message;
      output.classList.add('error');
    }
  });

  validateBtn.addEventListener('click', () => {
    try {
      JSON.parse(input.value);
      output.textContent = '✓ JSON valide!';
      output.classList.remove('error');
      output.classList.add('success');
    } catch (e) {
      output.textContent = '✗ JSON invalide: ' + e.message;
      output.classList.add('error');
      output.classList.remove('success');
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
