// Initialize AI configuration
window.ai = new PerchanceAI({
    temperature: 0.7,
    maxTokens: 1000
});

// Text editor styling rules
const textStyleRules = [
    {
        pattern: /\*([^*\n]+)\*/g,
        class: 'text-style-rule-asterisk'
    },
    {
        pattern: /> ([^\n]+)/g,
        class: 'text-style-rule-block-quote'
    },
    {
        pattern: /"([^"\n]+)"/g,
        class: 'text-style-rule-quote'
    }
];

// Update text style colors based on color scheme
function updateTextStyleRuleColors() {
    const darkMode = document.documentElement.style.colorScheme !== "light";
    document.querySelector(':root').style.setProperty('--text-style-rule-asterisk-color', darkMode ? "#919191" : "#585858");
    document.querySelector(':root').style.setProperty('--text-style-rule-block-quote-color', darkMode ? "#ffc86e" : "#7c3e00");
    document.querySelector(':root').style.setProperty('--text-style-rule-quote-color', darkMode ? "#4eb5f7" : "#00539b");
}

// Initialize color scheme listeners
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTextStyleRuleColors);
window.onForcedColorSchemeChangeHandlers = new Set();
window.onForcedColorSchemeChangeHandlers.add(updateTextStyleRuleColors);

// Initial color update
updateTextStyleRuleColors();
