// Perchance Plugin for D&D AI Adventure
class PerchancePlugin {
    constructor() {
        this.baseUrl = 'https://perchance.org/api/';
        this.generator = 'dnd-ai';
    }

    async generate() {
        try {
            const response = await fetch(`${this.baseUrl}${this.generator}/get`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.output;
        } catch (error) {
            console.error('Error generating from Perchance:', error);
            return null;
        }
    }

    // Helper method to enhance story text with random elements
    async enhanceStoryText(text) {
        try {
            // Get a fresh generation for each enhancement
            const generated = await this.generate();
            if (generated) {
                // Replace any placeholders in the text with the generated content
                text = text.replace(/\[PERCHANCE\]/g, generated);
            }
            return text;
        } catch (error) {
            console.error('Error enhancing story text:', error);
            return text;
        }
    }
}

// Initialize and export the plugin
window.perchancePlugin = new PerchancePlugin();
