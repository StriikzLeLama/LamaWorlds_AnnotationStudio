// Script to setup application icon for electron-builder
const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, 'assets', 'Logo', 'LamaWorlds_LogoV3.jpg');
const resourcesDir = path.join(__dirname, 'resources');

// Create resources directory if it doesn't exist
if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
}

// Check if logo exists
if (!fs.existsSync(logoPath)) {
    console.error(`❌ Logo not found at: ${logoPath}`);
    console.log('Please ensure LamaWorlds_LogoV3.jpg exists in assets/Logo/');
    process.exit(1);
}

// Copy logo to resources directory for electron-builder
const iconJpgPath = path.join(resourcesDir, 'icon.jpg');
const iconIcoPath = path.join(resourcesDir, 'icon.ico');

try {
    // Copy JPG as fallback
    fs.copyFileSync(logoPath, iconJpgPath);
    console.log('✓ Logo copied to resources/icon.jpg');
    
    // Check if .ico file exists, if not, use JPG and let electron-builder convert
    if (fs.existsSync(iconIcoPath)) {
        console.log('✓ Using existing resources/icon.ico');
    } else {
        console.log('');
        console.log('⚠️  No .ico file found. Using JPG (electron-builder will convert automatically).');
        console.log('📝 For best results, create a proper .ico file:');
        console.log('   1. Use an online converter: https://convertio.co/jpg-ico/');
        console.log('   2. Save as resources/icon.ico (256x256 or 512x512 recommended)');
        console.log('   3. Rebuild to use the .ico file');
        console.log('');
        // Use JPG path for now
        fs.copyFileSync(logoPath, iconIcoPath.replace('.ico', '.jpg'));
    }
} catch (err) {
    console.error('❌ Error copying logo:', err.message);
    process.exit(1);
}

