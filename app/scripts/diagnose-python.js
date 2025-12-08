// Script de diagnostic Python pour le mode build
const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('='.repeat(60));
console.log('Python Diagnostic Tool');
console.log('='.repeat(60));
console.log();

// Check environment
console.log('Environment:');
console.log(`  Platform: ${process.platform}`);
console.log(`  LOCALAPPDATA: ${process.env.LOCALAPPDATA || 'Not set'}`);
console.log(`  USERPROFILE: ${process.env.USERPROFILE || 'Not set'}`);
console.log(`  PATH length: ${(process.env.PATH || '').length} characters`);
console.log();

// Try to find Python
console.log('Searching for Python...');
const pythonCommands = ['py', 'python', 'python3'];
let foundPython = null;

for (const cmd of pythonCommands) {
    try {
        const version = execSync(`${cmd} --version`, { 
            timeout: 2000, 
            encoding: 'utf-8',
            stdio: 'pipe'
        });
        console.log(`✓ Found: ${cmd} - ${version.trim()}`);
        foundPython = cmd;
        break;
    } catch (e) {
        console.log(`✗ ${cmd} - not found`);
    }
}

// Try common paths on Windows
if (!foundPython && process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : '');
    const commonPaths = [
        'C:\\Python310\\python.exe',
        'C:\\Python311\\python.exe',
        localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python310', 'python.exe') : '',
        localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python311', 'python.exe') : '',
    ].filter(p => p);
    
    console.log('\nChecking common installation paths...');
    for (const pyPath of commonPaths) {
        if (fs.existsSync(pyPath)) {
            try {
                const version = execSync(`"${pyPath}" --version`, { 
                    timeout: 2000, 
                    encoding: 'utf-8' 
                });
                console.log(`✓ Found: ${pyPath} - ${version.trim()}`);
                foundPython = pyPath;
                break;
            } catch (e) {
                console.log(`✗ ${pyPath} - exists but cannot execute`);
            }
        } else {
            console.log(`✗ ${pyPath} - not found`);
        }
    }
}

if (!foundPython) {
    console.log('\n❌ Python not found!');
    console.log('\nPlease install Python 3.10+ from https://www.python.org/downloads/');
    console.log('Make sure to check "Add Python to PATH" during installation.');
    process.exit(1);
}

// Check dependencies
console.log('\nChecking Python dependencies...');
try {
    execSync(`"${foundPython}" -c "import fastapi, uvicorn, PIL"`, {
        timeout: 3000,
        encoding: 'utf-8',
        stdio: 'pipe'
    });
    console.log('✓ All dependencies are installed');
} catch (e) {
    console.log('❌ Dependencies missing!');
    console.log(`Run: "${foundPython}" -m pip install -r requirements.txt`);
    process.exit(1);
}

console.log('\n✓ Python is ready!');
console.log(`Python executable: ${foundPython}`);
process.exit(0);

