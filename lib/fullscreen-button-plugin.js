// Simple fullscreen button plugin
const fullscreenButton = {
    init: function(element) {
        const btn = document.createElement('button');
        btn.textContent = '⛶';
        btn.onclick = () => {
            if (!document.fullscreenElement) {
                element.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        };
        element.appendChild(btn);
    }
};
