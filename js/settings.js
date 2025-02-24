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
    const responseStyleEl = document.getElementById('responseStyleEl');
    const customResponseStyleCtn = document.getElementById('customResponseStyleCtn');
    const difficultyModeEl = document.getElementById('difficultyModeEl');
    const infoTrackingBtn = document.getElementById('infoTrackingBtn');
    const currentTrackedInfoEl = document.getElementById('currentTrackedInfoEl');
    const responseStyleCustomInputEl = document.getElementById('responseStyleCustomInputEl');
    const storyWritingStyleCustomInputEl = document.getElementById('storyWritingStyleCustomInputEl');

    // Load writing style
    if (localStorage.responseStyle && responseStyleEl) {
        responseStyleEl.value = localStorage.responseStyle;
        if (customResponseStyleCtn) {
            customResponseStyleCtn.hidden = (responseStyleEl.value !== '@@@custom');
        }
    }
    if(localStorage.responseStyleCustomInput) {
        if (responseStyleCustomInputEl) {
            responseStyleCustomInputEl.value = localStorage.responseStyleCustomInput;
        }
    }
    if(localStorage.storyWritingStyleCustomInput) {
        if (storyWritingStyleCustomInputEl) {
            storyWritingStyleCustomInputEl.value = localStorage.storyWritingStyleCustomInput;
        }
    }

    // Load difficulty mode
    if (localStorage.difficultyMode && difficultyModeEl) {
        difficultyModeEl.value = localStorage.difficultyMode;
    }

    // Load info tracking state
    if (localStorage.infoTrackingEnabled && infoTrackingBtn) {
        infoTrackingBtn.dataset.enabled = localStorage.infoTrackingEnabled;
        updateInfoTrackingDisplay();
    }
    if (localStorage.currentTrackedInfo && currentTrackedInfoEl) {
        currentTrackedInfoEl.value = localStorage.currentTrackedInfo;
    }
}

function initializeWritingStyleSettings() {
    // Get all required elements
    const elements = {
        responseStyleEl: document.getElementById('responseStyleEl'),
        customResponseStyleCtn: document.getElementById('customResponseStyleCtn'),
        responseStyleCustomInputEl: document.getElementById('responseStyleCustomInputEl'),
        storyWritingStyleCustomInputEl: document.getElementById('storyWritingStyleCustomInputEl')
    };

    // Writing style change handler
    if (elements.responseStyleEl) {
        elements.responseStyleEl.addEventListener('change', () => {
            localStorage.responseStyle = elements.responseStyleEl.value;
            if (elements.customResponseStyleCtn) {
                elements.customResponseStyleCtn.hidden = (elements.responseStyleEl.value !== '@@@custom');
            }
        });
    }

    // Custom writing style input handlers
    if (elements.responseStyleCustomInputEl) {
        elements.responseStyleCustomInputEl.addEventListener('input', () => {
            localStorage.responseStyleCustomInput = elements.responseStyleCustomInputEl.value;
        });
    }

    if (elements.storyWritingStyleCustomInputEl) {
        elements.storyWritingStyleCustomInputEl.addEventListener('input', () => {
            localStorage.storyWritingStyleCustomInput = elements.storyWritingStyleCustomInputEl.value;
        });
    }
}

function initializeDifficultySettings() {
    const difficultyModeEl = document.getElementById('difficultyModeEl');
    if (difficultyModeEl) {
        difficultyModeEl.addEventListener('change', () => {
            localStorage.difficultyMode = difficultyModeEl.value;
        });
    }
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
    const rateLastMessageBadBtn = document.getElementById('rateLastMessageBadBtn');
    const rateLastMessageGoodBtn = document.getElementById('rateLastMessageGoodBtn');
    if (rateLastMessageBadBtn) {
        rateLastMessageBadBtn.disabled = true;
    }
    if (rateLastMessageGoodBtn) {
        rateLastMessageGoodBtn.disabled = true;
    }
    if (rateLastMessageBadBtn) {
        rateLastMessageBadBtn.style.opacity = 1;
    }
    if (rateLastMessageGoodBtn) {
        rateLastMessageGoodBtn.style.opacity = 1;
    }
}

function enableRatingButtons() {
    const rateLastMessageBadBtn = document.getElementById('rateLastMessageBadBtn');
    const rateLastMessageGoodBtn = document.getElementById('rateLastMessageGoodBtn');
    if (rateLastMessageBadBtn) {
        rateLastMessageBadBtn.disabled = false;
    }
    if (rateLastMessageGoodBtn) {
        rateLastMessageGoodBtn.disabled = false;
    }
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
    const rateLastMessageBadBtn = document.getElementById('rateLastMessageBadBtn');
    const rateLastMessageGoodBtn = document.getElementById('rateLastMessageGoodBtn');
    if (rateLastMessageBadBtn) {
        rateLastMessageBadBtn.disabled = true;
    }
    if (rateLastMessageGoodBtn) {
        rateLastMessageGoodBtn.disabled = true;
    }
    
    if(rating === "good") {
        if (rateLastMessageBadBtn) {
            rateLastMessageBadBtn.style.opacity = 0.2;
        }
    } else {
        if (rateLastMessageGoodBtn) {
            rateLastMessageGoodBtn.style.opacity = 0.2;
        }
    }

    // Handle recent rating reasons
    if(!window.recentRatingReasonCounts) window.recentRatingReasonCounts = {};
    let reasonCountEntries = Object.entries(window.recentRatingReasonCounts).sort((a,b) => b[1]-a[1]);
    if(reasonCountEntries.length > 10) reasonCountEntries = reasonCountEntries.slice(0, 10);
    window.recentRatingReasonCounts = Object.fromEntries(reasonCountEntries);
    const recentRatingReasonsDataList = document.getElementById('recentRatingReasonsDataList');
    if (recentRatingReasonsDataList) {
        recentRatingReasonsDataList.innerHTML = reasonCountEntries
            .map(e => `<option value="${e[0].replace(/</g, "&lt;").replace(/"/g, "&quot;")}"></option>`)
            .join("");
    }

    // Get rating reason
    let reasonResolver;
    const reasonFinishPromise = new Promise(r => reasonResolver = r);
    const ratingReasonEl = document.getElementById('ratingReasonEl');
    const ratingReasonCtn = document.getElementById('ratingReasonCtn');
    if (ratingReasonEl) {
        ratingReasonEl.value = "";
    }
    if (ratingReasonCtn) {
        ratingReasonCtn.style.display = "";
    }
    if (ratingReasonEl) {
        ratingReasonEl.focus();
    }
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
    if (ratingReasonEl) {
        ratingReasonEl.addEventListener("keydown", enterKeydownHandler);
    }

    // Wait for reason input
    const reason = await reasonFinishPromise;
    if(reason.length < 100) {
        window.recentRatingReasonCounts[reason] = (window.recentRatingReasonCounts[reason] || 0) + 1;
    }

    // Clean up
    if (ratingReasonCtn) {
        ratingReasonCtn.style.display = 'none';
    }
    window.removeEventListener("click", windowClickHandler);
    if (ratingReasonEl) {
        ratingReasonEl.removeEventListener("keydown", enterKeydownHandler);
    }

    // Submit rating
    window.lastGenerationStreamObj.submitUserRating({score, reason});
}
