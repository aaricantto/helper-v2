document.addEventListener('DOMContentLoaded', (event) => {
    const toggleThemeBtn = document.getElementById('toggle-theme-btn');

    // Listener for the Dark/Light toggle button
    toggleThemeBtn.addEventListener('click', () => {
        const theme = document.documentElement.getAttribute('data-theme');
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);

        // Update global color variables
        updateColorVariables(newTheme);

        // Update the graph with new colors
        updateGraph();
    });
    const copyBtn = document.getElementById('copy-to-clipboard-btn');
    copyBtn.addEventListener('click', copyContentToClipboard);
});

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
        // Use the combinedContent from the response
        navigator.clipboard.writeText(data.combinedContent).then(() => {
            console.log('Content copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy content to clipboard', err);
        });
    })
    .catch(error => console.error('Error:', error));
}
