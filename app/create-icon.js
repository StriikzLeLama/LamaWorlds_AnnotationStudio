// Simple script to create a placeholder icon
// Note: For production, you should create a proper .ico file
// You can use online tools like https://convertio.co/png-ico/ or https://www.icoconverter.com/

const fs = require('fs');
const path = require('path');

const resourcesDir = path.join(__dirname, 'resources');
if (!fs.existsSync(resourcesDir)) {
    fs.mkdirSync(resourcesDir, { recursive: true });
}

console.log('📝 Note: Pour créer une vraie icône .ico:');
console.log('1. Créez une image 256x256px ou 512x512px');
console.log('2. Convertissez-la en .ico avec: https://convertio.co/png-ico/');
console.log('3. Placez-la dans: resources/icon.ico');
console.log('');
console.log('Pour l\'instant, electron-builder utilisera l\'icône par défaut.');

