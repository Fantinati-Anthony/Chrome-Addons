// Tool: QR Code Generator
// Generate QR code for the current URL

export async function initQRCode() {
  const qrUrlDiv = document.getElementById('qr-url');
  const qrCanvas = document.getElementById('qr-canvas');
  const copyQrBtn = document.getElementById('btn-copy-qr');
  const downloadQrBtn = document.getElementById('btn-download-qr');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab?.url || '';
    qrUrlDiv.textContent = url.length > 50 ? url.substring(0, 50) + '...' : url;

    // Generate QR Code using canvas
    generateQRCode(qrCanvas, url);

    copyQrBtn.addEventListener('click', async () => {
      try {
        const dataUrl = qrCanvas.toDataURL('image/png');
        const blob = await (await fetch(dataUrl)).blob();
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        copyQrBtn.textContent = 'Copie!';
        setTimeout(() => { copyQrBtn.textContent = 'Copier l\'image'; }, 1000);
      } catch (e) {
        alert('Erreur lors de la copie');
      }
    });

    downloadQrBtn.addEventListener('click', () => {
      const dataUrl = qrCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'qrcode.png';
      a.click();
    });
  } catch (error) {
    qrUrlDiv.textContent = 'Erreur';
  }
}

// Simple QR Code generator using external API
function generateQRCode(canvas, text) {
  const size = 200;
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
