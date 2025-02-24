// Simple text editor plugin
function createTextEditor(config = {}) {
    const editor = document.createElement('textarea');
    editor.className = 'text-editor';
    
    // Add helper methods
    editor.appendText = function(text) {
        this.value += text;
    };

    // Apply styling rules if provided
    if (config.textStyleRules) {
        editor.addEventListener('input', () => {
            let text = editor.value;
            config.textStyleRules.forEach(rule => {
                text = text.replace(rule.match, (match) => match); // Keep the text as is, styling will be handled by CSS
            });
            editor.value = text;
        });
    }
    
    return editor;
}
