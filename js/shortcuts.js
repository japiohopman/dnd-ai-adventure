// Shortcut button management
function renderShortcutButtons() {
    let shortcutButtons = JSON.parse(localStorage.shortcutButtons || "[]");
    shortcutButtonsCtn.hidden = shortcutButtons.length === 0;
    
    let html = shortcutButtons.map(b => 
        `<button class="shortcutButton" 
                title="Right-click to edit, drag to re-order" 
                oncontextmenu="showShortcutEditor({defaultEditId:${b.id}}); event.preventDefault();" 
                data-config="${encodeURIComponent(JSON.stringify(b))}" 
                onclick="if(shortcutButtonsCtn.dataset.trashMode) { deleteShortcutButton(JSON.parse(decodeURIComponent(this.dataset.config))) } else { executeShortcutButton(JSON.parse(decodeURIComponent(this.dataset.config))) }">${b.label}</button>`
    ).join("");
    
    if(shortcutButtons.length > 0) {
        html += `<button id="toggleShortcutButtonTrashModeBtn" onclick="toggleShortcutButtonTrashMode()">${shortcutButtonsCtn.dataset.trashMode ? "🏁" : "🗑️"}</button>`;
    }
    
    shortcutButtonsCtn.innerHTML = html;
    
    updateDragHint(shortcutButtons.length);
}

function updateDragHint(buttonCount) {
    if(buttonCount > 3 && !localStorage.knowsAboutShortcutButtonDragReordering) {
        dragShortcutButtonsToReorderHintEl.hidden = false;
        dragShortcutButtonsToReorderHintEl.innerHTML = window.matchMedia("(pointer: coarse)").matches ? 
            "(drag buttons to re-order, long-press to edit)" : 
            "(drag buttons to re-order, right-click to edit)";
    } else {
        dragShortcutButtonsToReorderHintEl.hidden = true;
    }
}

function toggleShortcutButtonTrashMode() {
    if(!localStorage.knowsHowShortcutButtonTrashModeWorks) {
        if(!confirm("Tap a shortcut button to delete it.")) return;
        localStorage.knowsHowShortcutButtonTrashModeWorks = "1";
    }
    
    shortcutButtonsCtn.dataset.trashMode = shortcutButtonsCtn.dataset.trashMode === "1" ? "" : "1";
    toggleShortcutButtonTrashModeBtn.textContent = shortcutButtonsCtn.dataset.trashMode === "1" ? "🏁" : "🗑️";
}

function deleteShortcutButton(data) {
    let shortcutButtons = JSON.parse(localStorage.shortcutButtons || "[]");
    shortcutButtons = shortcutButtons.filter(b => b.id !== data.id);
    if(shortcutButtons.length === 0) shortcutButtonsCtn.dataset.trashMode = "";
    localStorage.shortcutButtons = JSON.stringify(shortcutButtons);
    renderShortcutButtons();
}

function executeShortcutButton(data) {
    if(data.type === "action") {
        executeActionShortcut(data);
    } else if(data.type === "story") {
        executeStoryShortcut(data);
    }
}

function executeActionShortcut(data) {
    let insertionText = data.insertionText.replace(/\{[0-9]+-[0-9]+\}/g, m => m.evaluateItem);
    
    switch(data.actionInsertionType) {
        case "replace":
            whatHappensNextEl.value = insertionText;
            break;
        case "append":
            whatHappensNextEl.value += insertionText;
            break;
        case "prepend":
            whatHappensNextEl.value = insertionText + whatHappensNextEl.value;
            break;
        case "replace_selection":
            replaceSelectionInTextarea(whatHappensNextEl, insertionText);
            break;
    }
    
    localStorage.whatHappensNext = whatHappensNextEl.value;
    
    if(data.autoContinue === "yes") continueStory();
}

function executeStoryShortcut(data) {
    let insertionText = data.insertionText.replace(/\{[0-9]+-[0-9]+\}/g, m => m.evaluateItem);
    
    if(data.storyInsertionType === "inline") {
        storySoFarEl.value = storySoFarEl.value.trim() + insertionText;
    } else if(data.storyInsertionType === "new_paragraph") {
        storySoFarEl.value = storySoFarEl.value.trim() + "\n\n" + insertionText;
    }
    
    storySoFarEl.scrollTop = storySoFarEl.scrollHeight;
    localStorage.storySoFar = storySoFarEl.value;
    
    if(data.autoContinue === "yes") {
        continueStory({continueInline: data.storyContinuationType === "inline"});
    }
}

function replaceSelectionInTextarea(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = textarea.value.substring(0, start);
    const textAfter = textarea.value.substring(end);
    
    textarea.value = textBefore + text + textAfter;
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
}

