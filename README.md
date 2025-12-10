# 🦙 Lama Worlds Annotation Studio

A modern and powerful image annotation tool for YOLO datasets, with an elegant user interface and advanced features including Vision LLM integration.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## ✨ Main Features

### 🤖 Vision LLM Assistant (New!)
- **Automatic Verification**: Analyze all images and annotations with confidence scores
- **Automatic Annotation**: Create annotations for all filtered images
- **Smart Modification**: Improve and correct existing annotations
- **Multi-provider Support**: OpenAI GPT-4 Vision, Claude, GGUF (local models), Custom API
- **Advanced Filters**: Process only images that match your criteria
- **Dedicated Interface**: Modal panel with real-time progress tracking

### 🎨 Modern Interface
- Dark interface with futuristic neon design
- Interactive canvas with zoom, pan, rotation, and flip
- Image thumbnails with annotation preview
- Grid and list views for quick navigation
- Fullscreen mode for maximum focus
- Collapsible panels to optimize space

### 📝 Advanced Annotation
- Rectangular annotations (YOLO format)
- Customizable class system with colors
- Multiple selection with drag rectangle and Ctrl+click
- Batch operations (delete, change class, align)
- Annotation duplication (Ctrl+D)
- Comments on annotations
- Automatic annotation validation
- YOLO pre-annotation with custom model
- Quick Draw Mode for rapid annotation
- Reusable annotation templates
- Annotation groups

### 🔍 Navigation & Search
- Real-time image search
- Search in annotations (classes, comments, tags)
- Advanced filters: All / Annotated / Empty / By class / By size / By ratio
- Smart navigation: next unannotated image (N)
- Navigation history (Alt+←/→)
- Complete keyboard navigation
- Customizable keyboard shortcuts

### 💾 Project Management
- Automatic state saving
- Restore on restart
- Export/Import complete projects
- Import YAML classes (YOLO format)
- Export COCO, Pascal VOC, YOLO
- Tags/metadata for images
- Smart cache for optimal performance
- Per-image modification history
- Incremental saving

### 📊 Statistics & Analytics
- Real-time dashboard
- Detailed statistics by class
- Dataset progress
- Annotation measurements (dimensions, distances)
- Quality reports
- Advanced analytics with charts

## 📋 Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Python** 3.10+ ([Download](https://www.python.org/downloads/))
- **npm** (included with Node.js)

## 🛠️ Installation

### 1. Clone the project

```bash
git clone <repository-url>
cd LamaWorlds_AnnotationStudio
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

**Note**: To use Vision LLM with GGUF models, also install:
```bash
pip install llama-cpp-python
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

## 📦 Building

### Quick Build

```bash
npm run build:win
```

The `.exe` file will be created in the `release/` folder.

> 📖 For more details, see [docs/README.md](docs/README.md) or [app/BUILD.md](app/BUILD.md)

## 🚀 Quick Guide

### Open a Dataset

1. Click on **"Open Dataset Folder"**
2. Select the folder containing your images
3. The application automatically detects the structure

### Annotate an Image

1. Select a class in the left sidebar
2. Draw a rectangle on the image with the mouse
3. The annotation is automatically saved

### Use Vision LLM

1. Click on **"Vision LLM Assistant"** in the sidebar
2. Choose the mode (Verify/Annotate/Modify)
3. Select your provider (OpenAI, Claude, GGUF, Custom)
4. Configure image filters
5. Launch processing and track progress

## 📁 Project Structure

```
LamaWorlds_AnnotationStudio/
├── app/
│   ├── backend/          # Python Backend (FastAPI)
│   ├── electron/         # Electron Application
│   ├── react/            # React Frontend
│   ├── BUILD.md          # Build Guide
│   └── requirements.txt  # Python Dependencies
├── docs/
│   └── README.md         # Complete Documentation
├── LICENSE               # MIT License
└── README.md             # This file
```

## 🔧 Technologies

- **Frontend**: React 18, Vite, Konva
- **Backend**: FastAPI, Python 3.10+, Uvicorn
- **Desktop**: Electron 28
- **Vision LLM**: OpenAI API, Claude API, llama-cpp-python (GGUF)
- **Styling**: Modern CSS with glassmorphism effects

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

**MIT License** - You are free to use, modify, and distribute this software provided you include the copyright notice and license in all copies.

## 👤 Author

**StriikzLeLama**

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Propose features
- Submit pull requests

## 📞 Support

For questions or issues:
1. Check the [complete documentation](docs/README.md)
2. Review the [build guides](app/BUILD.md)
3. Check the console logs

---

**Made with ❤️ for the ML/AI community**
