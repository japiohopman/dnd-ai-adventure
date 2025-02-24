// Story state
let currentStory = '';
let isGenerating = false;

// Start the game with initial context
function startGame(initialContext = '') {
    currentStory = initialContext;
    updateStory('Welcome to your D&D adventure! ' + initialContext);
}

// Generate story response based on player action
async function generateStoryResponse(action) {
    if (isGenerating) return;
    isGenerating = true;

    try {
        // Update UI to show we're generating
        updateStory(`\n> ${action}\n`);
        generateBtn.textContent = '⌛ generating...';

        // Generate response using AI and Perchance
        const prompt = `${currentStory}\n\nPlayer: ${action}\n\nNarrator:`;
        const enhancedResponse = await generateStoryResponse(prompt);

        // Update story with AI and Perchance response
        currentStory += `\n${action}\n${enhancedResponse}`;
        updateStory(enhancedResponse);

        // Reset UI
        clearInputs();
    } catch (error) {
        console.error('Error generating story:', error);
        updateStory('\nError generating response. Please try again.\n');
    } finally {
        isGenerating = false;
        generateBtn.textContent = '▶️ continue';
    }
}

async function generateStoryResponse(prompt) {
    try {
        // First get the AI-generated response
        const response = await window.ai.generate(prompt);
        
        // Then enhance it with Perchance-generated elements
        const enhancedResponse = await window.perchancePlugin.enhanceStoryText(response);
        
        return enhancedResponse;
    } catch (error) {
        console.error('Error generating story response:', error);
        return 'Error generating story. Please try again.';
    }
}

// Stop story generation
function stopGeneration() {
    if (window.ai && typeof window.ai.stop === 'function') {
        window.ai.stop();
    }
    isGenerating = false;
}

// Save game state
function saveGame() {
    const gameState = {
        story: currentStory,
        timestamp: new Date().toISOString()
    };
    localStorage.setItem('dndGameState', JSON.stringify(gameState));
}

// Load game state
function loadGame() {
    const savedState = localStorage.getItem('dndGameState');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        currentStory = gameState.story;
        updateStory(currentStory);
        return true;
    }
    return false;
}

// Story generation event handlers
const generationEventHandlers = {
    onStart(data) {
        window.gotFirstChunk = false;
        window.withheldTrailingNewlines = "";
        generateBtn.disabled = true;
        regenLastBtn.disabled = true;
        deleteLastBtn.disabled = true;
        generateBtn.textContent = "⌛ loading...";
        stopBtn.style.display = "block";
        if(storySoFarEl.value.trim() && window.continueMode !== "inline") {
            storySoFarEl.value += "\n";
        }
        storySoFarEl.scrollTop = 99999999;
    },

    onChunk(data) {
        let textChunk = data.textChunk;
        
        // First chunk handling
        if(!window.gotFirstChunk) {
            if(storySoFarEl.value.trim() && window.continueMode !== "inline") {
                textChunk = "\n" + textChunk.replace(/^\s*\n+/g, "");
            }
            window.gotFirstChunk = true;
        }
        
        if(textChunk.length > 0) {
            storySoFarEl.value += textChunk;
        }
        
        // Clean up any unwanted text
        if(storySoFarEl.value.endsWith("\n# Player")) {
            storySoFarEl.value = storySoFarEl.value.replace(/\n# Player$/g, "");
        }
        
        storySoFarEl.scrollTop = 99999999;
    },

    onFinish(data) {
        generateBtn.disabled = false;
        regenLastBtn.disabled = false;
        deleteLastBtn.disabled = false;
        generateBtn.textContent = "▶️ continue";
        stopBtn.style.display = "none";
        
        if(window.withheldTrailingNewlines) {
            storySoFarEl.value += window.withheldTrailingNewlines;
            window.withheldTrailingNewlines = "";
        }
        
        // Save story
        localStorage.storySoFar = storySoFarEl.value;
        
        // Enable rating buttons
        if(typeof window.enableRatingButtons === 'function') {
            window.enableRatingButtons();
        }
    }
};

// Continue the story based on user input
async function continueStory(opts = {}) {
    const storyText = storySoFarEl.value.trim();
    const whatHappensNext = whatHappensNextEl.value.trim();
    
    if(!storyText && !whatHappensNext) {
        alert("Please enter some text to begin the story.");
        return;
    }
    
    try {
        await generateStoryContinuation({
            storyText,
            whatHappensNext,
            ...opts
        });
    } catch(error) {
        console.error('Error continuing story:', error);
        alert('An error occurred while generating the story. Please try again.');
    }
}

// Disable UI elements during story generation
function disableUIForGeneration() {
    generateBtn.disabled = true;
    regenLastBtn.disabled = true;
    deleteLastBtn.disabled = true;
    whatHappensNextEl.disabled = true;
}

// Format story text for AI processing
function formatStoryText() {
    return storySoFarEl.value.trim()
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\s+$/, "");
}

// Generate story continuation using AI
async function generateStoryContinuation(opts) {
    const {storyText, whatHappensNext} = opts;
    
    // Prepare prompt
    let prompt = "";
    if(storyText) {
        prompt += storyText + "\n\n";
    }
    if(whatHappensNext) {
        prompt += "> " + whatHappensNext + "\n\n";
    }
    
    // Generate with AI
    try {
        await generateWithAI(prompt, opts);
        whatHappensNextEl.value = "";
    } catch(error) {
        console.error('Error in story continuation:', error);
        throw error;
    }
}

// Generate text using AI
async function generateWithAI(storyText, opts = {}) {
    // Call AI generate
    const response = await window.ai.generate(storyText, {
        temperature: 0.7,
        maxTokens: 1000,
        ...opts
    });
    
    // Handle generation events
    generationEventHandlers.onStart({});
    generationEventHandlers.onChunk({textChunk: response.text});
    generationEventHandlers.onFinish({});
    
    return response;
}
