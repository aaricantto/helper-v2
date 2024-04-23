document.addEventListener('DOMContentLoaded', (event) => {
    const toggleThemeBtn = document.getElementById('toggle-theme-btn');
    
    // Set the initial theme to 'dark' on load
    dark_light('dark');

    // Listener for the Dark/Light toggle button
    toggleThemeBtn.addEventListener('click', () => dark_light());
    
    const copyBtn = document.getElementById('copy-to-clipboard-btn');
    copyBtn.addEventListener('click', copyContentToClipboard);
});

function dark_light(forcedTheme) {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = forcedTheme || (currentTheme === 'dark' ? 'light' : 'dark');
    document.documentElement.setAttribute('data-theme', newTheme);
    updateColorVariables(newTheme);
    updateGraph();
}

function copyContentToClipboard() {
    const selectedFilePaths = Array.from(selectedFiles);

    fetch('/api/copy_files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paths: selectedFilePaths }),
    })
    .then(response => response.json())
    .then(data => {
        navigator.clipboard.writeText(data.combinedContent).then(() => {
            console.log('Content copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy content to clipboard', err);
        });
    })
    .catch(error => console.error('Error:', error));
}
