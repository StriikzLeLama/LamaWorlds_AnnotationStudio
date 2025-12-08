const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function findPython() {
    const pythonCommands = process.platform === 'win32' 
        ? ['py', 'python', 'python3', 'python.exe']
        : ['python3', 'python'];
    
    // Try commands first
    for (const cmd of pythonCommands) {
        try {
            const version = execSync(`${cmd} --version`, { timeout: 2000, encoding: 'utf-8' });
            const versionMatch = version.match(/Python (\d+)\.(\d+)/);
            if (versionMatch) {
                const major = parseInt(versionMatch[1]);
                const minor = parseInt(versionMatch[2]);
                if (major >= 3 && minor >= 10) {
                    return { executable: cmd, version: version.trim() };
                }
            }
        } catch (e) {
            // Continue
        }
    }
    
    // Try Windows-specific paths
    if (process.platform === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : '');
        const commonPaths = [
            'C:\\Python310\\python.exe',
            'C:\\Python311\\python.exe',
            'C:\\Python312\\python.exe',
            localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python310', 'python.exe') : '',
            localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python311', 'python.exe') : '',
            localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python312', 'python.exe') : '',
        ].filter(p => p);
        
        for (const pyPath of commonPaths) {
            if (fs.existsSync(pyPath)) {
                try {
                    const version = execSync(`"${pyPath}" --version`, { timeout: 2000, encoding: 'utf-8' });
                    return { executable: pyPath, version: version.trim() };
                } catch (e) {
                    // Continue
                }
            }
        }
    }
    
    return null;
}

function checkDependencies(pythonExecutable) {
    try {
        execSync(`"${pythonExecutable}" -c "import fastapi, uvicorn, PIL"`, {
            timeout: 3000,
            encoding: 'utf-8',
            stdio: 'pipe'
        });
        return true;
    } catch (e) {
        return false;
    }
}

// Main check
const python = findPython();
if (!python) {
    console.error('❌ Python 3.10+ not found!');
    console.error('Please install Python 3.10+ from https://www.python.org/downloads/');
    console.error('Make sure to check "Add Python to PATH" during installation.');
    process.exit(1);
}

console.log(`✓ Found Python: ${python.executable} (${python.version})`);

if (!checkDependencies(python.executable)) {
    console.error('❌ Python dependencies not installed!');
    console.error('Please run: pip install -r requirements.txt');
    process.exit(1);
}

console.log('✓ Python dependencies are installed');
console.log(`Python executable: ${python.executable}`);
process.exit(0);

