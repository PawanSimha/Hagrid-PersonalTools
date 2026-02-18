document.addEventListener('DOMContentLoaded', () => {
    const jsonInput = document.getElementById('jsonInput');
    const formatBtn = document.getElementById('formatBtn');
    const minifyBtn = document.getElementById('minifyBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const statusBar = document.getElementById('statusBar');

    function updateStatus(message, isError = false) {
        statusBar.className = isError ? 'status-bar status-error' : 'status-bar status-success';
        statusBar.innerText = message;

        if (!isError) {
            setTimeout(() => {
                statusBar.style.display = 'none';
            }, 3000);
        } else {
            statusBar.style.display = 'block';
        }
    }

    function formatJSON() {
        const raw = jsonInput.value;
        if (!raw.trim()) return;

        try {
            const obj = JSON.parse(raw);
            jsonInput.value = JSON.stringify(obj, null, 4);
            updateStatus('✅ Valid JSON Formatted');
        } catch (e) {
            updateStatus(`❌ Invalid JSON: ${e.message}`, true);
        }
    }

    function minifyJSON() {
        const raw = jsonInput.value;
        if (!raw.trim()) return;

        try {
            const obj = JSON.parse(raw);
            jsonInput.value = JSON.stringify(obj);
            updateStatus('✅ JSON Minified');
        } catch (e) {
            updateStatus(`❌ Invalid JSON: ${e.message}`, true);
        }
    }

    async function copyToClipboard() {
        if (!jsonInput.value.trim()) return;
        try {
            await navigator.clipboard.writeText(jsonInput.value);
            const originalText = copyBtn.innerText;
            copyBtn.innerText = 'Copied!';
            setTimeout(() => copyBtn.innerText = originalText, 2000);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    }

    // Event Listeners
    formatBtn.addEventListener('click', formatJSON);
    minifyBtn.addEventListener('click', minifyJSON);
    copyBtn.addEventListener('click', copyToClipboard);
    clearBtn.addEventListener('click', () => {
        jsonInput.value = '';
        statusBar.style.display = 'none';
        jsonInput.focus();
    });
});
