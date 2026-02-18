/*
    Hagrid — Global Functionality
    Author: Pawan Simha
*/

// Theme Toggle Logic
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'light';

if (currentTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        if (theme === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
    });
}

// Search / Filter Logic (Homepage only)
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    const toolCards = document.querySelectorAll('.tool-card');
    const toolsSection = document.getElementById('tools');

    // Create a "no results" message
    const noResults = document.createElement('div');
    noResults.className = 'no-results';
    noResults.textContent = 'No tools found. Try a different search.';
    if (toolsSection) {
        toolsSection.querySelector('.tools-grid').appendChild(noResults);
    }

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        let visibleCount = 0;

        toolCards.forEach(card => {
            const toolName = (card.getAttribute('data-tool') || '').toLowerCase();
            const toolText = card.textContent.toLowerCase();
            const match = !query || toolName.includes(query) || toolText.includes(query);

            card.style.display = match ? '' : 'none';
            if (match) visibleCount++;
        });

        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    });

    // Auto-focus the search bar on the homepage
    searchInput.focus();
}

// Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl + S: Download (Prevent default if on a tool page)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            e.preventDefault();
            downloadBtn.click();
        }
    }

    // Ctrl + O: Upload (Focus image input if it exists)
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        const imageInput = document.getElementById('imageInput');
        if (imageInput) {
            e.preventDefault();
            imageInput.click();
        }
    }

    // R: Reset (If on a tool page)
    if (e.key.toLowerCase() === 'r' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        // Find all range inputs and reset them to default
        const rangeInputs = document.querySelectorAll('input[type="range"]');
        if (rangeInputs.length > 0) {
            rangeInputs.forEach(input => {
                input.value = input.getAttribute('value');
                // Trigger input event to update canvas
                input.dispatchEvent(new Event('input'));
            });
        }
    }

    // "/" key: Focus search bar (homepage shortcut, like Google)
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        const searchBar = document.getElementById('searchInput');
        if (searchBar) {
            e.preventDefault();
            searchBar.focus();
        }
    }
});
