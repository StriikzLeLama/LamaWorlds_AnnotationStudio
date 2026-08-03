/**
 * App racine — orchestre dataset, annotations, panneaux et raccourcis.
 * État central volontairement ici (outil desktop mono-écran) ; le client API
 * est partagé via ./api/client.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Settings, Eye, EyeOff, FolderOpen } from 'lucide-react';

import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import AnnotationCanvas from './components/AnnotationCanvas';
import StatsPanel from './components/StatsPanel';
import ValidationPanel from './components/ValidationPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import SettingsPanel from './components/SettingsPanel';
import MeasurementsPanel from './components/MeasurementsPanel';
import VisionLLMModal from './components/VisionLLMModal';
import DatasetMergeModal from './components/DatasetMergeModal';
import LayoutManager from './components/LayoutManager';
import MiniMap from './components/MiniMap';
import WorkflowMode from './components/WorkflowMode';
import AdvancedSearch from './components/AdvancedSearch';
import BatchImageActions from './components/BatchImageActions';
import ImagePreviewTooltip from './components/ImagePreviewTooltip';
import ThemeManager from './components/ThemeManager';

import { useUndoRedo } from './hooks/useUndoRedo';
import { useSettings, loadSettings } from './hooks/useSettings';
import api from './api/client';
import './styles/index.css';

// ============================================================================
// Main Application Component
// ============================================================================

/**
 * Main Application Component
 * 
 * Manages the entire application state and coordinates all components.
 * 
 * @component
 * @returns {JSX.Element} The rendered application
 */
