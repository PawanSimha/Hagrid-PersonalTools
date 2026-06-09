/* Author: Pawan Simha R */
const imageInput = document.getElementById('imageInput');
const dropZone = document.getElementById('dropZone');
const blurInput = document.getElementById('blurInput');
const blurValue = document.getElementById('blurValue');
const resetBtn = document.getElementById('resetBtn');
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

const canvasWrapper = document.getElementById('canvasWrapper');
const mainCanvas = document.getElementById('mainCanvas');
const mainCtx = mainCanvas.getContext('2d');
const blurCanvas = document.getElementById('blurCanvas');
const blurCtx = blurCanvas.getContext('2d');
const uploadPrompt = document.getElementById('uploadPrompt');

let originalImg = new Image();
let isDrawing = false;
let blurs = [];
let flipH = 1;
let flipV = 1;
let rotation90 = 0;

function handleImage(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            originalImg.src = e.target.result;
            originalImg.onload = () => {
                resetTransformations();
                initCanvas();
            };
        };
        reader.readAsDataURL(file);
    }
}

function resetTransformations() {
    flipH = 1;
    flipV = 1;
    rotation90 = 0;
    blurs = [];
}

function initCanvas() {
    const maxW = 800;
    const isRotated = rotation90 % 180 !== 0;
    const drawW = isRotated ? originalImg.height : originalImg.width;
    const drawH = isRotated ? originalImg.width : originalImg.height;

    const scale = Math.min(1, maxW / drawW);
    mainCanvas.width = drawW * scale;
    mainCanvas.height = drawH * scale;
    blurCanvas.width = mainCanvas.width;
    blurCanvas.height = mainCanvas.height;

    renderAll();
    canvasWrapper.style.display = 'block';
    uploadPrompt.style.display = 'none';
}

function renderAll() {
    const w = mainCanvas.width;
    const h = mainCanvas.height;

    mainCtx.clearRect(0, 0, w, h);
    mainCtx.save();

    // Transformations
    mainCtx.translate(w / 2, h / 2);
    mainCtx.rotate(rotation90 * Math.PI / 180);
    mainCtx.scale(flipH, flipV);

    // Filters
    const brightness = brightnessInput.value;
    const contrast = contrastInput.value;
    brightnessValue.textContent = brightness;
    contrastValue.textContent = contrast;
    mainCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    // Draw original image centered
    const imgW = originalImg.width * (w / (rotation90 % 180 === 0 ? originalImg.width : originalImg.height));
    const imgH = originalImg.height * (h / (rotation90 % 180 === 0 ? originalImg.height : originalImg.width));
    mainCtx.drawImage(originalImg, -originalImg.width / 2 * (w / (rotation90 % 180 === 0 ? originalImg.width : originalImg.height)), -originalImg.height / 2 * (h / (rotation90 % 180 === 0 ? originalImg.height : originalImg.width)), imgW, imgH);

    mainCtx.restore();
    renderBlurs();
}

canvasWrapper.addEventListener('mousedown', (e) => {
    if (!originalImg.src) return;
    isDrawing = true;
    const rect = mainCanvas.getBoundingClientRect();
    blurs.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        w: 0,
        h: 0
    });
});

window.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = mainCanvas.getBoundingClientRect();
    const currentBlur = blurs[blurs.length - 1];
    currentBlur.w = (e.clientX - rect.left) - currentBlur.x;
    currentBlur.h = (e.clientY - rect.top) - currentBlur.y;
    renderBlurs();
});

window.addEventListener('mouseup', () => { isDrawing = false; });

function renderBlurs() {
    blurCtx.clearRect(0, 0, blurCanvas.width, blurCanvas.height);
    const intensity = blurInput.value;

    blurs.forEach(b => {
        blurCtx.save();
        blurCtx.beginPath();
        blurCtx.rect(b.x, b.y, b.w, b.h);
        blurCtx.clip();
        blurCtx.filter = `blur(${intensity}px)`;
        blurCtx.drawImage(mainCanvas, 0, 0);
        blurCtx.restore();
    });
}

blurInput.addEventListener('input', () => {
    blurValue.textContent = blurInput.value;
    renderBlurs();
});

resetBtn.addEventListener('click', () => {
    blurs = [];
    renderBlurs();
});

downloadBtn.addEventListener('click', () => {
    if (!originalImg.src) return;

    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = mainCanvas.width;
    finalCanvas.height = mainCanvas.height;
    const finalCtx = finalCanvas.getContext('2d');

    // Draw fully transformed image
    finalCtx.drawImage(mainCanvas, 0, 0);

    // Apply blurs on top
    const intensity = blurInput.value;
    blurs.forEach(b => {
        finalCtx.save();
        finalCtx.beginPath();
        finalCtx.rect(b.x, b.y, b.w, b.h);
        finalCtx.clip();
        finalCtx.filter = `blur(${intensity}px)`;
        finalCtx.drawImage(mainCanvas, 0, 0);
        finalCtx.restore();
    });

    const link = document.createElement('a');
    link.download = `hagrid-private-${Date.now()}.png`;
    link.href = finalCanvas.toDataURL('image/png');
    link.click();
});

advancedToggle.addEventListener('click', () => {
    advancedToggle.classList.toggle('active');
    advancedContent.classList.toggle('active');
});

flipHBtn.addEventListener('click', () => { flipH *= -1; renderAll(); });
flipVBtn.addEventListener('click', () => { flipV *= -1; renderAll(); });
rotate90Btn.addEventListener('click', () => {
    rotation90 = (rotation90 + 90) % 360;
    initCanvas();
});

brightnessInput.addEventListener('input', renderAll);
contrastInput.addEventListener('input', renderAll);
imageInput.addEventListener('change', (e) => handleImage(e.target.files[0]));

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleImage(e.dataTransfer.files[0]); });
