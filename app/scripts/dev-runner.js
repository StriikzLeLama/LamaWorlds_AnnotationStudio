const { spawn } = require('child_process');
const path = require('path');
const net = require('net');
const http = require('http');

// Configuration
const PYTHON_PORT = 8000;
const VITE_PORT = 5173;
const ROOT_DIR = path.join(__dirname, '..');

// Colors
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    fgGreen: "\x1b[32m",
    fgCyan: "\x1b[36m",
    fgRed: "\x1b[31m",
    fgYellow: "\x1b[33m"
};

const log = (name, msg, color = colors.fgGreen) => {
    console.log(`${color}[${name}] ${msg}${colors.reset}`);
};

const checkPort = (port) => {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(1000);
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });
        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });
        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });
        socket.connect(port, '127.0.0.1');
    });
};

const waitForPort = async (port, name, maxAttempts = 60) => {
    log('System', `Waiting for ${name} on port ${port}...`, colors.fgYellow);
    let attempts = 0;
    while (attempts < maxAttempts) {
        if (await checkPort(port)) {
            log('System', `${name} is ready!`, colors.fgGreen);
            return true;
        }
        if (attempts % 10 === 0 && attempts > 0) {
            log('System', `Still waiting for ${name}... (${attempts}/${maxAttempts})`, colors.fgYellow);
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
    }
    log('System', `Timeout waiting for ${name} after ${maxAttempts} attempts`, colors.fgRed);
    return false;
};

// Find the actual port Vite is running on
const findVitePort = async (startPort = 5173, maxPort = 5180) => {
    for (let port = startPort; port <= maxPort; port++) {
        if (await checkPort(port)) {
            // Try to verify it's Vite by checking the response
            try {
                const response = await new Promise((resolve, reject) => {
                    http.get(`http://127.0.0.1:${port}`, (res) => {
                        resolve(res.statusCode);
                    }).on('error', reject);
                });
                if (response === 200) {
                    return port;
                }
            } catch (e) {
                // Continue checking
            }
        }
    }
    return null;
};

// Start Processes
(async () => {
    // Verify backend directory exists
    const backendDir = path.join(ROOT_DIR, 'backend');
    const fs = require('fs');
    if (!fs.existsSync(backendDir)) {
        log('Backend', `Backend directory not found: ${backendDir}`, colors.fgRed);
        process.exit(1);
    }
    
    // 1. Start Python Backend
    log('Backend', 'Starting Python Server...', colors.fgCyan);
    log('Backend', `Working directory: ${ROOT_DIR}`, colors.fgYellow);
    const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
    
    let backendOutput = '';
    const backend = spawn(pythonCmd, ['-m', 'backend.main'], {
        cwd: ROOT_DIR,
        env: { ...process.env, PYTHONUNBUFFERED: "1" },
        stdio: ['ignore', 'pipe', 'pipe']
    });

    backend.stdout.on('data', (data) => {
        const output = data.toString();
        backendOutput += output;
        process.stdout.write(`[Backend] ${output}`);
    });

    backend.stderr.on('data', (data) => {
        const output = data.toString();
        backendOutput += output;
        // Uvicorn logs to stderr, but INFO messages are not errors
        if (output.includes('ERROR') || output.includes('Traceback') || output.includes('Exception')) {
            process.stderr.write(`[Backend Error] ${output}`);
        } else {
            process.stdout.write(`[Backend] ${output}`);
        }
    });

    backend.on('error', (err) => {
        log('Backend', `Failed to start Python backend: ${err.message}`, colors.fgRed);
        log('Backend', 'Make sure Python is installed and dependencies are installed (pip install -r requirements.txt)', colors.fgYellow);
        process.exit(1);
    });

    backend.on('exit', (code) => {
        if (code !== 0 && code !== null) {
            log('Backend', `Backend process exited with code ${code}`, colors.fgRed);
            log('Backend', `Output: ${backendOutput}`, colors.fgYellow);
        }
    });

    if (!(await waitForPort(PYTHON_PORT, 'Backend'))) {
        log('Backend', 'Backend failed to start. Check if port 8000 is available and Python dependencies are installed.', colors.fgRed);
        log('Backend', `Last output: ${backendOutput}`, colors.fgYellow);
        backend.kill();
        process.exit(1);
    }

    // 2. Start Vite
    log('Frontend', 'Starting Vite...', colors.fgCyan);
    const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const vite = spawn(npxCmd, ['vite'], {
        cwd: ROOT_DIR,
        stdio: 'inherit',
        shell: true
    });

    vite.on('error', (err) => {
        log('Frontend', `Failed to start Vite: ${err.message}`, colors.fgRed);
        backend.kill();
        process.exit(1);
    });

    // Wait for Vite to start and find the actual port
    await new Promise(resolve => setTimeout(resolve, 2000)); // Give Vite time to start
    
    let actualVitePort = VITE_PORT;
    const foundPort = await findVitePort(VITE_PORT, 5180);
    if (foundPort) {
        actualVitePort = foundPort;
        if (foundPort !== VITE_PORT) {
            log('Frontend', `Vite is running on port ${foundPort} (${VITE_PORT} was in use)`, colors.fgYellow);
        }
    } else {
        // Fallback: try to wait for the default port
        if (!(await waitForPort(VITE_PORT, 'Frontend'))) {
            log('Frontend', 'Could not detect Vite port, trying alternative ports...', colors.fgYellow);
            // Try alternative ports
            for (let port = 5174; port <= 5180; port++) {
                if (await checkPort(port)) {
                    actualVitePort = port;
                    log('Frontend', `Found Vite on port ${port}`, colors.fgGreen);
                    break;
                }
            }
        }
    }

    if (!actualVitePort) {
        log('Frontend', 'Failed to find Vite server', colors.fgRed);
        backend.kill();
        vite.kill();
        process.exit(1);
    }

    // 3. Start Electron
    log('Electron', 'Launching Application...', colors.fgCyan);
    log('Electron', `Connecting to Vite on port ${actualVitePort}`, colors.fgYellow);
    const electron = spawn(npxCmd, ['electron', '.'], {
        cwd: ROOT_DIR,
        env: { ...process.env, ELECTRON_START_URL: `http://127.0.0.1:${actualVitePort}` },
        stdio: 'inherit',
        shell: true
    });

    electron.on('error', (err) => {
        log('Electron', `Failed to start Electron: ${err.message}`, colors.fgRed);
        backend.kill();
        vite.kill();
        process.exit(1);
    });

    electron.on('close', (code) => {
        log('System', 'Application closed. Cleaning up...', colors.fgYellow);
        backend.kill();
        vite.kill();
        process.exit(code);
    });

})();
