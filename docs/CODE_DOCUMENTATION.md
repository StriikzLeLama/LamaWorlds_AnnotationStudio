# Code Documentation

## Architecture Overview

Lama Worlds Annotation Studio is built with a modern React frontend and FastAPI backend architecture.

### Frontend Structure

```
app/react/src/
├── App.jsx                    # Main application component
├── components/                # React components
│   ├── AnnotationCanvas.jsx   # Main annotation canvas
│   ├── Sidebar.jsx            # Class management sidebar
│   ├── RightPanel.jsx         # Image list and export panel
│   ├── StatsPanel.jsx         # Statistics display
│   ├── AnalyticsPanel.jsx     # Analytics and charts
│   ├── ValidationPanel.jsx   # Annotation validation
│   ├── LayoutManager.jsx      # Layout management
│   ├── MiniMap.jsx            # Dataset overview map
│   ├── WorkflowMode.jsx       # Workflow mode selector
│   ├── AdvancedSearch.jsx     # Advanced search interface
│   ├── BatchImageActions.jsx  # Batch operations toolbar
│   ├── ImagePreviewTooltip.jsx # Image preview on hover
│   └── ThemeManager.jsx      # Theme management
├── hooks/                     # Custom React hooks
│   ├── useUndoRedo.js         # Undo/Redo functionality
│   └── useSettings.js         # Settings management
└── styles/                    # CSS styles
    └── index.css              # Main stylesheet
```

### Backend Structure

```
backend/
├── main.py                    # FastAPI application
├── models.py                  # Pydantic models
├── yolo_handler.py           # YOLO format handling
└── exporter.py               # Export functionality (COCO, VOC)
```

## Key Components

### App.jsx

Main application component that manages:
- Dataset loading and state
- Image navigation
- Annotation management
- UI state (panels, modals, layouts)
- Communication with backend API
- Keyboard shortcuts
- Undo/Redo system

**Key State Variables:**
- `datasetPath`: Current dataset folder path
- `images`: Array of image file paths
- `currentImageIndex`: Currently displayed image index
- `annotations`: Current image annotations
- `classes`: Annotation classes
- `selectedClassId`: Currently selected class
- `selectedAnnotationId`: Currently selected annotation
- `annotationCache`: Cache for annotations (performance optimization)

**Key Functions:**
- `loadDataset(path)`: Load dataset from folder
- `saveAnnotations(annotations)`: Save annotations to backend
- `changeImageIndex(index)`: Navigate to different image
- `onChangeAnnotationClass(annId, newClassId)`: Change annotation class
- `handleKeyDown(e)`: Handle keyboard shortcuts

### AnnotationCanvas.jsx

Main canvas component for drawing and editing annotations.

**Features:**
- Zoom, pan, rotate, flip
- Draw rectangular annotations
- Select and edit annotations
- Multi-selection support
- Keyboard shortcuts

### Sidebar.jsx

Class management sidebar with:
- Class list with colors
- Add/Edit/Delete classes
- YAML import/export
- YOLO pre-annotation
- Vision LLM integration
- Quick draw toggle
- Measurements toggle

### RightPanel.jsx

Image list and export panel with:
- Image grid/list view
- Search and filters
- Export options (COCO, VOC, Preview, Report, Project)
- Image tags
- Batch operations
- Quick actions on hover

### StatsPanel.jsx

Statistics display showing:
- Dataset progress
- Current image statistics
- Annotations by class
- Progress bars

### AnalyticsPanel.jsx

Analytics visualization with:
- Class distribution charts
- Annotation statistics
- Dataset metrics

### ValidationPanel.jsx

Annotation validation showing:
- Errors and warnings
- Duplicate detection
- Quality checks

## API Endpoints

All API calls go through the FastAPI backend on `http://localhost:8000`:

- `POST /load_dataset` - Load dataset images
- `POST /load_annotation` - Load annotations for an image
- `POST /save_annotation` - Save annotations
- `POST /load_classes` - Load classes
- `POST /save_classes` - Save classes
- `POST /get_annotated_images` - Get list of annotated images
- `POST /export_coco` - Export to COCO format
- `POST /export_voc` - Export to Pascal VOC format
- `POST /export_report` - Export statistics report
- `POST /export_project` - Export complete project
- `POST /import_project` - Import complete project
- `POST /import_yaml` - Import classes from YAML
- `POST /pre_annotate` - Pre-annotate with YOLO model
- `POST /delete_image` - Delete an image
- `POST /merge_datasets` - Merge multiple datasets

## State Management

The application uses React hooks for state management:
- `useState` for component state
- `useCallback` for memoized functions
- `useMemo` for computed values
- `useRef` for mutable references (cache)
- `useEffect` for side effects

LocalStorage is used for:
- Application state persistence
- Annotation comments
- Image tags
- Custom layouts
- Theme preferences

## Performance Optimizations

1. **Annotation Cache**: Annotations are cached in memory to avoid repeated API calls
2. **Virtual Scrolling**: Image lists use virtualization for large datasets
3. **React.memo**: Components are memoized to prevent unnecessary re-renders
4. **useCallback**: Functions are memoized to prevent recreation
5. **Lazy Loading**: Images are loaded lazily in the grid view

## Keyboard Shortcuts

All keyboard shortcuts are handled in `App.jsx` in the `handleKeyDown` function:

- Navigation: Arrow keys, Home/End, N (next unannotated)
- History: Alt+Arrow keys
- Canvas: Ctrl+Zoom, Mouse wheel, R (rotate), H/V (flip)
- Annotations: T (toggle), Z (zoom to selection)
- Fullscreen: F11
- Help: ? or F1

## Code Style

- **JSDoc Comments**: All functions have JSDoc comments
- **Type Annotations**: Type information in comments
- **Consistent Naming**: camelCase for variables, PascalCase for components
- **Component Organization**: Components are organized by feature
- **Error Handling**: Try-catch blocks with user-friendly error messages

## Adding New Features

1. **New Component**: Create in `components/` folder
2. **New API Endpoint**: Add to `backend/main.py`
3. **State Management**: Add state in `App.jsx` if needed globally
4. **Documentation**: Update this file and README.md

## Testing

Currently, the application is tested manually. Future improvements:
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical workflows

