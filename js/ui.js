// Get DOM elements
let storySoFarEl_placeholder, storySoFarEl, storyOverviewEl, whatHappensNextEl,
    deleteWhatHappensNextBtn, storyBeginBtn, generateBtn, stopBtn, storySoFarDeleteBtn,
    updateTrackedInfoUndoBtn, bottomButtonsCtn, subtitleEl, loadGameBtn, storyGenerationAreaEl,
    infoTrackingBtn, infoTrackingCtn, currentTrackedInfoEl;

// UI initialization
document.addEventListener('DOMContentLoaded', () => {
    if (!initializeElements()) {
        console.error("Failed to initialize all required elements");
        return;
    }
    initializeUI();
    loadSavedState();
});

function initializeElements() {
    // Get DOM elements
    storySoFarEl_placeholder = document.getElementById('storySoFarEl_placeholder');
    storySoFarEl = document.getElementById('storySoFarEl');
    storyOverviewEl = document.getElementById('storyOverviewEl');
    whatHappensNextEl = document.getElementById('whatHappensNextEl');
    deleteWhatHappensNextBtn = document.getElementById('deleteWhatHappensNextBtn');
    storyBeginBtn = document.getElementById('storyBeginBtn');
    generateBtn = document.getElementById('generateBtn');
    stopBtn = document.getElementById('stopBtn');
    storySoFarDeleteBtn = document.getElementById('storySoFarDeleteBtn');
    updateTrackedInfoUndoBtn = document.getElementById('updateTrackedInfoUndoBtn');
    bottomButtonsCtn = document.getElementById('bottomButtonsCtn');
    subtitleEl = document.getElementById('subtitleEl');
    loadGameBtn = document.getElementById('loadGameBtn');
    storyGenerationAreaEl = document.getElementById('storyGenerationAreaEl');
    infoTrackingBtn = document.getElementById('infoTrackingBtn');
    infoTrackingCtn = document.getElementById('infoTrackingCtn');
    currentTrackedInfoEl = document.getElementById('currentTrackedInfoEl');

    // Check required elements
    const requiredElements = {
        storySoFarEl,
        storyOverviewEl,
        whatHappensNextEl,
        deleteWhatHappensNextBtn,
        storyBeginBtn,
        generateBtn,
        stopBtn,
        subtitleEl,
        storyGenerationAreaEl
    };

    let missingElements = [];
    Object.entries(requiredElements).forEach(([name, element]) => {
        if (!element) {
            console.error(`Missing required element: ${name}`);
            missingElements.push(name);
        }
    });

    return missingElements.length === 0;
}

function initializeUI() {
    // Initialize story text area
    const storySoFarElement = document.getElementById('storySoFarEl');
    if (storySoFarElement && !window.storySoFarEl) {
        window.storySoFarEl = createTextEditor({
            textStyleRules: [
                {match: /(\s|^)\*\*[^*"""]+?\*\*/g, style: "font-weight:bold;"},
                {match: /(\s|^)\*[^*"""]+?\*/g, style: "color:var(--text-style-rule-asterisk-color); font-style:italic;"},
                {match: /(^|\n)>[^\n]*/g, style: "color:var(--text-style-rule-block-quote-color);"}
            ],
            placeholder: 'The story will appear here when you click the generate button below. You can edit it as needed.',
            onInput: handleStorySoFarInput,
            onClick: handleStorySoFarClick
        });

        // Replace the original element with the text editor
        storySoFarElement.replaceWith(window.storySoFarEl);
        window.storySoFarEl.style.cssText = `
            display: block;
            padding-bottom: 1.5rem;
            width: 100%;
            max-width: 98vw;
            min-height: 400px;
            max-height: 80vh;
            height: ${window.innerHeight * 0.3}px;
        `;
        
        // Update the global reference
        storySoFarEl = window.storySoFarEl;
    }

    // Initialize event listeners
    initializeEventListeners();

    // Update initial button states
    updateButtonsDisplay();
}

