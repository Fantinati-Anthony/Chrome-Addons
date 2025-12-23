// Tool: SEO Extractor
// Extract and analyze sitemap.xml and robots.txt files from any website

import { escapeHtml } from '../utils.js';

export async function initSeoExtractor() {
  const loadBtn = document.getElementById('btn-load-seo');
  const statusDiv = document.getElementById('seo-status');
  const tabsContainer = document.getElementById('seo-tabs');
  const sitemapContent = document.getElementById('seo-sitemap-content');
  const robotsContent = document.getElementById('seo-robots-content');
  const sitemapStats = document.getElementById('sitemap-stats');
  const robotsStats = document.getElementById('robots-stats');
  const copyBtns = document.querySelectorAll('.seo-copy-btn');
  const downloadBtns = document.querySelectorAll('.seo-download-btn');

  let currentData = {
    sitemaps: [],
    sitemapUrls: [],
    robotsTxt: '',
    origin: ''
  };

  // Tab switching
  tabsContainer.addEventListener('click', (e) => {
    const tab = e.target.closest('.seo-tab');
    if (!tab) return;

    tabsContainer.querySelectorAll('.seo-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    const target = tab.dataset.tab;
    document.querySelectorAll('.seo-tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`seo-${target}-content`).classList.add('active');
  });

  // Copy buttons
  copyBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.type;
      let textToCopy = '';

      if (type === 'sitemap') {
        textToCopy = currentData.sitemapUrls.join('\n');
      } else if (type === 'robots') {
        textToCopy = currentData.robotsTxt;
      }

      if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = btn.textContent;
        btn.textContent = 'Copie!';
        setTimeout(() => btn.textContent = originalText, 1500);
      }
    });
  });

  // Download buttons
  downloadBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      let content = '';
      let filename = '';

      if (type === 'sitemap') {
        content = currentData.sitemapUrls.join('\n');
        filename = 'sitemap-urls.txt';
      } else if (type === 'robots') {
        content = currentData.robotsTxt;
        filename = 'robots.txt';
      }

      if (content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  });

  // Main load button
  loadBtn.addEventListener('click', async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const origin = new URL(tab.url).origin;
      currentData.origin = origin;

      statusDiv.innerHTML = '<div class="status-message info">Chargement en cours...</div>';

      // Load both in parallel
      const [sitemapResult, robotsResult] = await Promise.allSettled([
        loadSitemap(origin),
        loadRobots(origin)
      ]);

      let statusMessages = [];

      // Process sitemap result
      if (sitemapResult.status === 'fulfilled' && sitemapResult.value.success) {
        currentData.sitemapUrls = sitemapResult.value.urls;
        currentData.sitemaps = sitemapResult.value.sitemaps;
        renderSitemapContent(sitemapResult.value);
        statusMessages.push(`Sitemap: ${sitemapResult.value.urls.length} URLs`);
      } else {
        sitemapContent.querySelector('.seo-results').innerHTML =
          '<div class="status-message error">Sitemap non trouve</div>';
        sitemapStats.innerHTML = '';
        statusMessages.push('Sitemap: non trouve');
      }

      // Process robots result
      if (robotsResult.status === 'fulfilled' && robotsResult.value.success) {
        currentData.robotsTxt = robotsResult.value.content;
        renderRobotsContent(robotsResult.value);
        statusMessages.push('Robots.txt: trouve');
      } else {
        robotsContent.querySelector('.seo-results').innerHTML =
          '<div class="status-message error">robots.txt non trouve</div>';
        robotsStats.innerHTML = '';
        statusMessages.push('Robots.txt: non trouve');
      }

      statusDiv.innerHTML = `<div class="status-message success">${statusMessages.join(' | ')}</div>`;

    } catch (error) {
      statusDiv.innerHTML = '<div class="status-message error">Erreur lors du chargement</div>';
      console.error('SEO Extractor error:', error);
    }
  });

  // Load sitemap with nested sitemap support
  async function loadSitemap(origin) {
    const sitemapUrl = origin + '/sitemap.xml';
    const response = await fetch(sitemapUrl);
    if (!response.ok) throw new Error('Sitemap not found');

    const text = await response.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, 'text/xml');

    const urls = [];
    const sitemaps = [];

    // Get direct URLs
    xml.querySelectorAll('url loc').forEach(loc => {
      urls.push(loc.textContent.trim());
    });

    // Get nested sitemaps
    xml.querySelectorAll('sitemap loc').forEach(loc => {
      sitemaps.push(loc.textContent.trim());
    });

    // Try to load nested sitemaps (up to 10)
    const nestedPromises = sitemaps.slice(0, 10).map(async (sitemapUrl) => {
      try {
        const res = await fetch(sitemapUrl);
        if (!res.ok) return [];
        const txt = await res.text();
        const nestedXml = parser.parseFromString(txt, 'text/xml');
        const nestedUrls = [];
        nestedXml.querySelectorAll('url loc').forEach(loc => {
          nestedUrls.push(loc.textContent.trim());
        });
        return nestedUrls;
      } catch {
        return [];
      }
    });

    const nestedResults = await Promise.all(nestedPromises);
    nestedResults.forEach(nestedUrls => urls.push(...nestedUrls));

    return { success: true, urls, sitemaps };
  }

  // Load robots.txt
  async function loadRobots(origin) {
    const robotsUrl = origin + '/robots.txt';
    const response = await fetch(robotsUrl);
    if (!response.ok) throw new Error('robots.txt not found');

    const content = await response.text();
    const parsed = parseRobotsTxt(content);

    return { success: true, content, parsed };
  }

  // Parse robots.txt into structured data
  function parseRobotsTxt(content) {
    const lines = content.split('\n');
    const rules = {
      userAgents: [],
      allows: [],
      disallows: [],
      sitemaps: [],
      crawlDelay: null
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) return;

      const directive = trimmed.substring(0, colonIndex).toLowerCase().trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      switch (directive) {
        case 'user-agent':
          rules.userAgents.push(value);
          break;
        case 'allow':
          rules.allows.push(value);
          break;
        case 'disallow':
          rules.disallows.push(value);
          break;
        case 'sitemap':
          rules.sitemaps.push(value);
          break;
        case 'crawl-delay':
          rules.crawlDelay = value;
          break;
      }
    });

    return rules;
  }

  // Render sitemap content
  function renderSitemapContent(data) {
    const resultsDiv = sitemapContent.querySelector('.seo-results');

    // Stats
    sitemapStats.innerHTML = `
      <div class="stat-item"><strong>${data.urls.length}</strong> URLs</div>
      <div class="stat-item"><strong>${data.sitemaps.length}</strong> Sitemaps</div>
    `;

    // URLs list
    let html = '';

    if (data.sitemaps.length > 0) {
      html += '<div class="seo-section"><h4>Sitemaps Index</h4>';
      data.sitemaps.forEach(url => {
        html += `<div class="seo-item sitemap-item"><a href="${escapeHtml(url)}" target="_blank">${escapeHtml(url)}</a></div>`;
      });
      html += '</div>';
    }

    if (data.urls.length > 0) {
      html += '<div class="seo-section"><h4>URLs</h4>';
      // Show first 100 URLs
      const displayUrls = data.urls.slice(0, 100);
      displayUrls.forEach(url => {
        html += `<div class="seo-item url-item"><a href="${escapeHtml(url)}" target="_blank">${escapeHtml(url)}</a></div>`;
      });
      if (data.urls.length > 100) {
        html += `<div class="seo-more">... et ${data.urls.length - 100} autres URLs</div>`;
      }
      html += '</div>';
    }

    resultsDiv.innerHTML = html || '<div class="status-message info">Aucune URL trouvee</div>';
  }

  // Render robots.txt content
  function renderRobotsContent(data) {
    const resultsDiv = robotsContent.querySelector('.seo-results');
    const parsed = data.parsed;

    // Stats
    robotsStats.innerHTML = `
      <div class="stat-item"><strong>${parsed.userAgents.length}</strong> User-Agents</div>
      <div class="stat-item"><strong>${parsed.disallows.length}</strong> Disallow</div>
      <div class="stat-item"><strong>${parsed.allows.length}</strong> Allow</div>
    `;

    // Content
    let html = '<div class="seo-section">';

    // Raw content
    html += '<h4>Contenu brut</h4>';
    html += `<pre class="robots-raw">${escapeHtml(data.content)}</pre>`;

    // Parsed analysis
    if (parsed.sitemaps.length > 0) {
      html += '<h4>Sitemaps declares</h4>';
      parsed.sitemaps.forEach(url => {
        html += `<div class="seo-item"><a href="${escapeHtml(url)}" target="_blank">${escapeHtml(url)}</a></div>`;
      });
    }

    if (parsed.crawlDelay) {
      html += `<h4>Crawl-Delay</h4><div class="seo-item">${escapeHtml(parsed.crawlDelay)} secondes</div>`;
    }

    html += '</div>';
    resultsDiv.innerHTML = html;
  }
}
