# 🦙 Lama Worlds Annotation Studio

A modern and powerful image annotation tool for YOLO datasets, with an elegant user interface and advanced features.

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## ✨ Features

### 🎨 Modern Interface
- **Dark interface** with futuristic neon design
- **Multiple themes**: Dark, Light, and Cyberpunk (customizable)
- **Interactive canvas** with zoom, pan, rotation, and flip
- **Image thumbnails** with annotation preview
- **Grid and list views** for quick navigation
- **Fullscreen mode** for maximum focus (F11)
- **Progress bar** to track your work
- **Real-time statistics panel** (collapsible)
- **Integrated validation panel** (collapsible)
- **Analytics panel** with advanced visualizations (collapsible)
- **Layout manager** with customizable presets (Annotation Focus, Stats Focus, Balanced, Minimal)
- **Mini-map** for quick dataset navigation
- **Image preview tooltip** on hover

### 📝 Advanced Annotation
- **Rectangular annotations** (YOLO format)
- **Customizable class system** with colors
- **Multiple selection** with drag rectangle and Ctrl+click
- **Batch operations** (delete all annotations of a class)
- **Annotation duplication** (Ctrl+D)
- **Comments on annotations** for personal notes
- **Automatic validation** of annotations (errors, warnings, duplicates)
- **YOLO pre-annotation** with custom model
- **Smart zoom** on selection (Z key)

### 🔍 Navigation & Search
- **Image search** in real-time
- **Search in annotations** (classes, comments, tags)
- **Advanced search** with multiple filters:
  - Text search in image names and annotations
  - Filter by class
  - Filter by annotation size (min/max)
  - Filter by date modified
  - Filter by tags
- **Basic filters**: All / Annotated / Empty / By class
- **Smart navigation**: next unannotated image (N)
- **Navigation history** (Alt+←/→)
- **Complete keyboard navigation** (arrows, Home/End)
- **Complete and customizable keyboard shortcuts**
- **Mini-map** for visual dataset overview
- **Image preview** on hover with annotation details

### 💾 Project Management
- **Automatic state saving**
- **Restore on restart**
- **Export/Import complete projects** (backup/restore)
- **Merge multiple datasets** with automatic class mapping
- **Import YAML classes** (YOLO format)
- **Export formats**: COCO, Pascal VOC, Preview, Report, Project
- **Export history** with quick re-export
- **Class templates** (save/load)
- **Tags/metadata** for images
- **Smart cache** for optimal performance
- **Per-image modification history**
- **Batch operations** on selected images (delete, tag, export)
- **Multiple image selection** (Ctrl+Click)

### 🚀 Performance & Quality
- **Advanced optimizations** (React.memo, useCallback, useMemo)
- **Automatic image centering** on load
- **Lazy loading** of images
- **Annotation cache**
- **Real-time quality validation**
- **Detailed statistical reports**
- **Smooth performance** even with large datasets

### 🎯 Special Features
- **YOLO pre-annotation**: Load a YOLO model to automatically pre-annotate
- **Vision LLM Assistant**: Integration with vision LLM models (OpenAI, Claude, GGUF) to verify, annotate, and automatically modify annotations
- **Workflow modes**: 
  - Normal: Standard annotation mode
  - Speed: Fast annotation with Quick Draw enabled
  - Review: Review and validate annotations with measurements
  - Precision: Precise annotation with measurements enabled
- **Layout presets**: 
  - Annotation Focus: Maximize canvas space
  - Stats Focus: Show all statistics
  - Balanced: Equal space for all panels
  - Minimal: Minimal UI, maximum canvas
  - Custom layouts: Save and reuse your own layouts
