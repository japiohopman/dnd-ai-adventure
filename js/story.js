// Story state
let currentStory = '';
let isGenerating = false;

// Update story display
function updateStory(text) {
    const storySoFarEl = document.getElementById('storySoFarEl');
    if (storySoFarEl) {
        storySoFarEl.value += text;
        storySoFarEl.scrollTop = storySoFarEl.scrollHeight;
    }
}

// Start the game with initial context
function startGame(initialContext = '') {
    currentStory = initialContext;
    const storySoFarEl = document.getElementById('storySoFarEl');
    if (storySoFarEl) {
        storySoFarEl.value = initialContext;
    }
    const storyGenerationAreaEl = document.getElementById('storyGenerationAreaEl');
    if (storyGenerationAreaEl) {
        storyGenerationAreaEl.hidden = false;
    }
    updateStory('Welcome to your D&D adventure! ' + initialContext);
}

// Generate story response based on player action
async function continueStory(action) {
    if (isGenerating) return;
    isGenerating = true;

    try {
        // Update UI to show we're generating
        updateStory(`\n> ${action}\n`);
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.textContent = '⌛ generating...';
        }

        // Generate response using AI and Perchance
        const prompt = `${currentStory}\n\nPlayer: ${action}\n\nNarrator:`;
        const response = await window.ai.generate(prompt);
        const enhancedResponse = await window.perchancePlugin.enhanceStoryText(response);

        // Update story with AI and Perchance response
        currentStory += `\n${action}\n${enhancedResponse}`;
        updateStory(enhancedResponse);

        // Reset UI
        const whatHappensNextEl = document.getElementById('whatHappensNextEl');
        if (whatHappensNextEl) {
            whatHappensNextEl.value = '';
        }
        if (generateBtn) {
            generateBtn.textContent = '▶️ continue';
        }
    } catch (error) {
        console.error('Error generating story:', error);
        updateStory('\nError generating response. Please try again.\n');
    } finally {
        isGenerating = false;
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
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.disabled = true;
        }
        const regenLastBtn = document.getElementById('regenLastBtn');
        if (regenLastBtn) {
            regenLastBtn.disabled = true;
        }
        const deleteLastBtn = document.getElementById('deleteLastBtn');
        if (deleteLastBtn) {
            deleteLastBtn.disabled = true;
        }
        if (generateBtn) {
            generateBtn.textContent = "⌛ loading...";
        }
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
            stopBtn.style.display = "block";
        }
        const storySoFarEl = document.getElementById('storySoFarEl');
        if (storySoFarEl && storySoFarEl.value.trim() && window.continueMode !== "inline") {
            storySoFarEl.value += "\n";
        }
        if (storySoFarEl) {
            storySoFarEl.scrollTop = 99999999;
        }
    },

    onChunk(data) {
        let textChunk = data.textChunk;
        
        // First chunk handling
        if(!window.gotFirstChunk) {
            const storySoFarEl = document.getElementById('storySoFarEl');
            if (storySoFarEl && storySoFarEl.value.trim() && window.continueMode !== "inline") {
                textChunk = "\n" + textChunk.replace(/^\s*\n+/g, "");
            }
            window.gotFirstChunk = true;
        }
        
        if(textChunk.length > 0) {
            const storySoFarEl = document.getElementById('storySoFarEl');
            if (storySoFarEl) {
                storySoFarEl.value += textChunk;
            }
        }
        
        // Clean up any unwanted text
        const storySoFarEl = document.getElementById('storySoFarEl');
        if (storySoFarEl && storySoFarEl.value.endsWith("\n# Player")) {
            storySoFarEl.value = storySoFarEl.value.replace(/\n# Player$/g, "");
        }
        
        if (storySoFarEl) {
            storySoFarEl.scrollTop = 99999999;
        }
    },

    onFinish(data) {
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.disabled = false;
        }
        const regenLastBtn = document.getElementById('regenLastBtn');
        if (regenLastBtn) {
            regenLastBtn.disabled = false;
        }
        const deleteLastBtn = document.getElementById('deleteLastBtn');
        if (deleteLastBtn) {
            deleteLastBtn.disabled = false;
        }
        if (generateBtn) {
            generateBtn.textContent = "▶️ continue";
        }
        const stopBtn = document.getElementById('stopBtn');
        if (stopBtn) {
            stopBtn.style.display = "none";
        }
        
        if(window.withheldTrailingNewlines) {
            const storySoFarEl = document.getElementById('storySoFarEl');
            if (storySoFarEl) {
                storySoFarEl.value += window.withheldTrailingNewlines;
            }
            window.withheldTrailingNewlines = "";
        }
        
        // Save story
        const storySoFarEl = document.getElementById('storySoFarEl');
        if (storySoFarEl) {
            localStorage.storySoFar = storySoFarEl.value;
        }
        
        // Enable rating buttons
        if(typeof window.enableRatingButtons === 'function') {
            window.enableRatingButtons();
        }
    }
};

// Continue the story based on user input
async function continueStory(opts = {}) {
    const whatHappensNextEl = document.getElementById('whatHappensNextEl');
    const deleteWhatHappensNextBtn = document.getElementById('deleteWhatHappensNextBtn');
    const storySoFarEl = document.getElementById('storySoFarEl');
    
    // Only proceed if we have the input element
    if (!whatHappensNextEl) {
        console.error('Could not find whatHappensNextEl element');
        return;
    }

    const userInput = whatHappensNextEl.value?.trim() || '';
    
    // Clear the input and hide the delete button
    whatHappensNextEl.value = '';
    if (deleteWhatHappensNextBtn) {
        deleteWhatHappensNextBtn.style.display = 'none';
    }

    // Don't continue if there's no input
    if (!userInput) {
        return;
    }

    // Get current story text
    const storyText = storySoFarEl?.value?.trim() || '';

    // Generate the story continuation
    try {
        await generateStoryContinuation({
            storyText,
            userInput
        });
    } catch (error) {
        console.error('Error continuing story:', error);
    }
}

// Disable UI elements during story generation
function disableUIForGeneration() {
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
        generateBtn.disabled = true;
    }
    const regenLastBtn = document.getElementById('regenLastBtn');
    if (regenLastBtn) {
        regenLastBtn.disabled = true;
    }
    const deleteLastBtn = document.getElementById('deleteLastBtn');
    if (deleteLastBtn) {
        deleteLastBtn.disabled = true;
    }
    const whatHappensNextEl = document.getElementById('whatHappensNextEl');
    if (whatHappensNextEl) {
        whatHappensNextEl.disabled = true;
    }
}

// Format story text for AI processing
function formatStoryText() {
    const storySoFarEl = document.getElementById('storySoFarEl');
    if (storySoFarEl) {
        return storySoFarEl.value.trim()
            .replace(/\n{3,}/g, "\n\n")
            .replace(/\s+$/, "");
    }
    return '';
}

// Generate story continuation using AI
async function generateStoryContinuation(opts) {
    const {storyText, whatHappensNext, userInput} = opts;
    
    // Prepare prompt
    let prompt = "";
    if(storyText) {
        prompt += storyText + "\n\n";
    }
    if(userInput) {
        prompt += "> " + userInput + "\n\n";
    }
    
    // Generate with AI
    try {
        await generateWithAI(prompt, opts);
        const whatHappensNextEl = document.getElementById('whatHappensNextEl');
        if (whatHappensNextEl) {
            whatHappensNextEl.value = "";
        }
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
