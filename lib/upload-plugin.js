// Simple upload plugin
const upload = {
    init: function(element) {
        const input = document.createElement('input');
        input.type = 'file';
        input.style.display = 'none';
        element.appendChild(input);
        return {
            trigger: () => input.click(),
            onUpload: (callback) => {
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => callback(e.target.result);
                        reader.readAsText(file);
                    }
                };
            }
        };
    }
};
