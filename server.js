const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Handle root path
    let filePath = req.url === '/' ? './index.html' : '.' + req.url;
    
    // Get file extension
    const extname = path.extname(filePath);
    let contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Read file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if(error.code === 'ENOENT') {
                // File not found
                fs.readFile('./404.html', (error, content) => {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(content, 'utf-8');
                });
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Try multiple ports if the first one fails
function tryPort(port) {
    server.listen(port, () => {
        console.log(`Server running at http://localhost:${port}/`);
    }).on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying ${port + 1}...`);
            tryPort(port + 1);
        } else {
            console.error(e);
        }
    });
}

tryPort(PORT);
