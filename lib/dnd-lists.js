// D&D Content Lists
const DndLists = {
    // Character lists
    race: [
        "Human",
        "Elf",
        "Dwarf", 
        "Halfling",
        "Gnome",
        "Half-Elf",
        "Half-Orc",
        "Tiefling",
        "Dragonborn"
    ],

    class: [
        "Fighter",
        "Wizard",
        "Cleric",
        "Rogue",
        "Ranger",
        "Paladin",
        "Barbarian",
        "Bard",
        "Druid",
        "Monk",
        "Sorcerer",
        "Warlock"
    ],

    // Location lists
    location: {
        dungeon: [
            "ancient crypt",
            "forgotten temple",
            "abandoned mine",
            "monster lair",
            "cursed ruins",
            "magical laboratory",
            "hidden vault"
        ],
        wilderness: [
            "dark forest",
            "misty mountains",
            "scorching desert",
            "frozen tundra",
            "treacherous swamp",
            "coastal cliffs",
            "underground caverns"
        ],
        settlement: [
            "bustling city",
            "quiet village",
            "fortified castle",
            "trading outpost",
            "mystical tower",
            "port town",
            "mountain stronghold"
        ]
    },

    // Encounter lists
    encounter: {
        combat: [
            "band of goblins",
            "fierce owlbear",
            "ancient dragon",
            "undead horde",
            "giant spider",
            "orc warband",
            "elemental creature"
        ],
        social: [
            "mysterious merchant",
            "wandering bard",
            "local noble",
            "cryptic sage",
            "friendly innkeeper",
            "suspicious guard",
            "traveling priest"
        ],
        exploration: [
            "hidden treasure",
            "magical portal",
            "ancient inscription",
            "trapped corridor",
            "secret passage",
            "magical fountain",
            "mysterious altar"
        ]
    },

    // Loot lists
    loot: {
        weapons: [
            "enchanted sword",
            "magical bow",
            "ancient warhammer",
            "cursed dagger",
            "legendary spear",
            "mystical staff",
            "holy mace"
        ],
        armor: [
            "plate armor",
            "elven chainmail",
            "dwarven shield",
            "magical robes",
            "dragon scale armor",
            "blessed helmet",
            "protective cloak"
        ],
        treasure: [
            "precious gems",
            "ancient coins",
            "magical scroll",
            "rare artifact",
            "valuable jewelry",
            "mystical orb",
            "enchanted ring"
        ]
    },

    // Helper function to get random item from a list
    getRandomFrom(list) {
        if (Array.isArray(list)) {
            return list[Math.floor(Math.random() * list.length)];
        }
        // If it's an object with sublists, first pick a random sublist
        const keys = Object.keys(list);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        return this.getRandomFrom(list[randomKey]);
    },

    // Helper function to get random item from a specific sublist
    getRandomFromSublist(list, sublist) {
        if (list[sublist] && Array.isArray(list[sublist])) {
            return list[sublist][Math.floor(Math.random() * list[sublist].length)];
        }
        return null;
    },

    // Generate a character description
    generateCharacter() {
        const race = this.getRandomFrom(this.race);
        const charClass = this.getRandomFrom(this.class);
        return `${race} ${charClass}`;
    },

    // Generate a location description
    generateLocation(type = null) {
        if (type && this.location[type]) {
            return this.getRandomFromSublist(this.location, type);
        }
        return this.getRandomFrom(this.location);
    },

    // Generate an encounter
    generateEncounter(type = null) {
        if (type && this.encounter[type]) {
            return this.getRandomFromSublist(this.encounter, type);
        }
        return this.getRandomFrom(this.encounter);
    },

    // Generate loot
    generateLoot(type = null) {
        if (type && this.loot[type]) {
            return this.getRandomFromSublist(this.loot, type);
        }
        return this.getRandomFrom(this.loot);
    }
};

// Export the lists
window.DndLists = DndLists;
