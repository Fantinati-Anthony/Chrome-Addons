// Main popup initialization
// All modules are loaded via script tags in popup.html

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Toolkit loaded');

  // ========== INITIALIZE I18N ==========
  if (typeof I18n !== 'undefined') {
    await I18n.init();
  }

  // ========== APPLY CUSTOM COLORS ==========
  await applyCustomColors();

  // ========== APPLY BUTTON SIZE ==========
  await applyButtonSize();

  // ========== APPLY CUSTOM TITLE ==========
  const popupTitleEl = document.getElementById('popup-title');
  if (popupTitleEl) {
    const data = await chrome.storage.sync.get(['popupTitle']);
    if (data.popupTitle) {
      popupTitleEl.textContent = data.popupTitle;
    }
  }

  // ========== APPLY MODULE VISIBILITY ==========
  await applyModuleVisibility();

  // ========== INITIALIZE FAVORITES ==========
  await initFavorites();

  // ========== INITIALIZE SEARCH ==========
  initSearch();

  // ========== CATEGORY COLLAPSE/EXPAND (ACCORDION) ==========
  initCategoryHeaders();

  // ========== SETTINGS BUTTON ==========
  const settingsBtn = document.getElementById('btn-settings');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  // ========== RELOAD BUTTON ==========
  const reloadBtn = document.getElementById('btn-reload');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      chrome.runtime.reload();
    });
  }

  // ========== UPDATE SYSTEM ==========
  // UI elements for update
  const updateBadge = document.getElementById('update-badge');
  const updateBanner = document.getElementById('update-banner');
  const updateVersions = document.getElementById('update-versions');
  const downloadUpdateBtn = document.getElementById('btn-download-update');
  const dismissUpdateBtn = document.getElementById('btn-dismiss-update');

  // Check for updates from storage (background.js handles the actual check)
  async function checkAndShowUpdate() {
    try {
      const data = await chrome.storage.local.get(['hasUpdate', 'remoteVersion', 'updateDismissed', 'dismissedVersion']);
      const localVersion = chrome.runtime.getManifest().version;

      if (data.hasUpdate && data.remoteVersion) {
        // Show update badge
        updateBadge.classList.remove('hidden');

        // Update version text
        updateVersions.textContent = `v${localVersion} → v${data.remoteVersion}`;

        // Check if banner was dismissed this session
        if (!data.updateDismissed || data.dismissedVersion !== data.remoteVersion) {
          updateBanner.classList.remove('hidden');
        }
      } else {
        updateBadge.classList.add('hidden');
        updateBanner.classList.add('hidden');
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  }

  // Badge click - show banner
  if (updateBadge) {
    updateBadge.addEventListener('click', () => {
      updateBanner.classList.remove('hidden');
    });
  }

  // Download button - now triggers auto-update
  if (downloadUpdateBtn) {
    downloadUpdateBtn.addEventListener('click', () => {
      AutoUpdater.startUpdate();
    });
  }

  // Dismiss button
  if (dismissUpdateBtn) {
    dismissUpdateBtn.addEventListener('click', async () => {
      updateBanner.classList.add('hidden');

      // Remember dismissal for this version
      const data = await chrome.storage.local.get(['remoteVersion']);
      chrome.storage.local.set({
        updateDismissed: true,
        dismissedVersion: data.remoteVersion
      });
    });
  }

  // Check for updates on popup open
  try {
    await checkAndShowUpdate();
  } catch (e) {
    console.log('Update check skipped:', e.message);
  }

  // Setup version footer
  const footer = document.getElementById('version-footer');
  if (footer) {
    const localVersion = chrome.runtime.getManifest().version;
    const checkText = typeof I18n !== 'undefined' ? I18n.t('app.version') : 'Verifier les mises a jour';
    const changelogText = typeof I18n !== 'undefined' ? I18n.t('app.changelog') : 'Changelog';
    footer.innerHTML = `v${localVersion} | <a href="#" id="check-update-link">Verifier les mises a jour</a> | <a href="#" id="changelog-link">Changelog</a>`;

    // Manual check link - triggers background check and updates UI
    document.getElementById('check-update-link').addEventListener('click', async (e) => {
      e.preventDefault();
      const link = e.target;
      link.textContent = 'Verification...';

      // Ask background to check
      chrome.runtime.sendMessage({ type: 'checkForUpdates' }, async (response) => {
        if (response && response.hasUpdate) {
          link.textContent = 'MAJ disponible!';
          checkAndShowUpdate();
        } else {
          link.textContent = 'A jour!';
        }
        setTimeout(() => {
          link.textContent = 'Verifier les mises a jour';
        }, 3000);
      });
    });

    // Changelog link - opens CHANGELOG.md on GitHub
    document.getElementById('changelog-link').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: 'https://github.com/Fantinati-Anthony/Chrome-Addons/blob/main/AT-Unified-Addon/CHANGELOG.md' });
    });
  }
});

