// Perchance Plugin for D&D AI Adventure
class PerchancePlugin {
    constructor() {
        this.baseUrl = 'https://perchance.org/api/';
        this.generators = {
            fantasy_names: 'fantasy-name-generator',
            items: 'rpg-item-generator',
            locations: 'fantasy-location-generator',
            quests: 'quest-generator'
        };
    }

    async generate(type) {
        if (!this.generators[type]) {
            throw new Error(`Unknown generator type: ${type}`);
        }

        try {
            const response = await fetch(`${this.baseUrl}${this.generators[type]}/get`);
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

    async generateName() {
        return this.generate('fantasy_names');
    }

    async generateItem() {
        return this.generate('items');
    }

    async generateLocation() {
        return this.generate('locations');
    }

    async generateQuest() {
        return this.generate('quests');
    }

    // Helper method to enhance story text with random elements
    async enhanceStoryText(text) {
        // Replace placeholders with generated content
        text = text.replace(/\[NAME\]/g, await this.generateName());
        text = text.replace(/\[ITEM\]/g, await this.generateItem());
        text = text.replace(/\[LOCATION\]/g, await this.generateLocation());
        text = text.replace(/\[QUEST\]/g, await this.generateQuest());
        return text;
    }
}

// Initialize and export the plugin
window.perchancePlugin = new PerchancePlugin();
