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

// Find Python executable
const findPython = () => {
    const pythonCommands = process.platform === 'win32' 
        ? ['py', 'python', 'python3', 'python.exe']
        : ['python3', 'python'];
    
    const { execSync } = require('child_process');
    
    for (const cmd of pythonCommands) {
        try {
            const version = execSync(`${cmd} --version`, { timeout: 2000, encoding: 'utf-8' });
            // Check if version is 3.10+
            const versionMatch = version.match(/Python (\d+)\.(\d+)/);
            if (versionMatch) {
                const major = parseInt(versionMatch[1]);
                const minor = parseInt(versionMatch[2]);
                if (major >= 3 && minor >= 10) {
                    log('System', `Found Python ${version.trim()} using '${cmd}'`, colors.fgGreen);
                    return cmd;
                }
            }
        } catch (e) {
            // Continue to next command
        }
    }
    
    // Try Windows-specific paths
    if (process.platform === 'win32') {
        const commonPaths = [
            'C:\\Python310\\python.exe',
            'C:\\Python311\\python.exe',
            'C:\\Python312\\python.exe',
            'C:\\Python313\\python.exe',
            path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python310', 'python.exe'),
            path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python311', 'python.exe'),
            path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Python', 'Python312', 'python.exe'),
        ];
        
        for (const pyPath of commonPaths) {
            if (require('fs').existsSync(pyPath)) {
                try {
                    const version = execSync(`"${pyPath}" --version`, { timeout: 2000, encoding: 'utf-8' });
                    log('System', `Found Python ${version.trim()} at ${pyPath}`, colors.fgGreen);
                    return pyPath;
                } catch (e) {
                    // Continue
                }
            }
        }
    }
    
    return null;
};

// Check if Python dependencies are installed
const checkPythonDeps = async (pythonCmd) => {
    try {
        const { execSync } = require('child_process');
        execSync(`${pythonCmd} -c "import fastapi, uvicorn, PIL"`, { 
            timeout: 3000,
            stdio: 'ignore',
            cwd: ROOT_DIR
        });
        return true;
    } catch (e) {
        return false;
    }
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
    
    // Find Python
    log('System', 'Looking for Python 3.10+...', colors.fgCyan);
    const pythonCmd = findPython();
    if (!pythonCmd) {
        log('Backend', 'Python 3.10+ not found!', colors.fgRed);
        log('Backend', 'Please install Python 3.10+ from https://www.python.org/downloads/', colors.fgYellow);
        log('Backend', 'Make sure to check "Add Python to PATH" during installation', colors.fgYellow);
        process.exit(1);
    }
    
    // Check dependencies
    log('System', 'Checking Python dependencies...', colors.fgCyan);
    const depsInstalled = await checkPythonDeps(pythonCmd);
    if (!depsInstalled) {
        log('Backend', 'Python dependencies not found!', colors.fgYellow);
        log('Backend', 'Installing dependencies...', colors.fgCyan);
        try {
            const { execSync } = require('child_process');
            execSync(`${pythonCmd} -m pip install -r requirements.txt`, {
                cwd: ROOT_DIR,
                stdio: 'inherit'
            });
            log('Backend', 'Dependencies installed successfully!', colors.fgGreen);
        } catch (e) {
            log('Backend', 'Failed to install dependencies automatically', colors.fgRed);
            log('Backend', 'Please run manually: pip install -r requirements.txt', colors.fgYellow);
            process.exit(1);
        }
    } else {
        log('System', 'Python dependencies OK', colors.fgGreen);
    }
    
    // 1. Start Python Backend
    log('Backend', 'Starting Python Server...', colors.fgCyan);
    log('Backend', `Working directory: ${ROOT_DIR}`, colors.fgYellow);
    
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
        log('Backend', `Python command used: ${pythonCmd}`, colors.fgYellow);
        if (err.code === 'ENOENT') {
            log('Backend', 'Python executable not found. Please install Python 3.10+', colors.fgYellow);
        }
        log('Backend', 'Make sure Python is installed and dependencies are installed (pip install -r requirements.txt)', colors.fgYellow);
        process.exit(1);
    });

    backend.on('exit', (code) => {
        if (code !== 0 && code !== null) {
            log('Backend', `Backend process exited with code ${code}`, colors.fgRed);
            if (backendOutput) {
                log('Backend', `Last output: ${backendOutput.substring(backendOutput.length - 500)}`, colors.fgYellow);
            }
            // Don't exit here, let the port check handle it
        }
    });

    if (!(await waitForPort(PYTHON_PORT, 'Backend'))) {
        log('Backend', 'Backend failed to start. Check if port 8000 is available and Python dependencies are installed.', colors.fgRed);
        if (backendOutput) {
            const lastLines = backendOutput.split('\n').slice(-10).join('\n');
            log('Backend', `Last output:\n${lastLines}`, colors.fgYellow);
        }
        backend.kill();
        process.exit(1);
    }
    
    log('Backend', 'Backend is ready!', colors.fgGreen);

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
