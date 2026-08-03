# Lama Worlds Annotation Studio

Local YOLO image annotation desktop app — **Tauri 2** + **React** + **FastAPI**.

![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Stack](https://img.shields.io/badge/desktop-Tauri%202-teal.svg)

## Features

- Draw / edit YOLO bounding boxes on a Konva canvas (zoom, pan, rotate, flip)
- Class manager, YAML import, YOLO pre-annotation, Vision LLM assistant
- Search, filters, batch image actions, export COCO / VOC / project
- Stats, analytics, validation, measurements, themes (Dark / Light / Studio)
- UI language: **English** (default) with a **French** toggle

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| Rust (rustup) | stable |
| MSVC Build Tools | Windows |
| Python | 3.10+ |
| WebView2 | Windows (usually preinstalled) |

## Quick start

```bash
cd app
npm install
pip install -r requirements.txt
npm run dev
```

`npm run dev` starts Tauri → Vite (`127.0.0.1:5173`) and spawns the FastAPI backend (`:8000`).

## Build

```bash
cd app
npm run build:app
```

Windows installer / bundle is produced by Tauri (`src-tauri`).

## Project layout

```
LamaWorlds_AnnotationStudio/
├── README.md                 # This file
├── docs/                     # User guide, build notes, changelog
└── app/
    ├── README.md
    ├── package.json
    ├── requirements.txt
    ├── backend/              # FastAPI (YOLO, export, Vision LLM)
    ├── react/                # React + Vite UI
    ├── src-tauri/            # Tauri / Rust shell
    ├── assets/Logo/          # Brand assets
    └── scripts/              # Python diagnose helpers
```

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/README.md](docs/README.md) | User guide & shortcuts |
| [docs/BUILD.md](docs/BUILD.md) | Build & packaging |
| [docs/CHANGELOG.md](docs/CHANGELOG.md) | Version history |
| [app/README.md](app/README.md) | App-folder developer notes |

## License

MIT — see [LICENSE](LICENSE).

**Author:** StriikzLeLama
