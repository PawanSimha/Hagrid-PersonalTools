const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const imageInput = document.getElementById("imageInput");
const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const unitSelect = document.getElementById("unitSelect");
const radiusInput = document.getElementById("radiusInput");
const radiusValue = document.getElementById("radiusValue");
const downloadBtn = document.getElementById("downloadBtn");
const fitSelect = document.getElementById("fitSelect");
const zoomInput = document.getElementById("zoomInput");
const bgColorInput = document.getElementById("bgColorInput");
const offsetXInput = document.getElementById("offsetXInput");
const offsetYInput = document.getElementById("offsetYInput");

const offsetYValue = document.getElementById("offsetYValue");
const dropZone = document.getElementById("dropZone");

// Advanced Controls
const advancedToggle = document.getElementById("advancedToggle");
const advancedContent = document.getElementById("advancedContent");
const flipHBtn = document.getElementById("flipHBtn");
const flipVBtn = document.getElementById("flipVBtn");
const rotate90Btn = document.getElementById("rotate90Btn");
const rotateInput = document.getElementById("rotateInput");
const rotateValue = document.getElementById("rotateValue");
const brightnessInput = document.getElementById("brightnessInput");
const brightnessValue = document.getElementById("brightnessValue");
const contrastInput = document.getElementById("contrastInput");
const contrastValue = document.getElementById("contrastValue");
const shadowInput = document.getElementById("shadowInput");
const shadowValue = document.getElementById("shadowValue");
const checkerboardToggle = document.getElementById("checkerboardToggle");
const canvasWrapper = document.getElementById("canvasWrapper");

let img = new Image();
let flipH = 1;
let flipV = 1;
let rotation90 = 0;

function unitToPx(value) {
  const dpi = 96;
  if (unitSelect.value === "mm") return value * (dpi / 25.4);
  if (unitSelect.value === "cm") return value * (dpi / 2.54);
  return value;
}

function handleImage(file) {
  if (file && file.type.startsWith('image/')) {
    img.src = URL.createObjectURL(file);
    img.onload = draw;
  }
}

imageInput.addEventListener("change", e => {
  handleImage(e.target.files[0]);
});
/* Author: Pawan Simha R */
/**
 * Border Radius Cropper logic
 */
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
  const w = unitToPx(+widthInput.value);
  const h = unitToPx(+heightInput.value);

  canvas.width = w;
  canvas.height = h;

  ctx.clearRect(0, 0, w, h);

  // Apply Shadows if any
  const shadow = +shadowInput.value;
  shadowValue.textContent = shadow;
  if (shadow > 0) {
    ctx.shadowBlur = shadow;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowOffsetY = shadow / 4;
  }

  ctx.save();

  const radius = +radiusInput.value;
  radiusValue.textContent = radius;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.arcTo(w, 0, w, h, radius);
  ctx.arcTo(w, h, 0, h, radius);
  ctx.arcTo(0, h, 0, 0, radius);
  ctx.arcTo(0, 0, w, 0, radius);
  ctx.closePath();
  ctx.clip();

  // Draw Background
  ctx.fillStyle = bgColorInput.value;
  ctx.fillRect(0, 0, w, h);

  // Draw Image with Fit Modes
  if (img.naturalWidth) {
    let drawW = w;
    let drawH = h;

    const mode = fitSelect.value;
    if (mode !== 'fill') {
      const scaleW = w / img.naturalWidth;
      const scaleH = h / img.naturalHeight;
      const ratio = mode === 'cover' ? Math.max(scaleW, scaleH) : Math.min(scaleW, scaleH);
      drawW = img.naturalWidth * ratio;
      drawH = img.naturalHeight * ratio;
    }

    // Apply Zoom
    const zoom = +zoomInput.value;
    drawW *= zoom;
    drawH *= zoom;

    // Center and transformations
    ctx.translate(w / 2 + +offsetXInput.value, h / 2 + +offsetYInput.value);

    // Apply Rotation
    const rotate = +rotateInput.value;
    rotateValue.textContent = rotate;
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

[widthInput, heightInput, unitSelect, radiusInput, fitSelect, zoomInput, bgColorInput, offsetXInput, offsetYInput, rotateInput, brightnessInput, contrastInput, shadowInput].forEach(el =>
  el.addEventListener("input", draw)
);

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `hagrid-br-${Date.now()}.png`;
  link.href = canvas.toDataURL();
  link.click();
});
