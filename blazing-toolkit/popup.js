// Main popup initialization
// All modules are loaded via script tags in popup.html

// Global function to refresh the tool grid based on activated tools
async function refreshToolGrid() {
  if (typeof toolStore === 'undefined') return;

  const activatedTools = toolStore.getActivatedToolsList();
  const allToolIcons = document.querySelectorAll('.tool-icon[data-tool]');
  const gridView = document.getElementById('grid-view');

  // Hide all tools initially
  allToolIcons.forEach(icon => {
    const toolId = icon.dataset.tool;
    const isActivated = activatedTools.some(t => t.id === toolId);

    if (isActivated) {
      icon.style.display = '';
      icon.classList.remove('tool-hidden');

      // Add description tooltip if available
      const locale = toolStore.getToolLocale(toolId);
      if (locale.description) {
        icon.dataset.description = locale.description;
      }
    } else {
      icon.style.display = 'none';
      icon.classList.add('tool-hidden');
    }
  });

  // Update category visibility
  document.querySelectorAll('.category-section').forEach(section => {
    const toolsGrid = section.querySelector('.tools-grid');
    if (!toolsGrid) return;

    const visibleTools = toolsGrid.querySelectorAll('.tool-icon:not(.tool-hidden)');
    if (visibleTools.length === 0) {
      section.classList.add('hidden');
    } else {
      section.classList.remove('hidden');
    }
  });

  // Show/hide empty state
  const hasActiveTools = activatedTools.length > 0;
  let emptyState = document.getElementById('empty-tools-state');

  if (!hasActiveTools) {
    if (!emptyState) {
      emptyState = document.createElement('div');
      emptyState.id = 'empty-tools-state';
      emptyState.className = 'empty-tools-state';
      emptyState.innerHTML = `
        <div class="empty-icon">🧰</div>
        <h3 data-i18n="toolStore.noTools">Aucun outil active</h3>
        <p data-i18n="toolStore.noToolsDesc">Cliquez sur "Ajouter des outils" pour commencer</p>
      `;
      gridView.insertBefore(emptyState, gridView.firstChild);

      // Apply i18n to new element
      if (typeof I18n !== 'undefined' && typeof I18n.applyTranslations === 'function') {
        I18n.applyTranslations();
      }
    }
    emptyState.style.display = 'block';
  } else if (emptyState) {
    emptyState.style.display = 'none';
  }
}

