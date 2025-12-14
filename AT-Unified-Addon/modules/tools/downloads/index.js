// Tool: Downloads
// Batch download files from a list of URLs

export function initDownloads() {
  const urlsTextarea = document.getElementById('dl-urls');
  const concurrentInput = document.getElementById('dl-concurrent');
  const downloadBtn = document.getElementById('btn-download');
  const logDiv = document.getElementById('dl-log');

  let downloadQueue = [];
  let activeDownloads = 0;

  downloadBtn.addEventListener('click', () => {
    const urls = urlsTextarea.value.split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0 && (url.startsWith('http://') || url.startsWith('https://')));

    if (urls.length === 0) {
      alert('Aucune URL valide trouvee');
      return;
    }

    const maxConcurrent = parseInt(concurrentInput.value) || 3;
    downloadQueue = [...urls];
    activeDownloads = 0;
    logDiv.innerHTML = '';
    log(`Demarrage: ${urls.length} fichier(s)...`);

    for (let i = 0; i < Math.min(maxConcurrent, downloadQueue.length); i++) {
      processNextDownload(maxConcurrent);
    }
  });

  function processNextDownload(maxConcurrent) {
    if (downloadQueue.length === 0 || activeDownloads >= maxConcurrent) return;
    const url = downloadQueue.shift();
    activeDownloads++;

    chrome.downloads.download({ url }, (downloadId) => {
      if (chrome.runtime.lastError) {
        log(`Erreur: ${url.substring(0, 40)}...`);
      } else {
        log(`OK: ${url.substring(0, 40)}...`);
      }
      activeDownloads--;
      if (downloadQueue.length > 0) {
        processNextDownload(maxConcurrent);
      } else if (activeDownloads === 0) {
        log('Termine!');
      }
    });
  }

  function log(message) {
    const p = document.createElement('p');
    p.textContent = message;
    logDiv.appendChild(p);
    logDiv.scrollTop = logDiv.scrollHeight;
  }
}
