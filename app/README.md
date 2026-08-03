# Developer notes (`app/`)

Working directory for npm / Tauri / Python backend.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Tauri desktop + Vite + Python backend |
| `npm run dev:vite` | Vite only (UI without shell) |
| `npm run build` | Build React → `dist/` |
| `npm run build:app` | Full Tauri production build |
| `npm run build:win` | Tauri NSIS bundle |
| `npm run diagnose` | Check Python / deps |
| `npm run test-python` | Quick Python smoke test |

## Stack

- **Shell:** Tauri 2 (`src-tauri/`) — dialogs, file read, asset protocol, backend spawn
- **UI:** React 18 + Vite (`react/`) — i18n EN/FR via `react/src/i18n/`
- **Bridge:** `react/src/desktopApi.js` (exposed as `window.electronAPI` for legacy call sites)
- **API:** FastAPI (`backend/`) on `http://127.0.0.1:8000`

## Backend

```bash
pip install -r requirements.txt
```

Optional Vision LLM (GGUF): `llama-cpp-python` is listed in `requirements.txt`.

Helper scripts:

- `install-backend-deps.bat` / `install-backend-deps.ps1`
- `scripts/diagnose-python.js`

## Icons

Brand assets live in `assets/Logo/`. Tauri icons are generated under `src-tauri/icons/` (`npx tauri icon assets/Logo/app-icon-source.png`).
