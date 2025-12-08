const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess;
const BACKEND_PORT = 8000;

function createWindow() {
    // Set application icon
    const iconPath = app.isPackaged 
        ? path.join(process.resourcesPath, 'assets', 'Logo', 'LamaWorlds_LogoV3.jpg')
        : path.join(__dirname, '..', 'assets', 'Logo', 'LamaWorlds_LogoV3.jpg');
    
    // Get primary display bounds for centering
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
    const { x: screenX, y: screenY } = primaryDisplay.workArea;
    
    const windowWidth = 1800;
    const windowHeight = 1100;
    const x = Math.floor(screenX + (screenWidth - windowWidth) / 2);
    const y = Math.floor(screenY + (screenHeight - windowHeight) / 2);
    
    mainWindow = new BrowserWindow({
        width: windowWidth,
        height: windowHeight,
        x: x,
        y: y,
        backgroundColor: '#0a0a12', // Dark navy
        icon: fs.existsSync(iconPath) ? iconPath : undefined, // Set icon if file exists
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            // webSecurity must be false to allow loading local file:// images
            // This is safe because we're only loading local files, not remote content
            webSecurity: false,
            allowRunningInsecureContent: false, // Disable insecure content
            experimentalFeatures: false
        },
        frame: true,
        show: false, // Don't show until ready
        autoHideMenuBar: true, // Hide menu bar by default
        center: true, // Center window on screen
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        titleBarOverlay: process.platform === 'win32' ? {
            color: '#0a0a12',
            symbolColor: '#00e0ff'
        } : undefined
    });
    
    // Set Content Security Policy to reduce security warnings
    // Note: We need 'unsafe-eval' for React development, but this is only in dev mode
    if (!app.isPackaged) {
        mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [
                        "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* file: data:; " +
                        "img-src 'self' http://localhost:* file: data: blob:; " +
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:*; " +
                        "style-src 'self' 'unsafe-inline' http://localhost:*; " +
                        "connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*"
                    ]
                }
            });
        });
    }
    
    // Hide menu bar
    mainWindow.setMenuBarVisibility(false);

    // DevTools - disabled by default (can be enabled manually with Ctrl+Shift+I or F12)
    // Uncomment the line below if you need DevTools in development
    // if (!app.isPackaged || process.env.DEBUG === '1') {
    //     mainWindow.webContents.openDevTools();
    // }

    mainWindow.loadFile(path.join(__dirname, 'loading.html'));

    // Show window when ready and ensure it's properly positioned
    mainWindow.once('ready-to-show', () => {
        // Ensure window is visible and properly positioned
        if (!mainWindow.isVisible()) {
            mainWindow.show();
        }
        // Center if needed (in case position was lost)
        if (!mainWindow.isVisible() || mainWindow.getBounds().y < 0) {
            mainWindow.center();
        }
        // Focus the window
        mainWindow.focus();
    });
    
    // Prevent window from moving unexpectedly
    mainWindow.on('move', () => {
        const bounds = mainWindow.getBounds();
        // If window moved to negative Y, reset it
        if (bounds.y < 0) {
            mainWindow.setPosition(bounds.x, 0);
        }
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });

    // Handle navigation errors
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error(`Failed to load: ${errorCode} - ${errorDescription}`);
    });
}

