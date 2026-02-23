/* Author: Pawan Simha */
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const amountInput = document.getElementById('amountInput');
    const amountValue = document.getElementById('amountValue');
    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const imageBefore = document.getElementById('imageBefore');
    const imageAfter = document.getElementById('imageAfter');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const uploadPrompt = document.getElementById('uploadPrompt');
    const advancedToggle = document.getElementById('advancedToggle');
    const advancedContent = document.getElementById('advancedContent');

    // Channels
    const chanR = document.getElementById('chanR');
    const chanG = document.getElementById('chanG');
    const chanB = document.getElementById('chanB');

    // Transformations
    const flipHBtn = document.getElementById('flipHBtn');
    const flipVBtn = document.getElementById('flipVBtn');
    const rotate90Btn = document.getElementById('rotate90Btn');

    let currentFile = null;
    let transformations = { flipH: false, flipV: false, rotation: 0 };

    // Advanced Toggle
    advancedToggle.addEventListener('click', () => {
        advancedToggle.classList.toggle('active');
        advancedContent.style.display = advancedToggle.classList.contains('active') ? 'block' : 'none';
    });

    // Handle Amount Update
    amountInput.addEventListener('input', (e) => {
        amountValue.textContent = e.target.value;
    });

    // Handle File Selection
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) return;
        currentFile = file;

        const reader = new FileReader();
        reader.onload = (e) => {
            imageBefore.src = e.target.result;
            imageBefore.style.display = 'block';
            uploadPrompt.style.display = 'none';
            processBtn.disabled = false;

            // Re-apply local transformations to new image
            applyTransformations(imageBefore);

            // Reset Result
            imageAfter.style.display = 'none';
            downloadBtn.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    // Local Transformations Logic
    function applyTransformations(img) {
        let transformStr = `rotate(${transformations.rotation}deg)`;
        if (transformations.flipH) transformStr += ` scaleX(-1)`;
        if (transformations.flipV) transformStr += ` scaleY(-1)`;
        img.style.transform = transformStr;
    }

    flipHBtn.addEventListener('click', () => {
        transformations.flipH = !transformations.flipH;
        applyTransformations(imageBefore);
        if (imageAfter.style.display !== 'none') applyTransformations(imageAfter);
    });

    flipVBtn.addEventListener('click', () => {
        transformations.flipV = !transformations.flipV;
        applyTransformations(imageBefore);
        if (imageAfter.style.display !== 'none') applyTransformations(imageAfter);
    });

    rotate90Btn.addEventListener('click', () => {
        transformations.rotation = (transformations.rotation + 90) % 360;
        applyTransformations(imageBefore);
        if (imageAfter.style.display !== 'none') applyTransformations(imageAfter);
    });

    // Process Image
    processBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        processBtn.disabled = true;
        loadingOverlay.style.display = 'flex';

        // Get Active Channels
        const activeChannels = [];
        if (chanR.checked) activeChannels.push('r');
        if (chanG.checked) activeChannels.push('g');
        if (chanB.checked) activeChannels.push('b');

        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('amount', amountInput.value / 100);
        formData.append('channels', activeChannels.join(','));

        try {
            const response = await fetch('/api/image/invert-image', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Inversion failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            imageAfter.src = url;
            imageAfter.style.display = 'block';
            applyTransformations(imageAfter); // Match existing preview transformations
            downloadBtn.style.display = 'inline-block';

            downloadBtn.onclick = () => {
                // To download with CSS transformations, we'd need a canvas. 
                // For simplicity as per existing tools, we download the original inverted image.
                const link = document.createElement('a');
                link.href = url;
                link.download = `inverted_${currentFile.name}`;
                link.click();
            };
        } catch (error) {
            console.error(error);
            alert('Error processing image. Backend says: ' + error.message);
        } finally {
            loadingOverlay.style.display = 'none';
            processBtn.disabled = false;
        }
    });
});
