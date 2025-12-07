// Script to test Python detection
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== Python Detection Test ===\n');

// Test 1: py launcher
console.log('1. Testing Python launcher (py)...');
try {
    const version = execSync('py --version', { timeout: 2000, encoding: 'utf-8' });
    console.log(`   ✓ Found: ${version.trim()}`);
    
    // Try to get Python path
    try {
        const pyPath = execSync('py -c "import sys; print(sys.executable)"', { timeout: 2000, encoding: 'utf-8' });
        console.log(`   ✓ Python executable: ${pyPath.trim()}`);
    } catch (e) {
        console.log(`   ⚠ Could not get Python path: ${e.message}`);
    }
} catch (e) {
    console.log(`   ✗ Not found: ${e.message}`);
}

// Test 2: python command
console.log('\n2. Testing python command...');
try {
    const version = execSync('python --version', { timeout: 2000, encoding: 'utf-8' });
    console.log(`   ✓ Found: ${version.trim()}`);
    
    // Try to get Python path
    try {
        const pyPath = execSync('python -c "import sys; print(sys.executable)"', { timeout: 2000, encoding: 'utf-8' });
        console.log(`   ✓ Python executable: ${pyPath.trim()}`);
    } catch (e) {
        console.log(`   ⚠ Could not get Python path: ${e.message}`);
    }
} catch (e) {
    console.log(`   ✗ Not found: ${e.message}`);
}

// Test 3: where command (Windows)
if (process.platform === 'win32') {
    console.log('\n3. Testing "where python" command...');
    try {
        const whereOutput = execSync('where python', { timeout: 2000, encoding: 'utf-8' });
        const paths = whereOutput.trim().split('\n').filter(p => p.trim());
        if (paths.length > 0) {
            console.log(`   ✓ Found ${paths.length} Python installation(s):`);
            paths.forEach((p, i) => {
                console.log(`      ${i + 1}. ${p}`);
                if (fs.existsSync(p)) {
                    try {
                        const version = execSync(`"${p}" --version`, { timeout: 2000, encoding: 'utf-8' });
                        console.log(`         Version: ${version.trim()}`);
                    } catch (e) {
                        console.log(`         ⚠ Could not execute: ${e.message}`);
                    }
                } else {
                    console.log(`         ⚠ File does not exist`);
                }
            });
        } else {
            console.log(`   ✗ No Python found in PATH`);
        }
    } catch (e) {
        console.log(`   ✗ Command failed: ${e.message}`);
    }
}

// Test 4: Common installation paths
if (process.platform === 'win32') {
    console.log('\n4. Checking common installation paths...');
    const commonPaths = [
        'C:\\Python310\\python.exe',
        'C:\\Python311\\python.exe',
        'C:\\Python312\\python.exe',
        'C:\\Program Files\\Python310\\python.exe',
        'C:\\Program Files\\Python311\\python.exe',
        'C:\\Program Files\\Python312\\python.exe',
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python310', 'python.exe'),
        path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python311', 'python.exe'),
        path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Programs', 'Python', 'Python310', 'python.exe'),
        path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe')
    ];
    
    let found = false;
    for (const pyPath of commonPaths) {
        if (pyPath && fs.existsSync(pyPath)) {
            console.log(`   ✓ Found: ${pyPath}`);
            try {
                const version = execSync(`"${pyPath}" --version`, { timeout: 2000, encoding: 'utf-8' });
                console.log(`      Version: ${version.trim()}`);
                found = true;
            } catch (e) {
                console.log(`      ⚠ Could not execute: ${e.message}`);
            }
        }
    }
    if (!found) {
        console.log(`   ✗ No Python found in common paths`);
    }
}

// Test 5: Environment PATH
console.log('\n5. Checking PATH environment variable...');
const pathEnv = process.env.PATH || '';
const pathDirs = pathEnv.split(path.delimiter);
const pythonInPath = pathDirs.some(dir => {
    const pythonExe = path.join(dir, 'python.exe');
    return fs.existsSync(pythonExe);
});
if (pythonInPath) {
    console.log(`   ✓ Python found in PATH directories`);
    pathDirs.forEach(dir => {
        const pythonExe = path.join(dir, 'python.exe');
        if (fs.existsSync(pythonExe)) {
            console.log(`      - ${pythonExe}`);
        }
    });
} else {
    console.log(`   ✗ Python not found in PATH directories`);
    console.log(`   PATH contains ${pathDirs.length} directories`);
}

console.log('\n=== Test Complete ===');

