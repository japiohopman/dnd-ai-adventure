// Info tracking state management
let manualCurrentTrackedInfoEditsSinceLastCheckpoint = 0;

// Initialize info tracking display
function updateInfoTrackingDisplay() {
    infoTrackingCtn.style.display = infoTrackingBtn.dataset.enabled ? 'block' : 'none';
    infoTrackingBtn.textContent = infoTrackingBtn.dataset.enabled ? '🚫 disable info tracker' : '📊 enable info tracker';
}

// Handle manual edits to tracked info
async function currentTrackedInfoManualEditHandler() {
    localStorage.currentTrackedInfo = currentTrackedInfoEl.value;
    window.manualCurrentTrackedInfoEditsSinceLastCheckpoint++;
    if(window.manualCurrentTrackedInfoEditsSinceLastCheckpoint > 10) {
        updateTrackedInfoUndoBtn.hidden = true;
    }
    updateTrackedInfoBtn.textContent = currentTrackedInfoEl.value.trim().length === 0 ? "✨ generate template" : "✨ auto update info";
}

// Generate initial tracked info template
async function generateInitialTrackedInfo() {
    const instruction = prompt("(Optional) Provide an instruction for the template you'd like to generate, 𝗼𝗿 𝗷𝘂𝘀𝘁 𝗰𝗹𝗶𝗰𝗸 𝗢𝗞.");
    if(instruction === null) return; // User clicked cancel

    // Update UI state
    const originalPlaceholder = currentTrackedInfoEl.placeholder;
    currentTrackedInfoEl.placeholder = "⌛ Loading... Just a sec.";
    updateTrackedInfoBtn.disabled = true;
    updateTrackedInfoStopBtn.hidden = false;
    currentTrackedInfoEl.value = "";

    // Generate template using AI
    const prePrefix = `<tracked_info>\n`;
    window.processedStorySoFarText = getPreprocessedStoryText();
    
    const promise = ai({
        instruction: `
        ${sharedInstructionPrefix.evaluateItem}
        TASK: Your task is to generate a simple plaintext RPG info tracking sheet with some starting values${storySoFarEl.value.trim() ? " Based on what has happened so far" : ""} for tracking an RPG game's world/character state. Base your response on this instruction: ${instruction || "Simple tracker for player's level, hitpoints, mana, xp, inventory, location, etc."}
        </instructions>
        
        BASIC EXAMPLE (you can change/add/remove things from this as necessary - this is just an example):
        <tracked_info>
        # Player:
        Level: 1
        Hitpoints: 100/100
        Mana: 10/10
        XP: 0/300
        Gold: 2
        Location: Adventurer's Guild, Arandale (Eastern Province of Daeanchen)
        Quest: None
        Inventory:
        - handkerchief
        - rusty dagger
        </tracked_info>
        `.trim(),
        startWith: `${prePrefix}# Player:`,
        stopSequences: ["</track"],
        onChunk: (data) => {
            currentTrackedInfoEl.value += data.textChunk;
            currentTrackedInfoEl.value = currentTrackedInfoEl.value.replace(prePrefix, "");
        },
    });

    // Setup stop button
    updateTrackedInfoStopBtn.onclick = () => promise.stop();

    // Wait for generation to complete
    await promise;

    // Clean up and save
    currentTrackedInfoEl.value = currentTrackedInfoEl.value.replace(/<\/track$/, "").trim();
    localStorage.currentTrackedInfo = currentTrackedInfoEl.value;

    // Reset UI state
    currentTrackedInfoEl.placeholder = originalPlaceholder;
    updateTrackedInfoBtn.disabled = false;
    updateTrackedInfoStopBtn.hidden = true;

    // Update story text with placeholder
    storySoFarEl.value = storySoFarEl.value.trim().replace(/\n+<tracked_info_placeholder>\n*/g, "\n\n").trim() + "\n\n<tracked_info_placeholder>";
    localStorage.storySoFar = storySoFarEl.value;
    
    updateTrackedInfoBtn.textContent = "✨ auto update info";
}