- **Fullscreen mode**: Total focus on annotation (F11 or via Layout Manager)
- **Grid view**: Fast visual navigation with annotation preview
- **Detailed statistics**: Dataset progress, annotations by class, averages
- **Automatic validation**: Error, warning, and duplicate detection
- **Report export**: Complete dataset statistics
- **Advanced filters**: Filter by size, position, aspect ratio of annotations
- **Annotation measurements**: Display dimensions and distances in real-time
- **Annotation templates**: Save and reuse annotation configurations
- **Annotation groups**: Group and manipulate multiple annotations together
- **Collapsible panels**: Customizable interface with collapsible panels
- **Theme customization**: Dark, Light, and Cyberpunk themes
- **Batch image operations**: Select multiple images and perform batch actions
- **Quick actions**: Hover actions on images (open, delete)

## 📋 Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Python** 3.10+ ([Download](https://www.python.org/downloads/))
- **npm** (included with Node.js)

## 🛠️ Installation

### 1. Clone or download the project

```bash
cd app
```

### 2. Install Node.js dependencies

```bash
npm install
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

## 🎮 Usage

### Development Mode

```bash
npm run dev
```

This command automatically starts:
- Python backend (FastAPI) on port 8000
- Vite server (React) on port 5173
- Electron application

### Production Mode

```bash
npm start
```

## 📦 Building to .exe

### Quick Build

```bash
npm run build:win
```

### Detailed Steps

1. **Build React frontend**:
   ```bash
   npm run build
   ```

2. **Create Windows installer**:
   ```bash
   npm run build:win
   ```

The `.exe` file will be created in the `release/` folder:
- `Lama Worlds Annotation Studio-1.0.0-Setup.exe`

> 📖 For more details, see [BUILD.md](../app/BUILD.md)

## 🎯 Usage Guide

### Open a Dataset

1. Click on **"Open Dataset Folder"**
2. Select the folder containing your images
3. The application automatically detects the structure:
   - `images/` - Image folder
   - `labels/` - Annotation folder (created automatically)
   - `classes.txt` - Class file (created automatically)

### Annotate an Image

1. **Select a class** in the left sidebar
2. **Draw a rectangle** on the image with the mouse
3. The annotation is **automatically saved**

### Modify an Annotation

- **Click** on an annotation to select it
- **Ctrl+Click** for multiple selection
- **Drag rectangle** for multiple selection
- **Drag** to move
- **Resize** with handles
- **Change class** with keys 1-9 or via menu
- **Duplicate** with Ctrl+D
- **Delete** with `Delete` key or × button
- **Add a comment** via the right panel

### YOLO Pre-annotation

1. In the sidebar, **"YOLO Pre-annotation"** section
2. Enter the path to your YOLO model (.pt or .onnx)
3. Set the confidence threshold (0.0 - 1.0)
4. Click on **"Load Model"** then **"Pre-annotate"**
5. Annotations will be automatically generated

### Vision LLM Assistant

1. Click on **"Vision LLM Assistant"** in the sidebar
2. Select the mode: **Verify** (verify), **Annotate** (create), or **Modify** (improve)
3. Choose your provider: OpenAI, Claude, GGUF (local model), or Custom API
4. Configure image filters (by status, class, max number)
5. Click on **"Start"** to launch processing
6. Track progress in real-time with the loading bar
7. Review results and apply them if necessary

**Vision LLM Features:**
- **Verification**: Analyze all images and annotations, returns a confidence score (0-100%)
- **Automatic annotation**: Creates annotations for all filtered images
- **Modification**: Improves and corrects existing annotations
- **Advanced filters**: Process only images that match your criteria
- **GGUF support**: Use local models (.gguf) for offline processing

### Smart Navigation

- **N**: Next unannotated image
- **Shift+N**: Previous unannotated image
- **Alt+←**: Back in history
- **Alt+→**: Forward in history
- **Home/End**: First/Last image

### Complete Keyboard Shortcuts

#### Navigation
| Shortcut | Action |
|----------|--------|
| `←` / `→` | Navigate between images |
| `Home` / `End` | Go to first/last image |
| `N` | Next unannotated image |
| `Shift+N` | Previous unannotated image |
| `Alt+←` / `Alt+→` | Navigation history (back/forward) |

#### Annotation
| Shortcut | Action |
|----------|--------|
| `Click & Drag` | Draw a new annotation |
| `Click` | Select an annotation |
| `Ctrl+Click` | Multiple selection |
| `Drag Rectangle` | Multiple selection by area |
| `Ctrl+A` | Select all annotations |
| `Delete` / `Backspace` | Delete selected annotation |
| `1-9` | Change class of selected annotation |
| `Ctrl+D` | Duplicate selected annotation |
| `T` | Hide/Show annotations |
| `Z` | Smart zoom on selection |

#### Editing
| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+C` | Copy selected annotation |
| `Ctrl+V` | Paste annotation |