function App() {
    // ========================================================================
    // State Management - Dataset & Images
    // ========================================================================
    
    /** @type {[string, Function]} Current dataset path */
    const [datasetPath, setDatasetPath] = useState('');
    
    /** @type {[string[], Function]} Array of image file paths */
    const [images, setImages] = useState([]);
    
    /** @type {[number, Function]} Current image index in the images array */
    const [currentImageIndex, setCurrentImageIndex] = useState(-1);
    
    /** @type {[Set<string>, Function]} Set of image paths that have annotations */
    const [annotatedImages, setAnnotatedImages] = useState(new Set());
    
    /** @type {[Set<string>, Function]} Set of selected image paths for batch operations */
    const [selectedImages, setSelectedImages] = useState(new Set());
    
    // ========================================================================
    // State Management - Annotations
    // ========================================================================
    
    /** @type {[Array<Object>, Function]} Current image annotations */
    const [annotations, setAnnotations] = useState([]);
    
    /** @type {[string|null, Function]} Currently selected annotation ID */
    const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
    
    /** @type {[Set<string>, Function]} Set of selected annotation IDs for multi-selection */
    const [selectedAnnotationIds, setSelectedAnnotationIds] = useState(new Set());
    
    /** @type {React.MutableRefObject<Object>} Cache for annotations to improve performance */
    const annotationCache = useRef({});
    
    /** @type {[Object, Function]} Comments for annotations: { annotationId: "comment text" } */
    const [annotationComments, setAnnotationComments] = useState({});
    
    /** @type {[Object, Function]} Annotation groups: { groupId: [annotationIds] } */
    const [annotationGroups, setAnnotationGroups] = useState({});
    
    /** @type {[string|null, Function]} Currently selected group ID */
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    
    /** @type {[Object|null, Function]} Copied annotation for paste operation */
    const [copiedAnnotation, setCopiedAnnotation] = useState(null);
    
    // ========================================================================
    // State Management - Classes
    // ========================================================================
    
    /** @type {[Array<Object>, Function]} Array of annotation classes */
    const [classes, setClasses] = useState([]);
    
    /** @type {[number, Function]} Currently selected class ID */
    const [selectedClassId, setSelectedClassId] = useState(0);
    
    /** @type {[Array<number>, Function]} Recently used class IDs */
    const [recentClasses, setRecentClasses] = useState([]);
    
    // ========================================================================
    // State Management - Navigation & History
    // ========================================================================
    
    /** @type {[Array<number>, Function]} Navigation history for back/forward */
    const [navigationHistory, setNavigationHistory] = useState([]);
    
    /** @type {[number, Function]} Current position in navigation history */
    const [historyIndex, setHistoryIndex] = useState(-1);
    
    /** @type {[Object, Function]} History per image: { imagePath: [{timestamp, annotations}] } */
    const [imageHistory, setImageHistory] = useState({});
    
    // ========================================================================
    // State Management - Search & Filters
    // ========================================================================
    
    /** @type {[string, Function]} Current search query */
    const [searchQuery, setSearchQuery] = useState('');
    
    /** @type {[boolean|null, Function]} Filter by annotation status: null=all, true=annotated, false=empty */
    const [filterAnnotated, setFilterAnnotated] = useState(null);
    
    /** @type {[number|null, Function]} Filter by class ID: null=all classes, number=specific class */
    const [filterClassId, setFilterClassId] = useState(null);
    
    /** @type {[boolean, Function]} Toggle search in annotations content */
    const [searchInAnnotations, setSearchInAnnotations] = useState(false);
    
    /** @type {[Object, Function]} Advanced search filters */
    const [advancedFilters, setAdvancedFilters] = useState({});
    
    // ========================================================================
    // State Management - UI State
    // ========================================================================
    
    /** @type {[boolean, Function]} Loading state */
    const [loading, setLoading] = useState(false);
    
    /** @type {[string, Function]} Save status message */
    const [saveStatus, setSaveStatus] = useState('Saved');
    
    /** @type {[string|null, Function]} Backend connection error message */
    const [backendError, setBackendError] = useState(null);
    
    /** @type {[boolean, Function]} Show keyboard shortcuts help modal */
    const [showShortcuts, setShowShortcuts] = useState(false);
    
    /** @type {[boolean, Function]} Show/hide annotations on canvas */
    const [showAnnotations, setShowAnnotations] = useState(true);
    
    /** @type {[boolean, Function]} Fullscreen mode state */
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    /** @type {[boolean, Function]} Show statistics/analytics/validation panels */
    const [showStatsPanels, setShowStatsPanels] = useState(true);
    
    /** @type {[Object, Function]} Current layout configuration */
    const [currentLayout, setCurrentLayout] = useState({
        showSidebar: true,
        showRightPanel: true,
        showStatsPanels: true,
        sidebarWidth: 250,
        rightPanelWidth: 320
    });
    
    /** @type {[string, Function]} Current workflow mode: 'normal', 'speed', 'review', 'precision' */
    const [workflowMode, setWorkflowMode] = useState('normal');
    
    /** @type {[boolean, Function]} Show mini map */
    const [showMiniMap, setShowMiniMap] = useState(false);
    
    /** @type {[Object|null, Function]} Image preview data for hover tooltip */
    const [imagePreview, setImagePreview] = useState(null);
    
    // ========================================================================
    // State Management - Modals & Panels
    // ========================================================================
    
    /** @type {[boolean, Function]} Show settings panel */
    const [showSettings, setShowSettings] = useState(false);
    
    /** @type {[boolean, Function]} Show Vision LLM modal */
    const [showVisionLLM, setShowVisionLLM] = useState(false);
    
    /** @type {[boolean, Function]} Show dataset merge modal */
    const [showDatasetMerge, setShowDatasetMerge] = useState(false);
    
    /** @type {[boolean, Function]} Show export preview */
    const [showExportPreview, setShowExportPreview] = useState(false);
    
    /** @type {[boolean, Function]} Show annotation measurements */
    const [showMeasurements, setShowMeasurements] = useState(false);
    
    // ========================================================================
    // State Management - Features & Tools
    // ========================================================================
    
    /** @type {[Object, Function]} Tags for images: { imagePath: [tag1, tag2, ...] } */
    const [imageTags, setImageTags] = useState({});
    
    /** @type {[Array<Object>, Function]} Saved annotation templates */
    const [annotationTemplates, setAnnotationTemplates] = useState([]);
    
    /** @type {[boolean, Function]} Quick draw mode (class stays selected after annotation) */
    const [quickDrawMode, setQuickDrawMode] = useState(false);
    
    /** @type {[boolean, Function]} Snap to grid mode */
    const [snapToGrid, setSnapToGrid] = useState(false);
    
    /** @type {[string, Function]} YOLO model path for pre-annotation */
    const [yoloModelPath, setYoloModelPath] = useState('');
    
    /** @type {[number, Function]} YOLO confidence threshold (0.0 - 1.0) */
    const [yoloConfidence, setYoloConfidence] = useState(0.25);
    
    /** @type {[Array<Object>, Function]} Auto-save history */
    const [autoSaveHistory, setAutoSaveHistory] = useState([]);
    
    /** @type {[Array<Object>, Function]} Incremental save history */
    const [incrementalSaveHistory, setIncrementalSaveHistory] = useState([]);
    
    /** @type {[string, Function]} Current theme: 'dark', 'light', 'cyberpunk' */
    const [currentTheme, setCurrentTheme] = useState('dark');
    
    // ========================================================================
    // Hooks & External State
    // ========================================================================
    
    /** Settings system hook */
    const { settings, updateSetting, updateSettings, getSetting } = useSettings();
    
    /** Undo/Redo system hook */
    const undoRedoHook = useUndoRedo([]);
    const { setState: setUndoRedoState, undo, redo, canUndo, canRedo } = undoRedoHook;

    // ========================================================================
    // Utility Functions
    // ========================================================================

    /**
     * Save application state to localStorage
     * Persists dataset path, classes, and UI preferences
     */
    const saveState = useCallback(() => {
        const state = {
            datasetPath,
            classes,
            selectedClassId,
            currentImageIndex,
            imageTags,
            annotationComments,
            currentLayout,
            workflowMode,
            currentTheme
        };
        
        try {
            localStorage.setItem('app_state', JSON.stringify(state));
        } catch (err) {
            console.error('Failed to save state:', err);
        }
    }, [datasetPath, classes, selectedClassId, currentImageIndex, imageTags, annotationComments, currentLayout, workflowMode, currentTheme]);

    // ========================================================================
    // Dataset Management Functions
    // ========================================================================

    /**
     * Load dataset from a folder path
     * Scans for images and loads existing annotations
     * 
     * @param {string} path - Path to the dataset folder
     */
    const loadDataset = useCallback(async (path) => {
        if (!path) return;
        
        setLoading(true);
        setBackendError(null);
        
        try {
            // Load images - request all images by setting a very large page_size
            const imagesRes = await api.post('/load_dataset', { path: path }, { 
                params: { page: 0, page_size: 999999 } 
            });
            const imageList = imagesRes.data.images || [];
            setImages(imageList);
            
            // Load classes
            const classesRes = await api.post('/load_classes', { path: path });
            const classList = classesRes.data.classes || [];
            setClasses(classList);
            
            // Load annotated images
            const annotatedRes = await api.post('/get_annotated_images', { dataset_path: path });
            const annotatedList = annotatedRes.data.annotated_images || [];
            setAnnotatedImages(new Set(annotatedList));
            
            // Set first image as current if available
            if (imageList.length > 0) {
                setCurrentImageIndex(0);
            }
            
            setDatasetPath(path);
                } catch (err) {
            console.error('Failed to load dataset:', err);
            setBackendError(err.message || 'Failed to connect to backend. Make sure Python is installed and dependencies are installed.');
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Open a dataset folder using Electron's dialog.
     */
    const handleOpenDataset = useCallback(async () => {
        try {
            if (!window.electronAPI || !window.electronAPI.selectFolder) {
                alert("Electron API not available. Please run in Electron.");
                return;
            }
            const folderPath = await window.electronAPI.selectFolder();
            if (folderPath) {
                await loadDataset(folderPath);
            }
        } catch (err) {
            console.error('Failed to open dataset:', err);
            alert('Failed to open dataset: ' + (err.message || 'Unknown error'));
        }
    }, [loadDataset]);

    /**
     * Load application state from localStorage
     * Restores previous session state
     */
    const loadState = useCallback(async () => {
        try {
            const saved = localStorage.getItem('app_state');
            if (saved) {
                const state = JSON.parse(saved);
                
                // Restore UI state first (non-blocking)
                if (state.classes) setClasses(state.classes);
                if (state.selectedClassId !== undefined) setSelectedClassId(state.selectedClassId);
                if (state.imageTags) setImageTags(state.imageTags);
                if (state.annotationComments) setAnnotationComments(state.annotationComments);
                if (state.currentLayout) setCurrentLayout(state.currentLayout);
                if (state.workflowMode) setWorkflowMode(state.workflowMode);
                if (state.currentTheme) setCurrentTheme(state.currentTheme);
                
                // Try to load dataset if path exists (non-blocking, with error handling)
                if (state.datasetPath) {
                    setDatasetPath(state.datasetPath);
                    // Load dataset asynchronously without blocking render
                    loadDataset(state.datasetPath).catch(err => {
                        console.warn('Failed to auto-load dataset:', err);
                        // Clear invalid path
                        setDatasetPath('');
                    }).then(() => {
                        // Restore image index after images are loaded
                        if (state.currentImageIndex !== undefined && state.currentImageIndex >= 0) {
                            setTimeout(() => {
                                setCurrentImageIndex(state.currentImageIndex);
                            }, 500); // Wait for images to load
                        }
                    });
                }
            }
        } catch (err) {
            console.error('Failed to load state:', err);
            // Clear potentially corrupted state
            try {
                localStorage.removeItem('app_state');
            } catch (e) {
                console.error('Failed to clear corrupted state:', e);
            }
        }
    }, [loadDataset]);

    // Load state on mount
    useEffect(() => {
        loadState();
    }, [loadState]);

    // Save state when relevant values change
    useEffect(() => {
        saveState();
    }, [saveState]);

    /**
     * Change current image index with history tracking
     * 
     * @param {number} newIndex - New image index
     */
    const changeImageIndex = useCallback((newIndex) => {
        if (newIndex < 0 || newIndex >= images.length) return;
        
        // Add to history
        setNavigationHistory(prev => {
            const newHistory = prev.slice(0, historyIndex + 1);
            newHistory.push(currentImageIndex);
            return newHistory;
        });
        setHistoryIndex(prev => prev + 1);
        
        setCurrentImageIndex(newIndex);
    }, [images.length, currentImageIndex, historyIndex]);

    // ========================================================================
    // Annotation Management Functions
    // ========================================================================

    /**
     * Save annotations for the current image
     * 
     * @param {Array<Object>} newAnnotations - Array of annotation objects
     */
    const saveAnnotations = useCallback(async (newAnnotations) => {
        if (currentImageIndex < 0 || currentImageIndex >= images.length) return;
            
            const currentImagePath = images[currentImageIndex];
        if (!currentImagePath || !datasetPath) return;
        
        setAnnotations(newAnnotations);
        setSaveStatus('Saving...');
        
        try {
            await api.post('/save_annotation', {
                image_name: currentImagePath,
                dataset_path: datasetPath,
                boxes: newAnnotations
            });
            
            // Update cache
            annotationCache.current[currentImagePath] = newAnnotations;
            
            // Update annotated images set
            setAnnotatedImages(prev => {
                const newSet = new Set(prev);
                if (newAnnotations.length > 0) {
                    newSet.add(currentImagePath);
                } else {
                    newSet.delete(currentImagePath);
                }
                return newSet;
            });
            
            setSaveStatus('Saved');
            
            // Update undo/redo state
            setUndoRedoState(newAnnotations);
        } catch (err) {
            console.error('Failed to save annotations:', err);
            setSaveStatus('Error');
        }
    }, [currentImageIndex, images, datasetPath, setUndoRedoState]);

    /**
     * Change class of an annotation
     * 
     * @param {string} annId - Annotation ID
     * @param {number} newClassId - New class ID
     */
    const onChangeAnnotationClass = useCallback(async (annId, newClassId) => {
        if (!annId || newClassId === undefined || !Array.isArray(annotations)) return;
        
        const newAnns = annotations.map(a => {
            if (!a || !a.id) return a;
            return a.id === annId ? { ...a, class_id: newClassId } : a;
        });
        
        await saveAnnotations(newAnns);
    }, [annotations, saveAnnotations]);

    /**
     * Update classes list
     * 
     * @param {Array<Object>} newClasses - New classes array
     */
    const onUpdateClasses = useCallback(async (newClasses) => {
        setClasses(newClasses);
        try {
            await api.post('/save_classes', { classes: newClasses, dataset_path: datasetPath });
        } catch (err) {
            console.error('Failed to save classes:', err);
        }
    }, [datasetPath]);

    /**
     * Handle YAML import
     * Imports classes from a YAML file (YOLO format)
     */
    const handleImportYaml = useCallback(async () => {
        try {
            if (!window.electronAPI || !window.electronAPI.selectFile) {
                alert("Electron API not available. Please run in Electron.");
                return;
            }

            const filePath = await window.electronAPI.selectFile([
                { name: 'YAML Files', extensions: ['yaml', 'yml'] },
                { name: 'All Files', extensions: ['*'] }
            ]);

            if (!filePath) {
                return; // User cancelled
            }

            setLoading(true);
            
            // Read file using Electron API
            const fileContent = await window.electronAPI.readFile(filePath);
            
            // Create a Blob from the content
            const blob = new Blob([fileContent], { type: 'text/yaml' });
            const fileName = filePath.split(/[/\\]/).pop();
            
            // Create FormData and send to backend
            const formData = new FormData();
            formData.append('file', blob, fileName);
            formData.append('dataset_path', datasetPath || '');

            const response = await api.post('/import_yaml_classes', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.classes) {
                setClasses(response.data.classes);
                alert(`Successfully imported ${response.data.classes.length} classes from YAML`);
            }
        } catch (err) {
            console.error('Failed to import YAML:', err);
            alert('Failed to import YAML: ' + (err.response?.data?.detail || err.message || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    }, [datasetPath]);

    /**
     * Handle undo operation
     */
    const handleUndo = useCallback(() => {
        if (canUndo) {
            const previousState = undo();
            if (previousState) {
                setAnnotations(previousState);
                saveAnnotations(previousState);
            }
        }
    }, [canUndo, undo, saveAnnotations]);

    /**
     * Handle redo operation
     */
    const handleRedo = useCallback(() => {
        if (canRedo) {
            const nextState = redo();
            if (nextState) {
                setAnnotations(nextState);
                saveAnnotations(nextState);
            }
        }
    }, [canRedo, redo, saveAnnotations]);

    // ========================================================================
    // Keyboard Shortcuts Handler
    // ========================================================================

    /**
     * Handle keyboard shortcuts
     * 
     * @param {KeyboardEvent} e - Keyboard event
     */
    const handleKeyDown = useCallback((e) => {
        // Ignore if typing in input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
        // Navigation
        if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            if (currentImageIndex > 0) {
                changeImageIndex(currentImageIndex - 1);
            }
        } else if (e.key === 'ArrowRight' && !e.ctrlKey && !e.altKey) {
            e.preventDefault();
            if (currentImageIndex < images.length - 1) {
                changeImageIndex(currentImageIndex + 1);
            }
        } else if (e.key === 'Home') {
            e.preventDefault();
            if (images.length > 0) {
                changeImageIndex(0);
            }
        } else if (e.key === 'End') {
            e.preventDefault();
            if (images.length > 0) {
                changeImageIndex(images.length - 1);
            }
        }
        
        // Next unannotated image
        if (e.key === 'n' || e.key === 'N') {
            e.preventDefault();
            const direction = e.shiftKey ? -1 : 1;
            let nextIndex = currentImageIndex;
            
            for (let i = 0; i < images.length; i++) {
                nextIndex = (nextIndex + direction + images.length) % images.length;
                if (!annotatedImages.has(images[nextIndex])) {
                    changeImageIndex(nextIndex);
                    return;
                }
            }
        }
        
        // History navigation
        if (e.altKey && e.key === 'ArrowLeft') {
            e.preventDefault();
            if (canUndo && historyIndex > 0) {
                const prevIndex = navigationHistory[historyIndex - 1];
                setHistoryIndex(prev => prev - 1);
                setCurrentImageIndex(prevIndex);
            }
        } else if (e.altKey && e.key === 'ArrowRight') {
            e.preventDefault();
            if (historyIndex < navigationHistory.length - 1) {
                const nextIndex = navigationHistory[historyIndex + 1];
                setHistoryIndex(prev => prev + 1);
                setCurrentImageIndex(nextIndex);
            }
        }
        
        // Toggle annotations
        if (e.key === 't' || e.key === 'T') {
            e.preventDefault();
            setShowAnnotations(prev => !prev);
        }
        
        // Fullscreen
        if (e.key === 'F11') {
            e.preventDefault();
            setIsFullscreen(prev => !prev);
        }
        
        // Shortcuts help
        if (e.key === '?' || e.key === 'F1') {
            e.preventDefault();
            setShowShortcuts(prev => !prev);
        }
        
        // Open Dataset (Ctrl+O)
        if (e.ctrlKey && (e.key === 'o' || e.key === 'O')) {
            e.preventDefault();
            if (window.electronAPI && window.electronAPI.selectFolder) {
                window.electronAPI.selectFolder().then(folderPath => {
                    if (folderPath) {
                        loadDataset(folderPath);
                    }
                });
            }
        }
        
        // Undo/Redo
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            if (canUndo) undo();
        } else if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
            e.preventDefault();
            if (canRedo) redo();
        }
        
        // Delete selected annotation
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
            e.preventDefault();
            const newAnns = annotations.filter(a => a.id !== selectedAnnotationId);
            saveAnnotations(newAnns);
            setSelectedAnnotationId(null);
        }
    }, [currentImageIndex, images.length, changeImageIndex, annotatedImages, canUndo, canRedo, undo, redo, historyIndex, navigationHistory, loadDataset, selectedAnnotationId, annotations, saveAnnotations]);

    // Attach keyboard listener
    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // ========================================================================
    // Load Annotations for Current Image
    // ========================================================================

    /**
     * Load annotations for the current image
     */
    useEffect(() => {
        if (currentImageIndex < 0 || currentImageIndex >= images.length || !datasetPath) {
            setAnnotations([]);
            return;
        }
        
        const currentImagePath = images[currentImageIndex];
        if (!currentImagePath) return;
        
        // Check cache first
        if (annotationCache.current[currentImagePath]) {
            setAnnotations(annotationCache.current[currentImagePath]);
            return;
        }
        
        // Load from backend
        setLoading(true);
        api.post('/load_annotation', {
            image_path: currentImagePath,
            dataset_path: datasetPath
        })
        .then(res => {
            const loadedAnnotations = res.data.boxes || [];
            setAnnotations(loadedAnnotations);
            annotationCache.current[currentImagePath] = loadedAnnotations;
            setUndoRedoState(loadedAnnotations);
        })
        .catch(err => {
            console.error('Failed to load annotations:', err);
            setAnnotations([]);
        })
        .finally(() => {
            setLoading(false);
        });
    }, [currentImageIndex, images, datasetPath, setUndoRedoState]);

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <>
            {/* Bannière d'erreur backend (si le process Python est down) */}
            {backendError && !datasetPath && (
                <div className="toast-error">
                    <strong>Backend :</strong> {backendError}
                </div>
            )}

            {/* Shell principal (masqué en mode fullscreen canvas) */}
            <div className="app-shell" style={{ display: isFullscreen ? 'none' : 'flex' }}>
                {/* Panneau classes / outils YOLO */}
                {!isFullscreen && currentLayout.showSidebar && (
                    <Sidebar
                        classes={classes}
                        setClasses={onUpdateClasses}
                        selectedClassId={selectedClassId}
                        setSelectedClassId={setSelectedClassId}
                        selectedAnnotationId={selectedAnnotationId}
                        onChangeAnnotationClass={onChangeAnnotationClass}
                        onImportYaml={handleImportYaml}
                        annotations={annotations}
                        onBatchDeleteClass={(classId) => {
                            saveAnnotations(annotations.filter((a) => a.class_id !== classId));
                        }}
                        onBatchChangeClass={(oldClassId, newClassId) => {
                            saveAnnotations(
                                annotations.map((a) =>
                                    a.class_id === oldClassId ? { ...a, class_id: newClassId } : a
                                )
                            );
                        }}
                        onAlignAnnotations={() => alert('Alignment feature coming soon!')}
                        onPreAnnotate={async () => {
                            if (!yoloModelPath) {
                                alert('Please set YOLO model path first');
                                return;
                            }
                            setLoading(true);
                            try {
                                const res = await api.post('/pre_annotate', {
                                    image_path: images[currentImageIndex],
                                    model_path: yoloModelPath,
                                    confidence: yoloConfidence,
                                    dataset_path: datasetPath,
                                });
                                if (res.data.boxes) await saveAnnotations(res.data.boxes);
                            } catch (err) {
                                console.error('Pre-annotation failed:', err);
                                alert('Pre-annotation failed: ' + (err.message || 'Unknown error'));
                            } finally {
                                setLoading(false);
                            }
                        }}
                        yoloModelPath={yoloModelPath}
                        setYoloModelPath={setYoloModelPath}
                        yoloConfidence={yoloConfidence}
                        setYoloConfidence={setYoloConfidence}
                        recentClasses={recentClasses}
                        quickDrawMode={quickDrawMode}
                        onToggleQuickDraw={() => setQuickDrawMode(!quickDrawMode)}
                        showMeasurements={showMeasurements}
                        onToggleMeasurements={() => setShowMeasurements(!showMeasurements)}
                        annotationTemplates={annotationTemplates}
                        onSaveTemplate={(template) => setAnnotationTemplates((prev) => [...prev, template])}
                        onLoadTemplate={() => alert('Template loading feature coming soon!')}
                        onDeleteTemplate={(templateId) =>
                            setAnnotationTemplates((prev) => prev.filter((t) => t.id !== templateId))
                        }
                        onOpenVisionLLM={() => setShowVisionLLM(true)}
                    />
                )}

                {/* Zone centrale : welcome OU barre d'outils + canvas */}
                <div className="app-main">
                    {!datasetPath && (
                        <div className="welcome">
                            <h1 className="welcome-brand">
                                Lama Worlds <em>Annotation Studio</em>
                            </h1>
                            <p className="welcome-sub">
                                Ouvrez un dossier dataset (images + labels YOLO) pour commencer
                                l&apos;annotation.
                            </p>
                            <button type="button" className="btn-primary btn-lg" onClick={handleOpenDataset}>
                                <FolderOpen size={22} />
                                Ouvrir un dataset
                            </button>
                            <p className="welcome-hint">
                                Raccourci : <kbd>Ctrl</kbd> + <kbd>O</kbd>
                            </p>
                        </div>
                    )}

                    {datasetPath && (
                        <>
                            {/* Barre d'outils supérieure */}
                            <div className="glass-panel topbar title-drag-region">
                                {backendError && (
                                    <div className="inline-error">
                                        <strong>Erreur backend</strong>
                                        <div style={{ marginTop: 6 }}>{backendError}</div>
                                        <div style={{ fontSize: '0.75rem', marginTop: 8, opacity: 0.85 }}>
                                            Vérifiez Python 3.10+ puis :{' '}
                                            <code>pip install -r requirements.txt</code>
                                        </div>
                                    </div>
                                )}

                                <div className="topbar-row">
                                    <div className="topbar-left">
                                        <div className="brand">
                                            Lama <span>Studio</span>
                                        </div>

                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            title="Ouvrir un dossier dataset (Ctrl+O)"
                                            onClick={async () => {
                                                if (!window.electronAPI?.selectFolder) {
                                                    alert('Electron API not available. Please run in Electron.');
                                                    return;
                                                }
                                                const folderPath = await window.electronAPI.selectFolder();
                                                if (folderPath) await loadDataset(folderPath);
                                            }}
                                        >
                                            <FolderOpen size={15} />
                                            Dataset
                                        </button>

                                        <LayoutManager
                                            currentLayout={currentLayout}
                                            onLayoutChange={(layout) => {
                                                setCurrentLayout(layout);
                                                if (layout.showStatsPanels !== undefined) {
                                                    setShowStatsPanels(layout.showStatsPanels);
                                                }
                                            }}
                                            showStatsPanels={showStatsPanels}
                                            onToggleStatsPanels={() => setShowStatsPanels(!showStatsPanels)}
                                            onToggleFullscreen={() => setIsFullscreen(!isFullscreen)}
                                        />

                                        <WorkflowMode
                                            currentMode={workflowMode}
                                            onModeChange={setWorkflowMode}
                                            onToggleQuickDraw={() => setQuickDrawMode(!quickDrawMode)}
                                            onToggleMeasurements={() => setShowMeasurements(!showMeasurements)}
                                        />

                                        <AdvancedSearch
                                            onSearch={setAdvancedFilters}
                                            filters={advancedFilters}
                                            imageTags={imageTags}
                                            classes={classes}
                                        />

                                        <ThemeManager
                                            currentTheme={currentTheme}
                                            onThemeChange={setCurrentTheme}
                                        />

                                        <button
                                            type="button"
                                            className="btn-ghost"
                                            onClick={() => setShowShortcuts(true)}
                                            title="Raccourcis clavier (?)"
                                        >
                                            ? Aide
                                        </button>

                                        <button
                                            type="button"
                                            className="btn-ghost"
                                            onClick={() => setShowSettings(true)}
                                            title="Paramètres"
                                        >
                                            <Settings size={14} />
                                            Réglages
                                        </button>

                                        <div
                                            className={`save-badge${saveStatus === 'Error' ? ' is-error' : ''}`}
                                        >
                                            {saveStatus}
                                        </div>

                                        {(canUndo || canRedo) && (
                                            <>
                                                <button
                                                    type="button"
                                                    className="btn-ghost"
                                                    onClick={handleUndo}
                                                    disabled={!canUndo}
                                                    title="Annuler (Ctrl+Z)"
                                                >
                                                    ↶ Undo
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-ghost"
                                                    onClick={handleRedo}
                                                    disabled={!canRedo}
                                                    title="Rétablir (Ctrl+Y)"
                                                >
                                                    ↷ Redo
                                                </button>
                                            </>
                                        )}
                                    </div>

                                    <div className="topbar-right">
                                        <div className="dataset-path" title={datasetPath}>
                                            {datasetPath}
                                        </div>
                                    </div>
                                </div>

                                {images.length > 0 && (
                                    <div className="progress-block">
                                        <div className="progress-meta">
                                            <span>
                                                Image {currentImageIndex + 1} / {images.length}
                                            </span>
                                            <span>
                                                {Math.round(((currentImageIndex + 1) / images.length) * 100)}%
                                            </span>
                                        </div>
                                        <div className="progress-track">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${((currentImageIndex + 1) / images.length) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                    {/* Canvas Area */}
                    {currentImageIndex >= 0 && images[currentImageIndex] && (
                            <AnnotationCanvas
                                imageUrl={images[currentImageIndex]}
                                annotations={annotations}
                                onChange={saveAnnotations}
                                selectedClassId={selectedClassId}
                                classes={classes}
                                selectedId={selectedAnnotationId}
                                onSelect={setSelectedAnnotationId}
                                selectedIds={selectedAnnotationIds}
                                onSelectMultiple={setSelectedAnnotationIds}
                                showAnnotations={showAnnotations}
                                onZoomToSelection={selectedAnnotationId || selectedAnnotationIds.size > 0}
                                isFullscreen={isFullscreen}
                                onToggleFullscreen={() => setIsFullscreen(prev => !prev)}
                        />
                    )}
                    </>
                )}
            </div>

                {/* Right Panel - Image List & Export */}
                {!isFullscreen && currentLayout.showRightPanel && (
            <RightPanel
                images={images}
                currentIndex={currentImageIndex}
                setIndex={changeImageIndex}
                annotations={annotations}
                onDeleteAnnotation={(id) => {
                    const newAnns = annotations.filter(a => a.id !== id);
                    saveAnnotations(newAnns);
                    if (selectedAnnotationId === id) {
                        setSelectedAnnotationId(null);
                    }
                }}
                        classes={classes}
                        datasetPath={datasetPath}
                        selectedAnnotationId={selectedAnnotationId}
                        onSelectAnnotation={setSelectedAnnotationId}
                        onChangeAnnotationClass={onChangeAnnotationClass}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        filterAnnotated={filterAnnotated}
                        setFilterAnnotated={setFilterAnnotated}
                        annotatedImages={annotatedImages}
                        filterClassId={filterClassId}
                        setFilterClassId={setFilterClassId}
                        annotationCache={annotationCache}
                        onDeleteImage={async (imagePath, index) => {
                            try {
                                await api.post('/delete_image', {
                                    dataset_path: datasetPath,
                                    image_path: imagePath
                                });
                                const newImages = images.filter(img => img !== imagePath);
                                setImages(newImages);
                                if (currentImageIndex >= newImages.length) {
                                    setCurrentImageIndex(Math.max(0, newImages.length - 1));
                                }
                            } catch (err) {
                                console.error('Failed to delete image:', err);
                                alert('Failed to delete image: ' + (err.message || 'Unknown error'));
                            }
                        }}
                        setImages={setImages}
                annotationComments={annotationComments}
                onUpdateAnnotationComment={(annId, comment) => {
                    setAnnotationComments(prev => ({
                        ...prev,
                        [annId]: comment || undefined
                    }));
                    try {
                        const key = `annotation_comments_${datasetPath}`;
                        const updated = { ...annotationComments, [annId]: comment || undefined };
                        if (!comment) delete updated[annId];
                        localStorage.setItem(key, JSON.stringify(updated));
                    } catch (err) {
                        console.error('Failed to save comment:', err);
                    }
                }}
                imageTags={imageTags}
                onUpdateImageTag={(imagePath, tags) => {
                    setImageTags(prev => ({
                        ...prev,
                        [imagePath]: tags
                    }));
                    try {
                        const key = `image_tags_${datasetPath}`;
                        const updated = { ...imageTags, [imagePath]: tags };
                        if (!tags || tags.length === 0) delete updated[imagePath];
                        localStorage.setItem(key, JSON.stringify(updated));
                    } catch (err) {
                        console.error('Failed to save tags:', err);
                    }
                }}
                searchInAnnotations={searchInAnnotations}
                setSearchInAnnotations={setSearchInAnnotations}
                onExport={async (format) => {
                    if (!datasetPath) {
                        alert('Please open a dataset first');
                        return;
                    }
                    
                            setLoading(true);
                    try {
                        if (format === 'preview') {
                            setShowExportPreview(true);
                        } else if (format === 'coco') {
                            const res = await api.post('/export', { dataset_path: datasetPath, format: 'coco' });
                            alert(`COCO export completed!\n\nFile: ${res.data.file || res.data.output_path}`);
                        } else if (format === 'voc') {
                            const res = await api.post('/export', { dataset_path: datasetPath, format: 'voc' });
                            alert(`Pascal VOC export completed!\n\nDirectory: ${res.data.dir || res.data.output_path}`);
                        } else if (format === 'report') {
                            const res = await api.post('/export_report', { dataset_path: datasetPath });
                            alert(`Report export completed!\n\nFile: ${res.data.output_path || res.data.file}`);
                        } else if (format === 'project') {
                            if (!window.electronAPI || !window.electronAPI.selectFolder) {
                                alert("Electron API not available. Please run in Electron.");
                                return;
                            }
                            const folderPath = await window.electronAPI.selectFolder();
                            if (!folderPath) return;
                            
                            const res = await api.post('/export_project', {
                                dataset_path: datasetPath,
                                output_path: folderPath
                            });
                            alert(`Project export completed!\n\nDirectory: ${res.data.output_path}`);
                        } else if (format === 'import_project') {
                            if (!window.electronAPI || !window.electronAPI.selectFolder) {
                                alert("Electron API not available. Please run in Electron.");
                                return;
                            }
                            const folderPath = await window.electronAPI.selectFolder();
                            if (!folderPath) return;
                            
                            const res = await api.post('/import_project', {
                                project_path: folderPath
                            });
                            await loadDataset(res.data.dataset_path);
                            alert(`Project imported successfully!\n\nDataset: ${res.data.dataset_path}`);
                        }
                    } catch (err) {
                        console.error(err);
                        const errorMsg = err.response?.data?.detail || err.message || "Export failed";
                        alert(`Export error: ${errorMsg}`);
                    } finally {
                        setLoading(false);
                    }
                }}
                        onOpenDatasetMerge={() => setShowDatasetMerge(true)}
                        selectedImages={selectedImages}
                        onToggleImageSelection={(imagePath) => {
                            setSelectedImages(prev => {
                                const newSet = new Set(prev);
                                if (newSet.has(imagePath)) {
                                    newSet.delete(imagePath);
                                } else {
                                    newSet.add(imagePath);
                                }
                                return newSet;
                            });
                        }}
                        onImagePreview={setImagePreview}
                    />
                )}
                
                {/* Colonnes stats / analytics / validation */}
                {datasetPath && showStatsPanels && (
                    <div className="stats-column">
                        <button
                            type="button"
                            className="btn-ghost"
                            onClick={() => setShowStatsPanels(!showStatsPanels)}
                            title={showStatsPanels ? 'Masquer les stats' : 'Afficher les stats'}
                            style={{ alignSelf: 'flex-end' }}
                        >
                            {showStatsPanels ? <EyeOff size={14} /> : <Eye size={14} />}
                            {showStatsPanels && <span>Masquer</span>}
                        </button>

                        {showStatsPanels && (
                            <>
                                <StatsPanel
                                    images={images}
                                    annotations={annotations}
                                    classes={classes}
                                    datasetPath={datasetPath}
                                    annotatedImages={annotatedImages}
                                />
                                <AnalyticsPanel
                                    images={images}
                                    annotations={annotations}
                                    classes={classes}
                                    annotatedImages={annotatedImages}
                                />
                                {currentImageIndex >= 0 && images[currentImageIndex] && (
                                    <ValidationPanel
                                        annotations={annotations}
                                        currentImagePath={images[currentImageIndex]}
                                        datasetPath={datasetPath}
                                        onFixAnnotation={(annId) => {
                                            saveAnnotations(annotations.filter((a) => a.id !== annId));
                                        }}
                                    />
                                )}
                                {showMeasurements && (
                                    <MeasurementsPanel
                                        annotations={annotations}
                                        classes={classes}
                                        imageDimensions={{ width: 0, height: 0 }}
                                        selectedId={selectedAnnotationId}
                                        selectedIds={selectedAnnotationIds}
                                    />
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Canvas plein écran */}
            {isFullscreen &&
                images.length > 0 &&
                currentImageIndex >= 0 &&
                currentImageIndex < images.length &&
                images[currentImageIndex] && (
                    <div className="fullscreen-overlay">
                        <AnnotationCanvas
                            imageUrl={images[currentImageIndex]}
                            annotations={annotations}
                            onChange={saveAnnotations}
                            selectedClassId={selectedClassId}
                            classes={classes}
                            selectedId={selectedAnnotationId}
                            onSelect={setSelectedAnnotationId}
                            selectedIds={selectedAnnotationIds}
                            onSelectMultiple={setSelectedAnnotationIds}
                            showAnnotations={showAnnotations}
                            onZoomToSelection={selectedAnnotationId || selectedAnnotationIds.size > 0}
                            isFullscreen={isFullscreen}
                            onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
                        />
                    </div>
                )}
        
            {/* Modals */}
            {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
            
            {showSettings && (
                <SettingsPanel
                    settings={settings}
                    updateSetting={updateSetting}
                    updateSettings={updateSettings}
                    resetSettings={() => {
                        const defaultSettings = loadSettings();
                        updateSettings(defaultSettings);
                    }}
                    onClose={() => setShowSettings(false)}
                />
            )}
            
            <DatasetMergeModal
                isOpen={showDatasetMerge}
                onClose={() => setShowDatasetMerge(false)}
                onMergeComplete={(result) => {
                    alert(`Datasets merged successfully!\n\n` +
                        `Total images: ${result.total_images}\n` +
                        `Total annotations: ${result.total_annotations}\n` +
                        `Total classes: ${result.total_classes}\n\n` +
                        `Output: ${result.output_path}`);
                }}
            />
            
        {showVisionLLM && (
            <VisionLLMModal
                isOpen={showVisionLLM}
                onClose={() => setShowVisionLLM(false)}
                images={images}
                annotations={annotations}
                classes={classes}
                datasetPath={datasetPath}
                annotatedImages={annotatedImages}
                onUpdateAnnotations={async (imagePath, newAnnotations) => {
                    if (!imagePath || !Array.isArray(newAnnotations)) return;
                    
                    const imageIndex = images.findIndex(img => img === imagePath || img.endsWith(imagePath) || imagePath.endsWith(img));
                    if (imageIndex < 0) return;
                    
                    if (imageIndex === currentImageIndex) {
                            await saveAnnotations(newAnnotations);
                    } else {
                        try {
                            await api.post('/save_annotation', {
                                image_name: imagePath,
                                dataset_path: datasetPath,
                                boxes: newAnnotations.map(ann => ({
                                    ...ann,
                                    id: ann.id || uuidv4()
                                }))
                            });
                            
                            if (annotationCache && annotationCache.current) {
                                annotationCache.current[imagePath] = newAnnotations;
                            }
                            
                            setAnnotatedImages(prev => {
                                const newSet = new Set(prev);
                                if (newAnnotations.length > 0) {
                                    newSet.add(imagePath);
                                } else {
                                    newSet.delete(imagePath);
                                }
                                return newSet;
                            });
                        } catch (err) {
                            console.error('Failed to update annotations:', err);
                        }
                    }
                }}
            />
        )}

            {/* Mini Map */}
            {datasetPath && images.length > 0 && (
                <MiniMap
                images={images}
                    currentIndex={currentImageIndex}
                    onImageSelect={(index) => {
                        if (index >= 0 && index < images.length) {
                            setCurrentImageIndex(index);
                        }
                    }}
                    annotatedImages={annotatedImages}
                />
            )}
            
            {/* Batch Image Actions */}
            <BatchImageActions
                selectedImages={selectedImages}
                onClearSelection={() => setSelectedImages(new Set())}
                onBatchDelete={async (imagePaths) => {
                    try {
                        setLoading(true);
                        for (const imgPath of imagePaths) {
                            await api.post('/delete_image', {
                            dataset_path: datasetPath,
                                image_path: imgPath
                            });
                        }
                        const newImages = images.filter(img => !imagePaths.includes(img));
                        setImages(newImages);
                        setSelectedImages(new Set());
                        alert(`Deleted ${imagePaths.length} image(s)`);
                    } catch (err) {
                        console.error('Batch delete error:', err);
                        alert('Failed to delete images: ' + (err.message || 'Unknown error'));
                    } finally {
                        setLoading(false);
                    }
                }}
                onBatchTag={(imagePaths, tags) => {
                    const updated = { ...imageTags };
                    imagePaths.forEach(path => {
                        updated[path] = tags;
                    });
                    setImageTags(updated);
                    try {
                        const key = `image_tags_${datasetPath}`;
                        localStorage.setItem(key, JSON.stringify(updated));
                    } catch (err) {
                        console.error('Failed to save tags:', err);
                    }
                    setSelectedImages(new Set());
                }}
                onBatchExport={(imagePaths) => {
                    alert(`Exporting ${imagePaths.length} selected images...`);
                    // TODO: Implement selective export
                }}
            />
            
            {/* Image Preview Tooltip */}
            {imagePreview && (
                <ImagePreviewTooltip
                    imagePath={imagePreview.path}
                    annotations={imagePreview.annotations || []}
                    classes={classes}
                    position={imagePreview.position || { x: 0, y: 0 }}
            />
        )}
        </>
    );
}

export default App;