function startBackend() {
    console.log('='.repeat(60));
    console.log('Starting Python backend...');
    console.log(`Platform: ${process.platform}`);
    console.log(`App is packaged: ${app.isPackaged}`);
    console.log(`LOCALAPPDATA: ${process.env.LOCALAPPDATA || 'Not set'}`);
    console.log(`USERPROFILE: ${process.env.USERPROFILE || 'Not set'}`);
    console.log(`PATH (first 200 chars): ${(process.env.PATH || '').substring(0, 200)}...`);
    console.log('='.repeat(60));
    
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    // In packaged app, use process.resourcesPath to get the correct path
    // electron-builder puts extraFiles in resourcesPath
    const appPath = app.isPackaged 
        ? process.resourcesPath
        : path.join(__dirname, '../');
    
    // Try multiple possible backend locations
    const possibleBackendPaths = app.isPackaged ? [
        path.join(appPath, 'backend'),           // resources/backend (extraResources)
        path.join(path.dirname(process.execPath), 'resources', 'backend'),  // fallback
        path.join(path.dirname(process.execPath), 'backend'),  // direct backend folder
        path.join(app.getAppPath(), 'backend')   // app.asar unpacked
    ] : [
        path.join(appPath, 'backend')
    ];
    
    let backendPath = null;
    for (const possiblePath of possibleBackendPaths) {
        if (fs.existsSync(possiblePath) && fs.existsSync(path.join(possiblePath, 'main.py'))) {
            backendPath = possiblePath;
            break;
        }
    }
    
    if (!backendPath) {
        // Use first path as default for error message
        backendPath = possibleBackendPaths[0];
    }

    console.log(`Backend path: ${backendPath}`);
    console.log(`Python command: ${pythonCmd}`);
    console.log(`All possible backend paths checked:`);
    possibleBackendPaths.forEach((p, i) => {
        const exists = fs.existsSync(p);
        const hasMain = exists && fs.existsSync(path.join(p, 'main.py'));
        console.log(`  ${i + 1}. ${p} - ${exists ? '✓ exists' : '✗ not found'} ${hasMain ? '(has main.py)' : ''}`);
    });

    // Check if backend directory exists
    if (!fs.existsSync(backendPath)) {
        console.error(`❌ Backend directory not found: ${backendPath}`);
        console.error(`   App path: ${appPath}`);
        console.error(`   Exec path: ${process.execPath}`);
        console.error(`   Resources path: ${process.resourcesPath}`);
        console.error(`   App path (getAppPath): ${app.getAppPath()}`);
        console.error(`   __dirname: ${__dirname}`);
        
        const errorMsg = `Backend directory not found!\n\n` +
            `Searched in:\n${possibleBackendPaths.map(p => `  - ${p}`).join('\n')}\n\n` +
            `Please ensure the application was built correctly.\n` +
            `The backend folder should be included in the build.`;
        
        if (mainWindow) {
            mainWindow.webContents.send('backend-error', errorMsg);
        }
        return false;
    }
    
    // Check if backend/main.py exists
    const backendMainPath = path.join(backendPath, 'main.py');
    if (!fs.existsSync(backendMainPath)) {
        console.error(`❌ Backend main.py not found: ${backendMainPath}`);
        if (mainWindow) {
            mainWindow.webContents.send('backend-error', `Backend main.py not found at: ${backendMainPath}`);
        }
        return false;
    }
    
    console.log(`✓ Backend directory found: ${backendPath}`);
    console.log(`✓ Backend main.py found: ${backendMainPath}`);

    // Run as module to fix import paths
    console.log(`Attempting to start backend with command: ${pythonCmd} -m backend.main`);
    console.log(`Working directory: ${backendPath}`);
    console.log(`Python path check: ${pythonCmd}`);
    
    // Try to find Python in common locations if not in PATH
    let pythonExecutable = pythonCmd;
    let pythonFound = false;
    
    // On Windows, try 'py' launcher first (recommended by Python.org)
    // But in packaged apps, 'py' might not work, so we'll also try to find the actual executable
    if (process.platform === 'win32') {
        try {
            // Try to get the actual Python path from py launcher
            let pyPath = null;
            try {
                // Use py -c to get the actual Python executable path
                const pyExecPath = execSync('py -c "import sys; print(sys.executable)"', { 
                    timeout: 2000, 
                    encoding: 'utf-8',
                    stdio: 'pipe'
                });
                pyPath = pyExecPath.trim();
                if (fs.existsSync(pyPath)) {
                    const version = execSync(`"${pyPath}" --version`, { timeout: 2000, encoding: 'utf-8' });
                    console.log(`✓ Python found via py launcher: ${pyPath} (${version.trim()})`);
                    pythonExecutable = pyPath;
                    pythonFound = true;
                }
            } catch (e) {
                // If that fails, try just 'py'
                const version = execSync('py --version', { timeout: 2000, encoding: 'utf-8' });
                console.log(`✓ Python launcher (py) found: ${version.trim()}`);
                pythonExecutable = 'py';
                pythonFound = true;
            }
        } catch (e) {
            console.log(`⚠ Python launcher (py) not found, trying 'python' command...`);
        }
    }
    
    // If py launcher didn't work, try python/python3 command
    if (!pythonFound) {
        try {
            // Try with full PATH environment
            const env = { ...process.env };
            // Ensure system PATH is included
            if (process.platform === 'win32') {
                const systemPaths = [
                    process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32') : '',
                    process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0') : '',
                ].filter(p => p);
                env.PATH = [
                    ...systemPaths,
                    ...(process.env.PATH ? process.env.PATH.split(path.delimiter) : []),
                    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Programs', 'Python') : '',
                    process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, 'Python') : '',
                    'C:\\Python310',
                    'C:\\Python311',
                    'C:\\Python312',
                    'C:\\Python313',
                ].filter(p => p).join(path.delimiter);
            }
            
            const version = execSync(`${pythonCmd} --version`, { 
                timeout: 2000, 
                encoding: 'utf-8',
                env: env
            });
            console.log(`✓ Python found in PATH: ${version.trim()}`);
            pythonFound = true;
        } catch (e) {
            console.log(`⚠ Python not found in PATH, trying common locations...`);
            console.log(`   Error: ${e.message}`);
        }
    }
    
    // If still not found, try using 'where' command on Windows to find Python
    if (!pythonFound && process.platform === 'win32') {
        try {
            // Try with extended PATH
            const env = { ...process.env };
            if (process.env.SystemRoot) {
                const systemPaths = [
                    path.join(process.env.SystemRoot, 'System32'),
                    path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0'),
                ];
                env.PATH = [
                    ...systemPaths,
                    ...(process.env.PATH ? process.env.PATH.split(path.delimiter) : [])
                ].join(path.delimiter);
            }
            
            const whereOutput = execSync('where python', { 
                timeout: 2000, 
                encoding: 'utf-8',
                env: env
            });
            const pythonPaths = whereOutput.trim().split('\n').filter(p => p.trim());
            if (pythonPaths.length > 0) {
                const firstPath = pythonPaths[0].trim();
                try {
                    const version = execSync(`"${firstPath}" --version`, { timeout: 2000, encoding: 'utf-8' });
                    pythonExecutable = firstPath;
                    pythonFound = true;
                    console.log(`✓ Found Python via 'where' command: ${pythonExecutable} (${version.trim()})`);
                } catch (e) {
                    console.log(`⚠ Found Python path but couldn't execute: ${firstPath}`);
                }
            }
        } catch (e) {
            console.log(`⚠ 'where python' command failed: ${e.message}`);
        }
    }
    
    // If still not found, try common installation paths
    if (!pythonFound && process.platform === 'win32') {
        // Try common Python installation paths on Windows
        const localAppData = process.env.LOCALAPPDATA || process.env.USERPROFILE ? path.join(process.env.USERPROFILE || '', 'AppData', 'Local') : '';
        const userProfile = process.env.USERPROFILE || '';
        
        const commonPaths = [
            // System-wide installations
            'C:\\Python310\\python.exe',
            'C:\\Python311\\python.exe',
            'C:\\Python312\\python.exe',
            'C:\\Python313\\python.exe',
            'C:\\Program Files\\Python310\\python.exe',
            'C:\\Program Files\\Python311\\python.exe',
            'C:\\Program Files\\Python312\\python.exe',
            'C:\\Program Files\\Python313\\python.exe',
            'C:\\Program Files (x86)\\Python310\\python.exe',
            'C:\\Program Files (x86)\\Python311\\python.exe',
            'C:\\Program Files (x86)\\Python312\\python.exe',
            // User installations (LOCALAPPDATA)
            localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python310', 'python.exe') : '',
            localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python311', 'python.exe') : '',
            localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python312', 'python.exe') : '',
            localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python313', 'python.exe') : '',
            // User installations (USERPROFILE)
            userProfile ? path.join(userProfile, 'AppData', 'Local', 'Programs', 'Python', 'Python310', 'python.exe') : '',
            userProfile ? path.join(userProfile, 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe') : '',
            userProfile ? path.join(userProfile, 'AppData', 'Local', 'Programs', 'Python', 'Python312', 'python.exe') : '',
            userProfile ? path.join(userProfile, 'AppData', 'Local', 'Programs', 'Python', 'Python313', 'python.exe') : '',
            // Also try without version number (latest)
            localAppData ? path.join(localAppData, 'Programs', 'Python', 'python.exe') : '',
            userProfile ? path.join(userProfile, 'AppData', 'Local', 'Programs', 'Python', 'python.exe') : '',
        ].filter(p => p); // Remove empty strings
        
        console.log(`Searching for Python in ${commonPaths.length} common locations...`);
        console.log(`LOCALAPPDATA: ${localAppData}`);
        console.log(`USERPROFILE: ${userProfile}`);
        
        for (const pyPath of commonPaths) {
            if (fs.existsSync(pyPath)) {
                try {
                    // Use spawn instead of execSync for better error handling
                    const version = execSync(`"${pyPath}" --version`, { 
                        timeout: 3000, 
                        encoding: 'utf-8',
                        windowsHide: true
                    });
                    pythonExecutable = pyPath;
                    pythonFound = true;
                    console.log(`✓ Found Python at: ${pythonExecutable} (${version.trim()})`);
                    break;
                } catch (e) {
                    console.log(`⚠ Python exists at ${pyPath} but couldn't execute: ${e.message}`);
                }
            } else {
                // Log first few attempts for debugging
                if (commonPaths.indexOf(pyPath) < 5) {
                    console.log(`  Checking: ${pyPath} - not found`);
                }
            }
        }
    }
    
    if (!pythonFound) {
        const errorMsg = 'Python not found!\n\n' +
            'Please install Python 3.10+ from https://www.python.org/downloads/\n' +
            'Make sure to check "Add Python to PATH" during installation.\n\n' +
            'After installation, restart the application.\n\n' +
            'If Python is already installed, try:\n' +
            '1. Restart your computer\n' +
            '2. Verify Python is accessible: Open Command Prompt and type "python --version"\n' +
            '3. If it works in CMD but not here, restart this application';
        console.error(`❌ ${errorMsg}`);
        console.error(`   Searched paths: ${process.env.PATH || 'PATH not set'}`);
        if (mainWindow) {
            mainWindow.webContents.send('backend-error', errorMsg);
        }
        return false;
    }
    
    // Verify Python can import required modules (optional check)
    console.log('Verifying Python dependencies...');
    try {
        // Use the same environment that will be used to spawn
        const checkEnv = { ...process.env };
        if (process.platform === 'win32') {
            const pathParts = (process.env.PATH || '').split(path.delimiter);
            const localAppData = process.env.LOCALAPPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : '');
            const additionalPaths = [
                process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32') : '',
                localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python310') : '',
                localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python311') : '',
                localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python312') : '',
            ].filter(p => p && !pathParts.includes(p));
            checkEnv.PATH = [...pathParts, ...additionalPaths].join(path.delimiter);
        }
        
        const checkDeps = execSync(`"${pythonExecutable}" -c "import fastapi, uvicorn, PIL"`, {
            timeout: 5000,
            encoding: 'utf-8',
            stdio: 'pipe',
            env: checkEnv
        });
        console.log('✓ Python dependencies are available');
    } catch (e) {
        console.warn('⚠ Python dependencies check failed - backend may fail to start');
        console.warn(`   Error: ${e.message}`);
        console.warn(`   Python executable: ${pythonExecutable}`);
        console.warn(`   Please ensure dependencies are installed: pip install -r requirements.txt`);
        console.warn(`   You can install them by running: "${pythonExecutable}" -m pip install -r "${path.join(backendPath, 'requirements.txt')}"`);
        // Don't fail here, let the backend try to start and show its own error
    }
    
    // Prepare Python command and arguments
    let spawnArgs = [];
    let finalPythonExecutable = pythonExecutable;
    
    // Build environment with proper PATH
    const env = { ...process.env };
    
    // Ensure PATH includes common Python locations on Windows
    if (process.platform === 'win32') {
        const pathParts = (process.env.PATH || '').split(path.delimiter);
        const localAppData = process.env.LOCALAPPDATA || (process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local') : '');
        
        const additionalPaths = [
            // System paths
            process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32') : '',
            process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0') : '',
            // User Python installations
            localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python310') : '',
            localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python311') : '',
            localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python312') : '',
            localAppData ? path.join(localAppData, 'Programs', 'Python', 'Python313') : '',
            localAppData ? path.join(localAppData, 'Programs', 'Python') : '',
            // System Python installations
            process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, 'Python', 'Python310') : '',
            process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, 'Python', 'Python311') : '',
            process.env.PROGRAMFILES ? path.join(process.env.PROGRAMFILES, 'Python', 'Python312') : '',
            'C:\\Python310',
            'C:\\Python311',
            'C:\\Python312',
            'C:\\Python313',
        ].filter(p => p && !pathParts.includes(p));
        
        env.PATH = [...pathParts, ...additionalPaths].join(path.delimiter);
        console.log(`Extended PATH with ${additionalPaths.length} additional locations`);
    }
    
    env.PYTHONUNBUFFERED = "1";
    
    if (app.isPackaged) {
        // In packaged mode, run main.py directly
        // Add the backend directory to PYTHONPATH
        const pythonPath = process.env.PYTHONPATH 
            ? `${backendPath}${path.delimiter}${process.env.PYTHONPATH}`
            : backendPath;
        
        env.PYTHONPATH = pythonPath;
        spawnArgs = [path.join(backendPath, 'main.py')];
        
        // If using 'py' launcher, try to use specific version
        if (finalPythonExecutable === 'py' && process.platform === 'win32') {
            // Try to use py -3.10 or just py -3
            spawnArgs = ['-3.10', path.join(backendPath, 'main.py')];
            // But if that doesn't work, we'll fall back to direct execution
        }
        
        console.log(`Spawning backend with: ${finalPythonExecutable} ${spawnArgs.join(' ')}`);
        console.log(`Working directory: ${backendPath}`);
        console.log(`PYTHONPATH: ${pythonPath}`);
        console.log(`PATH: ${env.PATH.substring(0, 200)}...`); // Log first 200 chars
        console.log(`Environment variables:`);
        console.log(`  PYTHONPATH: ${env.PYTHONPATH}`);
        console.log(`  PATH length: ${env.PATH.length} characters`);
        console.log(`  PYTHONUNBUFFERED: ${env.PYTHONUNBUFFERED}`);
        
        backendProcess = spawn(finalPythonExecutable, spawnArgs, {
            cwd: backendPath,
            env: env,
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true
        });
        
        console.log(`Backend process spawned:`);
        console.log(`  PID: ${backendProcess.pid}`);
        console.log(`  Executable: ${finalPythonExecutable}`);
        console.log(`  Args: ${spawnArgs.join(' ')}`);
        console.log(`  CWD: ${backendPath}`);
    } else {
        // In dev mode, use module import
        if (pythonExecutable === 'py' && process.platform === 'win32') {
            spawnArgs = ['-3.10', '-m', 'backend.main'];
        } else {
            spawnArgs = ['-m', 'backend.main'];
        }
        
        console.log(`Spawning backend with: ${finalPythonExecutable} ${spawnArgs.join(' ')}`);
        console.log(`Working directory: ${path.join(__dirname, '../')}`);
        
        backendProcess = spawn(finalPythonExecutable, spawnArgs, {
            cwd: path.join(__dirname, '../'),
            env: env,
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe']
        });
    }

    backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        // Uvicorn logs to stderr, but INFO messages are not errors
        if (!output.includes('ERROR') && !output.includes('Traceback')) {
            console.log(`Backend: ${output}`);
        }
    });

    backendProcess.stderr.on('data', (data) => {
        const output = data.toString();
        console.log(`Backend stderr: ${output}`); // Log all stderr for debugging
        
        // Check for various error patterns
        if (output.includes('ERROR') || output.includes('Traceback') || output.includes('Exception') || 
            output.includes('ModuleNotFoundError') || output.includes('ImportError') || 
            output.includes('No module named') || output.includes('cannot find') ||
            output.includes('FileNotFoundError') || output.includes('PermissionError')) {
            console.error(`Backend Error: ${output}`);
            let errorMsg = `Backend error detected:\n\n${output.substring(0, 500)}`;
            
            // Provide specific help based on error type
            if (output.includes('ModuleNotFoundError') || output.includes('No module named')) {
                const missingModule = output.match(/No module named ['"]([^'"]+)['"]/)?.[1] || 'unknown';
                errorMsg += `\n\n❌ Missing Python module: ${missingModule}\n\n`;
                errorMsg += 'This means Python dependencies are not installed.\n\n';
                errorMsg += 'To fix:\n';
                errorMsg += `1. Open Command Prompt as Administrator\n`;
                errorMsg += `2. Run: "${pythonExecutable}" -m pip install -r "${path.join(backendPath, 'requirements.txt')}"\n`;
                errorMsg += `   Or navigate to: ${backendPath}\n`;
                errorMsg += `   Then run: pip install -r requirements.txt\n`;
                errorMsg += '3. Restart the application\n\n';
                errorMsg += `Python used: ${pythonExecutable}`;
            } else if (output.includes('FileNotFoundError')) {
                errorMsg += '\n\nA required file is missing.\n';
                errorMsg += `Backend path: ${backendPath}\n`;
                errorMsg += 'Please check that all backend files are present.';
            } else if (output.includes('ImportError')) {
                errorMsg += '\n\nImport error detected.\n';
                errorMsg += `Backend path: ${backendPath}\n`;
                errorMsg += 'This may indicate a problem with the backend code structure.';
            }
            
            if (mainWindow) {
                mainWindow.webContents.send('backend-error', errorMsg);
            }
        } else if (output.includes('INFO') || output.includes('Uvicorn running') || output.includes('Application startup complete')) {
            console.log(`Backend: ${output}`);
            // Clear any previous errors when backend starts successfully
            if (mainWindow && output.includes('Uvicorn running')) {
                mainWindow.webContents.send('backend-ready');
            }
        } else {
            // Log other stderr messages for debugging
            console.log(`Backend: ${output}`);
        }
    });

    backendProcess.on('error', (err) => {
        console.error(`❌ Failed to start backend: ${err.message}`);
        console.error(`   Error code: ${err.code}`);
        console.error(`   Python executable used: ${pythonExecutable}`);
        console.error(`   Backend path: ${backendPath}`);
        console.error(`   Environment PATH length: ${process.env.PATH ? process.env.PATH.length : 0} chars`);
        console.error(`   Full error:`, err);
        
        let errorMsg = `Failed to start Python backend: ${err.message}\n\n`;
        if (err.code === 'ENOENT') {
            errorMsg += `Python executable not found.\n\n`;
            errorMsg += `Tried: ${pythonExecutable}\n\n`;
            errorMsg += `This usually happens when:\n`;
            errorMsg += `1. Python is not installed\n`;
            errorMsg += `2. Python is not in the system PATH\n`;
            errorMsg += `3. The application cannot access the system PATH\n\n`;
            errorMsg += `Solutions:\n`;
            errorMsg += `1. Install Python 3.10+ from https://www.python.org/downloads/\n`;
            errorMsg += `2. During installation, check "Add Python to PATH"\n`;
            errorMsg += `3. After installation, RESTART your computer\n`;
            errorMsg += `4. Verify Python works: Open Command Prompt and type "python --version"\n`;
            errorMsg += `5. If Python works in CMD but not here, try:\n`;
            errorMsg += `   - Restart the application\n`;
            errorMsg += `   - Run as Administrator\n`;
            errorMsg += `   - Check Windows Defender / Antivirus blocking\n\n`;
            errorMsg += `Note: Python is required for this application to work.`;
        } else {
            errorMsg += `Error code: ${err.code}\n\n`;
            errorMsg += `Make sure Python 3.10+ is installed and accessible.\n`;
            errorMsg += `Also ensure Python dependencies are installed:\n`;
            errorMsg += `  "${pythonExecutable}" -m pip install -r "${path.join(backendPath, 'requirements.txt')}"\n\n`;
            errorMsg += `Check the console for detailed error messages.`;
        }
        console.error(errorMsg);
        if (mainWindow) {
            mainWindow.webContents.send('backend-error', errorMsg);
        }
    });

    backendProcess.on('close', (code, signal) => {
        console.log(`[Backend] Process closed with code ${code}${signal ? ` (signal: ${signal})` : ''}`);
        if (code !== 0 && code !== null) {
            console.error(`❌ Backend process exited with code ${code}${signal ? ` (signal: ${signal})` : ''}`);
            console.error(`   Python executable used: ${pythonExecutable}`);
            console.error(`   Backend path: ${backendPath}`);
            console.error(`   Working directory: ${backendPath}`);
            
            let errorMsg = `Backend process exited with code ${code}.\n\n`;
            errorMsg += `Python: ${pythonExecutable}\n`;
            errorMsg += `Backend path: ${backendPath}\n\n`;
            
            if (code === 1) {
                errorMsg += 'This usually means:\n';
                errorMsg += '1. Python dependencies are not installed\n';
                errorMsg += '2. There is an error in the backend code\n';
                errorMsg += '3. Python version is incompatible\n\n';
                errorMsg += 'To fix:\n';
                errorMsg += '1. Open Command Prompt or PowerShell\n';
                errorMsg += `2. Navigate to: ${backendPath}\n`;
                errorMsg += '3. Run: pip install -r requirements.txt\n';
                errorMsg += '   Or: python -m pip install -r requirements.txt\n';
                errorMsg += '4. Check the console output above for specific error messages\n';
                errorMsg += '5. Restart the application';
            } else if (code === 9009 || code === 2) {
                errorMsg += 'Python executable not found.\n\n';
                errorMsg += 'Solutions:\n';
                errorMsg += '1. Install Python 3.10+ from https://www.python.org/downloads/\n';
                errorMsg += '2. During installation, check "Add Python to PATH"\n';
                errorMsg += '3. RESTART your computer after installation\n';
                errorMsg += '4. Verify Python is accessible:\n';
                errorMsg += '   - Open Command Prompt\n';
                errorMsg += '   - Type: python --version\n';
                errorMsg += '   - If it works there, restart this app';
            } else {
                errorMsg += `Unexpected exit code: ${code}\n`;
                errorMsg += 'Check the console for detailed error messages.';
            }
            if (mainWindow) {
                mainWindow.webContents.send('backend-error', errorMsg);
            }
        } else if (code === 0) {
            console.log(`✓ Backend process exited normally`);
        }
    });
    
    // Give backend a moment to start before checking
    console.log('Backend process spawned, waiting for it to start...');
    console.log(`Backend process PID: ${backendProcess.pid}`);
    console.log(`Backend process spawned: ${backendProcess.spawnfile}`);
    console.log(`Backend process args: ${backendProcess.spawnargs.join(' ')}`);

    return true;
}

