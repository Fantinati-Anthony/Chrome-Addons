// Tool: Quick Notes
// Store notes per domain

export async function initNotes() {
  const domainDiv = document.getElementById('notes-domain');
  const textarea = document.getElementById('notes-content');
  const saveBtn = document.getElementById('btn-save-notes');
  const clearBtn = document.getElementById('btn-clear-notes');

  let currentDomain = '';

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    currentDomain = url.hostname;
    domainDiv.textContent = `Notes pour: ${currentDomain}`;

    const key = 'notes_' + currentDomain;
    const data = await chrome.storage.local.get([key]);
    if (data[key]) {
      textarea.value = data[key];
    }
  } catch (e) {
    domainDiv.textContent = 'Notes';
  }

  saveBtn.addEventListener('click', async () => {
    if (!currentDomain) return;
    const key = 'notes_' + currentDomain;
    await chrome.storage.local.set({ [key]: textarea.value });
    saveBtn.textContent = 'Sauvegarde!';
    setTimeout(() => { saveBtn.textContent = 'Sauvegarder'; }, 1000);
  });

  clearBtn.addEventListener('click', async () => {
    if (!currentDomain) return;
    if (confirm('Effacer toutes les notes pour ce site?')) {
      const key = 'notes_' + currentDomain;
      await chrome.storage.local.remove([key]);
      textarea.value = '';
    }
  });
}
