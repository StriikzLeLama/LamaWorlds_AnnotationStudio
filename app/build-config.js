// Build configuration helper
const path = require('path');
const fs = require('fs');

console.log('Validating build configuration...\n');

// Check if dist folder exists (React build)
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
    console.error('❌ Error: dist folder not found. Please run "npm run build" first.');
    process.exit(1);
}
console.log('✓ dist folder found');

// Check if dist/index.html exists
const indexHtmlPath = path.join(distPath, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
    console.error('❌ Error: dist/index.html not found. Build may be incomplete.');
    process.exit(1);
}
console.log('✓ dist/index.html found');

// Check if backend exists
const backendPath = path.join(__dirname, 'backend');
if (!fs.existsSync(backendPath)) {
    console.error('❌ Error: backend folder not found.');
    process.exit(1);
}
console.log('✓ backend folder found');

// Check if backend/main.py exists
const backendMainPath = path.join(backendPath, 'main.py');
if (!fs.existsSync(backendMainPath)) {
    console.error('❌ Error: backend/main.py not found.');
    process.exit(1);
}
console.log('✓ backend/main.py found');

// Check if requirements.txt exists
const requirementsPath = path.join(__dirname, 'requirements.txt');
if (!fs.existsSync(requirementsPath)) {
    console.warn('⚠ Warning: requirements.txt not found. Python dependencies may not be documented.');
} else {
    console.log('✓ requirements.txt found');
}

// Check if electron/main.js exists
const electronMainPath = path.join(__dirname, 'electron', 'main.js');
if (!fs.existsSync(electronMainPath)) {
    console.error('❌ Error: electron/main.js not found.');
    process.exit(1);
}
console.log('✓ electron/main.js found');

console.log('\n✓ Build configuration validated successfully!');

