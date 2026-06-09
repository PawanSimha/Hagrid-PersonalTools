/* Author: Pawan Simha R */
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const imageInput = document.getElementById("imageInput");
const radiusInput = document.getElementById("radiusInput");
const zoomInput = document.getElementById("zoomInput");
const bgColorInput = document.getElementById("bgColorInput");
const offsetXInput = document.getElementById("offsetXInput");
const offsetYInput = document.getElementById("offsetYInput");
const downloadBtn = document.getElementById("downloadBtn");

const radiusValueDisplay = document.getElementById("radiusValueDisplay");
const zoomValue = document.getElementById("zoomValue");
const offsetXValue = document.getElementById("offsetXValue");
const offsetYValue = document.getElementById("offsetYValue");
const dropZone = document.getElementById("dropZone");

// Advanced Controls
const advancedToggle = document.getElementById("advancedToggle");
const advancedContent = document.getElementById("advancedContent");
const flipHBtn = document.getElementById("flipHBtn");
const flipVBtn = document.getElementById("flipVBtn");
const rotate90Btn = document.getElementById("rotate90Btn");
const rotateInput = document.getElementById("rotateInput");
const rotateValueDisplay = document.getElementById("rotateValueDisplay");
const brightnessInput = document.getElementById("brightnessInput");
const brightnessValue = document.getElementById("brightnessValue");
const contrastInput = document.getElementById("contrastInput");
const contrastValue = document.getElementById("contrastValue");
const checkerboardToggle = document.getElementById("checkerboardToggle");
const canvasWrapper = document.getElementById("canvasWrapper");

let img = new Image();
let flipH = 1;
let flipV = 1;
let rotation90 = 0;

function handleImage(file) {
    if (file && file.type.startsWith('image/')) {
        img.src = URL.createObjectURL(file);
        img.onload = draw;
    }
}

imageInput.addEventListener("change", e => {
    handleImage(e.target.files[0]);
});

// Drag and Drop Logic
dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    handleImage(e.dataTransfer.files[0]);
});

function draw() {
    const size = radiusInput.value * 2;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.save();

    // Create Circular Clip
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // Fill Background
    if (bgColorInput.value !== 'transparent') {
        ctx.fillStyle = bgColorInput.value;
        ctx.fillRect(0, 0, size, size);
    }

    // Draw Image
    if (img.naturalWidth) {
        const scaleW = size / img.naturalWidth;
        const scaleH = size / img.naturalHeight;

        // Use Max scale (cover) by default for circle crop
        const baseRatio = Math.max(scaleW, scaleH);
        const zoom = parseFloat(zoomInput.value);

        let drawW = img.naturalWidth * baseRatio * zoom;
        let drawH = img.naturalHeight * baseRatio * zoom;

        // Center and transformations
        ctx.translate(size / 2 + parseInt(offsetXInput.value), size / 2 + parseInt(offsetYInput.value));

        // Apply Rotation
        const rotate = parseInt(rotateInput.value);
        rotateValueDisplay.textContent = rotate;
        ctx.rotate((rotate + rotation90) * Math.PI / 180);

        // Apply Flips
        ctx.scale(flipH, flipV);

        // Apply Filters
        const brightness = brightnessInput.value;
        const contrast = contrastInput.value;
        brightnessValue.textContent = brightness;
        contrastValue.textContent = contrast;
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

        // Update Value Displays
        radiusValueDisplay.textContent = radiusInput.value;
        zoomValue.textContent = zoom.toFixed(1);
        offsetXValue.textContent = offsetXInput.value;
        offsetYValue.textContent = offsetYInput.value;
    }

    ctx.restore();
}

// UI Event Listeners
advancedToggle.addEventListener('click', () => {
    advancedToggle.classList.toggle('active');
    advancedContent.classList.toggle('active');
});

flipHBtn.addEventListener('click', () => { flipH *= -1; draw(); });
flipVBtn.addEventListener('click', () => { flipV *= -1; draw(); });
rotate90Btn.addEventListener('click', () => { rotation90 = (rotation90 + 90) % 360; draw(); });

checkerboardToggle.addEventListener('change', () => {
    canvasWrapper.classList.toggle('checkerboard', checkerboardToggle.checked);
});

[radiusInput, zoomInput, bgColorInput, offsetXInput, offsetYInput, rotateInput, brightnessInput, contrastInput].forEach(el =>
    el.addEventListener("input", draw)
);

downloadBtn.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `hagrid-circle-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
});
