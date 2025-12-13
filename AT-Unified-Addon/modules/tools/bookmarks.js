// Tool: Domain Bookmarks
// Shows bookmarks for the current domain

export async function initBookmarks() {
  const bookmarksDiv = document.getElementById('domain-bookmarks');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      bookmarksDiv.innerHTML = '<div class="status-message info">URL non disponible</div>';
      return;
    }

    const url = new URL(tab.url);
    const domain = url.hostname;
    const rootDomain = domain.split('.').slice(-2).join('.');

    chrome.bookmarks.getTree((tree) => {
      const matchingBookmarks = [];

      function search(nodes) {
        for (const node of nodes) {
          if (node.url) {
            try {
              const bookmarkUrl = new URL(node.url);
              const bookmarkDomain = bookmarkUrl.hostname;
              const bookmarkRootDomain = bookmarkDomain.split('.').slice(-2).join('.');
              if (bookmarkDomain === domain || bookmarkRootDomain === rootDomain) {
                matchingBookmarks.push(node);
              }
            } catch (e) {}
          }
          if (node.children) search(node.children);
        }
      }

      search(tree);
      renderBookmarks(matchingBookmarks, domain);
    });
  } catch (error) {
    bookmarksDiv.innerHTML = '<div class="status-message error">Erreur</div>';
  }

  function renderBookmarks(bookmarks, domain) {
    if (bookmarks.length === 0) {
      bookmarksDiv.innerHTML = `<div class="status-message info">Aucun favori pour ${domain}</div>`;
      return;
    }
    bookmarksDiv.innerHTML = '';
    bookmarks.forEach(b => {
      const item = document.createElement('div');
      item.className = 'list-item';
      item.innerHTML = `<span class="item-title">${b.title || b.url}</span><button class="visit-btn" data-url="${b.url}">→</button>`;
      bookmarksDiv.appendChild(item);
    });
    bookmarksDiv.querySelectorAll('.visit-btn').forEach(btn => {
      btn.addEventListener('click', () => chrome.tabs.create({ url: btn.dataset.url }));
    });
  }
}