// Helper function to load UI with fallback paths
function loadUI() {
    const distPaths = app.isPackaged ? [
        path.join(app.getAppPath(), 'dist', 'index.html'),
        path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html'),
        path.join(process.resourcesPath, 'dist', 'index.html'),
        path.join(path.dirname(process.execPath), 'resources', 'app.asar', 'dist', 'index.html'),
        path.join(path.dirname(process.execPath), 'resources', 'dist', 'index.html')
    ] : [
        path.join(__dirname, '../dist/index.html')
    ];
    
    for (const distPath of distPaths) {
        if (fs.existsSync(distPath)) {
            console.log(`Loading UI from: ${distPath}`);
            mainWindow.loadFile(distPath).catch(err => {
                console.error(`Failed to load UI from ${distPath}:`, err);
            });
            return true;
        }
    }
    
    console.error('Could not find UI file in any location. Tried:');
    distPaths.forEach(p => console.error(`  - ${p}`));
    return false;
}

// Check if backend is up
function checkBackend(callback, maxAttempts = 30) {
    let attempts = 0;
    const check = () => {
        attempts++;
        const req = http.get(`http://localhost:${BACKEND_PORT}/`, (res) => {
            if (res.statusCode === 200 || res.statusCode === 404) {
                // 404 is OK, it means the server is running
                console.log('Backend is ready!');
                callback();
            } else {
                console.log(`Backend returned status ${res.statusCode}, retrying... (${attempts}/${maxAttempts})`);
                if (attempts < maxAttempts) {
                    setTimeout(check, 1000);
                } else {
                    console.error('❌ Backend failed to start after maximum attempts');
                    // Still call callback to load UI (user will see error in UI)
                    callback();
                }
            }
        });
        req.on('error', (e) => {
            console.log(`Backend not ready yet (${e.message}), retrying... (${attempts}/${maxAttempts})`);
            if (attempts < maxAttempts) {
                setTimeout(check, 1000);
            } else {
                console.error('❌ Backend failed to start after maximum attempts');
                const errorMsg = 'Backend server did not start. Possible causes:\n' +
                    '1. Python is not installed or not in PATH\n' +
                    '2. Python dependencies are not installed (pip install -r requirements.txt)\n' +
                    '3. Port 8000 is already in use\n' +
                    'Check the console for detailed error messages.';
                if (mainWindow) {
                    mainWindow.webContents.send('backend-error', errorMsg);
                }
                // Still call callback to load UI (user will see error in UI)
                callback();
            }
        });
        req.setTimeout(2000, () => {
            req.destroy();
            if (attempts < maxAttempts) {
                setTimeout(check, 1000);
            } else {
                console.error('❌ Backend timeout after maximum attempts');
                callback();
            }
        });
    };
    check();
}


