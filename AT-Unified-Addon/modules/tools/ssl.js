// Tool: SSL/TLS Checker
// Check SSL certificate and provide link to SSL Labs

export async function initSSL() {
  const sslStatus = document.getElementById('ssl-status');
  const sslLink = document.getElementById('ssl-link');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab.url);
    const isHttps = url.protocol === 'https:';

    sslStatus.innerHTML = isHttps
      ? '<span class="status-badge success">🔒 HTTPS</span> Connexion securisee'
      : '<span class="status-badge error">⚠️ HTTP</span> Connexion non securisee';

    sslLink.href = `https://www.ssllabs.com/ssltest/analyze.html?d=${encodeURIComponent(url.hostname)}`;
    sslLink.textContent = 'Analyser sur SSL Labs →';
  } catch (error) {
    sslStatus.innerHTML = '<div class="status-message error">Erreur</div>';
  }
}
