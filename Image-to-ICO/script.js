// Image to ICO Logic
const imageInput = document.getElementById('imageInput');
const dropZone = document.getElementById('dropZone');
const uploadPrompt = document.getElementById('uploadPrompt');
const previewWrapper = document.getElementById('previewWrapper');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasPreview = document.getElementById('canvasPreview');
const cropOverlay = document.getElementById('cropOverlay');
const fileInfo = document.getElementById('fileInfo');

// Controls
const ratioBtns = document.querySelectorAll('.ratio-btn');
const resizeToRatio = document.getElementById('resizeToRatio');
const rotateCCW = document.getElementById('rotateCCW');
const rotateCW = document.getElementById('rotateCW');
const flipHBtn = document.getElementById('flipH');
const flipVBtn = document.getElementById('flipV');
const toggleGrid = document.getElementById('toggleGrid');

const coordLeft = document.getElementById('coordLeft');
const coordTop = document.getElementById('coordTop');
const dimWidth = document.getElementById('dimWidth');
const dimHeight = document.getElementById('dimHeight');

const sizeGrid = document.getElementById('sizeGrid');
const customSizeInput = document.getElementById('customSize');
const addSizeBtn = document.getElementById('addSizeBtn');

const cornerSlider = document.getElementById('cornerSlider');
const cornerValue = document.getElementById('cornerValue');
const shapeSquare = document.getElementById('shapeSquare');
const shapeCircle = document.getElementById('shapeCircle');
const bgColorInput = document.getElementById('bgColor');
const bgTransparent = document.getElementById('bgTransparent');

const internalFormat = document.getElementById('internalFormat');
const fileNameInput = document.getElementById('fileName');
const generateBtn = document.getElementById('generateBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

let originalImg = new Image();
let currentFileName = "favicon";
let rotation = 0;
let flipH = 1;
let flipV = 1;
let selectedRatio = 'free';
let showGrid = false;

// Cropping state
let cropX = 0;
let cropY = 0;
let cropW = 0;
let cropH = 0;

// Initialize
imageInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
dropZone.addEventListener('click', () => imageInput.click());
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
});

function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;

    currentFileName = file.name.split('.')[0];
    fileNameInput.value = currentFileName;
    fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

    const reader = new FileReader();
    reader.onload = (e) => {
        originalImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

originalImg.onload = () => {
    uploadPrompt.style.display = 'none';
    previewWrapper.style.display = 'block';
    resetControls();
    updateCanvas();
};

function resetControls() {
    rotation = 0;
    flipH = 1;
    flipV = 1;
    cropX = 0;
    cropY = 0;
    cropW = originalImg.width;
    cropH = originalImg.height;

    coordLeft.value = 0;
    coordTop.value = 0;
    dimWidth.value = cropW;
    dimHeight.value = cropH;
}

toggleGrid.addEventListener('click', () => {
    showGrid = !showGrid;
    toggleGrid.classList.toggle('active');
    updateCanvas();
});

function updateCanvas() {
    if (!originalImg.src) return;

    const isRotated = rotation % 180 !== 0;
    const realW = isRotated ? originalImg.height : originalImg.width;
    const realH = isRotated ? originalImg.width : originalImg.height;

    canvas.width = realW;
    canvas.height = realH;

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.scale(flipH, flipV);

    if (!bgTransparent.checked) {
        ctx.fillStyle = bgColorInput.value;
        ctx.fillRect(-originalImg.width / 2, -originalImg.height / 2, originalImg.width, originalImg.height);
    }

    ctx.drawImage(originalImg, -originalImg.width / 2, -originalImg.height / 2);

    // Draw Grid if enabled
    if (showGrid) {
        ctx.strokeStyle = 'rgba(0, 123, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 1; i < 3; i++) {
            ctx.moveTo(-originalImg.width / 2 + (originalImg.width * i / 3), -originalImg.height / 2);
            ctx.lineTo(-originalImg.width / 2 + (originalImg.width * i / 3), originalImg.height / 2);
            ctx.moveTo(-originalImg.width / 2, -originalImg.height / 2 + (originalImg.height * i / 3));
            ctx.lineTo(originalImg.width / 2, -originalImg.height / 2 + (originalImg.height * i / 3));
        }
        ctx.stroke();
    }

    ctx.restore();

    const dataUrl = canvas.toDataURL();
    canvasPreview.style.backgroundImage = `url(${dataUrl})`;
    canvasPreview.style.width = `${realW}px`;
    canvasPreview.style.height = `${realH}px`;

    const container = document.querySelector('.preview-main');
    const scale = Math.min(container.clientWidth / realW, container.clientHeight / realH, 1);
    canvasPreview.style.transform = `scale(${scale})`;

    updateCropUI();
}

function updateCropUI() {
    const isRotated = rotation % 180 !== 0;
    const realW = isRotated ? originalImg.height : originalImg.width;
    const realH = isRotated ? originalImg.width : originalImg.height;

    if (selectedRatio === 'free') {
        cropOverlay.style.display = 'none';
        coordLeft.value = 0;
        coordTop.value = 0;
        dimWidth.value = Math.round(realW);
        dimHeight.value = Math.round(realH);
    } else {
        cropOverlay.style.display = 'block';
        let targetRatio = 1;
        if (selectedRatio === '1:1') targetRatio = 1;
        else if (selectedRatio === 'original') targetRatio = originalImg.width / originalImg.height;

        let ow, oh;
        if (realW / realH > targetRatio) {
            oh = realH;
            ow = oh * targetRatio;
        } else {
            ow = realW;
            oh = ow / targetRatio;
        }

        cropOverlay.style.width = `${ow}px`;
        cropOverlay.style.height = `${oh}px`;
        cropOverlay.style.left = `${(realW - ow) / 2}px`;
        cropOverlay.style.top = `${(realH - oh) / 2}px`;

        coordLeft.value = Math.round((realW - ow) / 2);
        coordTop.value = Math.round((realH - oh) / 2);
        dimWidth.value = Math.round(ow);
        dimHeight.value = Math.round(oh);
    }
}

