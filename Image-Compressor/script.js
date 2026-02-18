/* Author: Pawan Simha */
// Image Compressor Logic
const imageInput = document.getElementById('imageInput');
const dropZone = document.getElementById('dropZone');
const qualityInput = document.getElementById('qualityInput');
const qualityValue = document.getElementById('qualityValue');
const formatSelect = document.getElementById('formatSelect');
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

const originalPreview = document.getElementById('originalPreview');
const compressedPreview = document.getElementById('compressedPreview');
const originalSizeLabel = document.getElementById('originalSize');
const compressedSizeLabel = document.getElementById('compressedSize');
const uploadPrompt = document.getElementById('uploadPrompt');

let originalImg = new Image();
let flipH = 1;
let flipV = 1;
let rotation90 = 0;

function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function handleImage(file) {
    if (file && file.type.startsWith('image/')) {
        originalSizeLabel.textContent = formatSize(file.size);

        const reader = new FileReader();
        reader.onload = (e) => {
            originalImg.src = e.target.result;
            originalPreview.src = e.target.result;
            originalPreview.style.display = 'block';
            uploadPrompt.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

originalImg.onload = () => {
    compress();
};

function compress() {
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

    // Apply Filters
    const brightness = brightnessInput.value;
    const contrast = contrastInput.value;
    brightnessValue.textContent = brightness;
    contrastValue.textContent = contrast;
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

    ctx.drawImage(originalImg, -originalImg.width / 2, -originalImg.height / 2);
    ctx.restore();

    const quality = qualityInput.value / 100;
    const format = formatSelect.value;

    canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        compressedPreview.src = url;
        compressedPreview.style.display = 'block';
        compressedSizeLabel.textContent = formatSize(blob.size);

        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            link.download = `hagrid-compressed-${Date.now()}.${format.split('/')[1]}`;
            link.href = url;
            link.click();
        };
    }, format, quality);
}

advancedToggle.addEventListener('click', () => {
    advancedToggle.classList.toggle('active');
    advancedContent.classList.toggle('active');
});

flipHBtn.addEventListener('click', () => { flipH *= -1; compress(); });
flipVBtn.addEventListener('click', () => { flipV *= -1; compress(); });
rotate90Btn.addEventListener('click', () => { rotation90 = (rotation90 + 90) % 360; compress(); });

imageInput.addEventListener('change', (e) => handleImage(e.target.files[0]));
[qualityInput, formatSelect, brightnessInput, contrastInput].forEach(el => el.addEventListener('input', () => {
    if (el.id === 'qualityInput') qualityValue.textContent = qualityInput.value;
    compress();
}));

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleImage(e.dataTransfer.files[0]); });
