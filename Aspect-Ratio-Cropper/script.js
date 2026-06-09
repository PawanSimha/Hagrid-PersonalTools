/* Author: Pawan Simha R */
// Aspect Ratio Cropper Logic
const imageInput = document.getElementById('imageInput');
const dropZone = document.getElementById('dropZone');
const ratioSelect = document.getElementById('ratioSelect');
const zoomInput = document.getElementById('zoomInput');
const zoomValue = document.getElementById('zoomValue');
const offsetXInput = document.getElementById('offsetXInput');
const offsetXValue = document.getElementById('offsetXValue');
const offsetYInput = document.getElementById('offsetYInput');
const offsetYValue = document.getElementById('offsetYValue');
const downloadBtn = document.getElementById('downloadBtn');

// Advanced Controls
const advancedToggle = document.getElementById('advancedToggle');
const advancedContent = document.getElementById('advancedContent');
const flipHBtn = document.getElementById('flipHBtn');
const flipVBtn = document.getElementById('flipVBtn');
const rotate90Btn = document.getElementById('rotate90Btn');
const brightnessInput = document.getElementById('brightnessInput');
const brightnessValue = document.getElementById('brightnessValue');
const contrastInput = document.getElementById('contrastInput');
const contrastValue = document.getElementById('contrastValue');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imagePreview = document.getElementById('imagePreview');
const cropOverlay = document.getElementById('cropOverlay');
const uploadPrompt = document.getElementById('uploadPrompt');

let originalImg = new Image();
let fileName = "cropped-image";
let flipH = 1;
let flipV = 1;
let rotation90 = 0;

function handleImage(file) {
    if (file && file.type.startsWith('image/')) {
        fileName = file.name.split('.')[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImg.src = e.target.result;
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            cropOverlay.style.display = 'block';
            uploadPrompt.style.display = 'none';
            updateCrop();
        };
        reader.readAsDataURL(file);
    }
}

function updateCrop() {
    if (!originalImg.src) return;

    const zoom = parseFloat(zoomInput.value);
    const offsetX = parseInt(offsetXInput.value);
    const offsetY = parseInt(offsetYInput.value);

    // Update Value Displays
    zoomValue.textContent = zoom.toFixed(1);
    offsetXValue.textContent = offsetX;
    offsetYValue.textContent = offsetY;

    const brightness = brightnessInput.value;
    const contrast = contrastInput.value;
    brightnessValue.textContent = brightness;
    contrastValue.textContent = contrast;

    const ratioParts = selectedRatio.split(':');
    let targetRatio = 1;
    if (ratioParts.length === 2) {
        targetRatio = parseInt(ratioParts[0]) / parseInt(ratioParts[1]);
    } else {
        targetRatio = originalImg.width / originalImg.height;
    }

    // Apply multiple transforms: zoom, translate, flip, rotate
    imagePreview.style.transform = `scale(${zoom * flipH}, ${zoom * flipV}) translate(${offsetX / zoom}px, ${offsetY / zoom}px) rotate(${rotation90}deg)`;
    imagePreview.style.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    const container = imagePreview.parentElement;
    const contW = container.clientWidth;
    const contH = container.clientHeight;

    let overlayW, overlayH;
    if (contW / contH > targetRatio) {
        overlayH = contH * 0.8;
        overlayW = overlayH * targetRatio;
    } else {
        overlayW = contW * 0.8;
        overlayH = overlayW / targetRatio;
    }

    cropOverlay.style.width = `${overlayW}px`;
    cropOverlay.style.height = `${overlayH}px`;
    cropOverlay.style.left = `${(contW - overlayW) / 2}px`;
    cropOverlay.style.top = `${(contH - overlayH) / 2}px`;
}

downloadBtn.addEventListener('click', () => {
    if (!originalImg.src) return;

    const zoom = parseFloat(zoomInput.value);
    const offsetX = parseInt(offsetXInput.value);
    const offsetY = parseInt(offsetYInput.value);

    const ratioParts = selectedRatio.split(':');
    let targetRatio = 1;
    if (ratioParts.length === 2) {
        targetRatio = parseInt(ratioParts[0]) / parseInt(ratioParts[1]);
    } else {
        targetRatio = originalImg.width / originalImg.height;
    }

    const outputW = 1080;
    const outputH = outputW / targetRatio;

    canvas.width = outputW;
    canvas.height = outputH;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outputW, outputH);

    const imgRatio = originalImg.width / originalImg.height;
    let drawW, drawH;

    if (imgRatio > targetRatio) {
        drawH = outputH * zoom;
        drawW = drawH * imgRatio;
    } else {
        drawW = outputW * zoom;
        drawH = drawW / imgRatio;
    }

    ctx.save();
    ctx.translate(outputW / 2 + (offsetX * (outputW / cropOverlay.clientWidth)), outputH / 2 + (offsetY * (outputH / cropOverlay.clientHeight)));
    ctx.rotate(rotation90 * Math.PI / 180);
    ctx.scale(flipH, flipV);

    // Apply filters to export
    ctx.filter = `brightness(${brightnessInput.value}%) contrast(${contrastInput.value}%)`;

    ctx.drawImage(originalImg, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    const link = document.createElement('a');
    link.download = `${fileName}-cropped.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
});

advancedToggle.addEventListener('click', () => {
    advancedToggle.classList.toggle('active');
    advancedContent.classList.toggle('active');
});

flipHBtn.addEventListener('click', () => { flipH *= -1; updateCrop(); });
flipVBtn.addEventListener('click', () => { flipV *= -1; updateCrop(); });
rotate90Btn.addEventListener('click', () => { rotation90 = (rotation90 + 90) % 360; updateCrop(); });

const ratioCards = document.querySelectorAll('.ratio-card');
let selectedRatio = '1:1';

ratioCards.forEach(card => {
    card.addEventListener('click', () => {
        ratioCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedRatio = card.dataset.ratio;
        updateCrop();
    });
});

imageInput.addEventListener('change', (e) => handleImage(e.target.files[0]));
[zoomInput, offsetXInput, offsetYInput, brightnessInput, contrastInput].forEach(el => el.addEventListener('input', updateCrop));

window.addEventListener('resize', updateCrop);

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleImage(e.dataTransfer.files[0]); });
