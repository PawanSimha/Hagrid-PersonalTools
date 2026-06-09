/* Author: Pawan Simha R */
// Palette Extractor Logic
const imageInput = document.getElementById('imageInput');
const dropZone = document.getElementById('dropZone');
const countInput = document.getElementById('countInput');
const countValue = document.getElementById('countValue');
const paletteDisplay = document.getElementById('paletteDisplay');
const uploadPrompt = document.getElementById('uploadPrompt');
const imagePreview = document.getElementById('imagePreview');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function handleImage(file) {
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                uploadPrompt.style.display = 'none';
                extractPalette(img);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function extractPalette(img) {
    // Resize image for faster processing
    const maxDim = 100;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colors = {};

    // Sample every 5th pixel
    for (let i = 0; i < data.length; i += 20) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const hex = rgbToHex(r, g, b);
        colors[hex] = (colors[hex] || 0) + 1;
    }

    // Sort by frequency
    const sortedColors = Object.keys(colors).sort((a, b) => colors[b] - colors[a]);
    const limit = parseInt(countInput.value);
    const topColors = sortedColors.slice(0, limit);

    renderPalette(topColors);
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

const copyAllBtn = document.getElementById('copyAllBtn');
let currentPalette = [];

function renderPalette(colors) {
    currentPalette = colors;
    paletteDisplay.innerHTML = '';

    if (colors.length > 0) {
        copyAllBtn.style.display = 'block';
    } else {
        copyAllBtn.style.display = 'none';
    }

    colors.forEach(hex => {
        const block = document.createElement('div');
        block.className = 'palette-block';

        const colorBox = document.createElement('div');
        colorBox.className = 'palette-color-box';
        colorBox.style.backgroundColor = hex;
        colorBox.title = 'Copy Hex Code';

        colorBox.addEventListener('click', () => {
            navigator.clipboard.writeText(hex);
            const oldHex = hex;
            hexLabel.textContent = 'COPIED!';
            setTimeout(() => hexLabel.textContent = oldHex, 1000);
        });

        const hexLabel = document.createElement('span');
        hexLabel.className = 'palette-hex-label';
        hexLabel.textContent = hex;

        block.appendChild(colorBox);
        block.appendChild(hexLabel);
        paletteDisplay.appendChild(block);
    });
}

copyAllBtn.addEventListener('click', () => {
    if (currentPalette.length > 0) {
        const allHex = currentPalette.join(', ');
        navigator.clipboard.writeText(allHex);
        copyAllBtn.textContent = '✅ ALL COPIED!';
        setTimeout(() => copyAllBtn.textContent = 'Copy All HEX Codes', 1500);
    }
});

imageInput.addEventListener('change', (e) => handleImage(e.target.files[0]));
countInput.addEventListener('input', () => {
    countValue.textContent = countInput.value;
    if (imagePreview.src) {
        const img = new Image();
        img.onload = () => extractPalette(img);
        img.src = imagePreview.src;
    }
});

// Drag and Drop Logic
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

document.addEventListener('DOMContentLoaded', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleImage(e.dataTransfer.files[0]);
});