// Initialize drag-and-drop functionality
function makeChildrenReorderableViaDrag(container, { childSelector='*', onEnd, onStart, excludeChildren=[] } = {}) {
    let draggedEl = null;
    let ghostEl = null;
    let started = false;
    let isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    function createGhost(el) {
        const ghost = el.cloneNode(true);
        const styles = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        Object.assign(ghost.style, {
            position: 'fixed',
            pointerEvents: 'none',
            opacity: '0.7',
            zIndex: '1000',
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            margin: '0',
            fontSize: styles.getPropertyValue("font-size")
        });
        return ghost;
    }

    function handleMove(x, y) {
        if(!draggedEl || !ghostEl) return;
        
        ghostEl.style.left = `${x - ghostEl.getBoundingClientRect().width / 2}px`;
        ghostEl.style.top = `${y - ghostEl.getBoundingClientRect().height / 2}px`;

        const children = [...container.querySelectorAll(`:scope > ${childSelector}`)].filter(child => !excludeChildren.includes(child));
        if(children.length === 0) {
            container.appendChild(draggedEl);
            return;
        }

        // Find closest child and determine insertion position
        const closestChild = findClosestChild(children, x, y);
        if(!closestChild) return;

        const rect = closestChild.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;

        if(x < centerX) {
            if(closestChild !== draggedEl && closestChild.previousElementSibling !== draggedEl) {
                container.insertBefore(draggedEl, closestChild);
            }
        } else {
            if(closestChild.nextElementSibling !== draggedEl) {
                container.insertBefore(draggedEl, closestChild.nextElementSibling);
            }
        }
    }

    function findClosestChild(children, x, y) {
        let closestChild = null;
        let minDistance = Infinity;

        children.forEach(child => {
            const rect = child.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            const distance = Math.hypot(x - centerX, y - centerY);

            if(distance < minDistance) {
                minDistance = distance;
                closestChild = child;
            }
        });

        return closestChild;
    }

    function cleanup(timer) {
        if(timer) clearTimeout(timer);
        if(ghostEl) ghostEl.remove();
        if(draggedEl) draggedEl.style.opacity = draggedElOriginalOpacity;
        draggedEl = ghostEl = null;
        if(started) onEnd?.();
        started = false;
    }

    let draggedElOriginalOpacity;
    function initDrag(event) {
        const isTouch = event.type.includes('touch');
        const point = isTouch ? event.touches[0] : event;
        const target = event.target.closest(childSelector);
        
        if(!target || !container.contains(target) || excludeChildren.includes(target)) return;
        
        const startPos = { x: point.clientX, y: point.clientY };
        const startDelayMs = 200;

        function startDragging() {
            draggedEl = target;
            if(!started) { onStart?.(); started = true; }
            
            draggedElOriginalOpacity = draggedEl.style.opacity;
            draggedEl.style.opacity = '0.5';
            
            ghostEl = createGhost(draggedEl);
            document.body.appendChild(ghostEl);
            handleMove(point.clientX, point.clientY);
        }

        const timer = setTimeout(startDragging, startDelayMs);
        
        let moveHandlerCount = 0;
        function moveHandler(e) {
            e.preventDefault();
            const p = isTouch ? e.touches[0] : e;
            
            if(isTouch && !draggedEl && Math.hypot(p.clientX - startPos.x, p.clientY - startPos.y) > 30) {
                cleanup(timer);
                return;
            }
            
            if(moveHandlerCount % 2 === 0) handleMove(p.clientX, p.clientY);
            moveHandlerCount++;
        }

        function endHandler() {
            document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', moveHandler);
            cleanup(timer);
        }

        document.addEventListener(isTouch ? 'touchmove' : 'mousemove', moveHandler, isTouch ? { passive: false } : undefined);
        document.addEventListener(isTouch ? 'touchend' : 'mouseup', endHandler, { once: true });
    }

    container.addEventListener('touchstart', initDrag);
    container.addEventListener('mousedown', initDrag);
}

// Initialize shortcut button drag-and-drop
makeChildrenReorderableViaDrag(shortcutButtonsCtn, {
    childSelector: ".shortcutButton",
    onEnd: () => {
        const shortcutButtonsData = [...shortcutButtonsCtn.querySelectorAll("button.shortcutButton")]
            .map(el => JSON.parse(decodeURIComponent(el.dataset.config)));
        
        const didChangeOrder = shortcutButtonsData.map(b => b.id).join(",") !== 
            JSON.parse(localStorage.shortcutButtons).map(b => b.id).join(",");
        
        localStorage.shortcutButtons = JSON.stringify(shortcutButtonsData);
        renderShortcutButtons();
        
        if(!dragShortcutButtonsToReorderHintEl.hidden && didChangeOrder) {
            localStorage.knowsAboutShortcutButtonDragReordering = "1";
            dragShortcutButtonsToReorderHintEl.hidden = true;
        }
    }
});