function initializeEventListeners() {
    // Story overview input
    if (storyOverviewEl) {
        storyOverviewEl.addEventListener('input', updateButtonsDisplay);
    }

    // What happens next input
    if (whatHappensNextEl) {
        whatHappensNextEl.addEventListener('input', () => {
            if (deleteWhatHappensNextBtn) {
                deleteWhatHappensNextBtn.style.display = whatHappensNextEl.value.trim() ? '' : 'none';
            }
        });
    }

    // Story begin button
    if (storyBeginBtn) {
        storyBeginBtn.addEventListener('click', () => {
            if (storyOverviewEl) {
                window.startGame(storyOverviewEl.value);
            }
        });
    }

    // Load game button
    if (loadGameBtn) {
        loadGameBtn.addEventListener('click', handleLoadGame);
    }

    // Generate button
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            window.continueStory();
        });
    }

    // Stop button
    if (stopBtn) {
        stopBtn.addEventListener('click', handleStop);
    }

    // Delete what happens next button
    if (deleteWhatHappensNextBtn) {
        deleteWhatHappensNextBtn.addEventListener('click', () => {
            if (whatHappensNextEl) {
                whatHappensNextEl.value = '';
                deleteWhatHappensNextBtn.style.display = 'none';
            }
        });
    }

    // Info tracking button
    if (infoTrackingBtn) {
        infoTrackingBtn.addEventListener('click', toggleInfoTracking);
    }
}

// Update buttons display based on state
function updateButtonsDisplay() {
    const hasOverview = storyOverviewEl?.value?.trim()?.length > 0;
    const hasStoryText = storySoFarEl?.value?.trim()?.length > 0;
    const hasWhatHappensNext = whatHappensNextEl?.value?.trim()?.length > 0;

    // Show/hide begin and load buttons
    if (storyBeginBtn) {
        storyBeginBtn.style.display = hasOverview ? '' : 'none';
    }
    if (loadGameBtn) {
        loadGameBtn.style.display = hasOverview ? '' : 'none';
    }
    
    // Show/hide generation area
    if (storyGenerationAreaEl) {
        storyGenerationAreaEl.hidden = !hasOverview;
    }

    // Show/hide delete button
    if (deleteWhatHappensNextBtn) {
        deleteWhatHappensNextBtn.style.display = hasWhatHappensNext ? '' : 'none';
    }

    // Update bottom buttons container
    if (bottomButtonsCtn) {
        bottomButtonsCtn.style.display = hasStoryText ? "flex" : "none";
        if (generateBtn && hasStoryText) {
            generateBtn.textContent = "▶️ continue";
        }
    }
}

function handleStorySoFarInput() {
    if (updateTrackedInfoUndoBtn) {
        updateTrackedInfoUndoBtn.hidden = true;
    }
    if (storySoFarDeleteBtn) {
        storySoFarDeleteBtn.dataset.mode = 'delete';
    }
    window.storyTextBeforeLastGeneration = null;

    clearTimeout(window.storySoFarSaveOnInputDebounceTimeout);
    window.storySoFarSaveOnInputDebounceTimeout = setTimeout(() => {
        localStorage.storySoFar = storySoFarEl.value;
    }, 2000);
}

function handleStorySoFarClick(e) {
    let lowerFifth = this.offsetHeight * 8 / 10;
    let closeToBottom = this.scrollHeight - this.scrollTop - this.clientHeight < 40;
    if(e.offsetY > lowerFifth && closeToBottom) {
        this.scrollTop = this.scrollHeight;
    }
}

function handleLoadGame() {
    // Implement game loading functionality
    console.log('Load game clicked');
}

function handleStop() {
    window.userClickedStop = true;
    window.lastGenerationStreamObj.stop();
    this.style.display = 'none';
}

function toggleInfoTracking() {
    infoTrackingCtn.hidden = !infoTrackingCtn.hidden;
    infoTrackingBtn.textContent = infoTrackingCtn.hidden ? '📊 enable info tracker' : '📊 disable info tracker';
}

function loadSavedState() {
    try {
        // Only set values if both the element and localStorage value exist
        if (storyOverviewEl && localStorage.storyOverview) {
            storyOverviewEl.value = localStorage.storyOverview;
        }

        if (whatHappensNextEl && localStorage.whatHappensNext) {
            whatHappensNextEl.value = localStorage.whatHappensNext;
        }

        if (storySoFarEl && localStorage.storySoFar) {
            storySoFarEl.value = localStorage.storySoFar;
        }

        // Update button visibility
        if (deleteWhatHappensNextBtn && whatHappensNextEl) {
            deleteWhatHappensNextBtn.hidden = !whatHappensNextEl.value.trim();
        }

        // Update subtitle visibility
        if (subtitleEl && localStorage.generateCount) {
            const count = Number(localStorage.generateCount);
            if (!isNaN(count) && count > 5) {
                subtitleEl.style.display = "none";
            }
        }
    } catch (error) {
        console.error('Error loading saved state:', error);
    }
}

// Anti-layout jank function
function antiAntiLayoutJank(fn) {
    let prevPageScrollTop = document.scrollingElement.scrollTop;
    fn();
    document.scrollingElement.scrollTop = prevPageScrollTop;
}
