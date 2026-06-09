/* Author: Pawan Simha R */
// QR Generator Logic
const qrInput = document.getElementById('qrInput');
const fgColor = document.getElementById('fgColor');
const bgColor = document.getElementById('bgColor');
const qrMargin = document.getElementById('qrMargin');
const marginValue = document.getElementById('marginValue');
const qrECC = document.getElementById('qrECC');
const logoInput = document.getElementById('logoInput');
const logoDropZone = document.getElementById('logoDropZone');
const clearLogoBtn = document.getElementById('clearLogoBtn');
const qrCanvas = document.getElementById('qrCanvas');
const downloadBtn = document.getElementById('downloadBtn');

let logoImg = null;

function generateQR() {
    const text = qrInput.value || 'https://hagrid.tools';
    QRCode.toCanvas(qrCanvas, text, {
        width: 600,
        margin: parseInt(qrMargin.value),
        errorCorrectionLevel: qrECC.value,
        color: {
            dark: fgColor.value,
            light: bgColor.value
        }
    }, function (error) {
        if (error) {
            console.error(error);
            return;
        }

        // If logo is present, draw it on top
        if (logoImg) {
            drawLogo();
        }
    });
}

function drawLogo() {
    const ctx = qrCanvas.getContext('2d');
    const size = qrCanvas.width;
    const logoSize = size * 0.2; // 20% of QR size
    const x = (size - logoSize) / 2;
    const y = (size - logoSize) / 2;

    // Draw a background for the logo to ensure it's readable
    ctx.fillStyle = bgColor.value;
    ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);

    ctx.drawImage(logoImg, x, y, logoSize, logoSize);
}

function handleLogo(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            logoImg = new Image();
            logoImg.onload = () => {
                clearLogoBtn.style.display = 'block';
                generateQR();
            };
            logoImg.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

qrInput.addEventListener('input', generateQR);
fgColor.addEventListener('input', generateQR);
bgColor.addEventListener('input', generateQR);
qrMargin.addEventListener('input', () => {
    marginValue.textContent = qrMargin.value;
    generateQR();
});
qrECC.addEventListener('change', generateQR);

logoInput.addEventListener('change', (e) => handleLogo(e.target.files[0]));
clearLogoBtn.addEventListener('click', () => {
    logoImg = null;
    clearLogoBtn.style.display = 'none';
    logoInput.value = '';
    generateQR();
});

// Logo Drag and Drop
logoDropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    logoDropZone.style.borderColor = 'var(--primary-color)';
});
logoDropZone.addEventListener('dragleave', () => {
    logoDropZone.style.borderColor = 'var(--border-color)';
});
logoDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    logoDropZone.style.borderColor = 'var(--border-color)';
    handleLogo(e.dataTransfer.files[0]);
});

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `hagrid-qr-${Date.now()}.png`;
    link.href = qrCanvas.toDataURL('image/png');
    link.click();
});

// Initial generate
generateQR();
