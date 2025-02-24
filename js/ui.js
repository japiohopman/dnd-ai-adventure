// Get DOM elements
let storySoFarEl_placeholder, storySoFarEl, storyOverviewEl, whatHappensNextEl,
    deleteWhatHappensNextBtn, storyBeginBtn, generateBtn, stopBtn, storySoFarDeleteBtn,
    updateTrackedInfoUndoBtn, bottomButtonsCtn, subtitleEl;

// UI initialization
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    storySoFarEl_placeholder = document.getElementById('storySoFarEl_placeholder');
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

    initializeUI();
    loadSavedState();
});

function initializeUI() {
    // Initialize story text area
    if (!window.storySoFarEl) {
        window.storySoFarEl = createTextEditor({
            textStyleRules: [
                {match: /(\s|^)\*\*[^*"""]+?\*\*/g, style: "font-weight:bold;"},
                {match: /(\s|^)\*[^*"""]+?\*/g, style: "color:var(--text-style-rule-asterisk-color); font-style:italic;"},
                {match: /(^|\n)>[^\n]*/g, style: "color:var(--text-style-rule-block-quote-color); font-style:italic;"},
                {match: /(\s|^)[""][^*"]+?[""]/g, style: "color:var(--text-style-rule-quote-color); font-style:italic;"},
                {match: /^[^:]{1,30}?:/g, style: "font-weight:bold;"},
                {match: /(^|\n)#+ [^\n]*/g, style: "font-weight:bold;"},
            ],
        });
    }
    storySoFarEl = window.storySoFarEl;

    if (storySoFarEl_placeholder) {
        storySoFarEl_placeholder.replaceWith(storySoFarEl);
        storySoFarEl.style.cssText = `display:block; padding-bottom:1.5rem; width:100%; max-width:98vw; min-height:400px; max-height:80vh; height:${window.innerHeight*0.3}px;`;
        storySoFarEl.placeholder = 'The story will appear here when you click the generate button below. You can edit it as needed.';
    }

    // Initialize event listeners
    initializeEventListeners();
    updateButtonsDisplay();
}

function initializeEventListeners() {
    // Story overview
    if (storyOverviewEl) {
        storyOverviewEl.addEventListener('input', () => {
            localStorage.storyOverview = storyOverviewEl.value;
        });
    }

    // Story text area
    if (storySoFarEl) {
        storySoFarEl.addEventListener('input', handleStorySoFarInput);
        storySoFarEl.addEventListener('click', handleStorySoFarClick);
    }

    // What happens next input
    if (whatHappensNextEl) {
        whatHappensNextEl.addEventListener('input', () => {
            localStorage.whatHappensNext = whatHappensNextEl.value;
            if (deleteWhatHappensNextBtn) {
                deleteWhatHappensNextBtn.hidden = !whatHappensNextEl.value.trim();
            }
        });
    }

    // Button handlers
    if (storyBeginBtn) {
        storyBeginBtn.addEventListener('click', handleStoryBegin);
    }
    if (generateBtn) {
        generateBtn.addEventListener('click', () => continueStory());
    }
    if (stopBtn) {
        stopBtn.addEventListener('click', handleStop);
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

function handleStoryBegin() {
    this.disabled = true;
    storyBeginOptionsCtn.hidden = true;
    this.textContent = '⌛ loading...';
    generateBtn.click();
}

function handleStop() {
    window.userClickedStop = true;
    window.lastGenerationStreamObj.stop();
    this.style.display = 'none';
}

function updateButtonsDisplay() {
    if(storySoFarEl.value.trim() === "") {
        bottomButtonsCtn.style.display = "none";
    } else {
        bottomButtonsCtn.style.display = "flex";
        generateBtn.textContent = "▶️ continue";
    }
}

function loadSavedState() {
    // Load saved values from localStorage
    if(localStorage.storyOverview) storyOverviewEl.value = localStorage.storyOverview;
    if(localStorage.whatHappensNext) whatHappensNextEl.value = localStorage.whatHappensNext;
    if(localStorage.storySoFar) storySoFarEl.value = localStorage.storySoFar;
    
    // Update UI based on saved state
    deleteWhatHappensNextBtn.hidden = !whatHappensNextEl.value.trim();
    if(localStorage.generateCount && Number(localStorage.generateCount) > 5) {
        subtitleEl.style.display = "none";
    }
}

// Anti-layout jank function
function antiAntiLayoutJank(fn) {
    let prevPageScrollTop = document.scrollingElement.scrollTop;
    fn();
    document.scrollingElement.scrollTop = prevPageScrollTop;
}
