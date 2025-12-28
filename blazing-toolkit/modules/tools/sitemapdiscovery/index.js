// Tool: Sitemap Discovery Engine
// Professional sitemap detection mimicking search engine behavior
// Merges robots.txt and sitemap.xml detection with recursive resolution

import { escapeHtml } from '../utils.js';

// Configuration
const CONFIG = {
  MAX_DEPTH: 3,
  RATE_LIMIT_MS: 500,
  REQUEST_TIMEOUT_MS: 10000,
  MAX_SITEMAPS_TO_RESOLVE: 50,
  STANDARD_SITEMAP_PATHS: [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-index.xml',
    '/wp-sitemap.xml',
    '/sitemap/',
    '/sitemap-main.xml',
    '/sitemaps/sitemap.xml',
    '/sitemap1.xml',
    '/post-sitemap.xml',
    '/page-sitemap.xml',
    '/news-sitemap.xml',
    '/image-sitemap.xml',
    '/video-sitemap.xml'
  ]
};

// Sitemap type detection
const SITEMAP_TYPES = {
  INDEX: 'index',
  PAGES: 'pages',
  POSTS: 'posts',
  IMAGES: 'images',
  VIDEOS: 'videos',
  PRODUCTS: 'products',
  NEWS: 'news',
  CATEGORIES: 'categories',
  TAGS: 'tags',
  AUTHORS: 'authors',
  UNKNOWN: 'unknown'
};

// CMS detection patterns
const CMS_PATTERNS = {
  wordpress: ['/wp-sitemap.xml', '/wp-content/', 'wordpress'],
  shopify: ['/sitemap.xml', 'cdn.shopify.com', 'shopify'],
  prestashop: ['/1_index_sitemap.xml', 'prestashop'],
  wix: ['wix.com', 'wixsite.com'],
  squarespace: ['squarespace.com', 'sqsp.com'],
  drupal: ['/sitemap.xml', 'drupal'],
  joomla: ['/component/', 'joomla'],
  magento: ['/sitemap/', 'magento']
};

// Session cache
const sessionCache = new Map();

