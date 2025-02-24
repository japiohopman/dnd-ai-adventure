// Initialize settings on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeSettings();
    loadSavedSettings();
});

function initializeSettings() {
    // Initialize writing style settings
    initializeWritingStyleSettings();
    
    // Initialize difficulty mode settings
    initializeDifficultySettings();
    
    // Initialize color scheme settings
    initializeColorSchemeSettings();
}

function loadSavedSettings() {
    // Load writing style
    if(localStorage.responseStyle) {
        responseStyleEl.value = localStorage.responseStyle;
        customResponseStyleCtn.hidden = (responseStyleEl.value !== '@@@custom');
    }
    if(localStorage.responseStyleCustomInput) {
        responseStyleCustomInputEl.value = localStorage.responseStyleCustomInput;
    }
    if(localStorage.storyWritingStyleCustomInput) {
        storyWritingStyleCustomInputEl.value = localStorage.storyWritingStyleCustomInput;
    }

    // Load difficulty mode
    if(localStorage.difficultyMode) {
        difficultyModeEl.value = localStorage.difficultyMode;
    }

    // Load info tracking state
    if(localStorage.infoTrackingEnabled) {
        infoTrackingBtn.dataset.enabled = localStorage.infoTrackingEnabled;
        updateInfoTrackingDisplay();
    }
    if(localStorage.currentTrackedInfo) {
        currentTrackedInfoEl.value = localStorage.currentTrackedInfo;
    }
}

function initializeWritingStyleSettings() {
    // Writing style change handler
    responseStyleEl.addEventListener('change', () => {
        localStorage.responseStyle = responseStyleEl.value;
        customResponseStyleCtn.hidden = (responseStyleEl.value !== '@@@custom');
    });

    // Custom writing style input handlers
    responseStyleCustomInputEl.addEventListener('input', () => {
        localStorage.responseStyleCustomInput = responseStyleCustomInputEl.value;
    });

    storyWritingStyleCustomInputEl.addEventListener('input', () => {
        localStorage.storyWritingStyleCustomInput = storyWritingStyleCustomInputEl.value;
    });
}

function initializeDifficultySettings() {
    difficultyModeEl.addEventListener('change', () => {
        localStorage.difficultyMode = difficultyModeEl.value;
    });
}

function initializeColorSchemeSettings() {
    // Update text style colors based on color scheme
    function updateTextStyleRuleColors() {
        const darkMode = document.documentElement.style.colorScheme !== "light";
        document.querySelector(':root').style.setProperty('--text-style-rule-asterisk-color', darkMode ? "#919191" : "#585858");
        document.querySelector(':root').style.setProperty('--text-style-rule-block-quote-color', darkMode ? "#ffc86e" : "#7c3e00");
        document.querySelector(':root').style.setProperty('--text-style-rule-quote-color', darkMode ? "#4eb5f7" : "#00539b");
    }

    // Listen for system color scheme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateTextStyleRuleColors);
    window.onForcedColorSchemeChangeHandlers.add(updateTextStyleRuleColors);

    // Initialize color scheme
    updateTextStyleRuleColors();
}

// Rating system
function resetRatingButtons() {
    rateLastMessageBadBtn.disabled = true;
    rateLastMessageGoodBtn.disabled = true;
    rateLastMessageBadBtn.style.opacity = 1;
    rateLastMessageGoodBtn.style.opacity = 1;
}

function enableRatingButtons() {
    rateLastMessageBadBtn.disabled = false;
    rateLastMessageGoodBtn.disabled = false;
}

async function rateLastMessage(rating) {
    if(!window.lastGenerationStreamObj) return;

    // Check if user understands ratings
    if(!localStorage.knowsHowRatingsWork) {
        if(!confirm("Your ratings help improve Perchance's AI plugin, which powers this generator. Please do not submit ratings if your story includes sensitive personal info.\n\nContinue?")) return;
        localStorage.knowsHowRatingsWork = "1";
    }

    // Update UI
    const score = rating === "good" ? 1 : 0;
    rateLastMessageBadBtn.disabled = true;
    rateLastMessageGoodBtn.disabled = true;
    
    if(rating === "good") {
        rateLastMessageBadBtn.style.opacity = 0.2;
    } else {
        rateLastMessageGoodBtn.style.opacity = 0.2;
    }

    // Handle recent rating reasons
    if(!window.recentRatingReasonCounts) window.recentRatingReasonCounts = {};
    let reasonCountEntries = Object.entries(window.recentRatingReasonCounts).sort((a,b) => b[1]-a[1]);
    if(reasonCountEntries.length > 10) reasonCountEntries = reasonCountEntries.slice(0, 10);
    window.recentRatingReasonCounts = Object.fromEntries(reasonCountEntries);
    recentRatingReasonsDataList.innerHTML = reasonCountEntries
        .map(e => `<option value="${e[0].replace(/</g, "&lt;").replace(/"/g, "&quot;")}"></option>`)
        .join("");

    // Get rating reason
    let reasonResolver;
    const reasonFinishPromise = new Promise(r => reasonResolver = r);
    ratingReasonEl.value = "";
    ratingReasonCtn.style.display = "";
    ratingReasonEl.focus();
    await new Promise(r => setTimeout(r, 100));

    // Handle clicks outside reason input
    function windowClickHandler(event) {
        if(!ratingReasonCtn.contains(event.target)) {
            reasonResolver(ratingReasonEl.value);
        }
    }
    window.addEventListener("click", windowClickHandler);

    // Handle enter key
    function enterKeydownHandler(event) {
        if(event.key === 'Enter') {
            reasonResolver(ratingReasonEl.value);
        }
    }
    ratingReasonEl.addEventListener("keydown", enterKeydownHandler);

    // Wait for reason input
    const reason = await reasonFinishPromise;
    if(reason.length < 100) {
        window.recentRatingReasonCounts[reason] = (window.recentRatingReasonCounts[reason] || 0) + 1;
    }

    // Clean up
    ratingReasonCtn.style.display = 'none';
    window.removeEventListener("click", windowClickHandler);
    ratingReasonEl.removeEventListener("keydown", enterKeydownHandler);

    // Submit rating
    window.lastGenerationStreamObj.submitUserRating({score, reason});
}
