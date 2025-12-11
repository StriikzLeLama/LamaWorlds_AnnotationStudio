# Build Guide for .exe

## Prerequisites

1. **Node.js** installed (v20+)
2. **Python 3.10+** installed on the system
3. **npm** installed

## Build Steps

### 1. Install dependencies (if not already done)

```bash
npm install
```

### 2. Build React frontend

```bash
npm run build
```

This command compiles React with Vite and creates the `dist/` folder.

### 3. Build Electron application

```bash
npm run build:win
```

Or for a complete build:

```bash
npm run build:app
```

## Result

The `.exe` file will be created in the `release/` folder:
- `Lama Worlds Annotation Studio-1.0.0-Setup.exe` (NSIS installer)

## Python Installation Required

⚠️ **Important**: The application requires Python installed on the target system.

The user must have:
- Python 3.10+ installed
- Python dependencies installed: `pip install -r requirements.txt`

### Development Mode (Recommended)

To avoid Python detection issues in build mode, you can use development mode:

```bash
npm run dev
```

This command automatically starts:
- Python backend (FastAPI) on port 8000
- Vite server (React) on port 5173
- Electron application

**Development mode advantages:**
- ✅ Automatic and reliable Python detection
- ✅ Hot-reload for development
- ✅ Detailed real-time logs
- ✅ No PATH issues
- ✅ Optimal performance with React optimizations

### Production Mode (Build)

To create an .exe, follow the steps above, but note that:
- The end user must have Python installed
- Dependencies must be installed with `install-backend-deps.bat`
- Python detection may be problematic depending on the environment

### Option 1: Install Python automatically

To include Python in the installer, you can use a custom installation script.

### Option 2: Create a launcher that checks Python

The application automatically checks if Python is installed on startup.

## Build Structure

```
release/
├── Lama Worlds Annotation Studio-1.0.0-Setup.exe
└── win-unpacked/ (development folder)
```

## Notes

- The build includes the Python backend but **not** the Python interpreter
- The end user must install Python separately
- For a standalone build, consider PyInstaller for the backend
- The application is optimized for performance with React.memo, useCallback, and useMemo
- To use Vision LLM with GGUF models, install `llama-cpp-python`: `pip install llama-cpp-python`
- Python dependencies are listed in `requirements.txt`

## Troubleshooting

### Error: "dist folder not found"
→ Run `npm run build` first

### Error: "electron-builder not found"
→ Run `npm install`

### Build too large
→ Normal, Electron includes Chromium (~100-200 MB)

### Network error when opening file or importing YAML

If you get a network error ("Network Error" or "ECONNREFUSED") in the compiled application:

1. **Check that Python is installed**:
   - Python 3.7+ must be installed and accessible in your PATH
   - Download from: https://www.python.org/downloads/
   - During installation, check "Add Python to PATH"

2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   Or if you have the compiled app, navigate to `resources/backend` and run:
   ```bash
   pip install fastapi uvicorn pillow numpy opencv-python python-multipart watchdog pyyaml requests llama-cpp-python
   ```

3. **Check backend logs**:
   - The application console should display backend startup messages
   - If you see errors about missing modules, install them with pip

4. **Check that the backend starts**:
   - The backend should start automatically when the application launches
   - Check the console for the "Backend is ready!" message

5. **Check port 8000**:
   - The backend uses port 8000 by default
   - Make sure no other application is using this port

## Included Optimizations

The application includes several performance optimizations:
- **React.memo** to avoid unnecessary re-renders
- **useCallback** to memoize functions
- **useMemo** to memoize expensive calculations
- **Smart annotation cache**
- **Lazy loading** of images
- **Automatic centering** of images for better UX
