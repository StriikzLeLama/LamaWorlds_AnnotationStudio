const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const http = require('http');

let mainWindow;
let backendProcess;
const BACKEND_PORT = 8000;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        backgroundColor: '#0a0a12', // Dark navy
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false // Allow local file loading for images
        },
        frame: true,
        show: false, // Don't show until ready
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        titleBarOverlay: process.platform === 'win32' ? {
            color: '#0a0a12',
            symbolColor: '#00e0ff'
        } : undefined
    });
    
        // Keep menu bar visible
        // Menu bar is visible by default

    // DevTools disabled - uncomment to enable
    // if (!app.isPackaged) {
    //     mainWindow.webContents.openDevTools();
    // }

    mainWindow.loadFile(path.join(__dirname, 'loading.html'));

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
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
    console.log('Starting Python backend...');
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    // In packaged app, use app.getAppPath() to get the correct path
    const appPath = app.isPackaged 
        ? path.dirname(process.execPath)
        : path.join(__dirname, '../');
    
    const backendPath = app.isPackaged
        ? path.join(appPath, 'resources', 'backend')
        : path.join(appPath, 'backend');

    console.log(`Backend path: ${backendPath}`);
    console.log(`Python command: ${pythonCmd}`);

    // Check if backend directory exists
    if (!fs.existsSync(backendPath)) {
        console.error(`Backend directory not found: ${backendPath}`);
        return false;
    }

    // Run as module to fix import paths
    backendProcess = spawn(pythonCmd, ['-m', 'backend.main'], {
        cwd: backendPath,
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
        shell: true
    });

    backendProcess.stdout.on('data', (data) => {
        const output = data.toString();
        // Uvicorn logs to stderr, but INFO messages are not errors
        if (!output.includes('ERROR') && !output.includes('Traceback')) {
            console.log(`Backend: ${output}`);
        }
    });

    backendProcess.stderr.on('data', (data) => {
        const output = data.toString();
        if (output.includes('ERROR') || output.includes('Traceback') || output.includes('Exception')) {
            console.error(`Backend Error: ${output}`);
        } else {
            console.log(`Backend: ${output}`);
        }
    });

    backendProcess.on('error', (err) => {
        console.error(`Failed to start backend: ${err.message}`);
        let errorMsg = `Failed to start Python backend: ${err.message}\n\n`;
        if (err.code === 'ENOENT') {
            errorMsg += `Python is not found in your PATH.\n`;
            errorMsg += `Please install Python from https://www.python.org/downloads/\n`;
            errorMsg += `Make sure to check "Add Python to PATH" during installation.`;
        } else {
            errorMsg += `Make sure Python is installed and in your PATH.\n`;
            errorMsg += `Also ensure Python dependencies are installed:\n`;
            errorMsg += `  pip install -r requirements.txt`;
        }
        console.error(errorMsg);
        if (mainWindow) {
            mainWindow.webContents.send('backend-error', errorMsg);
        }
    });

    backendProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
            console.log(`Backend process exited with code ${code}`);
        }
    });

    return true;
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
                if (attempts < maxAttempts) {
                    setTimeout(check, 1000);
                } else {
                    console.error('Backend failed to start after maximum attempts');
                    if (mainWindow) {
                        mainWindow.webContents.send('backend-error', 'Backend failed to start');
                    }
                }
            }
        });
        req.on('error', (e) => {
            if (attempts < maxAttempts) {
                setTimeout(check, 1000);
            } else {
                console.error('Backend failed to start after maximum attempts');
                if (mainWindow) {
                    mainWindow.webContents.send('backend-error', 'Backend failed to start');
                }
            }
        });
        req.setTimeout(2000, () => {
            req.destroy();
            if (attempts < maxAttempts) {
                setTimeout(check, 1000);
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
        // Wait a bit for Vite to be ready and try multiple ports if needed
        const tryLoadUrl = async (url, retries = 3) => {
            for (let i = 0; i < retries; i++) {
                try {
                    await mainWindow.loadURL(url);
                    console.log(`Successfully loaded: ${url}`);
                    return;
                } catch (e) {
                    console.log(`Attempt ${i + 1} failed for ${url}, trying alternative ports...`);
                    // Try alternative ports
                    const basePort = 5173;
                    for (let port = basePort; port <= 5180; port++) {
                        const altUrl = `http://127.0.0.1:${port}`;
                        try {
                            await mainWindow.loadURL(altUrl);
                            console.log(`Successfully loaded alternative URL: ${altUrl}`);
                            return;
                        } catch (err) {
                            // Continue trying
                        }
                    }
                    if (i < retries - 1) {
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
            // Fallback to dist
            console.error("Failed to load dev URL, falling back to file");
            mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
        };
        
        setTimeout(() => {
            tryLoadUrl(startUrl);
        }, 1500);
    } else {
        // In production, start backend and wait for it to be ready
        console.log("Production mode: Starting backend...");
        const backendStarted = startBackend();
        if (backendStarted) {
            // Wait for backend to be ready before loading the UI
            checkBackend(() => {
                console.log("Loading production UI...");
                mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
            });
        } else {
            // If backend failed to start, still try to load UI (user will see error)
            console.error("Backend failed to start, loading UI anyway...");
            mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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
                const tryLoadUrl = async (url) => {
                    try {
                        await mainWindow.loadURL(url);
                        return;
                    } catch (e) {
                        // Try alternative ports
                        for (let port = 5173; port <= 5180; port++) {
                            const altUrl = `http://127.0.0.1:${port}`;
                            try {
                                await mainWindow.loadURL(altUrl);
                                return;
                            } catch (err) {
                                // Continue
                            }
                        }
                        console.error("Failed to load dev URL, falling back to file");
                        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
                    }
                };
                tryLoadUrl(startUrl);
            }, 1000);
        } else {
            mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
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
