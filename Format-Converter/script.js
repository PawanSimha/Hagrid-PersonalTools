/* Author: Pawan Simha */
// Format Converter Logic
const imageInput = document.getElementById('imageInput');
const dropZone = document.getElementById('dropZone');
const formatSelect = document.getElementById('formatSelect');
const qualityInput = document.getElementById('qualityInput');
const qualityValue = document.getElementById('qualityValue');
const qualityControl = document.getElementById('qualityControl');
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
const fileInfo = document.getElementById('fileInfo');
const uploadPrompt = document.getElementById('uploadPrompt');

let originalImg = new Image();
let fileName = "converted-image";
let flipH = 1;
let flipV = 1;
let rotation90 = 0;

function handleImage(file) {
    if (file && file.type.startsWith('image/')) {
        fileName = file.name.split('.')[0];
        fileInfo.textContent = `Original: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

        const reader = new FileReader();
        reader.onload = (e) => {
            originalImg.src = e.target.result;
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            uploadPrompt.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

function updatePreview() {
    if (!originalImg.src) return;

    const brightness = brightnessInput.value;
    const contrast = contrastInput.value;
    brightnessValue.textContent = brightness;
    contrastValue.textContent = contrast;

    imagePreview.style.transform = `scale(${flipH}, ${flipV}) rotate(${rotation90}deg)`;
    imagePreview.style.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
}

document.addEventListener('DOMContentLoaded', () => {
    if (formatSelect.value === 'image/jpeg' || formatSelect.value === 'image/webp') {
        qualityControl.style.display = 'flex';
    } else {
        qualityControl.style.display = 'none';
    }
});

formatSelect.addEventListener('change', () => {
    if (formatSelect.value === 'image/jpeg' || formatSelect.value === 'image/webp') {
        qualityControl.style.display = 'flex';
    } else {
        qualityControl.style.display = 'none';
    }
});

qualityInput.addEventListener('input', () => {
    qualityValue.textContent = qualityInput.value;
});

downloadBtn.addEventListener('click', () => {
    if (!originalImg.src) return;

    const isRotated = rotation90 % 180 !== 0;
    const drawW = isRotated ? originalImg.height : originalImg.width;
    const drawH = isRotated ? originalImg.width : originalImg.height;

    canvas.width = drawW;
    canvas.height = drawH;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotation90 * Math.PI / 180);
    ctx.scale(flipH, flipV);

    ctx.filter = `brightness(${brightnessInput.value}%) contrast(${contrastInput.value}%)`;
    ctx.drawImage(originalImg, -originalImg.width / 2, -originalImg.height / 2);
    ctx.restore();

    const format = formatSelect.value;
    const extension = format.split('/')[1];
    const quality = qualityInput.value / 100;

    const dataURL = canvas.toDataURL(format, quality);
    const link = document.createElement('a');
    link.download = `${fileName}-hagrid.${extension}`;
    link.href = dataURL;
    link.click();
});

advancedToggle.addEventListener('click', () => {
    advancedToggle.classList.toggle('active');
    advancedContent.classList.toggle('active');
});

flipHBtn.addEventListener('click', () => { flipH *= -1; updatePreview(); });
flipVBtn.addEventListener('click', () => { flipV *= -1; updatePreview(); });
rotate90Btn.addEventListener('click', () => { rotation90 = (rotation90 + 90) % 360; updatePreview(); });

imageInput.addEventListener('change', (e) => handleImage(e.target.files[0]));
[brightnessInput, contrastInput].forEach(el => el.addEventListener('input', updatePreview));

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleImage(e.dataTransfer.files[0]); });
