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
});