// ========== CATEGORY HEADERS (ACCORDION) ==========
function initCategoryHeaders() {
  document.querySelectorAll('.category-header').forEach(header => {
    // Skip favorites header (no collapse)
    if (header.dataset.noCollapse === 'true') return;

    header.addEventListener('click', () => {
      const isCollapsed = header.dataset.collapsed === 'true';
      const categoryId = header.closest('.category-section').id;

      if (isCollapsed) {
        // Opening this category - close all others (accordion effect)
        document.querySelectorAll('.category-header').forEach(otherHeader => {
          if (otherHeader !== header && otherHeader.dataset.noCollapse !== 'true') {
            otherHeader.dataset.collapsed = 'true';
            const otherId = otherHeader.closest('.category-section').id;
            saveCollapsedState(otherId, true);
          }
        });
        header.dataset.collapsed = 'false';
        saveCollapsedState(categoryId, false);
      } else {
        // Closing this category
        header.dataset.collapsed = 'true';
        saveCollapsedState(categoryId, true);
      }
    });
  });
}

async function saveCollapsedState(categoryId, isCollapsed) {
  const data = await chrome.storage.local.get(['collapsedCategories']);
  const collapsed = data.collapsedCategories || {};
  collapsed[categoryId] = isCollapsed;
  await chrome.storage.local.set({ collapsedCategories: collapsed });
}

// ========== SEARCH FUNCTIONALITY ==========
function initSearch() {
  const searchInput = document.getElementById('search-tools');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    filterTools(query);
  });

  // Clear search on Escape
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      filterTools('');
    }
  });
}

function filterTools(query) {
  const allTools = document.querySelectorAll('.tool-icon[data-tool]');
  const customButtons = document.querySelectorAll('#custom-buttons-container .tool-icon[data-custom-url]');
  const categories = document.querySelectorAll('.category-section:not(.favorites-section)');

  if (!query) {
    // Show all tools, restore category visibility
    allTools.forEach(tool => {
      tool.classList.remove('search-hidden', 'search-match');
    });
    customButtons.forEach(btn => {
      btn.classList.remove('search-hidden', 'search-match');
    });
    categories.forEach(cat => {
      cat.style.display = '';
    });
    // Re-apply module visibility
    applyModuleVisibility();
    return;
  }

  // Filter built-in tools by query
  allTools.forEach(tool => {
    const toolId = tool.dataset.tool;
    const label = tool.querySelector('.tool-label')?.textContent.toLowerCase() || '';
    const title = tool.dataset.title?.toLowerCase() || '';

    const matches = toolId.includes(query) || label.includes(query) || title.includes(query);

    if (matches) {
      tool.classList.remove('search-hidden');
      tool.classList.add('search-match');
    } else {
      tool.classList.add('search-hidden');
      tool.classList.remove('search-match');
    }
  });

  // Filter custom buttons by query
  customButtons.forEach(btn => {
    const label = btn.querySelector('.tool-label')?.textContent.toLowerCase() || '';
    const url = btn.dataset.customUrl?.toLowerCase() || '';
    const title = btn.title?.toLowerCase() || '';

    const matches = label.includes(query) || url.includes(query) || title.includes(query);

    if (matches) {
      btn.classList.remove('search-hidden');
      btn.classList.add('search-match');
    } else {
      btn.classList.add('search-hidden');
      btn.classList.remove('search-match');
    }
  });

  // Expand categories with matches, hide empty ones
  categories.forEach(cat => {
    const visibleTools = cat.querySelectorAll('.tool-icon:not(.search-hidden)');
    if (visibleTools.length > 0) {
      cat.style.display = '';
      const header = cat.querySelector('.category-header');
      if (header && header.dataset.noCollapse !== 'true') {
        header.dataset.collapsed = 'false';
      }
    } else {
      cat.style.display = 'none';
    }
  });
}

// ========== FAVORITES SYSTEM ==========
let favoriteTools = [];

async function initFavorites() {
  // Load favorites from storage
  const data = await chrome.storage.sync.get(['favoriteTools']);
  favoriteTools = data.favoriteTools || [];

  // Add star buttons to all built-in tools
  addFavoriteStars();

  // Render favorites section
  renderFavorites();

  // Set empty text
  const favContainer = document.getElementById('favorites-container');
  if (favContainer) {
    const emptyText = typeof I18n !== 'undefined' ? I18n.t('favorites.empty') : 'Aucun favori';
    favContainer.dataset.emptyText = emptyText;
  }

  // Watch for custom buttons being loaded and add stars to them
  const customContainer = document.getElementById('custom-buttons-container');
  if (customContainer) {
    const observer = new MutationObserver(() => {
      addFavoriteStarsToCustomButtons();
      renderFavorites();
    });
    observer.observe(customContainer, { childList: true });

    // Also add stars if custom buttons are already loaded
    setTimeout(() => {
      addFavoriteStarsToCustomButtons();
      renderFavorites();
    }, 100);
  }
}

