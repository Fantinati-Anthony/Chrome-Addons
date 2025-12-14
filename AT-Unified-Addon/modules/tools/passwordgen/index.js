// Tool: Password Generator
// Generate secure random passwords

export function initPasswordGen() {
  const lengthInput = document.getElementById('pwd-length');
  const upperCheck = document.getElementById('pwd-upper');
  const lowerCheck = document.getElementById('pwd-lower');
  const numbersCheck = document.getElementById('pwd-numbers');
  const symbolsCheck = document.getElementById('pwd-symbols');
  const generateBtn = document.getElementById('btn-generate-pwd');
  const output = document.getElementById('password-output');
  const strengthDiv = document.getElementById('pwd-strength');
  const copyBtn = document.getElementById('btn-copy-pwd');

  generateBtn.addEventListener('click', () => {
    const length = parseInt(lengthInput.value) || 16;
    let chars = '';

    if (upperCheck.checked) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (lowerCheck.checked) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (numbersCheck.checked) chars += '0123456789';
    if (symbolsCheck.checked) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (!chars) {
      output.textContent = 'Selectionnez au moins une option';
      return;
    }

    let password = '';
    const array = new Uint32Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      password += chars[array[i] % chars.length];
    }

    output.textContent = password;

    let strength = 0;
    if (length >= 8) strength++;
    if (length >= 12) strength++;
    if (length >= 16) strength++;
    if (upperCheck.checked && lowerCheck.checked) strength++;
    if (numbersCheck.checked) strength++;
    if (symbolsCheck.checked) strength++;

    if (strength <= 2) {
      strengthDiv.textContent = 'Faible';
      strengthDiv.className = 'password-strength weak';
    } else if (strength <= 4) {
      strengthDiv.textContent = 'Moyen';
      strengthDiv.className = 'password-strength medium';
    } else {
      strengthDiv.textContent = 'Fort';
      strengthDiv.className = 'password-strength strong';
    }
  });

  copyBtn.addEventListener('click', async () => {
    if (output.textContent && output.textContent !== 'Selectionnez au moins une option') {
      await navigator.clipboard.writeText(output.textContent);
      copyBtn.textContent = 'Copie!';
      setTimeout(() => { copyBtn.textContent = 'Copier'; }, 1000);
    }
  });
}
