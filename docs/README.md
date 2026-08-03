# User guide

Lama Worlds Annotation Studio — annotate YOLO datasets locally.

## Open a dataset

1. Click **Dataset** (or press `Ctrl+O`)
2. Select a folder with images (and optional `labels/`, `classes.txt`)

Supported layouts:

```
my_dataset/
├── images/
├── labels/          # created if missing
└── classes.txt
```

or a flat folder of images.

YOLO label lines: `class_id x_center y_center width height` (normalized 0–1).

## Annotate

1. Pick a class in the left sidebar
2. Drag on the canvas to draw a box
3. Annotations save automatically to the backend

Tips:

- `Ctrl+Click` / drag-select for multi-select
- Keys `1–9` change class
- `Ctrl+D` duplicate, `Delete` remove
- `Q` quick draw, `M` measurements, `T` toggle boxes, `F11` fullscreen

## Vision LLM

Sidebar → **Vision LLM Assistant**: verify / annotate / modify via OpenAI, Claude, GGUF, or custom API.

## Export

Right panel → **Export**: COCO, Pascal VOC, report, full project, merge datasets.

## Language

Top bar language button: **EN** (default) ↔ **FR**. Preference is stored in `localStorage`.

## Themes

**Dark** (default), **Light**, **Studio** — via the Theme control.

## Keyboard shortcuts (common)

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Open dataset |
| `←` / `→` | Prev / next image |
| `N` / `Shift+N` | Next / prev unannotated |
| `Ctrl+Z` / `Ctrl+Y` | Undo / redo |
| `Ctrl++` / `Ctrl+-` / `Ctrl+0` | Zoom in / out / reset |
| `R` / `Shift+R` | Rotate |
| `H` / `V` | Flip H / V |
| `?` / `F1` | Shortcuts help |

Press `?` in the app for the full list.