function addFavoriteStars() {
  document.querySelectorAll('.category-section:not(.favorites-section) .tool-icon[data-tool]').forEach(tool => {
    const toolId = tool.dataset.tool;

    // Don't add star if already exists
    if (tool.querySelector('.favorite-star')) return;

    const star = document.createElement('button');
    star.className = 'favorite-star' + (favoriteTools.includes(toolId) ? ' is-favorite' : '');
    star.textContent = favoriteTools.includes(toolId) ? '★' : '☆';
    star.title = favoriteTools.includes(toolId) ? 'Retirer des favoris' : 'Ajouter aux favoris';

    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(toolId);
    });

    tool.appendChild(star);
  });
}

// Add favorite stars to custom buttons (uses custom:URL format)
function addFavoriteStarsToCustomButtons() {
  document.querySelectorAll('#custom-buttons-container .tool-icon[data-custom-url]').forEach(btn => {
    const customUrl = btn.dataset.customUrl;
    const favId = 'custom:' + customUrl;

    // Don't add star if already exists
    if (btn.querySelector('.favorite-star')) return;

    const star = document.createElement('button');
    star.className = 'favorite-star' + (favoriteTools.includes(favId) ? ' is-favorite' : '');
    star.textContent = favoriteTools.includes(favId) ? '★' : '☆';
    star.title = favoriteTools.includes(favId) ? 'Retirer des favoris' : 'Ajouter aux favoris';

    star.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(favId);
    });

    btn.appendChild(star);
  });
}

async function toggleFavorite(toolId) {
  const index = favoriteTools.indexOf(toolId);
  if (index > -1) {
    favoriteTools.splice(index, 1);
  } else {
    favoriteTools.push(toolId);
  }

  // Save to storage
  await chrome.storage.sync.set({ favoriteTools });

  // Update UI
  updateFavoriteStars();
  renderFavorites();
}

function updateFavoriteStars() {
  // Update built-in tool stars
  document.querySelectorAll('.category-section:not(.favorites-section) .tool-icon[data-tool] .favorite-star').forEach(star => {
    const tool = star.closest('.tool-icon');
    const toolId = tool?.dataset.tool;
    if (!toolId) return;

    const isFav = favoriteTools.includes(toolId);
    star.className = 'favorite-star' + (isFav ? ' is-favorite' : '');
    star.textContent = isFav ? '★' : '☆';
    star.title = isFav ? 'Retirer des favoris' : 'Ajouter aux favoris';
  });

  // Update custom button stars
  document.querySelectorAll('#custom-buttons-container .tool-icon[data-custom-url] .favorite-star').forEach(star => {
    const btn = star.closest('.tool-icon');
    const customUrl = btn?.dataset.customUrl;
    if (!customUrl) return;

    const favId = 'custom:' + customUrl;
    const isFav = favoriteTools.includes(favId);
    star.className = 'favorite-star' + (isFav ? ' is-favorite' : '');
    star.textContent = isFav ? '★' : '☆';
    star.title = isFav ? 'Retirer des favoris' : 'Ajouter aux favoris';
  });
}

function renderFavorites() {
  const container = document.getElementById('favorites-container');
  const section = document.getElementById('category-favorites');
  const countSpan = section?.querySelector('.favorites-count');

  if (!container || !section) return;

  // Clear container
  container.innerHTML = '';

  if (favoriteTools.length === 0) {
    section.classList.add('hidden');
    return;
  }

  section.classList.remove('hidden');
  if (countSpan) {
    countSpan.textContent = `(${favoriteTools.length})`;
  }

  // Clone favorite tools into favorites container
  favoriteTools.forEach(favId => {
    let original = null;
    let isCustom = false;

    if (favId.startsWith('custom:')) {
      // Custom button favorite
      const customUrl = favId.substring(7); // Remove 'custom:' prefix
      original = document.querySelector(`#custom-buttons-container .tool-icon[data-custom-url="${customUrl}"]`);
      isCustom = true;
    } else {
      // Built-in tool favorite
      original = document.querySelector(`.category-section:not(.favorites-section) .tool-icon[data-tool="${favId}"]`);
    }

    if (!original) return;

    const clone = original.cloneNode(true);
    // Remove star from clone
    const star = clone.querySelector('.favorite-star');
    if (star) star.remove();

    // Add remove button instead
    const removeBtn = document.createElement('button');
    removeBtn.className = 'favorite-star is-favorite';
    removeBtn.textContent = '★';
    removeBtn.title = 'Retirer des favoris';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(favId);
    });
    clone.appendChild(removeBtn);

    // Re-attach click handler for custom buttons
    if (isCustom) {
      const customUrl = favId.substring(7);
      clone.addEventListener('click', (e) => {
        if (e.target.classList.contains('favorite-star')) return;
        chrome.tabs.create({ url: customUrl });
      });
    }

    container.appendChild(clone);
  });

  // Re-attach tool handlers to cloned built-in tools
  container.querySelectorAll('.tool-icon[data-tool]').forEach(tool => {
    initSingleToolHandler(tool);
  });
}

