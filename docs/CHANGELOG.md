# Changelog

## [1.2.0] — 2026-08

### Changed
- **Desktop shell:** migrated from Electron to **Tauri 2** (Rust WebView)
- **UI language:** English by default, French toggle (`EN` ↔ `FR`)
- **Branding:** Lama Worlds logos / generated Tauri icons
- **Docs:** consolidated README / BUILD; removed obsolete Electron docs

### Removed
- Electron main/preload/loading and electron-builder scripts
- Unused `framer-motion` dependency
- Redundant meta docs (`FILES_REMOVED`, `FINAL_SUMMARY`, old code/Vision idea dumps)

### Added
- `src-tauri/` shell: native dialogs, file read, asset protocol, Python backend spawn
- `react/src/desktopApi.js` bridge
- `react/src/i18n/` translation tables

## [1.1.0] — 2024

### Added
- Layout manager, themes, mini-map, advanced search
- Batch image actions, workflow modes, export history
- Vision LLM assistant (verify / annotate / modify)
- Collapsible stats / analytics / validation panels

### Fixed
- Panel scrollbar / overflow issues
- Rendering performance improvements

## [1.0.0]

Initial YOLO annotation studio release (Electron + React + FastAPI).
