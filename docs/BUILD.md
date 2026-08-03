# Build guide

## Prerequisites

- Node.js 18+
- Rust toolchain (`rustup`)
- Windows: MSVC Build Tools + WebView2
- Python 3.10+ (runtime dependency for the FastAPI sidecar)

## Development

```bash
cd app
npm install
pip install -r requirements.txt
npm run dev
```

## Production build

```bash
cd app
npm run build:app
```

Windows NSIS-focused:

```bash
npm run build:win
```

Tauri packages the React `dist/` output and embeds `backend/` + `requirements.txt` as bundle resources (see `src-tauri/tauri.conf.json`).

## Python on end-user machines

The desktop shell starts `python` / `py` and runs `backend/main.py`. Users need:

1. Python 3.10+ on PATH (or the Windows `py` launcher)
2. Dependencies: `pip install -r requirements.txt`

You can use `install-backend-deps.bat` / `install-backend-deps.ps1` next to the app resources.

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Port 5173 in use | Stop the other Vite/process, or close stale terminals |
| Backend error toast | Install Python deps; check `npm run diagnose` |
| Blank images | Ensure Tauri asset protocol scopes allow dataset paths (configured for `**`) |
| Rust / link errors | Install Visual Studio Build Tools (C++) |

## Icons

```bash
cd app
npx tauri icon assets/Logo/app-icon-source.png
```
