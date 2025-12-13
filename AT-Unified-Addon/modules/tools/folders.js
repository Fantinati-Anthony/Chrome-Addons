// Tool: Bookmark Folders
// Shows bookmark folders from the bookmarks bar

export function initFolders() {
  const foldersDiv = document.getElementById('bookmark-folders');

  chrome.bookmarks.getSubTree('1', (results) => {
    if (!results || !results[0]) {
      foldersDiv.innerHTML = '<div class="status-message info">Barre de favoris vide</div>';
      return;
    }
    const folders = (results[0].children || []).filter(item => item.children);
    if (folders.length === 0) {
      foldersDiv.innerHTML = '<div class="status-message info">Aucun dossier</div>';
      return;
    }
    foldersDiv.innerHTML = '';
    folders.forEach(folder => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `<span class="item-title">📁 ${folder.title}</span><button class="visit-btn" data-id="${folder.id}">→</button>`;
      foldersDiv.appendChild(item);
    });
    foldersDiv.querySelectorAll('.visit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        chrome.tabs.create({ url: `chrome://bookmarks/?id=${btn.dataset.id}` });
      });
    });
  });
}
