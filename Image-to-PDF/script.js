/* Author: Pawan Simha R */
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('fileInput');
    const dropZone = document.getElementById('dropZone');
    const processBtn = document.getElementById('processBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const fileList = document.getElementById('fileList');
    const fileListContainer = document.getElementById('fileListContainer');
    const uploadPrompt = document.getElementById('uploadPrompt');
    const fileCount = document.getElementById('fileCount');
    const fileStats = document.getElementById('fileStats');
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
            fileStats.style.display = 'block';
            fileCount.textContent = uploadedFiles.length;

            fileList.innerHTML = '';
            uploadedFiles.forEach((file, index) => {
                const item = document.createElement('div');
                item.className = 'file-item';

                const reader = new FileReader();
                reader.onload = (e) => {
                    item.innerHTML = `
                        <div class="file-info">
                            <img src="${e.target.result}" alt="preview">
                            <span>${file.name} (${(file.size / 1024).toFixed(1)} KB)</span>
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
            fileStats.style.display = 'none';
            fileList.innerHTML = '';
        }
    }

    clearAllBtn.onclick = () => {
        uploadedFiles = [];
        updateUI();
    };

    // Process PDF
    processBtn.addEventListener('click', async () => {
        if (!uploadedFiles.length) return;

        processBtn.disabled = true;
        loadingOverlay.style.display = 'flex';

        const formData = new FormData();
        uploadedFiles.forEach(file => {
            formData.append('files', file);
        });

        try {
            const response = await fetch('/api/doc/image-to-pdf', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error('PDF generation failed');

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `hagrid_converted_${Date.now()}.pdf`;
            link.click();

            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 100);

        } catch (error) {
            console.error(error);
            alert('Error creating PDF: ' + error.message);
        } finally {
            loadingOverlay.style.display = 'none';
            processBtn.disabled = false;
        }
    });
});