const waitForVite = (url, callback) => {
    http.get(url, (res) => {
        if (res.statusCode === 200) {
            callback();
        } else {
            setTimeout(() => waitForVite(url, callback), 500);
        }
    }).on('error', (err) => {
        setTimeout(() => waitForVite(url, callback), 500);
    });
};

app.on('ready', () => {
    // In dev mode (via runner), backend is already running.
    // In prod mode (packaged), we need to spawn it.
    const isDev = !app.isPackaged;

    createWindow();

    const startUrl = process.env.ELECTRON_START_URL || `http://127.0.0.1:5173`;

    if (isDev) {
        console.log("Dev mode: Assuming backend is managed by runner.");
        console.log(`Loading URL: ${startUrl}`);
        
        // Helper to check if a URL is accessible
        const checkUrl = (url) => {
            return new Promise((resolve) => {
                const req = http.get(url, (res) => {
                    resolve(res.statusCode === 200);
                });
                req.on('error', () => resolve(false));
                req.setTimeout(1000, () => {
                    req.destroy();
                    resolve(false);
                });
            });
        };
        
        // Wait a bit for Vite to be ready and try multiple ports if needed
        const tryLoadUrl = async (url, retries = 5) => {
            for (let i = 0; i < retries; i++) {
                // Check if URL is accessible first
                const isAccessible = await checkUrl(url);
                if (isAccessible) {
                    try {
                        await mainWindow.loadURL(url);
                        console.log(`✓ Successfully loaded: ${url}`);
                        return true;
                    } catch (e) {
                        console.log(`Failed to load ${url}: ${e.message}`);
                    }
                } else {
                    console.log(`URL ${url} not accessible yet, waiting... (${i + 1}/${retries})`);
                }
                
                // Try alternative ports
                const basePort = parseInt(url.match(/:(\d+)/)?.[1] || '5173');
                for (let port = basePort; port <= 5180; port++) {
                    const altUrl = `http://127.0.0.1:${port}`;
                    const altAccessible = await checkUrl(altUrl);
                    if (altAccessible) {
                        try {
                            await mainWindow.loadURL(altUrl);
                            console.log(`✓ Successfully loaded alternative URL: ${altUrl}`);
                            return true;
                        } catch (err) {
                            // Continue trying
                        }
                    }
                }
                
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
            // Fallback to dist
            console.warn("⚠ Failed to load dev URL, falling back to dist");
            const distPath = path.join(__dirname, '../dist/index.html');
            if (fs.existsSync(distPath)) {
                mainWindow.loadFile(distPath);
            } else {
                console.error("❌ Dist folder not found. Please run 'npm run build' first.");
            }
            return false;
        };
        
        // Wait a bit for services to start
        setTimeout(() => {
            tryLoadUrl(startUrl);
        }, 2000);
    } else {
        // In production, start backend and wait for it to be ready
        console.log("Production mode: Starting backend...");
        const backendStarted = startBackend();
        if (backendStarted) {
            // Give backend a moment to start before checking
            setTimeout(() => {
                // Wait for backend to be ready before loading the UI
                checkBackend(() => {
                    console.log("Loading production UI...");
                    loadUI();
                });
            }, 2000); // Wait 2 seconds for backend to start
        } else {
            // If backend failed to start, still try to load UI (user will see error)
            console.error("Backend failed to start, loading UI anyway...");
            loadUI();
        }
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
        const startUrl = process.env.ELECTRON_START_URL || `http://127.0.0.1:5173`;
        const isDev = !app.isPackaged;
        if (isDev) {
            setTimeout(() => {
                const checkUrl = (url) => {
                    return new Promise((resolve) => {
                        const req = http.get(url, (res) => {
                            resolve(res.statusCode === 200);
                        });
                        req.on('error', () => resolve(false));
                        req.setTimeout(1000, () => {
                            req.destroy();
                            resolve(false);
                        });
                    });
                };
                
                const tryLoadUrl = async (url) => {
                    const isAccessible = await checkUrl(url);
                    if (isAccessible) {
                        try {
                            await mainWindow.loadURL(url);
                            return;
                        } catch (e) {
                            console.error(`Failed to load ${url}: ${e.message}`);
                        }
                    }
                    
                    // Try alternative ports
                    for (let port = 5173; port <= 5180; port++) {
                        const altUrl = `http://127.0.0.1:${port}`;
                        const altAccessible = await checkUrl(altUrl);
                        if (altAccessible) {
                            try {
                                await mainWindow.loadURL(altUrl);
                                return;
                            } catch (err) {
                                // Continue
                            }
                        }
                    }
                    console.error("Failed to load dev URL, falling back to file");
                    loadUI();
                };
                tryLoadUrl(startUrl);
            }, 1000);
        } else {
            loadUI();
        }
    }
});

app.on('window-all-closed', function () {
    // On macOS, keep app running even when all windows are closed
    if (process.platform !== 'darwin') {
        if (backendProcess) {
            backendProcess.kill();
        }
        app.quit();
    }
});

app.on('before-quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});

// IPC Handlers
ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('select-file', async (event, filters) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: filters || [
            { name: 'YAML Files', extensions: ['yaml', 'yml'] },
            { name: 'All Files', extensions: ['*'] }
        ]
    });
    return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('read-file', async (event, filePath) => {
    try {
        return fs.readFileSync(filePath, 'utf-8');
    } catch (err) {
        throw new Error(`Failed to read file: ${err.message}`);
    }
});
