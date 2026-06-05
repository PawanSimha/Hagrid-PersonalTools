/**
 * Image Collage Maker
 * Author: Pawan Simha
 */

document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const dropZone = document.getElementById('dropZone');
    const imageList = document.getElementById('imageList');
    const canvas = document.getElementById('collageCanvas');
    const ctx = canvas.getContext('2d');
    const emptyState = document.getElementById('emptyState');
    const downloadBtn = document.getElementById('downloadBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    // Global Controls
    const ratioSelect = document.getElementById('ratioSelect');
    const customRatioContainer = document.getElementById('customRatioContainer');
    const customRatioW = document.getElementById('customRatioW');
    const customRatioH = document.getElementById('customRatioH');
    const bentoRowManager = document.getElementById('bentoRowManager');
    const rowControlsList = document.getElementById('rowControlsList');

    const globalControls = [
        { s: 'columnsInput', n: 'columnsNum' },
        { s: 'spacingInput', n: 'spacingNum' },
        { s: 'radiusInput', n: 'radiusNum' },
        { s: 'shadowInput', n: 'shadowNum' },
        { s: 'qualityInput', n: null, v: 'qualityValue' }
    ];
    const bgColorInput = document.getElementById('bgColorInput');
    const formatSelect = document.getElementById('formatSelect');

    // Layout Buttons
    const layoutBtns = ['Grid', 'Vertical', 'Horizontal', 'Mosaic', 'Bento'].map(l => document.getElementById('layout' + l));

    // Individual Edit Controls
    const editToggle = document.getElementById('editToggle');
    const editContent = document.getElementById('editContent');
    const individualControls = document.getElementById('individualControls');
    const bentoOnlyControls = document.getElementById('bentoOnlyControls');
    const editPrompt = document.getElementById('editPrompt');
    const imgControls = [
        { s: 'imgBorderInput', n: 'imgBorderNum' },
        { s: 'imgRotationInput', n: 'imgRotationNum' },
        { s: 'imgOpacityInput', n: 'imgOpacityNum' },
        { s: 'imgBrightnessInput', n: 'imgBrightnessNum' },
        { s: 'imgZoomInput', n: 'imgZoomNum' },
        { s: 'imgPanXInput', n: 'imgPanXNum' },
        { s: 'imgPanYInput', n: 'imgPanYNum' },
        { s: 'imgColSpanInput', n: 'imgColSpanNum' },
        { s: 'imgRowSpanInput', n: 'imgRowSpanNum' }
    ];
    const imgFitSelect = document.getElementById('imgFitSelect');
    const imgFlipHBtn = document.getElementById('imgFlipHBtn');
    const imgFlipVBtn = document.getElementById('imgFlipVBtn');
    const imgBorderColorInput = document.getElementById('imgBorderColorInput');
    const resetImgBtn = document.getElementById('resetImgBtn');

    let images = [];
    let selectedImageId = null;
    let currentLayout = 'grid';
    let isDraggingCanvas = false;
    let lastMousePos = { x: 0, y: 0 };
    let draggedItemId = null;
    let rowConfigs = []; // [{cols: 3, height: 1}]

    // --- LINKING CONTROLS ---
    function linkControls(sliderId, numId, valueId, onInput) {
        const slider = document.getElementById(sliderId);
        const num = numId ? document.getElementById(numId) : null;
        const val = valueId ? document.getElementById(valueId) : null;
        const update = (v) => { v = parseFloat(v); if (slider) slider.value = v; if (num) num.value = v; if (val) val.textContent = v.toFixed(1); onInput(v); };
        if (slider) slider.addEventListener('input', (e) => update(e.target.value));
        if (num) num.addEventListener('input', (e) => update(e.target.value));
    }

    globalControls.forEach(c => linkControls(c.s, c.n, c.v, renderCollage));
    imgControls.forEach(c => linkControls(c.s, c.n, null, (v) => {
        const imgObj = images.find(img => img.id === selectedImageId);
        if (imgObj) {
            const prop = c.s.replace('img', '').replace('Input', '');
            const key = prop.charAt(0).toLowerCase() + prop.slice(1);
            imgObj[key === 'border' ? 'borderWidth' : key] = parseFloat(v);
            renderCollage();
        }
    }));

    // --- ROW MANAGER ---
    function updateRowManager() {
        if (currentLayout !== 'bento' || images.length === 0) { bentoRowManager.style.display = 'none'; return; }
        bentoRowManager.style.display = 'block';
        
        let totalAssigned = 0;
        let rowIndex = 0;
        rowControlsList.innerHTML = '';

        while (totalAssigned < images.length) {
            if (!rowConfigs[rowIndex]) rowConfigs[rowIndex] = { cols: 2, height: 1 };
            const config = rowConfigs[rowIndex];
            const i = rowIndex;

            const div = document.createElement('div');
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
                    <span style="font-size: 0.7rem; font-weight: 600;">Row ${i+1}</span>
                    <div style="display: flex; gap: 0.25rem;">
                        <span style="font-size: 0.6rem;">Cols:</span>
                        <input type="number" step="0.1" value="${config.cols}" style="width: 40px; font-size: 0.7rem;" id="rowCols_${i}">
                        <span style="font-size: 0.6rem;">H:</span>
                        <input type="number" step="0.1" value="${config.height}" style="width: 40px; font-size: 0.7rem;" id="rowHeight_${i}">
                    </div>
                </div>
            `;
            div.querySelector(`#rowCols_${i}`).addEventListener('input', (e) => { rowConfigs[i].cols = parseFloat(e.target.value) || 1; renderCollage(); });
            div.querySelector(`#rowHeight_${i}`).addEventListener('input', (e) => { rowConfigs[i].height = parseFloat(e.target.value) || 1; renderCollage(); });
            rowControlsList.appendChild(div);

            totalAssigned += Math.ceil(config.cols); // Approximate images per row
            rowIndex++;
            if (rowIndex > images.length) break; // Safety
        }
    }

    // --- FILE HANDLING ---
    imageInput.addEventListener('change', (e) => handleFiles(e.target.files));
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); handleFiles(e.dataTransfer.files); });

    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        images.push({
                            id: Date.now() + Math.random(), img, file,
                            borderWidth: 0, borderColor: '#000000', fitMode: 'cover', flipH: false, flipV: false, rotation: 0, opacity: 100, brightness: 100, zoom: 100, panX: 0, panY: 0,
                            colSpan: 1, rowSpan: 1
                        });
                        updateImageList(); updateRowManager(); renderCollage();
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function updateImageList() {
        imageList.innerHTML = '';
        images.forEach((imgObj, i) => {
            const item = document.createElement('div');
            item.className = `image-item ${imgObj.id === selectedImageId ? 'selected' : ''}`;
            item.draggable = true;
            item.innerHTML = `<img src="${imgObj.img.src}"><div class="slot-badge">#${i+1}</div><div class="image-controls"><button class="remove-btn">×</button></div>`;
            item.addEventListener('dragstart', () => { draggedItemId = imgObj.id; item.classList.add('dragging'); });
            item.addEventListener('dragend', () => item.classList.remove('dragging'));
            item.addEventListener('dragover', (e) => { e.preventDefault(); item.classList.add('drag-over'); });
            item.addEventListener('dragleave', () => item.classList.remove('drag-over'));
            item.addEventListener('drop', (e) => {
                e.preventDefault();
                if (draggedItemId !== imgObj.id) {
                    const dIdx = images.findIndex(img => img.id === draggedItemId), tIdx = images.findIndex(img => img.id === imgObj.id);
                    const [draggedItem] = images.splice(dIdx, 1); images.splice(tIdx, 0, draggedItem);
                    updateImageList(); updateRowManager(); renderCollage();
                }
            });
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-btn')) {
                    images = images.filter(img => img.id !== imgObj.id);
                    if (selectedImageId === imgObj.id) selectedImageId = null;
                    updateImageList(); updateRowManager(); renderCollage(); return;
                }
                selectImage(imgObj.id);
            });
            imageList.appendChild(item);
        });
        const has = images.length > 0; emptyState.style.display = has ? 'none' : 'block'; canvas.style.display = has ? 'block' : 'none'; downloadBtn.disabled = !has;
        if (!has) { selectedImageId = null; updateIndividualControls(); }
    }

    function selectImage(id) { selectedImageId = id; updateImageList(); updateIndividualControls(); if (editContent.style.display === 'none') editToggle.click(); }

    function updateIndividualControls() {
        const imgObj = images.find(img => img.id === selectedImageId);
        if (imgObj) {
            individualControls.style.display = 'block'; editPrompt.style.display = 'none'; bentoOnlyControls.style.display = currentLayout === 'bento' ? 'block' : 'none';
            imgControls.forEach(c => {
                const prop = c.s.replace('img', '').replace('Input', '');
                const key = prop.charAt(0).toLowerCase() + prop.slice(1);
                const val = imgObj[key === 'border' ? 'borderWidth' : key];
                document.getElementById(c.s).value = val; if (c.n) document.getElementById(c.n).value = val;
            });
            imgBorderColorInput.value = imgObj.borderColor; imgFitSelect.value = imgObj.fitMode;
            imgFlipHBtn.classList.toggle('active', imgObj.flipH); imgFlipVBtn.classList.toggle('active', imgObj.flipV);
        } else { individualControls.style.display = 'none'; editPrompt.style.display = 'block'; }
    }

    // --- CANVAS INTERACTION ---
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width), y = (e.clientY - rect.top) * (canvas.height / rect.height);
        const clicked = findImageAt(x, y); if (clicked) { selectImage(clicked.id); isDraggingCanvas = true; lastMousePos = { x, y }; }
    });
    window.addEventListener('mousemove', (e) => {
        if (!isDraggingCanvas || !selectedImageId) return;
        const imgObj = images.find(img => img.id === selectedImageId); if (!imgObj) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width), y = (e.clientY - rect.top) * (canvas.height / rect.height);
        imgObj.panX = Math.max(-100, Math.min(100, imgObj.panX + (x - lastMousePos.x) / canvas.width * 200));
        imgObj.panY = Math.max(-100, Math.min(100, imgObj.panY + (y - lastMousePos.y) / canvas.height * 200));
        lastMousePos = { x, y }; updateIndividualControls(); renderCollage();
    });
    window.addEventListener('mouseup', () => isDraggingCanvas = false);
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) * (canvas.width / rect.width), y = (e.clientY - rect.top) * (canvas.height / rect.height);
        const hovered = findImageAt(x, y); if (hovered) { selectImage(hovered.id); hovered.zoom = Math.max(10, Math.min(400, hovered.zoom + (e.deltaY > 0 ? -1 : 1))); updateIndividualControls(); renderCollage(); }
    }, { passive: false });

    // --- LAYOUT ENGINE ---
    function findImageAt(mx, my) { return calculateLayout().layout.find(d => mx >= d.x && mx <= d.x + d.w && my >= d.y && my <= d.y + d.h)?.img; }

    function calculateLayout() {
        const spacing = parseFloat(document.getElementById('spacingInput').value);
        const ratio = ratioSelect.value;
        const cols = parseFloat(document.getElementById('columnsInput').value);
        let cW = 1200, cH;
        if (ratio === 'auto') {
            if (currentLayout === 'vertical') { cW = 600 + spacing * 2; cH = images.length * 600 + (images.length + 1) * spacing; }
            else if (currentLayout === 'horizontal') { cW = images.length * 600 + (images.length + 1) * spacing; cH = 600 + spacing * 2; }
            else { cW = cols * 600 + (cols + 1) * spacing; cH = Math.ceil(images.length / Math.floor(cols)) * 600 + (Math.ceil(images.length / Math.floor(cols)) + 1) * spacing; }
        } else {
            let rw = 1, rh = 1;
            if (ratio === 'custom') { rw = parseFloat(customRatioW.value) || 1; rh = parseFloat(customRatioH.value) || 1; }
            else { [rw, rh] = ratio.split(':').map(Number); }
            cH = (cW * rh) / rw;
        }

        const layout = [];
        if (currentLayout === 'bento') {
            let currentX = spacing, currentY = spacing;
            let imgIndex = 0;
            let rowIndex = 0;
            const baseH = 600;

            while (imgIndex < images.length) {
                const config = rowConfigs[rowIndex] || { cols: 2, height: 1 };
                const rowCols = Math.max(1, config.cols);
                const rowHScale = config.height;
                const imagesInRow = Math.min(images.length - imgIndex, Math.ceil(rowCols));
                
                const cellW = (cW - (rowCols + 1) * spacing) / rowCols;
                const cellH = baseH * rowHScale;

                for (let i = 0; i < imagesInRow; i++) {
                    const img = images[imgIndex + i];
                    layout.push({ img, x: currentX, y: currentY, w: cellW, h: cellH });
                    currentX += cellW + spacing;
                }

                currentX = spacing;
                currentY += cellH + spacing;
                imgIndex += imagesInRow;
                rowIndex++;
            }
            if (ratio === 'auto') cH = currentY;
        } else {
            const lCols = currentLayout === 'vertical' ? 1 : (currentLayout === 'horizontal' ? images.length : cols);
            const cellW = (cW - (lCols + 1) * spacing) / lCols, cellH = (cH - (Math.ceil(images.length / lCols) + 1) * spacing) / Math.ceil(images.length / lCols);
            images.forEach((img, i) => layout.push({ img, x: spacing + (i % lCols) * (cellW + spacing), y: spacing + Math.floor(i / lCols) * (cellH + spacing), w: cellW, h: cellH }));
        }
        return { layout, cW, cH };
    }

    function renderCollage() {
        if (images.length === 0) return;
        const { layout, cW, cH } = calculateLayout();
        canvas.width = cW; canvas.height = cH;
        const radius = parseFloat(document.getElementById('radiusInput').value), shadow = parseFloat(document.getElementById('shadowInput').value);
        ctx.fillStyle = bgColorInput.value; ctx.fillRect(0, 0, cW, cH);
        layout.forEach(d => drawCell(d.img, d.x, d.y, d.w, d.h, radius, shadow));
    }

    function drawCell(imgObj, x, y, w, h, radius, shadow) {
        ctx.save();
        if (shadow > 0) { ctx.shadowColor = `rgba(0,0,0,${shadow/200})`; ctx.shadowBlur = shadow/2; ctx.shadowOffsetX = ctx.shadowOffsetY = shadow/4; }
        ctx.fillStyle = imgObj.borderWidth > 0 ? imgObj.borderColor : bgColorInput.value;
        drawRoundedRect(ctx, x, y, w, h, radius); ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.beginPath(); drawRoundedRect(ctx, x + imgObj.borderWidth, y + imgObj.borderWidth, w - imgObj.borderWidth*2, h - imgObj.borderWidth*2, Math.max(0, radius - imgObj.borderWidth)); ctx.clip();
        ctx.translate(x + w / 2, y + h / 2);
        if (imgObj.rotation !== 0) ctx.rotate((imgObj.rotation * Math.PI) / 180);
        if (imgObj.flipH || imgObj.flipV) ctx.scale(imgObj.flipH ? -1 : 1, imgObj.flipV ? -1 : 1);
        ctx.filter = `brightness(${imgObj.brightness}%) opacity(${imgObj.opacity}%)`;
        const img = imgObj.img, iR = img.width / img.height, cR = (w - imgObj.borderWidth*2) / (h - imgObj.borderWidth*2);
        let dW, dH; const z = imgObj.zoom / 100;
        if (imgObj.fitMode === 'cover') { if (iR > cR) { dH = (h-imgObj.borderWidth*2) * z; dW = dH * iR; } else { dW = (w-imgObj.borderWidth*2) * z; dH = dW / iR; } }
        else { if (iR > cR) { dW = (w-imgObj.borderWidth*2) * z; dH = dW / iR; } else { dH = (h-imgObj.borderWidth*2) * z; dW = dH * iR; } }
        ctx.drawImage(img, -dW / 2 + (imgObj.panX / 100) * w, -dH / 2 + (imgObj.panY / 100) * h, dW, dH);
        ctx.restore();
    }

    function drawRoundedRect(ctx, x, y, w, h, r) { if (w < 2*r) r = w/2; if (h < 2*r) r = h/2; ctx.beginPath(); ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r); ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath(); }

    ratioSelect.addEventListener('change', () => { customRatioContainer.style.display = ratioSelect.value === 'custom' ? 'block' : 'none'; renderCollage(); });
    bgColorInput.addEventListener('input', renderCollage);
    layoutBtns.forEach(btn => btn.addEventListener('click', () => { layoutBtns.forEach(b => b.classList.remove('active')); btn.classList.add('active'); currentLayout = btn.id.replace('layout', '').toLowerCase(); updateRowManager(); updateIndividualControls(); renderCollage(); }));
    resetImgBtn.addEventListener('click', () => { const i = images.find(img => img.id === selectedImageId); if (i) { Object.assign(i, { borderWidth: 0, rotation: 0, opacity: 100, brightness: 100, zoom: 100, panX: 0, panY: 0, fitMode: 'cover', flipH: false, flipV: false, borderColor: '#000000', colSpan: 1, rowSpan: 1 }); updateIndividualControls(); renderCollage(); } });
    downloadBtn.addEventListener('click', () => { const format = formatSelect.value, ext = format === 'image/png' ? 'png' : 'jpg', link = document.createElement('a'); link.download = `collage-${Date.now()}.${ext}`; link.href = canvas.toDataURL(format, format === 'image/jpeg' ? parseFloat(document.getElementById('qualityInput').value)/100 : undefined); link.click(); });
});