// Make it available globally
window.refreshToolGrid = refreshToolGrid;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Toolkit loaded');

  // ========== APPLY THEME ==========
  await applyTheme();

  // ========== INITIALIZE I18N ==========
  if (typeof I18n !== 'undefined') {
    await I18n.init();
  }

  // ========== INITIALIZE TOOL STORE ==========
  if (typeof toolStore !== 'undefined') {
    await toolStore.init();
    toolStore.setupEventListeners();
  }

  // ========== APPLY CUSTOM COLORS ==========
  await applyCustomColors();

  // ========== APPLY BUTTON SIZE ==========
  await applyButtonSize();

  // ========== APPLY HEADER (TITLE OR LOGO) ==========
  await applyHeader();

  // ========== APPLY CUSTOM ORDER ==========
  await applyCustomOrder();

  // ========== APPLY TOOL VISIBILITY (MODULAR) ==========
  await refreshToolGrid();

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
    settingsBtn.addEventListener('click', async () => {
      // Open options page
      chrome.runtime.openOptionsPage();
      // Also open side panel to show live preview
      const isSidebar = document.body.dataset.mode === 'sidebar';
      if (!isSidebar) {
        try {
          await chrome.runtime.sendMessage({ type: 'openSidePanel' });
        } catch (e) {
          console.log('Side panel not available:', e);
        }
      }
    });
  }

  // ========== RELOAD BUTTON ==========
  const reloadBtn = document.getElementById('btn-reload');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => {
      chrome.runtime.reload();
    });
  }

  // ========== MODE SWITCH BUTTON ==========
  const switchModeBtn = document.getElementById('btn-switch-mode');
  if (switchModeBtn) {
    // Check if we're in sidebar mode
    const isSidebar = document.body.dataset.mode === 'sidebar';

    if (isSidebar) {
      // In sidebar mode: button switches to popup mode
      switchModeBtn.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ type: 'switchDisplayMode', mode: 'popup' });
        // Show confirmation
        switchModeBtn.textContent = '✓';
        switchModeBtn.title = 'Mode Popup active! Cliquez sur l\'icone.';
        setTimeout(() => {
          switchModeBtn.textContent = '📌';
          switchModeBtn.title = 'Passer en mode Popup';
        }, 2000);
      });
    } else {
      // In popup mode: button opens sidebar
      switchModeBtn.addEventListener('click', async () => {
        // First, switch to sidebar mode
        await chrome.runtime.sendMessage({ type: 'switchDisplayMode', mode: 'sidebar' });
        // Then open the side panel
        await chrome.runtime.sendMessage({ type: 'openSidePanel' });
        // Close the popup
        window.close();
      });
    }
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
      chrome.tabs.create({ url: 'https://github.com/Fantinati-Anthony/Chrome-Addons/blob/main/blazing-toolkit/CHANGELOG.md' });
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
  const searchContainer = document.getElementById('header-search');
  const searchToggleBtn = document.getElementById('btn-search-toggle');
  const searchCloseBtn = document.getElementById('btn-search-close');
  const mainContent = document.querySelector('.main-content');

  if (!searchInput) return;

  // Toggle search visibility (sidebar mode)
  if (searchToggleBtn && searchContainer) {
    searchToggleBtn.addEventListener('click', () => {
      searchContainer.classList.remove('hidden');
      if (mainContent) mainContent.classList.add('search-visible');
      searchInput.focus();
    });
  }

  // Close search (sidebar mode)
  if (searchCloseBtn && searchContainer) {
    searchCloseBtn.addEventListener('click', () => {
      searchContainer.classList.add('hidden');
      if (mainContent) mainContent.classList.remove('search-visible');
      searchInput.value = '';
      filterTools('');
    });
  }

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    filterTools(query);
  });

  // Clear search on Escape
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      searchInput.value = '';
      filterTools('');
      // Also close search container in sidebar mode
      if (searchContainer && !searchContainer.classList.contains('hidden')) {
        searchContainer.classList.add('hidden');
        if (mainContent) mainContent.classList.remove('search-visible');
      }
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

// ========== HEADER (TITLE OR LOGO) ==========
async function applyHeader() {
  const popupTitleEl = document.getElementById('popup-title');
  const popupLogoEl = document.getElementById('popup-logo');

  const data = await chrome.storage.sync.get(['headerMode', 'popupTitle', 'logoUrl']);
  const headerMode = data.headerMode || 'logo-light';

  if (headerMode === 'text') {
    // Show title, hide logo
    if (popupTitleEl) {
      popupTitleEl.style.display = '';
      if (data.popupTitle) {
        popupTitleEl.textContent = data.popupTitle;
      }
    }
    if (popupLogoEl) {
      popupLogoEl.style.display = 'none';
    }
  } else {
    // Show logo, hide title
    if (popupTitleEl) {
      popupTitleEl.style.display = 'none';
    }
    if (popupLogoEl) {
      popupLogoEl.style.display = '';
      if (headerMode === 'logo-light') {
        popupLogoEl.src = 'logos/light-mode.png';
      } else if (headerMode === 'logo-dark') {
        popupLogoEl.src = 'logos/dark-mode.png';
      } else if (headerMode === 'logo-custom' && data.logoUrl) {
        popupLogoEl.src = data.logoUrl;
      }
    }
  }
}

