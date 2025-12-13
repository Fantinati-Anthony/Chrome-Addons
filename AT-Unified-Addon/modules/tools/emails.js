// Tool: Email Extractor
// Extracts email addresses from the current page

export function initEmails() {
  const extractBtn = document.getElementById('btn-extract-emails');
  const emailCount = document.getElementById('email-count');
  const emailList = document.getElementById('email-list');
  const copyLinesBtn = document.getElementById('btn-copy-emails-lines');
  const copySemicolonBtn = document.getElementById('btn-copy-emails-semicolon');
  const clearBtn = document.getElementById('btn-clear-emails');

  let extractedEmails = [];

  chrome.storage.local.get(['emails'], (data) => {
    if (data.emails && data.emails.length > 0) {
      extractedEmails = data.emails;
      renderEmails();
    }
  });

  extractBtn.addEventListener('click', extractEmails);

  copyLinesBtn.addEventListener('click', () => {
    if (extractedEmails.length > 0) {
      navigator.clipboard.writeText(extractedEmails.join('\n'));
      copyLinesBtn.textContent = 'Copie!';
      setTimeout(() => { copyLinesBtn.textContent = 'Copier (lignes)'; }, 1000);
    }
  });

  copySemicolonBtn.addEventListener('click', () => {
    if (extractedEmails.length > 0) {
      navigator.clipboard.writeText(extractedEmails.join(';'));
      copySemicolonBtn.textContent = 'Copie!';
      setTimeout(() => { copySemicolonBtn.textContent = 'Copier (;)'; }, 1000);
    }
  });

  clearBtn.addEventListener('click', () => {
    extractedEmails = [];
    chrome.storage.local.set({ emails: [] });
    renderEmails();
  });

  async function extractEmails() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const pageContent = document.documentElement.innerHTML;
          const matches = pageContent.match(emailRegex) || [];
          return [...new Set(matches)];
        }
      });
      if (results && results[0] && results[0].result) {
        extractedEmails = results[0].result;
        chrome.storage.local.set({ emails: extractedEmails });
        renderEmails();
      }
    } catch (error) {
      console.error('Error extracting emails:', error);
      emailList.innerHTML = '<div class="status-message error">Erreur</div>';
    }
  }

  function renderEmails() {
    emailCount.textContent = `${extractedEmails.length} email(s)`;
    emailList.textContent = extractedEmails.length > 0 ? extractedEmails.join('\n') : '';
  }
}
