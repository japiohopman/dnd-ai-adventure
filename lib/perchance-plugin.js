// Perchance Plugin for D&D AI Adventure
class PerchancePlugin {
    constructor() {
        this.baseUrl = 'https://perchance.org/api/';
        this.generators = {
            main: 'dnd-ai',
            character: 'dnd-character-generator',
            encounter: 'dnd-encounter-generator',
            loot: 'dnd-loot-generator',
            location: 'dnd-location-generator'
        };
    }

    async generate(type = 'main') {
        try {
            const generator = this.generators[type] || this.generators.main;
            const response = await fetch(`${this.baseUrl}${generator}/get`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.output;
        } catch (error) {
            console.error(`Error generating from Perchance (${type}):`, error);
            return null;
        }
    }

    // Generate a character description
    async generateCharacter() {
        return this.generate('character');
    }

    // Generate an encounter
    async generateEncounter() {
        return this.generate('encounter');
    }

    // Generate loot
    async generateLoot() {
        return this.generate('loot');
    }

    // Generate a location description
    async generateLocation() {
        return this.generate('location');
    }

    // Helper method to enhance story text with random elements
    async enhanceStoryText(text, context = {}) {
        try {
            // Replace placeholders with generated content
            text = text.replace(/\[CHARACTER\]/g, await this.generateCharacter() || '[Character generation failed]');
            text = text.replace(/\[ENCOUNTER\]/g, await this.generateEncounter() || '[Encounter generation failed]');
            text = text.replace(/\[LOOT\]/g, await this.generateLoot() || '[Loot generation failed]');
            text = text.replace(/\[LOCATION\]/g, await this.generateLocation() || '[Location generation failed]');
            
            // Add context-specific enhancements
            if (context.isNewLocation) {
                const location = await this.generateLocation();
                if (location) {
                    text = `${location}\n\n${text}`;
                }
            }
            
            if (context.isEncounter) {
                const encounter = await this.generateEncounter();
                if (encounter) {
                    text = `${text}\n\nYou encounter: ${encounter}`;
                }
            }

            if (context.isLoot) {
                const loot = await this.generateLoot();
                if (loot) {
                    text = `${text}\n\nYou find: ${loot}`;
                }
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
