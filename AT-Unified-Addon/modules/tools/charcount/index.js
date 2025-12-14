// Tool: Character Counter
// Count characters with social media limits

export function initCharCount() {
  const textarea = document.getElementById('charcount-input');
  const resultsDiv = document.getElementById('charcount-results');
  const limitItems = document.querySelectorAll('.limit-item');

  function updateCounts() {
    const text = textarea.value;
    const chars = text.length;
    const charsNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;

    resultsDiv.innerHTML = `
      <span><strong>${chars}</strong> caracteres</span>
      <span><strong>${charsNoSpaces}</strong> sans espaces</span>
      <span><strong>${words}</strong> mots</span>
      <span><strong>${lines}</strong> lignes</span>
    `;

    limitItems.forEach(item => {
      const limit = parseInt(item.dataset.limit);
      if (chars <= limit) {
        item.classList.remove('over');
        item.classList.add('ok');
      } else {
        item.classList.remove('ok');
        item.classList.add('over');
      }
      item.querySelector('.limit-value').textContent = `${chars}/${limit}`;
    });
  }

  textarea.addEventListener('input', updateCounts);
  updateCounts();
}