export async function initSitemapDiscovery() {
  // DOM Elements
  const analyzeBtn = document.getElementById('btn-analyze-sitemaps');
  const modeSelect = document.getElementById('discovery-mode');
  const statusDiv = document.getElementById('discovery-status');
  const robotsSection = document.getElementById('robots-section');
  const robotsContent = document.getElementById('robots-display');
  const robotsLink = document.getElementById('robots-link');
  const sitemapsSection = document.getElementById('sitemaps-section');
  const sitemapsTree = document.getElementById('sitemaps-tree');
  const statsSection = document.getElementById('stats-section');
  const statsContent = document.getElementById('stats-content');
  const exportBtn = document.getElementById('btn-export-json');
  const copyAllBtn = document.getElementById('btn-copy-all-urls');
  const seoScoreDiv = document.getElementById('seo-score');

  // State
  let currentData = {
    origin: '',
    robotsTxt: null,
    sitemaps: [],
    allUrls: [],
    stats: {},
    cmsDetected: null,
    analysisTime: 0
  };

  // Main analyze button
  analyzeBtn.addEventListener('click', async () => {
    const mode = modeSelect.value;
    await runAnalysis(mode);
  });

  // Export JSON button
  exportBtn.addEventListener('click', () => {
    if (!currentData.origin) return;
    const exportData = {
      domain: currentData.origin,
      analyzedAt: new Date().toISOString(),
      robotsTxt: currentData.robotsTxt,
      sitemaps: currentData.sitemaps,
      totalUrls: currentData.allUrls.length,
      statistics: currentData.stats,
      cmsDetected: currentData.cmsDetected
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sitemap-discovery-${new URL(currentData.origin).hostname}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Copy all URLs button
  copyAllBtn.addEventListener('click', async () => {
    if (currentData.allUrls.length === 0) return;
    await navigator.clipboard.writeText(currentData.allUrls.join('\n'));
    const originalText = copyAllBtn.textContent;
    copyAllBtn.textContent = 'Copie!';
    setTimeout(() => copyAllBtn.textContent = originalText, 1500);
  });

  // Main analysis function
  async function runAnalysis(mode) {
    const startTime = performance.now();

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const origin = new URL(tab.url).origin;
      currentData.origin = origin;

      // Check cache
      const cacheKey = `${origin}-${mode}`;
      if (sessionCache.has(cacheKey)) {
        const cached = sessionCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 min cache
          currentData = cached.data;
          renderResults();
          showStatus('info', 'Resultats en cache (< 5 min)');
          return;
        }
      }

      showStatus('loading', 'Analyse en cours...');
      resetUI();

      // Reset state
      currentData.sitemaps = [];
      currentData.allUrls = [];
      currentData.stats = {};
      currentData.robotsTxt = null;
      currentData.cmsDetected = null;

      // Step 1: Analyze robots.txt (always first)
      showStatus('loading', 'Etape 1/4: Analyse du robots.txt...');
      const robotsResult = await analyzeRobotsTxt(origin);
      currentData.robotsTxt = robotsResult;

      // Step 2: Scan standard paths (if mode is not 'quick')
      let discoveredSitemaps = [];
      if (robotsResult.sitemaps.length > 0) {
        discoveredSitemaps = [...robotsResult.sitemaps];
      }

      if (mode !== 'quick') {
        showStatus('loading', 'Etape 2/4: Scan des chemins standards...');
        const standardPaths = await scanStandardPaths(origin);
        // Merge and deduplicate
        standardPaths.forEach(path => {
          if (!discoveredSitemaps.includes(path)) {
            discoveredSitemaps.push(path);
          }
        });
      } else if (discoveredSitemaps.length === 0) {
        // Quick mode but no sitemaps in robots.txt - try default
        const defaultSitemap = origin + '/sitemap.xml';
        const exists = await checkSitemapExists(defaultSitemap);
        if (exists) {
          discoveredSitemaps.push(defaultSitemap);
        }
      }

      // Step 3: Parse and resolve sitemaps
      showStatus('loading', 'Etape 3/4: Resolution des sitemaps...');
      const resolvedSitemaps = await resolveSitemaps(discoveredSitemaps, mode === 'complete' ? CONFIG.MAX_DEPTH : 1);
      currentData.sitemaps = resolvedSitemaps;

      // Step 4: Aggregate results
      showStatus('loading', 'Etape 4/4: Agregation des resultats...');
      aggregateResults();

      // Detect CMS
      currentData.cmsDetected = detectCMS(origin, currentData);

      // Calculate analysis time
      currentData.analysisTime = Math.round(performance.now() - startTime);

      // Cache results
      sessionCache.set(cacheKey, {
        timestamp: Date.now(),
        data: { ...currentData }
      });

      // Render results
      renderResults();
      showStatus('success', `Analyse terminee en ${currentData.analysisTime}ms`);

    } catch (error) {
      console.error('Sitemap Discovery error:', error);
      showStatus('error', 'Erreur lors de l\'analyse: ' + error.message);
    }
  }

  // Sub-module: Robots Analyzer
  async function analyzeRobotsTxt(origin) {
    const robotsUrl = origin + '/robots.txt';
    const result = {
      found: false,
      url: robotsUrl,
      content: '',
      sitemaps: [],
      userAgents: [],
      disallows: [],
      allows: [],
      crawlDelay: null
    };

    try {
      const response = await fetchWithTimeout(robotsUrl, CONFIG.REQUEST_TIMEOUT_MS);
      if (!response.ok) return result;

      const text = await response.text();
      // Validate it's actually a robots.txt (not HTML error page)
      if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().toLowerCase().startsWith('<html')) {
        return result;
      }

      result.found = true;
      result.content = text;

      // Parse robots.txt
      const lines = text.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) continue;

        const directive = trimmed.substring(0, colonIndex).toLowerCase().trim();
        const value = trimmed.substring(colonIndex + 1).trim();

        switch (directive) {
          case 'sitemap':
            if (value && !result.sitemaps.includes(value)) {
              result.sitemaps.push(value);
            }
            break;
          case 'user-agent':
            if (!result.userAgents.includes(value)) {
              result.userAgents.push(value);
            }
            break;
          case 'disallow':
            result.disallows.push(value);
            break;
          case 'allow':
            result.allows.push(value);
            break;
          case 'crawl-delay':
            result.crawlDelay = parseInt(value) || null;
            break;
        }
      }
    } catch (error) {
      console.log('robots.txt fetch error:', error);
    }

    return result;
  }

  // Sub-module: Sitemap Path Scanner
  async function scanStandardPaths(origin) {
    const foundPaths = [];

    for (const path of CONFIG.STANDARD_SITEMAP_PATHS) {
      const fullUrl = origin + path;
      try {
        const exists = await checkSitemapExists(fullUrl);
        if (exists) {
          foundPaths.push(fullUrl);
        }
        // Rate limiting
        await delay(CONFIG.RATE_LIMIT_MS);
      } catch (error) {
        // Ignore errors, continue scanning
      }
    }

    return foundPaths;
  }

  // Check if a sitemap URL exists and is valid XML
  async function checkSitemapExists(url) {
    try {
      const response = await fetchWithTimeout(url, CONFIG.REQUEST_TIMEOUT_MS);
      if (!response.ok) return false;

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();

      // Check for XML content
      if (contentType.includes('xml') || text.trim().startsWith('<?xml') || text.includes('<urlset') || text.includes('<sitemapindex')) {
        return true;
      }

      // Handle gzipped sitemaps (check extension)
      if (url.endsWith('.gz')) {
        return response.ok;
      }

      return false;
    } catch {
      return false;
    }
  }

  // Sub-module: Sitemap Index Resolver (recursive)
  async function resolveSitemaps(sitemapUrls, maxDepth) {
    const resolved = [];
    const visited = new Set();
    const queue = sitemapUrls.map(url => ({ url, depth: 0, parent: null }));
    let processedCount = 0;

    while (queue.length > 0 && processedCount < CONFIG.MAX_SITEMAPS_TO_RESOLVE) {
      const { url, depth, parent } = queue.shift();

      // Skip if already visited or exceeds max depth
      if (visited.has(url) || depth > maxDepth) continue;
      visited.add(url);
      processedCount++;

      try {
        const sitemapData = await parseSitemap(url);
        if (!sitemapData) continue;

        sitemapData.depth = depth;
        sitemapData.parent = parent;

        resolved.push(sitemapData);

        // If it's a sitemap index, add child sitemaps to queue
        if (sitemapData.isIndex && sitemapData.childSitemaps.length > 0) {
          for (const childUrl of sitemapData.childSitemaps) {
            if (!visited.has(childUrl)) {
              queue.push({ url: childUrl, depth: depth + 1, parent: url });
            }
          }
        }

        // Rate limiting
        await delay(CONFIG.RATE_LIMIT_MS);
      } catch (error) {
        console.log('Error resolving sitemap:', url, error);
      }
    }

    return resolved;
  }

  // Sub-module: Sitemap XML Parser
  async function parseSitemap(url) {
    try {
      let text;

      // Handle gzipped sitemaps
      if (url.endsWith('.gz')) {
        const response = await fetchWithTimeout(url, CONFIG.REQUEST_TIMEOUT_MS);
        if (!response.ok) return null;

        // For .gz files, we'd need to decompress - simplified handling
        const buffer = await response.arrayBuffer();
        try {
          const decompressed = pako.inflate(new Uint8Array(buffer), { to: 'string' });
          text = decompressed;
        } catch {
          // If pako not available, skip gzipped files
          return null;
        }
      } else {
        const response = await fetchWithTimeout(url, CONFIG.REQUEST_TIMEOUT_MS);
        if (!response.ok) return null;
        text = await response.text();
      }

      // Validate XML
      if (!text.trim().startsWith('<?xml') && !text.includes('<urlset') && !text.includes('<sitemapindex')) {
        return null;
      }

      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'text/xml');

      // Check for parse errors
      if (xml.querySelector('parsererror')) {
        return null;
      }

      const isIndex = xml.querySelector('sitemapindex') !== null;
      const sitemapData = {
        url,
        isIndex,
        type: detectSitemapType(url, xml),
        urls: [],
        childSitemaps: [],
        lastmod: null,
        urlCount: 0
      };

      if (isIndex) {
        // Parse sitemap index
        xml.querySelectorAll('sitemap').forEach(sitemap => {
          const loc = sitemap.querySelector('loc');
          if (loc) {
            sitemapData.childSitemaps.push(loc.textContent.trim());
          }
        });
        sitemapData.urlCount = sitemapData.childSitemaps.length;
      } else {
        // Parse urlset
        xml.querySelectorAll('url').forEach(urlEl => {
          const loc = urlEl.querySelector('loc');
          const lastmod = urlEl.querySelector('lastmod');
          const changefreq = urlEl.querySelector('changefreq');
          const priority = urlEl.querySelector('priority');

          if (loc) {
            sitemapData.urls.push({
              loc: loc.textContent.trim(),
              lastmod: lastmod?.textContent.trim() || null,
              changefreq: changefreq?.textContent.trim() || null,
              priority: priority?.textContent.trim() || null
            });
          }
        });
        sitemapData.urlCount = sitemapData.urls.length;

        // Get most recent lastmod
        const lastmods = sitemapData.urls
          .filter(u => u.lastmod)
          .map(u => new Date(u.lastmod))
          .filter(d => !isNaN(d));
        if (lastmods.length > 0) {
          sitemapData.lastmod = new Date(Math.max(...lastmods)).toISOString();
        }
      }

      return sitemapData;
    } catch (error) {
      console.log('Error parsing sitemap:', url, error);
      return null;
    }
  }

  // Detect sitemap type based on URL and content
  function detectSitemapType(url, xml) {
    const urlLower = url.toLowerCase();

    if (xml.querySelector('sitemapindex')) return SITEMAP_TYPES.INDEX;
    if (urlLower.includes('news')) return SITEMAP_TYPES.NEWS;
    if (urlLower.includes('image')) return SITEMAP_TYPES.IMAGES;
    if (urlLower.includes('video')) return SITEMAP_TYPES.VIDEOS;
    if (urlLower.includes('product')) return SITEMAP_TYPES.PRODUCTS;
    if (urlLower.includes('post')) return SITEMAP_TYPES.POSTS;
    if (urlLower.includes('page')) return SITEMAP_TYPES.PAGES;
    if (urlLower.includes('category') || urlLower.includes('categor')) return SITEMAP_TYPES.CATEGORIES;
    if (urlLower.includes('tag')) return SITEMAP_TYPES.TAGS;
    if (urlLower.includes('author')) return SITEMAP_TYPES.AUTHORS;

    // Check XML content for clues
    if (xml.querySelector('news\\:news, news')) return SITEMAP_TYPES.NEWS;
    if (xml.querySelector('image\\:image, image')) return SITEMAP_TYPES.IMAGES;
    if (xml.querySelector('video\\:video, video')) return SITEMAP_TYPES.VIDEOS;

    return SITEMAP_TYPES.UNKNOWN;
  }

  // Detect CMS from patterns
  function detectCMS(origin, data) {
    const checkString = (origin + ' ' + (data.robotsTxt?.content || '') + ' ' +
      data.sitemaps.map(s => s.url).join(' ')).toLowerCase();

    for (const [cms, patterns] of Object.entries(CMS_PATTERNS)) {
      for (const pattern of patterns) {
        if (checkString.includes(pattern.toLowerCase())) {
          return cms;
        }
      }
    }
    return null;
  }

  // Aggregate all results
  function aggregateResults() {
    const allUrls = new Set();
    const typeCount = {};

    for (const sitemap of currentData.sitemaps) {
      if (!sitemap.isIndex) {
        for (const url of sitemap.urls) {
          allUrls.add(url.loc);
        }
      }

      // Count by type
      typeCount[sitemap.type] = (typeCount[sitemap.type] || 0) + 1;
    }

    currentData.allUrls = Array.from(allUrls);
    currentData.stats = {
      totalSitemaps: currentData.sitemaps.length,
      sitemapIndexes: currentData.sitemaps.filter(s => s.isIndex).length,
      totalUrls: allUrls.size,
      byType: typeCount,
      robotsFound: currentData.robotsTxt?.found || false,
      sitemapsInRobots: currentData.robotsTxt?.sitemaps?.length || 0
    };
  }

  // UI Rendering functions
  function resetUI() {
    robotsSection.classList.add('hidden');
    sitemapsSection.classList.add('hidden');
    statsSection.classList.add('hidden');
    robotsContent.innerHTML = '';
    sitemapsTree.innerHTML = '';
    statsContent.innerHTML = '';
    seoScoreDiv.innerHTML = '';
  }

  function renderResults() {
    // Render robots.txt section
    if (currentData.robotsTxt) {
      robotsSection.classList.remove('hidden');
      robotsLink.href = currentData.robotsTxt.url;
      robotsLink.onclick = (e) => {
        e.preventDefault();
        chrome.tabs.create({ url: currentData.robotsTxt.url });
      };

      if (currentData.robotsTxt.found) {
        robotsSection.querySelector('.section-indicator').textContent = 'Trouve';
        robotsSection.querySelector('.section-indicator').className = 'section-indicator found';

        let robotsHtml = `<pre class="robots-raw">${escapeHtml(currentData.robotsTxt.content)}</pre>`;

        if (currentData.robotsTxt.sitemaps.length > 0) {
          robotsHtml += `<div class="robots-sitemaps"><strong>Sitemaps declares (${currentData.robotsTxt.sitemaps.length}):</strong><ul>`;
          currentData.robotsTxt.sitemaps.forEach(url => {
            robotsHtml += `<li><a href="${escapeHtml(url)}" target="_blank" class="sitemap-link">${escapeHtml(url)}</a></li>`;
          });
          robotsHtml += '</ul></div>';
        }

        robotsContent.innerHTML = robotsHtml;
      } else {
        robotsSection.querySelector('.section-indicator').textContent = 'Non trouve';
        robotsSection.querySelector('.section-indicator').className = 'section-indicator not-found';
        robotsContent.innerHTML = '<div class="status-message warning">robots.txt non trouve ou invalide</div>';
      }
    }

    // Render sitemaps section
    sitemapsSection.classList.remove('hidden');
    if (currentData.sitemaps.length > 0) {
      sitemapsSection.querySelector('.section-indicator').textContent = `${currentData.sitemaps.length} trouve(s)`;
      sitemapsSection.querySelector('.section-indicator').className = 'section-indicator found';
      renderSitemapsTree();
    } else {
      sitemapsSection.querySelector('.section-indicator').textContent = 'Non trouve';
      sitemapsSection.querySelector('.section-indicator').className = 'section-indicator not-found';
      sitemapsTree.innerHTML = '<div class="status-message warning">Aucun sitemap detecte</div>';
    }

    // Render stats section
    statsSection.classList.remove('hidden');
    renderStats();

    // Render SEO score
    renderSeoScore();
  }

  function renderSitemapsTree() {
    // Group sitemaps by depth
    const rootSitemaps = currentData.sitemaps.filter(s => s.depth === 0);

    let html = '<ul class="sitemap-tree">';

    for (const sitemap of rootSitemaps) {
      html += renderSitemapNode(sitemap);
    }

    html += '</ul>';
    sitemapsTree.innerHTML = html;

    // Add event listeners for copy and open buttons
    sitemapsTree.querySelectorAll('.btn-copy-url').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const url = btn.dataset.url;
        await navigator.clipboard.writeText(url);
        btn.textContent = 'Copie!';
        setTimeout(() => btn.textContent = 'Copier', 1500);
      });
    });

    sitemapsTree.querySelectorAll('.btn-open-url').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.tabs.create({ url: btn.dataset.url });
      });
    });

    // Collapsible tree nodes
    sitemapsTree.querySelectorAll('.sitemap-node.has-children > .sitemap-header').forEach(header => {
      header.addEventListener('click', () => {
        header.parentElement.classList.toggle('collapsed');
      });
    });
  }

  function renderSitemapNode(sitemap) {
    const children = currentData.sitemaps.filter(s => s.parent === sitemap.url);
    const hasChildren = children.length > 0;
    const typeIcon = getTypeIcon(sitemap.type);
    const typeLabel = getTypeLabel(sitemap.type);

    let html = `<li class="sitemap-node ${hasChildren ? 'has-children' : ''}" data-depth="${sitemap.depth}">`;
    html += `<div class="sitemap-header">`;
    html += `<span class="sitemap-icon">${typeIcon}</span>`;
    html += `<span class="sitemap-type">${typeLabel}</span>`;
    html += `<span class="sitemap-url">${escapeHtml(sitemap.url)}</span>`;
    html += `<span class="sitemap-count">(${sitemap.urlCount} ${sitemap.isIndex ? 'sitemaps' : 'URLs'})</span>`;
    html += `<div class="sitemap-actions">`;
    html += `<button class="btn-copy-url small-btn" data-url="${escapeHtml(sitemap.url)}">Copier</button>`;
    html += `<button class="btn-open-url small-btn" data-url="${escapeHtml(sitemap.url)}">Ouvrir</button>`;
    html += `</div>`;
    html += `</div>`;

    if (hasChildren) {
      html += '<ul class="sitemap-children">';
      for (const child of children) {
        html += renderSitemapNode(child);
      }
      html += '</ul>';
    }

    html += '</li>';
    return html;
  }

  function renderStats() {
    const stats = currentData.stats;

    let html = '<div class="stats-grid">';

    html += `<div class="stat-card">
      <div class="stat-value">${stats.totalSitemaps}</div>
      <div class="stat-label">Sitemaps</div>
    </div>`;

    html += `<div class="stat-card">
      <div class="stat-value">${stats.sitemapIndexes}</div>
      <div class="stat-label">Index</div>
    </div>`;

    html += `<div class="stat-card">
      <div class="stat-value">${stats.totalUrls.toLocaleString()}</div>
      <div class="stat-label">URLs exposees</div>
    </div>`;

    html += `<div class="stat-card">
      <div class="stat-value">${stats.sitemapsInRobots}</div>
      <div class="stat-label">Dans robots.txt</div>
    </div>`;

    html += '</div>';

    // CMS detection
    if (currentData.cmsDetected) {
      html += `<div class="cms-detected">
        <span class="cms-label">CMS detecte:</span>
        <span class="cms-value">${escapeHtml(currentData.cmsDetected.charAt(0).toUpperCase() + currentData.cmsDetected.slice(1))}</span>
      </div>`;
    }

    // Type breakdown
    if (Object.keys(stats.byType).length > 0) {
      html += '<div class="type-breakdown"><h4>Repartition par type:</h4><ul>';
      for (const [type, count] of Object.entries(stats.byType)) {
        html += `<li>${getTypeIcon(type)} ${getTypeLabel(type)}: <strong>${count}</strong></li>`;
      }
      html += '</ul></div>';
    }

    statsContent.innerHTML = html;
  }

  function renderSeoScore() {
    const stats = currentData.stats;
    let score = 0;
    const issues = [];
    const good = [];

    // Score calculation
    if (stats.robotsFound) {
      score += 25;
      good.push('robots.txt present');
    } else {
      issues.push('robots.txt absent');
    }

    if (stats.totalSitemaps > 0) {
      score += 25;
      good.push('Sitemap(s) detecte(s)');
    } else {
      issues.push('Aucun sitemap trouve');
    }

    if (stats.sitemapsInRobots > 0) {
      score += 25;
      good.push('Sitemap declare dans robots.txt');
    } else if (stats.totalSitemaps > 0) {
      issues.push('Sitemap non declare dans robots.txt');
    }

    if (stats.totalUrls > 0) {
      score += 25;
      good.push(`${stats.totalUrls.toLocaleString()} URLs indexables`);
    } else {
      issues.push('Aucune URL dans les sitemaps');
    }

    const scoreClass = score >= 75 ? 'score-good' : score >= 50 ? 'score-medium' : 'score-bad';

    let html = `<div class="seo-score-container">
      <div class="score-circle ${scoreClass}">
        <span class="score-value">${score}</span>
        <span class="score-max">/100</span>
      </div>
      <div class="score-details">
        <h4>Score SEO Surface Exposee</h4>`;

    if (good.length > 0) {
      html += '<ul class="score-good-list">';
      good.forEach(item => {
        html += `<li>&#10004; ${escapeHtml(item)}</li>`;
      });
      html += '</ul>';
    }

    if (issues.length > 0) {
      html += '<ul class="score-issues-list">';
      issues.forEach(item => {
        html += `<li>&#10006; ${escapeHtml(item)}</li>`;
      });
      html += '</ul>';
    }

    html += '</div></div>';
    seoScoreDiv.innerHTML = html;
  }

  function getTypeIcon(type) {
    const icons = {
      [SITEMAP_TYPES.INDEX]: '&#128194;',
      [SITEMAP_TYPES.PAGES]: '&#128196;',
      [SITEMAP_TYPES.POSTS]: '&#128221;',
      [SITEMAP_TYPES.IMAGES]: '&#128247;',
      [SITEMAP_TYPES.VIDEOS]: '&#127909;',
      [SITEMAP_TYPES.PRODUCTS]: '&#128722;',
      [SITEMAP_TYPES.NEWS]: '&#128240;',
      [SITEMAP_TYPES.CATEGORIES]: '&#128193;',
      [SITEMAP_TYPES.TAGS]: '&#127991;',
      [SITEMAP_TYPES.AUTHORS]: '&#128100;',
      [SITEMAP_TYPES.UNKNOWN]: '&#128196;'
    };
    return icons[type] || icons[SITEMAP_TYPES.UNKNOWN];
  }

  function getTypeLabel(type) {
    const labels = {
      [SITEMAP_TYPES.INDEX]: 'Index',
      [SITEMAP_TYPES.PAGES]: 'Pages',
      [SITEMAP_TYPES.POSTS]: 'Articles',
      [SITEMAP_TYPES.IMAGES]: 'Images',
      [SITEMAP_TYPES.VIDEOS]: 'Videos',
      [SITEMAP_TYPES.PRODUCTS]: 'Produits',
      [SITEMAP_TYPES.NEWS]: 'News',
      [SITEMAP_TYPES.CATEGORIES]: 'Categories',
      [SITEMAP_TYPES.TAGS]: 'Tags',
      [SITEMAP_TYPES.AUTHORS]: 'Auteurs',
      [SITEMAP_TYPES.UNKNOWN]: 'General'
    };
    return labels[type] || labels[SITEMAP_TYPES.UNKNOWN];
  }

  function showStatus(type, message) {
    const classes = {
      loading: 'status-message info',
      success: 'status-message success',
      error: 'status-message error',
      info: 'status-message info',
      warning: 'status-message warning'
    };
    statusDiv.className = classes[type] || classes.info;
    statusDiv.innerHTML = type === 'loading'
      ? `<span class="spinner"></span> ${escapeHtml(message)}`
      : escapeHtml(message);
  }

  // Utility functions
  async function fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
