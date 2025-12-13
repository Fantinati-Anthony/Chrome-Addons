// Tool: Lorem Ipsum Generator
// Generate placeholder text

export function initLorem() {
  const countInput = document.getElementById('lorem-count');
  const generateBtn = document.getElementById('btn-generate-lorem');
  const outputDiv = document.getElementById('lorem-output');
  const copyBtn = document.getElementById('btn-copy-lorem');

  const loremText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';

  generateBtn.addEventListener('click', () => {
    const count = parseInt(countInput.value) || 3;
    const paragraphs = [];
    for (let i = 0; i < count; i++) {
      paragraphs.push(loremText);
    }
    outputDiv.textContent = paragraphs.join('\n\n');
  });

  copyBtn.addEventListener('click', async () => {
    const text = outputDiv.textContent;
    if (text) {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Copie!';
      setTimeout(() => { copyBtn.textContent = 'Copier'; }, 1000);
    }
  });
}
