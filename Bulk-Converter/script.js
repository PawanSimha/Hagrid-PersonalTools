/* Author: Pawan Simha */
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const formatSelect = document.getElementById('formatSelect');
    const processBtn = document.getElementById('processBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const fileList = document.getElementById('fileList');
    const fileListContainer = document.getElementById('fileListContainer');
    const uploadPrompt = document.getElementById('uploadPrompt');
    const loadingOverlay = document.getElementById('loadingOverlay');

    let uploadedFiles = [];

    // Handle File Selection
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    function handleFiles(files) {
        if (!files.length) return;

        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                uploadedFiles.push(file);
            }
        });

        updateUI();
    }

    function updateUI() {
        if (uploadedFiles.length > 0) {
            fileListContainer.style.display = 'block';
            uploadPrompt.style.display = 'none';
            processBtn.disabled = false;
            clearAllBtn.style.display = 'block';

            fileList.innerHTML = '';
            uploadedFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'file-item';

                const reader = new FileReader();
                reader.onload = (e) => {
                    item.innerHTML = `
                        <div class="file-info">
                            <img src="${e.target.result}" alt="preview">
                            <span>${file.name}</span>
                        </div>
                        <span class="remove-file" data-index="${index}">&times;</span>
                    `;

                    item.querySelector('.remove-file').onclick = () => {
                        uploadedFiles.splice(index, 1);
                        updateUI();
                    };
                };
                reader.readAsDataURL(file);
                fileList.appendChild(item);
            });
        } else {
            fileListContainer.style.display = 'none';
            uploadPrompt.style.display = 'block';
            processBtn.disabled = true;
            clearAllBtn.style.display = 'none';
            fileList.innerHTML = '';
        }
    }

    clearAllBtn.onclick = () => {
        uploadedFiles = [];
        updateUI();
    };

    // Process Conversion
    processBtn.addEventListener('click', async () => {
        if (!uploadedFiles.length) return;

        processBtn.disabled = true;
        loadingOverlay.style.display = 'flex';

        const formData = new FormData();
        uploadedFiles.forEach(file => {
            formData.append('files', file);
        });
        formData.append('format', formatSelect.value);

        try {
            const response = await fetch('/bulk-convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('Conversion failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `hagrid_bulk_${formatSelect.value}_${Date.now()}.zip`;
            link.click();

            setTimeout(() => URL.revokeObjectURL(url), 100);

        } catch (error) {
            console.error(error);
            alert('Error converting images: ' + error.message);
        } finally {
            loadingOverlay.style.display = 'none';
            processBtn.disabled = false;
        }
    });
});
