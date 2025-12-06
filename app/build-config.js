// Build configuration helper
const path = require('path');
const fs = require('fs');

// Check if dist folder exists (React build)
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    console.error('Error: dist folder not found. Please run "npm run build" first.');
    process.exit(1);
}

// Check if backend exists
if (!fs.existsSync(path.join(__dirname, 'backend'))) {
    console.error('Error: backend folder not found.');
    process.exit(1);
}

console.log('✓ Build configuration validated');

