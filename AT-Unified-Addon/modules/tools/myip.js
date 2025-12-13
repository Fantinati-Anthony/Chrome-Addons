// Tool: My IP Address
// Detect and display IP with geolocation

export async function initMyIP() {
  const getIpBtn = document.getElementById('btn-get-ip');
  const resultsDiv = document.getElementById('ip-results');

  getIpBtn.addEventListener('click', async () => {
    resultsDiv.innerHTML = '<div class="loading">Detection en cours...</div>';

    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      resultsDiv.innerHTML = `
        <div class="ip-item"><span class="ip-label">IP</span><span class="ip-value" data-copy="${data.ip}">${data.ip}</span></div>
        <div class="ip-item"><span class="ip-label">Ville</span><span class="ip-value">${data.city || 'N/A'}</span></div>
        <div class="ip-item"><span class="ip-label">Region</span><span class="ip-value">${data.region || 'N/A'}</span></div>
        <div class="ip-item"><span class="ip-label">Pays</span><span class="ip-value">${data.country_name || 'N/A'}</span></div>
        <div class="ip-item"><span class="ip-label">FAI</span><span class="ip-value">${data.org || 'N/A'}</span></div>
      `;

      resultsDiv.querySelectorAll('.ip-value[data-copy]').forEach(el => {
        el.addEventListener('click', async () => {
          await navigator.clipboard.writeText(el.dataset.copy);
          el.textContent = 'Copie!';
          setTimeout(() => { el.textContent = el.dataset.copy; }, 1000);
        });
      });
    } catch (error) {
      resultsDiv.innerHTML = '<div class="status-message error">Erreur de detection</div>';
    }
  });
}
