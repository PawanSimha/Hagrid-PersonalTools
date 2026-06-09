/* Author: Pawan Simha R */
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const intensityInput = document.getElementById('intensityInput');
    const intensityValue = document.getElementById('intensityValue');
    const processBtn = document.getElementById('processBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const imageBefore = document.getElementById('imageBefore');
    const imageAfter = document.getElementById('imageAfter');
    const uploadPrompt = document.getElementById('uploadPrompt');
    const loadingOverlay = document.getElementById('loadingOverlay');

    let currentFile = null;

    // Handle Intensity Update
    intensityInput.addEventListener('input', (e) => {
        intensityValue.textContent = e.target.value;
    });

    // Handle File Selection
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
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

            // Reset result
            imageAfter.style.display = 'none';
            downloadBtn.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    // Process Sketch
    processBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        processBtn.disabled = true;
        loadingOverlay.style.display = 'flex';

        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('intensity', intensityInput.value / 100);
        formData.append('sketch_type', 'gray');
        formData.append('line_thickness', '1');
        formData.append('shadow_tint', '#000000');

        try {
            const response = await fetch('/api/image/pencil-sketch', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Sketch processing failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            imageAfter.src = url;
            imageAfter.style.display = 'block';
            downloadBtn.style.display = 'block';

            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = url;
                link.download = `sketched_${currentFile.name}`;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 100);
            };

        } catch (error) {
            console.error(error);
            alert('Error applying filter: ' + error.message);
        } finally {
            loadingOverlay.style.display = 'none';
            processBtn.disabled = false;
        }
    });
});
