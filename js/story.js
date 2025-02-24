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