// Helper to init handler for a single tool (for cloned favorites)
function initSingleToolHandler(tool) {
  tool.addEventListener('click', async (e) => {
    // Ignore if clicking on favorite star
    if (e.target.classList.contains('favorite-star')) return;

    const toolId = tool.dataset.tool;
    const action = tool.dataset.action;

    if (action === 'direct') {
      // Handle direct actions
      handleDirectAction(toolId);
    } else {
      // Open panel
      if (typeof showToolPanel === 'function') {
        showToolPanel(toolId);
      }
    }
  });
}

// ========== BUTTON SIZE ==========
async function applyButtonSize() {
  const data = await chrome.storage.sync.get(['buttonSize']);
  const size = data.buttonSize || 1;
  document.documentElement.style.setProperty('--button-size', size);
}

// ========== MODULE VISIBILITY ==========
async function applyModuleVisibility() {
  // Load enabled modules
  const data = await chrome.storage.sync.get(['enabledModules']);
  const enabledModules = data.enabledModules || {};

  // Apply visibility to tool icons
  document.querySelectorAll('.tool-icon[data-tool]').forEach(icon => {
    const toolId = icon.dataset.tool;
    // If module is explicitly disabled (false), hide it
    if (enabledModules[toolId] === false) {
      icon.style.display = 'none';
    }
  });

  // Hide empty categories (except custom links)
  document.querySelectorAll('.category-section').forEach(section => {
    const categoryId = section.id;
    if (categoryId === 'category-customLinks') return; // Skip custom links

    const grid = section.querySelector('.tools-grid');
    if (!grid) return;

    const visibleTools = grid.querySelectorAll('.tool-icon:not([style*="display: none"])');
    if (visibleTools.length === 0) {
      section.classList.add('hidden');
    } else {
      section.classList.remove('hidden');
    }
  });

  // Handle custom links category visibility
  const customLinksSection = document.getElementById('category-customLinks');
  if (customLinksSection) {
    const data = await chrome.storage.sync.get(['customButtons']);
    const customButtons = data.customButtons || [];
    if (customButtons.length === 0) {
      customLinksSection.classList.add('hidden');
    } else {
      customLinksSection.classList.remove('hidden');
    }
  }
}

// ========== CUSTOM COLORS ==========
async function applyCustomColors() {
  const DEFAULT_COLORS = {
    bgColor: '#f5f5f5',
    textColor: '#333333',
    primaryColor: '#3498db',
    primaryHover: '#2980b9',
    secondaryColor: '#2c3e50',
    buttonBg: '#ffffff',
    buttonText: '#666666',
    panelBg: '#ffffff',
    borderColor: '#eeeeee',
    successColor: '#27ae60',
    errorColor: '#e74c3c'
  };

  const DEFAULT_RADIUS = {
    radiusSmall: 4,
    radiusMedium: 8,
    radiusLarge: 12
  };

  const data = await chrome.storage.sync.get(['customColors', 'customRadius']);
  const colors = data.customColors || DEFAULT_COLORS;
  const radius = data.customRadius || DEFAULT_RADIUS;

  // Apply colors to CSS variables
  const root = document.documentElement;
  root.style.setProperty('--bg-color', colors.bgColor);
  root.style.setProperty('--text-color', colors.textColor);
  root.style.setProperty('--primary-color', colors.primaryColor);
  root.style.setProperty('--primary-hover', colors.primaryHover);
  root.style.setProperty('--secondary-color', colors.secondaryColor);
  root.style.setProperty('--button-bg', colors.buttonBg);
  root.style.setProperty('--button-text', colors.buttonText);
  root.style.setProperty('--panel-bg', colors.panelBg);
  root.style.setProperty('--border-color', colors.borderColor);
  root.style.setProperty('--success-color', colors.successColor);
  root.style.setProperty('--error-color', colors.errorColor);

  // Apply border radius
  root.style.setProperty('--radius-small', radius.radiusSmall + 'px');
  root.style.setProperty('--radius-medium', radius.radiusMedium + 'px');
  root.style.setProperty('--radius-large', radius.radiusLarge + 'px');
}
