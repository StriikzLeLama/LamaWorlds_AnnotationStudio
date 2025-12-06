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
        // Frameless for custom title bar if desired, but standard for now
        frame: true,
        show: false, // Don't show until ready
        titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
        titleBarOverlay: process.platform === 'win32' ? {
            color: '#0a0a12',
            symbolColor: '#00e0ff'
        } : undefined
    });

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

    // Run as module to fix import paths
    backendProcess = spawn(pythonCmd, ['-m', 'backend.main'], {
        cwd: backendPath,
        env: { ...process.env, PYTHONUNBUFFERED: "1" }
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
    });

    backendProcess.on('close', (code) => {
        if (code !== 0 && code !== null) {
            console.log(`Backend process exited with code ${code}`);
        }
    });
}

// Check if backend is up
function checkBackend(callback) {
    http.get(`http://localhost:${BACKEND_PORT}/`, (res) => {
        if (res.statusCode === 200) {
            callback();
        }
    }).on('error', (e) => {
        setTimeout(() => checkBackend(callback), 1000);
    });
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

    if (isDev) {
        console.log("Dev mode: Assuming backend is managed by runner.");
    } else {
        // In production, always start backend
        startBackend();
    }

    createWindow();

    const startUrl = process.env.ELECTRON_START_URL || `http://127.0.0.1:5173`;

    if (isDev) {
        console.log(`Loading URL: ${startUrl}`);
        // Wait a bit for Vite to be ready
        setTimeout(() => {
            mainWindow.loadURL(startUrl).catch(e => {
                console.error("Failed to load dev URL, falling back to file", e);
                mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
            });
        }, 1000);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
        const startUrl = process.env.ELECTRON_START_URL || `http://127.0.0.1:5173`;
        const isDev = !app.isPackaged;
        if (isDev) {
            setTimeout(() => {
                mainWindow.loadURL(startUrl).catch(e => {
                    console.error("Failed to load dev URL", e);
                    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
                });
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