#### Canvas
| Shortcut | Action |
|----------|--------|
| `Ctrl + / -` | Zoom in/out |
| `Ctrl+0` | Reset zoom |
| `Mouse Wheel` | Zoom |
| `Middle Click` / `Shift+Drag` | Pan (move view) |
| `R` | Clockwise rotation |
| `Shift+R` | Counter-clockwise rotation |
| `H` | Flip horizontally |
| `V` | Flip vertically |
| `F11` | Fullscreen mode |
| `Q` | Toggle Quick Draw Mode |
| `M` | Show/Hide measurements |

#### Interface & Layout
| Shortcut | Action |
|----------|--------|
| `Ctrl+E` | Open Export menu |
| `Ctrl+I` | Import project |
| `Ctrl+M` | Merge datasets |
| `Ctrl+F` | Toggle fullscreen canvas |

#### Help
| Shortcut | Action |
|----------|--------|
| `?` / `F1` | Show/Hide shortcut help |

### Class Management

- **Add a class**: Click on "+" in the sidebar
- **Edit a class**: Double-click on the name
- **Change color**: Click on the color square
- **Delete a class**: Click on × (also deletes all its annotations)
- **Import from YAML**: "Import YAML" button
- **Save template**: "Save Template" button
- **Load template**: "Load Template" button

### Tags and Metadata

- **Add tags**: Click on the tag icon in the image list
- **Search by tag**: Use search with "tag:tag_name"
- **Multiple tags**: Separate by commas

### Project Export/Import

- **Complete export**: Menu → Export Project (saves everything: images, annotations, classes, tags, comments)
- **Complete import**: Menu → Import Project (restores a complete project)
- **Merge datasets**: Menu → Merge Datasets (combine multiple datasets with automatic class mapping)

### Layout Management

- **Layout presets**: Click "Layout" button to choose from presets
- **Save custom layout**: Use "Save Current Layout" to save your preferred configuration
- **Toggle panels**: Use "Hide Stats" to hide/show Statistics/Analytics/Validation panels
- **Fullscreen canvas**: Use "Fullscreen Canvas" button or F11

### Workflow Modes

- **Normal**: Standard annotation workflow
- **Speed**: Quick annotation mode with Quick Draw enabled
- **Review**: Review mode with measurements enabled
- **Precision**: Precision mode with measurements enabled

### Batch Operations

1. **Select multiple images**: Hold `Ctrl` (or `Cmd` on Mac) and click on images
2. **Batch actions**: Use the bottom toolbar to:
   - Export selected images
   - Tag selected images
   - Delete selected images
3. **Clear selection**: Click the X button in the batch actions toolbar

### Advanced Search

1. Click **"Advanced"** button in the top bar
2. Configure filters:
   - Text search
   - Class filter
   - Size range (min/max)
   - Date range
   - Tag filter
3. Click **"Search"** to apply filters

### Import Classes from YAML

1. Click on **"Import YAML"** in the sidebar
2. Select your `data.yaml` file (YOLO format)
3. Choose to **replace** or **merge** with existing classes

### Export Dataset

1. Click on **"EXPORT COCO"** or **"EXPORT VOC"** in the right panel
2. The file will be created in the dataset folder

### Statistical Report Export

1. Click on **"Export Report"** in the statistics panel
2. A detailed report will be generated with:
   - Dataset progress
   - Statistics by class
   - Annotated/unannotated images
   - Averages and totals

## 📁 Dataset Structure

