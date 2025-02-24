// Perchance Plugin for D&D AI Adventure
class PerchancePlugin {
    constructor() {
        // Initialize with local DndLists instead of remote API
        this.dndLists = window.DndLists;
    }

    async generate(type = 'main') {
        try {
            switch (type) {
                case 'character':
                    return this.dndLists.generateCharacter();
                case 'encounter':
                    return this.dndLists.generateEncounter();
                case 'loot':
                    return this.dndLists.generateLoot();
                case 'location':
                    return this.dndLists.generateLocation();
                default:
                    // For main type, generate a random content type
                    const types = ['character', 'encounter', 'loot', 'location'];
                    const randomType = types[Math.floor(Math.random() * types.length)];
                    return this.generate(randomType);
            }
        } catch (error) {
            console.error(`Error generating content (${type}):`, error);
            return this.getFallbackContent(type);
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
            text = text.replace(/\[CHARACTER\]/g, await this.generateCharacter());
            text = text.replace(/\[ENCOUNTER\]/g, await this.generateEncounter());
            text = text.replace(/\[LOOT\]/g, await this.generateLoot());
            text = text.replace(/\[LOCATION\]/g, await this.generateLocation());
            
            // Add context-specific enhancements
            if (context.isNewLocation) {
                const location = await this.generateLocation();
                if (location) {
                    text = `You find yourself in ${this.addArticle(location)}.\n\n${text}`;
                }
            }
            
            if (context.isEncounter) {
                const encounter = await this.generateEncounter();
                if (encounter) {
                    text = `${text}\n\nYou encounter ${this.addArticle(encounter)}!`;
                }
            }

            if (context.isLoot) {
                const loot = await this.generateLoot();
                if (loot) {
                    text = `${text}\n\nYou find ${this.addArticle(loot)}.`;
                }
            }

            return text;
        } catch (error) {
            console.error('Error enhancing story text:', error);
            return text;
        }
    }

    // Helper to add appropriate article (a/an)
    addArticle(text) {
        if (!text) return text;
        return (/^[aeiou]/i.test(text) ? 'an ' : 'a ') + text;
    }

    // Fallback content if something goes wrong
    getFallbackContent(type) {
        const fallbacks = {
            character: "mysterious adventurer",
            encounter: "strange creature",
            loot: "curious item",
            location: "mysterious place",
            main: "mysterious occurrence"
        };
        return fallbacks[type] || fallbacks.main;
    }
}

// Initialize and export the plugin
window.perchancePlugin = new PerchancePlugin();
