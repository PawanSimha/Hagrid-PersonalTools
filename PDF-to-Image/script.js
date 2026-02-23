/* Author: Pawan Simha */
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const formatSelect = document.getElementById('formatSelect');
    const processBtn = document.getElementById('processBtn');
    const fileName = document.getElementById('fileName');
    const uploadPrompt = document.getElementById('uploadPrompt');
    const pdfIcon = document.getElementById('pdfIcon');
    const loadingOverlay = document.getElementById('loadingOverlay');

    let currentFile = null;

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
        if (!file || file.type !== 'application/pdf') return;
        currentFile = file;

        fileName.textContent = file.name + ` (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;
        fileName.style.display = 'block';
        uploadPrompt.style.display = 'none';
        pdfIcon.style.opacity = '1';
        processBtn.disabled = false;
    }

    // Process PDF
    processBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        processBtn.disabled = true;
        loadingOverlay.style.display = 'flex';

        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('format', formatSelect.value);

        try {
            const response = await fetch('/api/doc/pdf-to-image', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Conversion failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;

            // If it's a single page, download the image, else ZIP
            const isZip = response.headers.get('content-type') === 'application/zip';
            link.download = isZip ? 'pdf_pages.zip' : `pdf_page.${formatSelect.value}`;

            link.click();

            setTimeout(() => URL.revokeObjectURL(url), 100);

        } catch (error) {
            console.error(error);
            alert('Error converting PDF: ' + error.message);
        } finally {
            loadingOverlay.style.display = 'none';
            processBtn.disabled = false;
        }
    });
});