```
my_dataset/
├── images/
│   ├── image1.jpg
│   ├── image2.jpg
│   └── ...
├── labels/
│   ├── image1.txt
│   ├── image2.txt
│   └── ...
└── classes.txt
```

### YOLO Format

Each `.txt` file in `labels/` contains:
```
class_id x_center y_center width height
```

Where all values are normalized between 0 and 1.

## 🏗️ Architecture

```
app/
├── backend/          # Python Backend (FastAPI)
│   ├── main.py      # Main API
│   ├── models.py    # Pydantic models
│   ├── yolo_handler.py  # YOLO format handling
│   └── exporter.py  # COCO/VOC export
├── electron/        # Electron Application
│   ├── main.js     # Main process
│   └── preload.js  # Security bridge
├── react/          # React Frontend
│   └── src/
│       ├── App.jsx
│       ├── components/
│       │   ├── AnnotationCanvas.jsx
│       │   ├── Sidebar.jsx
│       │   ├── RightPanel.jsx
│       │   ├── StatsPanel.jsx
│       │   ├── ValidationPanel.jsx
│       │   └── KeyboardShortcuts.jsx
│       └── hooks/
│           └── useUndoRedo.js
├── dist/           # React Build (generated)
└── release/        # Electron Build (generated)
```

## 🔧 Technologies Used

- **Frontend**: React 18, Vite, Konva, Framer Motion
- **Backend**: FastAPI, Python 3.10+, Uvicorn
- **Desktop**: Electron 28
- **Styling**: Modern CSS with glassmorphism effects
- **Performance**: React.memo, useCallback, useMemo for optimizations
- **Vision LLM**: Support for OpenAI GPT-4 Vision, Claude, GGUF (llama-cpp-python)
- **Python Dependencies**: FastAPI, Uvicorn, Pillow, NumPy, OpenCV, PyYAML, Requests, llama-cpp-python

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start in development mode |
| `npm start` | Start the application |
| `npm run build` | Build React frontend |
| `npm run build:win` | Create Windows installer |
| `npm run build:app` | Complete build (frontend + installer) |
| `npm run electron` | Launch Electron alone |
| `npm run diagnose` | Diagnose Python configuration |

## 📦 Dependencies

### Python Dependencies (requirements.txt)
- `fastapi` - Web framework for API
- `uvicorn` - ASGI server
- `pillow` - Image processing
- `numpy` - Numerical computations
- `opencv-python` - Computer vision
- `python-multipart` - Multipart/form-data support
- `watchdog` - File monitoring
- `pyyaml` - YAML parsing
- `requests` - HTTP requests (for Vision LLM)
- `llama-cpp-python` - GGUF model support (optional)

## 🐛 Troubleshooting

### Application won't start

1. Check that Python is installed: `python --version`
2. Check that Python dependencies are installed: `pip install -r requirements.txt`
3. Check that Node.js dependencies are installed: `npm install`

### Backend won't start

- Check that port 8000 is not in use
- Check the logs in the console

### Images don't display

- Check that image paths are correct
- Check that images are in the correct format (jpg, png, etc.)

### Build error

- Make sure you ran `npm run build` before `npm run build:win`
- Check that all files are present

### Slow performance

- The application is optimized for large datasets
- Use annotation cache (enabled by default)
- Close other applications to free up memory

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Propose features
- Submit pull requests

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](../LICENSE) file for details.

**MIT License** - You are free to use, modify, and distribute this software provided you include the copyright notice and license in all copies.

## 👤 Author

**StriikzLeLama**

## 🙏 Acknowledgments

- YOLO for the annotation format
- The open-source community for the tools used

## 📞 Support

For questions or issues:
1. Check the complete documentation in this file
2. Check the [BUILD.md](BUILD.md) for build instructions
3. Check the [CODE_DOCUMENTATION.md](CODE_DOCUMENTATION.md) for code architecture
4. Check the [CHANGELOG.md](CHANGELOG.md) for version history
5. Check the console logs for errors

---

**Made with ❤️ for the ML/AI community**
