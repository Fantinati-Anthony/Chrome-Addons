// Tool: Chrome Remote Desktop
// Quick access to remote desktop with OS detection

export function initRemoteDesktop() {
  const osInfo = document.getElementById('remote-os-info');
  const webBtn = document.getElementById('btn-remote-web');
  const downloadBtn = document.getElementById('btn-remote-download');
  const qrCanvas = document.getElementById('remote-qr-canvas');
  const androidLink = document.getElementById('link-android');
  const iosLink = document.getElementById('link-ios');

  // Detect OS
  const platform = navigator.platform.toLowerCase();
  const userAgent = navigator.userAgent.toLowerCase();
  let osName = 'Unknown';
  let osIcon = '💻';

  if (platform.includes('win') || userAgent.includes('windows')) {
    osName = 'Windows';
    osIcon = '🪟';
  } else if (platform.includes('mac') || userAgent.includes('macintosh')) {
    osName = 'macOS';
    osIcon = '🍎';
  } else if (platform.includes('linux') || userAgent.includes('linux')) {
    osName = 'Linux';
    osIcon = '🐧';
  }

  osInfo.innerHTML = `<div class="os-icon">${osIcon}</div><div class="os-name">${osName}</div>`;

  webBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://remotedesktop.google.com/access/' });
  });

  downloadBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://remotedesktop.google.com/access/' });
  });

  androidLink.href = 'https://play.google.com/store/apps/details?id=com.google.chromeremotedesktop';
  iosLink.href = 'https://apps.apple.com/app/chrome-remote-desktop/id944025852';

  generateQRCode(qrCanvas, 'https://remotedesktop.google.com/');
}

function generateQRCode(canvas, text) {
  const size = 150;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    ctx.drawImage(img, 0, 0, size, size);
  };
  img.onerror = () => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QR Error', size / 2, size / 2);
  };
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
}