// Update existing tracked info
async function updateTrackedInfo() {
    if(!infoTrackingBtn.dataset.enabled) {
        throw new Error("It shouldn't be possible to update tracked info if it's disabled.");
    }

    // Confirm with user about potential inaccuracies
    if(localStorage.knowsTrackedInfoAutoUpdateIsInaccurate !== "1") {
        if(!confirm(`Note: The AI often makes mistakes when trying to auto-update the tracked info. I'll improve this eventually, but for now you may want to manually update this info to ensure accuracy.`)) return;
        localStorage.knowsTrackedInfoAutoUpdateIsInaccurate = "1";
    }

    // Clean up multiple placeholders
    cleanupTrackedInfoPlaceholders();

    // Update UI state
    const originalPlaceholder = currentTrackedInfoEl.placeholder;
    currentTrackedInfoEl.placeholder = "⌛ Loading... Just a sec.";
    updateTrackedInfoBtn.disabled = true;
    updateTrackedInfoStopBtn.hidden = false;

    try {
        // Prepare for update
        const originalTrackedInfoText = currentTrackedInfoEl.value;
        const prePrefix = `<tracked_info:updated>\n`;
        let originalTextPrefix = originalTrackedInfoText.split(/[:=]/)[0];
        if(originalTextPrefix.includes("\n") || originalTextPrefix.length > 50) originalTextPrefix = "";

        // Get processed story text
        window.processedStorySoFarText = getPreprocessedStoryText();
        let subsequentEventsText = window.processedStorySoFarText.split("</tracked_info>")[1].trim();
        subsequentEventsText = subsequentEventsText.replace(/ \(previous events\)/g, "");

        // Clear current tracked info (after getting processed text)
        currentTrackedInfoEl.value = "";

        // Generate updated info using AI
        const promise = ai({
            instruction: `
            Below are some events that have happened since the tracked_info was last updated. Your task is to:
            1. Write a concise paragraph-by-paragraph dot-point summary of the events_since_last_tracked_info_update with a focus on events that could affect the tracked_info properties.
                - IMPORTANT: Within dot-point your summary, whenever you notice a tracked_info change, explicitly write the change in parentheses e.g. "(X changes from Y to Z)"
            2. Use the dot-point summary that you wrote to update the tracked_info data.
            
            Original tracked info:
            ${originalTrackedInfoText}
            
            Events since last update:
            ${subsequentEventsText}
            `,
            startWith: `${prePrefix}${originalTextPrefix}`,
            stopSequences: ["</track"],
            onChunk: (data) => {
                currentTrackedInfoEl.value += data.textChunk;
                currentTrackedInfoEl.value = currentTrackedInfoEl.value.replace(prePrefix, "");
            },
        });

        // Setup stop button
        updateTrackedInfoStopBtn.onclick = () => promise.stop();

        // Wait for generation to complete
        await promise;

        // Clean up and save
        currentTrackedInfoEl.value = currentTrackedInfoEl.value.replace(/<\/track$/, "").trim();
        localStorage.currentTrackedInfo = currentTrackedInfoEl.value;

    } catch(error) {
        console.error("Error updating tracked info:", error);
    } finally {
        // Reset UI state
        currentTrackedInfoEl.placeholder = originalPlaceholder;
        updateTrackedInfoBtn.disabled = false;
        updateTrackedInfoStopBtn.hidden = true;
    }
}

// Helper function to clean up multiple tracked info placeholders
function cleanupTrackedInfoPlaceholders() {
    let numMarkers = storySoFarEl.value.split(/\n+<tracked_info_placeholder>\n+/).length - 1;
    
    if(numMarkers > 1) {
        let i = -1;
        storySoFarEl.value = storySoFarEl.value.replace(/\n+<tracked_info_placeholder>\n+/, function(m) {
            i++;
            return i === numMarkers-1 ? m : "\n\n";
        });
    }
    
    if(numMarkers === 0) {
        storySoFarEl.value = storySoFarEl.value.trim().replace(/\n+<tracked_info_placeholder>\n*/g, "\n\n").trim() + "\n\n<tracked_info_placeholder>";
    }
}

// Helper function to observe element visibility
function onVisibleOnce(element, callback) {
    new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if(entry.intersectionRatio > 0) {
                callback(element);
                observer.disconnect();
            }
        });
    }).observe(element);
}
