# Lama Worlds Annotation Studio

Annotateur YOLO local — **Tauri 2** (Rust) + **React** + **FastAPI** (Python).

## Prérequis

- Node.js 18+
- Rust (rustup) + MSVC Build Tools (Windows)
- Python 3.10+ avec `pip install -r requirements.txt`
- WebView2 (Windows, en général déjà installé)

## Développement

```bash
cd app
npm install
pip install -r requirements.txt
npm run dev
```

`npm run dev` lance Tauri, qui démarre Vite (`5173`) et spawne le backend Python (`8000`).

## Build

```bash
npm run build:app
```

## Architecture

| Couche | Techno |
|--------|--------|
| Shell desktop | Tauri 2 / Rust (`src-tauri/`) |
| UI | React + Vite (`react/`) |
| Bridge | `react/src/desktopApi.js` (compat `window.electronAPI`) |
| API / YOLO / export | FastAPI (`backend/`) |

L’ancien shell Electron (`electron/`) n’est plus utilisé par les scripts npm.