// ========== CUSTOM ORDER ==========
async function applyCustomOrder() {
  const data = await chrome.storage.sync.get(['categoryOrder', 'toolOrder']);
  const gridView = document.getElementById('grid-view');
  if (!gridView) return;

  // Apply category order
  if (data.categoryOrder && Array.isArray(data.categoryOrder)) {
    const categoryOrder = data.categoryOrder;

    // Get all category sections (exclude favorites and custom links which stay at top)
    const categories = Array.from(gridView.querySelectorAll('.category-section:not(.favorites-section):not(#category-customLinks)'));

    // Sort categories based on saved order
    categories.sort((a, b) => {
      const aId = a.id.replace('category-', '');
      const bId = b.id.replace('category-', '');
      const aIndex = categoryOrder.indexOf(aId);
      const bIndex = categoryOrder.indexOf(bId);
      // If not in order list, put at end
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });

    // Find insertion point (after customLinks if it exists, or at start)
    const customLinks = document.getElementById('category-customLinks');
    const insertAfter = customLinks || document.getElementById('category-favorites');

    // Re-append categories in new order
    categories.forEach(cat => {
      if (insertAfter && insertAfter.nextSibling) {
        gridView.insertBefore(cat, insertAfter.nextSibling);
      } else {
        gridView.appendChild(cat);
      }
    });
  }

  // Apply tool order within each category
  if (data.toolOrder && typeof data.toolOrder === 'object') {
    Object.keys(data.toolOrder).forEach(categoryId => {
      const toolOrder = data.toolOrder[categoryId];
      const category = document.getElementById(`category-${categoryId}`);
      if (!category) return;

      const grid = category.querySelector('.tools-grid');
      if (!grid) return;

      const tools = Array.from(grid.querySelectorAll('.tool-icon[data-tool]'));

      // Sort tools based on saved order
      tools.sort((a, b) => {
        const aId = a.dataset.tool;
        const bId = b.dataset.tool;
        const aIndex = toolOrder.indexOf(aId);
        const bIndex = toolOrder.indexOf(bId);
        return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
      });

      // Re-append tools in new order
      tools.forEach(tool => grid.appendChild(tool));
    });
  }
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

// ========== THEME MANAGEMENT ==========
async function applyTheme() {
  const data = await chrome.storage.sync.get(['theme']);
  const theme = data.theme || 'light';

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle('dark-mode', prefersDark);
  } else {
    document.body.classList.toggle('dark-mode', theme === 'dark');
  }
}

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', async (e) => {
  const data = await chrome.storage.sync.get(['theme']);
  if (data.theme === 'system') {
    document.body.classList.toggle('dark-mode', e.matches);
  }
});

// Listen for changes from options page (theme, colors, radius, size)
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'themeChanged') {
    if (message.theme === 'system') {
      document.body.classList.toggle('dark-mode', message.isDark);
    } else {
      document.body.classList.toggle('dark-mode', message.theme === 'dark');
    }
  }

  // Live preview: colors
  if (message.type === 'colorsChanged') {
    const colors = message.colors;
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
    root.style.setProperty('--category-bg', colors.categoryBg || '#ffffff');
    root.style.setProperty('--category-header', colors.categoryHeader || '#f5f5f5');
    root.style.setProperty('--footer-bg', colors.footerBg || '#f5f5f5');
    root.style.setProperty('--footer-text', colors.footerText || '#999999');
  }

  // Live preview: border radius
  if (message.type === 'radiusChanged') {
    const radius = message.radius;
    const root = document.documentElement;
    root.style.setProperty('--radius-small', radius.radiusSmall + 'px');
    root.style.setProperty('--radius-medium', radius.radiusMedium + 'px');
    root.style.setProperty('--radius-large', radius.radiusLarge + 'px');
    root.style.setProperty('--radius-category-top', (radius.radiusCategoryTop || 8) + 'px');
    root.style.setProperty('--radius-category-bottom', (radius.radiusCategoryBottom || 8) + 'px');
  }

  // Live preview: button size
  if (message.type === 'sizeChanged') {
    document.documentElement.style.setProperty('--button-size', message.size);
  }

  // Live preview: settings (header mode, title, logo)
  if (message.type === 'settingsChanged') {
    applyHeader();
  }
});

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
    errorColor: '#e74c3c',
    categoryBg: '#ffffff',
    categoryHeader: '#f5f5f5',
    footerBg: '#f5f5f5',
    footerText: '#999999'
  };

  const DEFAULT_RADIUS = {
    radiusSmall: 4,
    radiusMedium: 8,
    radiusLarge: 12,
    radiusCategoryTop: 8,
    radiusCategoryBottom: 8
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
  root.style.setProperty('--category-bg', colors.categoryBg || '#ffffff');
  root.style.setProperty('--category-header', colors.categoryHeader || '#f5f5f5');
  root.style.setProperty('--footer-bg', colors.footerBg || '#f5f5f5');
  root.style.setProperty('--footer-text', colors.footerText || '#999999');

  // Apply border radius
  root.style.setProperty('--radius-small', radius.radiusSmall + 'px');
  root.style.setProperty('--radius-medium', radius.radiusMedium + 'px');
  root.style.setProperty('--radius-large', radius.radiusLarge + 'px');
  root.style.setProperty('--radius-category-top', (radius.radiusCategoryTop || 8) + 'px');
  root.style.setProperty('--radius-category-bottom', (radius.radiusCategoryBottom || 8) + 'px');
}