// Event Listeners for Controls
ratioBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        ratioBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedRatio = btn.dataset.ratio;
        updateCanvas();
    });
});

rotateCCW.addEventListener('click', () => { rotation = (rotation - 90) % 360; updateCanvas(); });
rotateCW.addEventListener('click', () => { rotation = (rotation + 90) % 360; updateCanvas(); });
flipHBtn.addEventListener('click', () => { flipH *= -1; updateCanvas(); });
flipVBtn.addEventListener('click', () => { flipV *= -1; updateCanvas(); });

document.addEventListener('DOMContentLoaded', () => {
    const val = cornerSlider.value;
    cornerValue.textContent = `${val}%`;
    canvasPreview.style.borderRadius = `${val}%`;
});

cornerSlider.addEventListener('input', () => {
    const val = cornerSlider.value;
    cornerValue.textContent = `${val}%`;
    canvasPreview.style.borderRadius = `${val}%`;
});

shapeSquare.addEventListener('click', () => {
    cornerSlider.value = 0;
    cornerValue.textContent = '0%';
    canvasPreview.style.borderRadius = '0';
});

shapeCircle.addEventListener('click', () => {
    cornerSlider.value = 50;
    cornerValue.textContent = '50%';
    canvasPreview.style.borderRadius = '50%';
});

bgTransparent.addEventListener('change', updateCanvas);
bgColorInput.addEventListener('input', () => {
    bgTransparent.checked = false;
    updateCanvas();
});

addSizeBtn.addEventListener('click', () => {
    const val = customSizeInput.value;
    if (val && !isNaN(val)) {
        const label = document.createElement('label');
        label.innerHTML = `<input type="checkbox" value="${val}" checked> ${val}x${val}`;
        sizeGrid.appendChild(label);
        customSizeInput.value = '';
    }
});

generateBtn.addEventListener('click', async () => {
    if (!originalImg.src) return;

    loadingOverlay.style.display = 'flex';
    generateBtn.disabled = true;

    try {
        // 1. Prepare the styled image on a hidden canvas
        const finalCanvas = document.createElement('canvas');
        const fctx = finalCanvas.getContext('2d');

        // Use a high resolution for the base (e.g. 1024x1024 or max dimension)
        const maxDim = Math.max(canvas.width, canvas.height, 512);
        finalCanvas.width = maxDim;
        finalCanvas.height = maxDim;

        // Draw background if not transparent
        if (!bgTransparent.checked) {
            fctx.fillStyle = bgColorInput.value;
            fctx.fillRect(0, 0, maxDim, maxDim);
        }

        // Apply rounded corners clip if needed
        const radius = (cornerSlider.value / 100) * maxDim;
        if (radius > 0) {
            fctx.beginPath();
            fctx.moveTo(radius, 0);
            fctx.lineTo(maxDim - radius, 0);
            fctx.quadraticCurveTo(maxDim, 0, maxDim, radius);
            fctx.lineTo(maxDim, maxDim - radius);
            fctx.quadraticCurveTo(maxDim, maxDim, maxDim - radius, maxDim);
            fctx.lineTo(radius, maxDim);
            fctx.quadraticCurveTo(0, maxDim, 0, maxDim - radius);
            fctx.lineTo(0, radius);
            fctx.quadraticCurveTo(0, 0, radius, 0);
            fctx.closePath();
            fctx.clip();
        }

        // Draw the processed image from the main canvas (which already has rotation/flip)
        // We center it
        const scale = Math.min(maxDim / canvas.width, maxDim / canvas.height);
        const dw = canvas.width * scale;
        const dh = canvas.height * scale;
        fctx.drawImage(canvas, (maxDim - dw) / 2, (maxDim - dh) / 2, dw, dh);

        // 2. Convert to Blob
        const blob = await new Promise(resolve => finalCanvas.toBlob(resolve, 'image/png'));

        // 3. Collect sizes
        const selectedSizes = Array.from(sizeGrid.querySelectorAll('input:checked')).map(cb => cb.value);

        // 4. Send to backend
        const formData = new FormData();
        formData.append('file', blob, 'processed.png');
        formData.append('sizes', selectedSizes.join(','));

        const response = await fetch('/generate-ico', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error('Failed to generate ICO');

        const resultBlob = await response.blob();
        const url = URL.createObjectURL(resultBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileNameInput.value || 'favicon'}.ico`;
        link.click();

    } catch (err) {
        console.error(err);
        alert('Error generating ICO. Please ensure the backend is running.');
    } finally {
        loadingOverlay.style.display = 'none';
        generateBtn.disabled = false;
    }
});

// Update Coordinates on manual input
[coordLeft, coordTop, dimWidth, dimHeight].forEach(input => {
    input.addEventListener('change', () => {
        // Update crop logic...
    });
});
