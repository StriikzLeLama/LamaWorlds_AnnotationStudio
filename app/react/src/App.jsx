import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import AnnotationCanvas from './components/AnnotationCanvas';
import StatsPanel from './components/StatsPanel';
import ValidationPanel from './components/ValidationPanel';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import { useUndoRedo } from './hooks/useUndoRedo';
import './styles/index.css';

// Configure Axios
const API_URL = 'http://localhost:8000';
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

// Add request interceptor for better error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
            console.error('Backend connection error:', error);
            // Show user-friendly error
            if (error.config && !error.config._retry) {
                error.config._retry = true;
                // Try to reconnect after a delay
                return new Promise((resolve) => {
                    setTimeout(() => {
                        resolve(api.request(error.config));
                    }, 2000);
                });
            }
        }
        return Promise.reject(error);
    }
);

function App() {
    const [datasetPath, setDatasetPath] = useState('');
    const [images, setImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(-1);
    const [annotations, setAnnotations] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState(0);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
    const [selectedAnnotationIds, setSelectedAnnotationIds] = useState(new Set()); // Multiple selection
    const [navigationHistory, setNavigationHistory] = useState([]); // History for back/forward navigation
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState('Saved');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAnnotated, setFilterAnnotated] = useState(null); // null = all, true = annotated, false = not annotated
    const [filterClassId, setFilterClassId] = useState(null); // null = all classes, number = specific class
    const [copiedAnnotation, setCopiedAnnotation] = useState(null);
    const annotationCache = useRef({}); // Cache for annotations
    const [annotatedImages, setAnnotatedImages] = useState(new Set()); // Set of image paths that have annotations
    const [backendError, setBackendError] = useState(null); // Backend connection error
    const [showShortcuts, setShowShortcuts] = useState(false); // Show keyboard shortcuts help
    const [showAnnotations, setShowAnnotations] = useState(true); // Toggle annotations visibility
    const [isFullscreen, setIsFullscreen] = useState(false); // Fullscreen mode
    const [imageTags, setImageTags] = useState({}); // Tags for images: { imagePath: [tag1, tag2, ...] }
    const [annotationComments, setAnnotationComments] = useState({}); // Comments for annotations: { annotationId: "comment text" }
    const [imageHistory, setImageHistory] = useState({}); // History per image: { imagePath: [{timestamp, annotations, user?}] }
    const [autoSaveHistory, setAutoSaveHistory] = useState([]); // Auto-save history: [{timestamp, datasetPath, state}]
    const [searchInAnnotations, setSearchInAnnotations] = useState(false); // Search in annotations toggle
    const [yoloModelPath, setYoloModelPath] = useState(''); // YOLO model path for pre-annotation
    const [yoloConfidence, setYoloConfidence] = useState(0.25); // YOLO confidence threshold
    
    // Undo/Redo system - initialize with empty array
    const undoRedoHook = useUndoRedo([]);
    const { setState: setUndoRedoState, undo, redo, canUndo, canRedo } = undoRedoHook;

    // Save state to localStorage
    const saveState = useCallback(() => {
        const state = {
            datasetPath,
            currentImageIndex,
            selectedClassId,
            timestamp: Date.now()
        };
        try {
            localStorage.setItem('annotationStudio_state', JSON.stringify(state));
        } catch (err) {
            console.error('Failed to save state:', err);
        }
    }, [datasetPath, currentImageIndex, selectedClassId]);

    // Restore state from localStorage on mount
    useEffect(() => {
        const restoreState = async () => {
            try {
                const savedState = localStorage.getItem('annotationStudio_state');
                if (savedState) {
                    const state = JSON.parse(savedState);
                    // Verify dataset path still exists before restoring
                    if (state.datasetPath) {
                        try {
                            // Verify path exists and load dataset
                            const res = await api.post('/load_dataset', { path: state.datasetPath });
                            if (res.data.images && res.data.images.length > 0) {
                                setDatasetPath(state.datasetPath);
                                setImages(res.data.images);
                                
                                // Restore image index if valid
                                const imageIndex = Math.min(state.currentImageIndex || 0, res.data.images.length - 1);
                                setCurrentImageIndex(imageIndex >= 0 ? imageIndex : 0);

                                // Restore annotation comments
                                try {
                                    const commentsKey = `annotation_comments_${state.datasetPath}`;
                                    const savedComments = localStorage.getItem(commentsKey);
                                    if (savedComments) {
                                        setAnnotationComments(JSON.parse(savedComments));
                                    }
                                } catch (err) {
                                    console.error('Failed to restore comments:', err);
                                }

                                // Restore image tags
                                try {
                                    const tagsKey = `image_tags_${state.datasetPath}`;
                                    const savedTags = localStorage.getItem(tagsKey);
                                    if (savedTags) {
                                        setImageTags(JSON.parse(savedTags));
                                    }
                                } catch (err) {
                                    console.error('Failed to restore tags:', err);
                                }

                                // Load classes
                                const clsRes = await api.post('/load_classes', { path: state.datasetPath });
                                if (clsRes.data.classes.length > 0) {
                                    setClasses(clsRes.data.classes);
                                    // Restore selected class if valid
                                    const classId = state.selectedClassId || 0;
                                    if (clsRes.data.classes.find(c => c.id === classId)) {
                                        setSelectedClassId(classId);
                                    } else {
                                        setSelectedClassId(0);
                                    }
                                } else {
                                    setClasses([{ id: 0, name: 'default', color: '#00e0ff' }]);
                                    setSelectedClassId(0);
                                }
                                
                                // Load annotated images list
                                try {
                                    const annotatedRes = await api.post('/get_annotated_images', { dataset_path: state.datasetPath });
                                    if (annotatedRes.data.annotated_images) {
                                        setAnnotatedImages(new Set(annotatedRes.data.annotated_images));
                                    }
                                } catch (err) {
                                    console.error('Failed to load annotated images:', err);
                                    // Continue without annotated images list
                                }
                            } else {
                                // Dataset exists but no images
                                localStorage.removeItem('annotationStudio_state');
                            }
                        } catch (err) {
                            console.error('Failed to restore dataset:', err);
                            // Clear invalid state
                            localStorage.removeItem('annotationStudio_state');
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to restore state:', err);
            }
        };
        
        // Wait a bit for API to be ready
        const timer = setTimeout(() => {
            restoreState();
        }, 500);
        
        return () => clearTimeout(timer);
    }, []); // Only run on mount

    // Listen for backend errors and ready status from Electron
    useEffect(() => {
        // Listen for backend errors from main process
        if (window.electronAPI && window.electronAPI.onBackendError) {
            const cleanupError = window.electronAPI.onBackendError((error) => {
                console.error('Backend error received:', error);
                setBackendError(error);
            });
            
            // Listen for backend ready status
            let cleanupReady = null;
            if (window.electronAPI.onBackendReady) {
                cleanupReady = window.electronAPI.onBackendReady(() => {
                    console.log('Backend is ready!');
                    setBackendError(null);
                });
            }
            
            return () => {
                if (cleanupError) cleanupError();
                if (cleanupReady) cleanupReady();
            };
        }
        
        // Check backend connection periodically
        let checkInterval;
        const checkBackend = async () => {
            try {
                await api.get('/', { timeout: 2000 });
                setBackendError(null);
            } catch (err) {
                if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
                    // Don't set error immediately, wait for IPC message from main process
                    // setBackendError('Cannot connect to backend server. Please check the console for details.');
                }
            }
        };
        
        // Check after a delay to allow backend to start, then periodically
        const initialTimer = setTimeout(() => {
            checkBackend();
            checkInterval = setInterval(checkBackend, 5000); // Check every 5 seconds
        }, 3000);
        
        return () => {
            clearTimeout(initialTimer);
            if (checkInterval) clearInterval(checkInterval);
        };
    }, []);

    // Save state whenever relevant values change
    useEffect(() => {
        if (datasetPath) {
            saveState();
        }
    }, [datasetPath, currentImageIndex, selectedClassId, saveState]);

    // Debounce timer for auto-save
    const saveDebounceTimer = useRef(null);
    
    // Define saveAnnotations first using useCallback with debouncing
    const saveAnnotations = useCallback(async (newAnnotations, addToHistory = true, immediate = false) => {
        // Validate inputs
        if (!Array.isArray(newAnnotations)) {
            console.error('saveAnnotations: newAnnotations must be an array');
            return;
        }
        
        if (currentImageIndex < 0 || !Array.isArray(images) || currentImageIndex >= images.length || !datasetPath || !images[currentImageIndex]) {
            console.warn('saveAnnotations: Invalid state, skipping save');
            return;
        }
        
        // Validate annotations before saving
        const validAnnotations = newAnnotations.filter(ann => {
            if (!ann || typeof ann !== 'object') return false;
            // Check required fields
            if (typeof ann.x !== 'number' || typeof ann.y !== 'number' || 
                typeof ann.width !== 'number' || typeof ann.height !== 'number' ||
                typeof ann.class_id !== 'number') {
                console.warn('Invalid annotation format:', ann);
                return false;
            }
            // Check for valid values
            if (isNaN(ann.x) || isNaN(ann.y) || isNaN(ann.width) || isNaN(ann.height) || isNaN(ann.class_id)) {
                console.warn('Annotation contains NaN values:', ann);
                return false;
            }
            return true;
        });
        
        // Update state immediately for UI responsiveness
        setAnnotations(validAnnotations);
        const currentImagePath = images[currentImageIndex];
        if (annotationCache && annotationCache.current && currentImagePath) {
            annotationCache.current[currentImagePath] = validAnnotations;
        }
        
        // Add to undo history
        if (addToHistory && Array.isArray(annotations)) {
            setUndoRedoState(annotations);
        }
        
        // Add to image history
        if (currentImagePath && addToHistory && Array.isArray(annotations)) {
            setImageHistory(prev => {
                if (!prev || typeof prev !== 'object') prev = {};
                const imageHist = Array.isArray(prev[currentImagePath]) ? prev[currentImagePath] : [];
                return {
                    ...prev,
                    [currentImagePath]: [
                        ...imageHist,
                        {
                            timestamp: Date.now(),
                            annotations: [...annotations],
                            annotationCount: annotations.length
                        }
                    ].slice(-10) // Keep last 10 history entries
                };
            });
        }
        
        // Clear previous debounce timer
        if (saveDebounceTimer.current) {
            clearTimeout(saveDebounceTimer.current);
        }
        
        // Debounced save function
        const performSave = async () => {
            setSaveStatus('Saving...');
            try {
                if (!currentImagePath) {
                    console.error('No image path available for saving');
                    setSaveStatus('Error');
                    return;
                }
                
                await api.post('/save_annotation', {
                    image_name: currentImagePath,
                    dataset_path: datasetPath,
                    boxes: validAnnotations
                });
                
                // Update annotated images set
                setAnnotatedImages(prev => {
                    const newSet = new Set(prev);
                    if (validAnnotations.length > 0) {
                        newSet.add(currentImagePath);
                    } else {
                        newSet.delete(currentImagePath);
                    }
                    return newSet;
                });
                
                // Auto-save to history
                try {
                    const autoSaveEntry = {
                        timestamp: Date.now(),
                        datasetPath,
                        currentImageIndex,
                        imageCount: Array.isArray(images) ? images.length : 0,
                        annotationCount: validAnnotations.length
                    };
                    setAutoSaveHistory(prev => {
                        const prevArray = Array.isArray(prev) ? prev : [];
                        return [...prevArray, autoSaveEntry].slice(-50);
                    });
                    try {
                        localStorage.setItem('autoSaveHistory', JSON.stringify([...autoSaveHistory, autoSaveEntry].slice(-50)));
                    } catch (storageErr) {
                        console.warn('Failed to save to localStorage:', storageErr);
                    }
                } catch (err) {
                    console.error('Failed to save auto-save history:', err);
                }
                
                setSaveStatus('Saved');
            } catch (err) {
                console.error("Failed to save", err);
                setSaveStatus('Error');
                setTimeout(() => setSaveStatus('Saved'), 2000);
            }
        };
        
        // Save immediately or debounce
        if (immediate) {
            await performSave();
        } else {
            // Debounce save by 500ms for better performance
            saveDebounceTimer.current = setTimeout(performSave, 500);
            setSaveStatus('Saving...');
        }
    }, [currentImageIndex, images, datasetPath, annotations, setUndoRedoState, autoSaveHistory]);
    
    // Undo/Redo handlers
    const handleUndo = useCallback(() => {
        if (canUndo) {
            const previousState = undo();
            if (previousState) {
                saveAnnotations(previousState, false);
            }
        }
    }, [canUndo, undo, saveAnnotations]);
    
    const handleRedo = useCallback(() => {
        if (canRedo) {
            const nextState = redo();
            if (nextState) {
                saveAnnotations(nextState, false);
            }
        }
    }, [canRedo, redo, saveAnnotations]);
    
    // Copy/Paste annotations - Enhanced to support multiple annotations
    const [copiedAnnotations, setCopiedAnnotations] = useState([]); // Support multiple copied annotations
    
    const copyAnnotation = useCallback(() => {
        if (!Array.isArray(annotations)) return;
        
        // Copy multiple if selected, otherwise copy single
        if (selectedAnnotationIds && selectedAnnotationIds.size > 0) {
            const annsToCopy = annotations.filter(a => a && a.id && selectedAnnotationIds.has(a.id));
            if (annsToCopy.length > 0) {
                setCopiedAnnotations(annsToCopy);
                setCopiedAnnotation(annsToCopy[0]); // Keep for backward compatibility
            }
        } else if (selectedAnnotationId) {
            const ann = annotations.find(a => a && a.id === selectedAnnotationId);
            if (ann && typeof ann === 'object') {
                setCopiedAnnotations([ann]);
                setCopiedAnnotation(ann);
            }
        }
    }, [selectedAnnotationId, selectedAnnotationIds, annotations]);
    
    const pasteAnnotation = useCallback(() => {
        if (!Array.isArray(annotations)) return;
        
        // Use multiple copied annotations if available
        const annsToPaste = copiedAnnotations.length > 0 ? copiedAnnotations : 
                           (copiedAnnotation ? [copiedAnnotation] : []);
        
        if (annsToPaste.length === 0) return;
        
        // Validate and create new annotations with offset
        const newAnns = [];
        const offsetX = 20;
        const offsetY = 20;
        
        annsToPaste.forEach((ann, idx) => {
            if (ann && typeof ann === 'object' &&
                typeof ann.x === 'number' && typeof ann.y === 'number' &&
                typeof ann.width === 'number' && typeof ann.height === 'number' &&
                typeof ann.class_id === 'number') {
                newAnns.push({
                    ...ann,
                    id: uuidv4(),
                    x: (ann.x || 0) + offsetX + (idx * 5), // Offset slightly with variation
                    y: (ann.y || 0) + offsetY + (idx * 5)
                });
            }
        });
        
        if (newAnns.length > 0) {
            saveAnnotations([...annotations, ...newAnns]);
            // Select the pasted annotations
            setSelectedAnnotationIds(new Set(newAnns.map(a => a.id)));
        } else {
            console.warn('Cannot paste: invalid annotation format');
        }
    }, [copiedAnnotation, copiedAnnotations, annotations, saveAnnotations]);

    // Save annotations before changing image
    const saveCurrentAnnotations = useCallback(async () => {
        if (currentImageIndex >= 0 && currentImageIndex < images.length && images[currentImageIndex] && datasetPath) {
            try {
                await api.post('/save_annotation', {
                    image_name: images[currentImageIndex],
                    dataset_path: datasetPath,
                    boxes: annotations
                });
                // Update cache
                annotationCache.current[images[currentImageIndex]] = annotations;
            } catch (err) {
                console.error("Failed to save annotations before image change:", err);
            }
        }
    }, [currentImageIndex, images, datasetPath, annotations]);

    // Change image with auto-save
    const changeImageIndex = useCallback(async (newIndex, addToHistory = true) => {
        // Validate inputs
        if (typeof newIndex !== 'number' || isNaN(newIndex)) {
            console.warn('changeImageIndex: Invalid index', newIndex);
            return;
        }
        
        if (newIndex === currentImageIndex) return;
        
        if (!Array.isArray(images) || newIndex < 0 || newIndex >= images.length) {
            console.warn('changeImageIndex: Index out of bounds', newIndex, images.length);
            return;
        }
        
        // Save current annotations before changing
        if (currentImageIndex >= 0 && Array.isArray(images) && images[currentImageIndex] && datasetPath) {
            try {
                await saveCurrentAnnotations();
            } catch (err) {
                console.error('Failed to save annotations before image change:', err);
            }
        }
        
        // Add to navigation history
        if (addToHistory && currentImageIndex >= 0 && Array.isArray(navigationHistory)) {
            const newHistory = navigationHistory.slice(0, Math.max(0, historyIndex + 1));
            newHistory.push(currentImageIndex);
            setNavigationHistory(newHistory);
            setHistoryIndex(newHistory.length - 1);
        }
        
        setCurrentImageIndex(newIndex);
        setSelectedAnnotationId(null);
        setSelectedAnnotationIds(new Set());
    }, [currentImageIndex, images, datasetPath, saveCurrentAnnotations, navigationHistory, historyIndex]);
    
    // Navigation history functions
    const navigateBack = useCallback(() => {
        if (historyIndex >= 0 && navigationHistory[historyIndex] !== undefined) {
            const prevIndex = navigationHistory[historyIndex];
            setHistoryIndex(historyIndex - 1);
            changeImageIndex(prevIndex, false);
        }
    }, [historyIndex, navigationHistory, changeImageIndex]);
    
    const navigateForward = useCallback(() => {
        if (historyIndex < navigationHistory.length - 1) {
            const nextIndex = navigationHistory[historyIndex + 1];
            setHistoryIndex(historyIndex + 1);
            changeImageIndex(nextIndex, false);
        }
    }, [historyIndex, navigationHistory, changeImageIndex]);
    
    const canNavigateBack = historyIndex >= 0;
    const canNavigateForward = historyIndex < navigationHistory.length - 1;

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle if not typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
                return;
            }
            
            // Undo/Redo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                handleUndo();
                e.preventDefault();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                handleRedo();
                e.preventDefault();
            }
            
            // Copy/Paste
            if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedAnnotationId) {
                copyAnnotation();
                e.preventDefault();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedAnnotation) {
                pasteAnnotation();
                e.preventDefault();
            }
            
            // Delete key to remove selected annotation(s)
            if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedAnnotationId || (selectedAnnotationIds && selectedAnnotationIds.size > 0))) {
                if (!Array.isArray(annotations)) return;
                
                let idsToDelete = new Set();
                if (selectedAnnotationId) idsToDelete.add(selectedAnnotationId);
                if (selectedAnnotationIds && selectedAnnotationIds.forEach) {
                    selectedAnnotationIds.forEach(id => {
                        if (id) idsToDelete.add(id);
                    });
                }
                
                const newAnns = annotations.filter(a => a && a.id && !idsToDelete.has(a.id));
                saveAnnotations(newAnns);
                setSelectedAnnotationId(null);
                setSelectedAnnotationIds(new Set());
                e.preventDefault();
            }
            
            // Change class with 1-9 keys (works for single or multiple selection)
            if ((selectedAnnotationId || (selectedAnnotationIds && selectedAnnotationIds.size > 0)) && !e.ctrlKey && !e.metaKey) {
                if (!Array.isArray(annotations) || !Array.isArray(classes)) return;
                
                const numKey = parseInt(e.key);
                if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
                    const classIndex = numKey - 1;
                    if (classes[classIndex] && classes[classIndex].id !== undefined) {
                        let idsToChange = new Set();
                        if (selectedAnnotationId) idsToChange.add(selectedAnnotationId);
                        if (selectedAnnotationIds && selectedAnnotationIds.forEach) {
                            selectedAnnotationIds.forEach(id => {
                                if (id) idsToChange.add(id);
                            });
                        }
                        
                        const newAnns = annotations.map(a => {
                            if (!a || !a.id) return a;
                            return idsToChange.has(a.id) 
                                ? { ...a, class_id: classes[classIndex].id }
                                : a;
                        });
                        saveAnnotations(newAnns);
                        e.preventDefault();
                    }
                }
            }
            
            // Duplicate annotation (Ctrl+D)
            if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedAnnotationId) {
                if (!Array.isArray(annotations)) return;
                
                const ann = annotations.find(a => a && a.id === selectedAnnotationId);
                if (ann && typeof ann === 'object' && 
                    typeof ann.x === 'number' && typeof ann.y === 'number' &&
                    typeof ann.width === 'number' && typeof ann.height === 'number') {
                    const newAnn = {
                        ...ann,
                        id: uuidv4(),
                        x: (ann.x || 0) + 10, // Offset slightly
                        y: (ann.y || 0) + 10
                    };
                    const newAnns = [...annotations, newAnn];
                    saveAnnotations(newAnns);
                    setSelectedAnnotationId(newAnn.id);
                    e.preventDefault();
                }
            }
            
            // Toggle annotations visibility (T key)
            if (e.key === 't' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                setShowAnnotations(prev => !prev);
                e.preventDefault();
            }
            
            // Toggle fullscreen (F11)
            if (e.key === 'F11') {
                setIsFullscreen(prev => !prev);
                e.preventDefault();
            }
            
            // Zoom to selection (Z key)
            if (e.key === 'z' && !e.ctrlKey && !e.metaKey && !e.shiftKey && (selectedAnnotationId || (selectedAnnotationIds && selectedAnnotationIds.size > 0))) {
                // Trigger zoom to selection
                const event = new CustomEvent('zoomToSelection');
                window.dispatchEvent(event);
                e.preventDefault();
            }
            
            // Arrow keys to navigate images
            if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
                if (currentImageIndex < images.length - 1) {
                    changeImageIndex(currentImageIndex + 1);
                    e.preventDefault();
                }
            }
            if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
                if (currentImageIndex > 0) {
                    changeImageIndex(currentImageIndex - 1);
                    e.preventDefault();
                }
            }
            
            // Home/End for first/last image
            if (e.key === 'Home' && !e.ctrlKey && !e.metaKey) {
                if (images.length > 0) {
                    changeImageIndex(0);
                    e.preventDefault();
                }
            }
            if (e.key === 'End' && !e.ctrlKey && !e.metaKey) {
                if (images.length > 0) {
                    changeImageIndex(images.length - 1);
                    e.preventDefault();
                }
            }
            
            // N for next unannotated image
            if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                if (Array.isArray(images) && annotatedImages && typeof currentImageIndex === 'number') {
                    const nextUnannotated = images.findIndex((img, idx) => 
                        img && idx > currentImageIndex && !annotatedImages.has(img)
                    );
                    if (nextUnannotated >= 0) {
                        changeImageIndex(nextUnannotated);
                        e.preventDefault();
                    }
                }
            }
            
            // Shift+N for previous unannotated
            if (e.key === 'N' && e.shiftKey && !e.ctrlKey && !e.metaKey) {
                if (Array.isArray(images) && annotatedImages && typeof currentImageIndex === 'number' && currentImageIndex > 0) {
                    const prevUnannotated = images.slice(0, currentImageIndex).reverse().findIndex(img => 
                        img && !annotatedImages.has(img)
                    );
                    if (prevUnannotated >= 0) {
                        const actualIndex = currentImageIndex - prevUnannotated - 1;
                        if (actualIndex >= 0 && actualIndex < images.length) {
                            changeImageIndex(actualIndex);
                            e.preventDefault();
                        }
                    }
                }
            }
            
            // Select all annotations (Ctrl+A)
            if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.shiftKey) {
                if (Array.isArray(annotations) && annotations.length > 0) {
                    const validIds = annotations
                        .filter(a => a && a.id)
                        .map(a => a.id);
                    if (validIds.length > 0) {
                        setSelectedAnnotationIds(new Set(validIds));
                        e.preventDefault();
                    }
                }
            }
            
            // Navigation history (Alt+Left/Right)
            if (e.altKey && e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
                navigateBack();
                e.preventDefault();
            }
            if (e.altKey && e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
                navigateForward();
                e.preventDefault();
            }
            
            // Show shortcuts help (? or F1)
            if (e.key === '?' || e.key === 'F1') {
                setShowShortcuts(prev => !prev);
                e.preventDefault();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedAnnotationId, selectedAnnotationIds, annotations, currentImageIndex, images, saveAnnotations, handleUndo, handleRedo, copyAnnotation, pasteAnnotation, copiedAnnotation, changeImageIndex]);

    // Load annotations when image changes (with caching)
    useEffect(() => {
        if (currentImageIndex >= 0 && images[currentImageIndex] && datasetPath) {
            const imagePath = images[currentImageIndex];
            
            // Check cache first
            if (annotationCache.current[imagePath]) {
                setAnnotations(annotationCache.current[imagePath]);
                return;
            }
            
            const loadAnns = async () => {
                try {
                    const res = await api.post('/load_annotation', {
                        dataset_path: datasetPath,
                        image_path: imagePath
                    });
                    const boxes = res.data.boxes || [];
                    setAnnotations(boxes);
                    // Cache annotations
                    annotationCache.current[imagePath] = boxes;
                } catch (err) {
                    console.error("Error loading annotations:", err);
                    setAnnotations([]);
                    annotationCache.current[imagePath] = [];
                }
            };
            loadAnns();
        } else {
            setAnnotations([]);
        }
    }, [currentImageIndex, images, datasetPath]);

    const onChangeAnnotationClass = async (annId, newClassId) => {
        // Validate inputs
        if (!annId || typeof newClassId !== 'number' || isNaN(newClassId)) {
            console.warn('onChangeAnnotationClass: Invalid parameters', annId, newClassId);
            return;
        }
        
        if (!Array.isArray(annotations)) {
            console.warn('onChangeAnnotationClass: annotations is not an array');
            return;
        }
        
        const newAnns = annotations.map(a => {
            if (!a || !a.id) return a;
            return a.id === annId ? { ...a, class_id: newClassId } : a;
        });
        
        setAnnotations(newAnns);
        // Auto-save
        setSaveStatus('Saving...');
        try {
            if (!Array.isArray(images) || currentImageIndex < 0 || currentImageIndex >= images.length) {
                console.error('Invalid image index or images array');
                setSaveStatus('Error');
                return;
            }
            
            const currentImagePath = images[currentImageIndex];
            if (!currentImagePath || !datasetPath) {
                console.error('No image path or dataset path available for saving');
                setSaveStatus('Error');
                return;
            }
            
            await api.post('/save_annotation', {
                image_name: currentImagePath,
                dataset_path: datasetPath,
                boxes: newAnns
            });
            setTimeout(() => setSaveStatus('Saved'), 500);
            
            // Update annotated images set (should already be in set, but ensure it)
            if (currentImagePath && newAnns.length > 0) {
                setAnnotatedImages(prev => {
                    const newSet = new Set(prev);
                    newSet.add(currentImagePath);
                    return newSet;
                });
            }
        } catch (err) {
            console.error('Failed to change annotation class:', err);
            setSaveStatus('Error');
        }
    };

    const onUpdateClasses = async (newClasses) => {
        setClasses(newClasses);
        try {
            await api.post('/save_classes', { classes: newClasses, dataset_path: datasetPath });
        } catch (err) {
            console.error(err);
        }
    };

    const handleImportYaml = async () => {
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

            const res = await api.post('/import_yaml_classes', formData);

            if (res.data.classes && res.data.classes.length > 0) {
                // Ask user if they want to replace or merge
                const action = window.confirm(
                    `Found ${res.data.count} classes in YAML file.\n\n` +
                    `Click OK to replace existing classes, or Cancel to merge.`
                );

                if (action) {
                    // Replace
                    setClasses(res.data.classes);
                    if (datasetPath) {
                        await api.post('/save_classes', { 
                            classes: res.data.classes, 
                            dataset_path: datasetPath 
                        });
                    }
                    alert(`Imported ${res.data.count} classes from YAML.`);
                } else {
                    // Merge - add new classes that don't exist
                    const existingNames = new Set(classes.map(c => c.name.toLowerCase()));
                    const newClasses = res.data.classes.filter(c => 
                        !existingNames.has(c.name.toLowerCase())
                    );
                    if (newClasses.length > 0) {
                        const merged = [...classes, ...newClasses];
                        setClasses(merged);
                        if (datasetPath) {
                            await api.post('/save_classes', { 
                                classes: merged, 
                                dataset_path: datasetPath 
                            });
                        }
                        alert(`Added ${newClasses.length} new classes from YAML.`);
                    } else {
                        alert('All classes from YAML already exist.');
                    }
                }
            } else {
                alert('No classes found in YAML file.');
            }
        } catch (err) {
            console.error(err);
            let errorMsg = "Failed to import YAML";
            if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
                errorMsg = "Cannot connect to backend server. Please make sure the application is running correctly.";
            } else if (err.response?.data?.detail) {
                errorMsg = err.response.data.detail;
            } else if (err.message) {
                errorMsg = err.message;
            }
            alert(`Error importing YAML: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    const openDataset = async (resetState = false) => {
        try {
            if (!window.electronAPI || !window.electronAPI.selectDirectory) {
                alert("Electron API not available. Please run in Electron.");
                return;
            }
            
            // First, check if backend is available
            try {
                await api.get('/', { timeout: 3000 });
            } catch (err) {
                if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED') {
                    const errorMsg = "Backend server is not running!\n\n" +
                        "The Python backend needs to be started before opening a dataset.\n\n" +
                        "Possible causes:\n" +
                        "1. Python is not installed or not in PATH\n" +
                        "2. Python dependencies are not installed\n" +
                        "3. The backend failed to start\n\n" +
                        "Please check the console for detailed error messages.\n" +
                        "If the error persists, try:\n" +
                        "- Restart the application\n" +
                        "- Install Python 3.10+ and add it to PATH\n" +
                        "- Install dependencies: pip install -r requirements.txt";
                    alert(errorMsg);
                    setBackendError("Backend server is not running. Please check the console for details.");
                    return;
                }
            }
            
            const path = await window.electronAPI.selectDirectory();
            if (path) {
                // Clear previous state if opening new dataset
                if (resetState) {
                    setSelectedAnnotationId(null);
                    setAnnotations([]);
                }
                
                setDatasetPath(path);
                setLoading(true);
                // Load images
                try {
                    const res = await api.post('/load_dataset', { path });
                    setImages(res.data.images);
                    if (res.data.images.length > 0) {
                        setCurrentImageIndex(0);
                    } else {
                        alert("No images found in the selected directory");
                    }

                    // Load classes
                    const clsRes = await api.post('/load_classes', { path });
                    if (clsRes.data.classes.length > 0) {
                        setClasses(clsRes.data.classes);
                        setSelectedClassId(0);
                    } else {
                        setClasses([
                            { id: 0, name: 'default', color: '#00e0ff' }
                        ]);
                        setSelectedClassId(0);
                    }
                    
                    // Load annotated images list
                    try {
                        const annotatedRes = await api.post('/get_annotated_images', { dataset_path: path });
                        if (annotatedRes.data.annotated_images) {
                            setAnnotatedImages(new Set(annotatedRes.data.annotated_images));
                        }
                    } catch (err) {
                        console.error('Failed to load annotated images:', err);
                        // Continue without annotated images list
                    }
                } catch (err) {
                    console.error(err);
                    let errorMsg = "Failed to load dataset";
                    if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
                        errorMsg = "Cannot connect to backend server.\n\n" +
                            "The backend may have stopped. Please:\n" +
                            "1. Check the console for error messages\n" +
                            "2. Restart the application\n" +
                            "3. Verify Python is installed and dependencies are installed";
                        setBackendError("Backend connection lost. Please restart the application.");
                    } else if (err.response?.data?.detail) {
                        errorMsg = err.response.data.detail;
                    } else if (err.message) {
                        errorMsg = err.message;
                    }
                    alert(`Error: ${errorMsg}`);
                } finally {
                    setLoading(false);
                }
            }
        } catch (err) {
            console.error(err);
            alert("Failed to open directory dialog");
        }
    };

    // ... existing ...

    // Calculate progress
    const annotatedCount = images.filter((img) => annotatedImages.has(img)).length;
    const progress = images.length > 0 ? ((annotatedCount / images.length) * 100).toFixed(1) : 0;

    return (
        <>
        <div className="app-container" style={{ 
            display: isFullscreen ? 'none' : 'flex', 
            height: '100vh', 
            width: '100vw', 
            backgroundColor: '#050510', 
            color: 'white', 
            overflow: 'hidden', 
            boxSizing: 'border-box', 
            margin: 0, 
            padding: 0, 
            position: 'fixed', 
            top: 0, 
            left: 0 
        }}>
            {/* Sidebar - Class Manager */}
            {!isFullscreen && <Sidebar
                classes={classes}
                setClasses={onUpdateClasses}
                selectedClassId={selectedClassId}
                setSelectedClassId={setSelectedClassId}
                selectedAnnotationId={selectedAnnotationId}
                onChangeAnnotationClass={onChangeAnnotationClass}
                onImportYaml={handleImportYaml}
                annotations={annotations}
                onBatchDeleteClass={(classId) => {
                    const newAnns = annotations.filter(a => a.class_id !== classId);
                    saveAnnotations(newAnns, true, true); // Immediate save for batch operations
                }}
                onBatchChangeClass={(oldClassId, newClassId) => {
                    const newAnns = annotations.map(a => 
                        a.class_id === oldClassId ? { ...a, class_id: newClassId } : a
                    );
                    saveAnnotations(newAnns, true, true);
                }}
                onAlignAnnotations={(alignment) => {
                    if (selectedAnnotationIds.size === 0 && !selectedAnnotationId) return;
                    
                    const idsToAlign = selectedAnnotationIds.size > 0 
                        ? Array.from(selectedAnnotationIds)
                        : [selectedAnnotationId];
                    
                    const annsToAlign = annotations.filter(a => a && idsToAlign.includes(a.id));
                    if (annsToAlign.length < 2) return;
                    
                    let newAnns = [...annotations];
                    
                    if (alignment === 'left') {
                        const minX = Math.min(...annsToAlign.map(a => a.x));
                        newAnns = newAnns.map(a => 
                            idsToAlign.includes(a.id) ? { ...a, x: minX } : a
                        );
                    } else if (alignment === 'right') {
                        const maxX = Math.max(...annsToAlign.map(a => a.x + a.width));
                        newAnns = newAnns.map(a => 
                            idsToAlign.includes(a.id) ? { ...a, x: maxX - a.width } : a
                        );
                    } else if (alignment === 'top') {
                        const minY = Math.min(...annsToAlign.map(a => a.y));
                        newAnns = newAnns.map(a => 
                            idsToAlign.includes(a.id) ? { ...a, y: minY } : a
                        );
                    } else if (alignment === 'bottom') {
                        const maxY = Math.max(...annsToAlign.map(a => a.y + a.height));
                        newAnns = newAnns.map(a => 
                            idsToAlign.includes(a.id) ? { ...a, y: maxY - a.height } : a
                        );
                    } else if (alignment === 'center-h') {
                        const centerX = annsToAlign.reduce((sum, a) => sum + a.x + a.width / 2, 0) / annsToAlign.length;
                        newAnns = newAnns.map(a => 
                            idsToAlign.includes(a.id) ? { ...a, x: centerX - a.width / 2 } : a
                        );
                    } else if (alignment === 'center-v') {
                        const centerY = annsToAlign.reduce((sum, a) => sum + a.y + a.height / 2, 0) / annsToAlign.length;
                        newAnns = newAnns.map(a => 
                            idsToAlign.includes(a.id) ? { ...a, y: centerY - a.height / 2 } : a
                        );
                    } else if (alignment === 'distribute-h') {
                        const sorted = [...annsToAlign].sort((a, b) => a.x - b.x);
                        const totalWidth = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width - sorted[0].x;
                        const spacing = totalWidth / (sorted.length - 1);
                        let currentX = sorted[0].x;
                        sorted.forEach((ann, idx) => {
                            if (idx > 0 && idx < sorted.length - 1) {
                                currentX += spacing;
                                const annIdx = newAnns.findIndex(a => a.id === ann.id);
                                if (annIdx >= 0) {
                                    newAnns[annIdx] = { ...newAnns[annIdx], x: currentX - ann.width / 2 };
                                }
                            }
                        });
                    } else if (alignment === 'distribute-v') {
                        const sorted = [...annsToAlign].sort((a, b) => a.y - b.y);
                        const totalHeight = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height - sorted[0].y;
                        const spacing = totalHeight / (sorted.length - 1);
                        let currentY = sorted[0].y;
                        sorted.forEach((ann, idx) => {
                            if (idx > 0 && idx < sorted.length - 1) {
                                currentY += spacing;
                                const annIdx = newAnns.findIndex(a => a.id === ann.id);
                                if (annIdx >= 0) {
                                    newAnns[annIdx] = { ...newAnns[annIdx], y: currentY - ann.height / 2 };
                                }
                            }
                        });
                    }
                    
                    saveAnnotations(newAnns, true, true);
                }}
                onPreAnnotate={async (modelPath, confidence) => {
                    if (!datasetPath || images.length === 0) {
                        alert('Please open a dataset first');
                        return;
                    }
                    try {
                        setLoading(true);
                        // This would call a backend endpoint for YOLO pre-annotation
                        // For now, we'll show a message
                        alert(`YOLO Pre-annotation feature:\n\nModel: ${modelPath}\nConfidence: ${(confidence * 100).toFixed(0)}%\n\nThis feature requires YOLO model integration in the backend.`);
                        setLoading(false);
                    } catch (err) {
                        console.error('Pre-annotation failed:', err);
                        alert('Pre-annotation failed: ' + (err.message || 'Unknown error'));
                        setLoading(false);
                    }
                }}
                yoloModelPath={yoloModelPath}
                setYoloModelPath={setYoloModelPath}
                yoloConfidence={yoloConfidence}
                setYoloConfidence={setYoloConfidence}
            />}

            {/* Right Side Panels - Stats and Validation */}
            {datasetPath && (
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    width: '250px',
                    margin: '10px',
                    gap: '10px'
                }}>
                    {/* Stats Panel */}
                    <StatsPanel 
                        images={images} 
                        annotations={annotations} 
                        classes={classes} 
                        datasetPath={datasetPath} 
                        annotatedImages={annotatedImages} 
                    />
                    
                    {/* Validation Panel */}
                    {currentImageIndex >= 0 && images[currentImageIndex] && (
                        <ValidationPanel
                            annotations={annotations}
                            currentImagePath={images[currentImageIndex]}
                            datasetPath={datasetPath}
                            onFixAnnotation={(annId) => {
                                const newAnns = annotations.filter(a => a.id !== annId);
                                saveAnnotations(newAnns);
                            }}
                        />
                    )}
                </div>
            )}

            {/* Main Canvas Area */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Top Bar */}
                <div className="glass-panel title-drag-region" style={{ minHeight: '60px', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', margin: '10px', flexDirection: 'column', zIndex: 1000, position: 'relative', boxSizing: 'border-box', marginTop: '10px', marginBottom: '10px' }}>
                    {backendError && (
                        <div style={{ 
                            width: '100%', 
                            background: 'rgba(255, 68, 68, 0.2)', 
                            border: '1px solid #ff4444', 
                            padding: '12px', 
                            borderRadius: '4px', 
                            marginBottom: '8px', 
                            fontSize: '0.85rem', 
                            color: '#ffaaaa',
                            whiteSpace: 'pre-line',
                            lineHeight: '1.5'
                        }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '0.9rem' }}>
                                ⚠️ Backend Error
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                {backendError}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#ff8888', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255, 136, 136, 0.3)' }}>
                                <strong>Quick Fix:</strong> Make sure Python 3.10+ is installed and dependencies are installed:<br/>
                                <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '3px' }}>
                                    pip install -r requirements.txt
                                </code>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div className="neon-text" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>LAMA ANNOTATION STUDIO</div>
                            <button
                                onClick={() => setShowShortcuts(true)}
                                style={{
                                    background: 'rgba(0, 224, 255, 0.1)',
                                    border: '1px solid rgba(0, 224, 255, 0.3)',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    color: '#00e0ff',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                                title="Keyboard Shortcuts (?)"
                            >
                                <span>?</span> Help
                            </button>
                            <div style={{ fontSize: '0.8rem', color: saveStatus === 'Error' ? '#ff4444' : '#00ff00', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                {saveStatus}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#aaa', alignItems: 'center' }}>
                                {(canUndo || canRedo) && (
                                    <>
                                        <button
                                            onClick={handleUndo}
                                            disabled={!canUndo}
                                            style={{
                                                padding: '2px 8px',
                                                background: canUndo ? 'rgba(0, 224, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '4px',
                                                color: canUndo ? '#00e0ff' : '#666',
                                                cursor: canUndo ? 'pointer' : 'not-allowed',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            Undo (Ctrl+Z)
                                        </button>
                                        <button
                                            onClick={handleRedo}
                                            disabled={!canRedo}
                                            style={{
                                                padding: '2px 8px',
                                                background: canRedo ? 'rgba(0, 224, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '4px',
                                                color: canRedo ? '#00e0ff' : '#666',
                                                cursor: canRedo ? 'pointer' : 'not-allowed',
                                                fontSize: '0.75rem'
                                            }}
                                        >
                                            Redo (Ctrl+Y)
                                        </button>
                                    </>
                                )}
                                {/* Navigation history */}
                                {(canNavigateBack || canNavigateForward) && (
                                    <>
                                        <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.2)' }} />
                                        <button
                                            onClick={navigateBack}
                                            disabled={!canNavigateBack}
                                            style={{
                                                padding: '2px 8px',
                                                background: canNavigateBack ? 'rgba(0, 224, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '4px',
                                                color: canNavigateBack ? '#00e0ff' : '#666',
                                                cursor: canNavigateBack ? 'pointer' : 'not-allowed',
                                                fontSize: '0.75rem'
                                            }}
                                            title="Alt+Left"
                                        >
                                            ← Back
                                        </button>
                                        <button
                                            onClick={navigateForward}
                                            disabled={!canNavigateForward}
                                            style={{
                                                padding: '2px 8px',
                                                background: canNavigateForward ? 'rgba(0, 224, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '4px',
                                                color: canNavigateForward ? '#00e0ff' : '#666',
                                                cursor: canNavigateForward ? 'pointer' : 'not-allowed',
                                                fontSize: '0.75rem'
                                            }}
                                            title="Alt+Right"
                                        >
                                            Forward →
                                        </button>
                                    </>
                                )}
                                {/* Next unannotated */}
                                {images.length > 0 && (
                                    <>
                                        <div style={{ width: '1px', height: '16px', background: 'rgba(255, 255, 255, 0.2)' }} />
                                        <button
                                            onClick={() => {
                                                const nextUnannotated = images.findIndex((img, idx) => 
                                                    idx > currentImageIndex && !annotatedImages.has(img)
                                                );
                                                if (nextUnannotated >= 0) {
                                                    changeImageIndex(nextUnannotated);
                                                }
                                            }}
                                            style={{
                                                padding: '2px 8px',
                                                background: 'rgba(0, 224, 255, 0.1)',
                                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                                borderRadius: '4px',
                                                color: '#00e0ff',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem'
                                            }}
                                            title="Next Unannotated (N)"
                                        >
                                            Next Empty (N)
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {!datasetPath && (
                                <button className="btn-primary" onClick={() => openDataset(true)}>
                                    Open Dataset Folder
                                </button>
                            )}
                            {datasetPath && (
                                <>
                                    <span style={{ color: '#aaa', fontSize: '0.8rem', maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {datasetPath}
                                    </span>
                                    <button 
                                        className="btn-primary" 
                                        onClick={() => openDataset(true)}
                                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                    >
                                        Open Another Dataset
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    {/* Progress Bar */}
                    {datasetPath && images.length > 0 && (
                        <div style={{ width: '100%', marginTop: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#aaa', marginBottom: '4px' }}>
                                <span>Progress: {currentImageIndex + 1} / {images.length}</span>
                                <span>{progress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ 
                                    width: `${((currentImageIndex + 1) / images.length) * 100}%`, 
                                    height: '100%', 
                                    background: 'linear-gradient(90deg, #00e0ff, #56b0ff)',
                                    transition: 'width 0.3s ease'
                                }}></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Canvas */}
                <div style={{ flex: 1, backgroundColor: '#000', margin: '0 10px 10px 10px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#00e0ff' }}>
                            <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                border: '3px solid rgba(0, 224, 255, 0.3)', 
                                borderTop: '3px solid #00e0ff', 
                                borderRadius: '50%', 
                                animation: 'spin 1s linear infinite',
                                marginBottom: '20px'
                            }}></div>
                            <div>Loading...</div>
                        </div>
                    ) : images.length > 0 && currentImageIndex >= 0 && currentImageIndex < images.length && images[currentImageIndex] ? (
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
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#555', gap: '20px' }}>
                            {images.length === 0 ? (
                                <>
                                    <div style={{ fontSize: '3rem' }}>📁</div>
                                    <div style={{ fontSize: '1.2rem' }}>No images loaded</div>
                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>Click "Open Dataset Folder" to get started</div>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: '3rem' }}>🖼️</div>
                                    <div style={{ fontSize: '1.2rem' }}>No image selected</div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Image List & Info */}
            <RightPanel
                annotatedImages={annotatedImages}
                images={images}
                currentIndex={currentImageIndex}
                setIndex={changeImageIndex}
                annotations={annotations}
                classes={classes}
                selectedAnnotationId={selectedAnnotationId}
                onSelectAnnotation={setSelectedAnnotationId}
                onChangeAnnotationClass={onChangeAnnotationClass}
                onDeleteAnnotation={(id) => {
                    const newAnns = annotations.filter(a => a.id !== id);
                    saveAnnotations(newAnns);
                    if (selectedAnnotationId === id) {
                        setSelectedAnnotationId(null);
                    }
                }}
                annotationComments={annotationComments}
                onUpdateAnnotationComment={(annId, comment) => {
                    setAnnotationComments(prev => ({
                        ...prev,
                        [annId]: comment || undefined
                    }));
                    // Save to localStorage
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
                    // Save to localStorage
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
                datasetPath={datasetPath}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterAnnotated={filterAnnotated}
                setFilterAnnotated={setFilterAnnotated}
                filterClassId={filterClassId}
                setFilterClassId={setFilterClassId}
                annotationCache={annotationCache}
                onDeleteImage={async (imagePath, imageIndex) => {
                    try {
                        setLoading(true);
                        // Delete image and annotation file via backend
                        await api.post('/delete_image', {
                            dataset_path: datasetPath,
                            image_path: imagePath
                        });
                        
                        // Remove from images list
                        const newImages = images.filter((img, idx) => img !== imagePath);
                        setImages(newImages);
                        
                        // Remove from annotated images set
                        setAnnotatedImages(prev => {
                            const newSet = new Set(prev);
                            newSet.delete(imagePath);
                            return newSet;
                        });
                        
                        // Remove from cache
                        if (annotationCache.current[imagePath]) {
                            delete annotationCache.current[imagePath];
                        }
                        
                        // Adjust current index if needed
                        if (imageIndex <= currentImageIndex) {
                            if (currentImageIndex > 0) {
                                setCurrentImageIndex(currentImageIndex - 1);
                            } else if (newImages.length > 0) {
                                setCurrentImageIndex(0);
                            } else {
                                setCurrentImageIndex(-1);
                            }
                        } else if (currentImageIndex >= newImages.length && newImages.length > 0) {
                            setCurrentImageIndex(newImages.length - 1);
                        }
                        
                        // Clear annotations if current image was deleted
                        if (imageIndex === currentImageIndex) {
                            setAnnotations([]);
                        }
                    } catch (err) {
                        console.error('Failed to delete image:', err);
                        throw err;
                    } finally {
                        setLoading(false);
                    }
                }}
                setImages={setImages}
                onExport={async (format) => {
                    if (!datasetPath) {
                        alert('Please open a dataset first');
                        return;
                    }
                    
                    // Export/Import project
                    if (format === 'project') {
                        try {
                            setLoading(true);
                            const projectData = {
                                version: '1.0',
                                datasetPath,
                                classes,
                                imageTags,
                                annotationComments,
                                currentImageIndex,
                                selectedClassId,
                                timestamp: Date.now(),
                                imageCount: images.length
                            };
                            
                            const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `project_${datasetPath.split(/[/\\]/).pop()}_${new Date().toISOString().split('T')[0]}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                            setLoading(false);
                            return;
                        } catch (err) {
                            console.error('Failed to export project:', err);
                            alert('Failed to export project: ' + (err.message || 'Unknown error'));
                            setLoading(false);
                            return;
                        }
                    }
                    
                    if (format === 'import_project') {
                        try {
                            if (!window.electronAPI || !window.electronAPI.selectFile) {
                                alert("Electron API not available");
                                return;
                            }
                            
                            const filePath = await window.electronAPI.selectFile([
                                { name: 'JSON Files', extensions: ['json'] },
                                { name: 'All Files', extensions: ['*'] }
                            ]);
                            
                            if (!filePath) return;
                            
                            setLoading(true);
                            const fileContent = await window.electronAPI.readFile(filePath);
                            const projectData = JSON.parse(fileContent);
                            
                            if (projectData.version && projectData.datasetPath) {
                                const confirmMsg = `Import project from:\n${projectData.datasetPath}\n\n` +
                                    `Classes: ${projectData.classes?.length || 0}\n` +
                                    `Images: ${projectData.imageCount || 0}\n\n` +
                                    `This will restore the project state. Continue?`;
                                
                                if (window.confirm(confirmMsg)) {
                                    // Restore project state
                                    if (projectData.classes) setClasses(projectData.classes);
                                    if (projectData.imageTags) setImageTags(projectData.imageTags);
                                    if (projectData.annotationComments) setAnnotationComments(projectData.annotationComments);
                                    if (projectData.selectedClassId !== undefined) setSelectedClassId(projectData.selectedClassId);
                                    
                                    // Try to load dataset if path exists
                                    try {
                                        const res = await api.post('/load_dataset', { path: projectData.datasetPath });
                                        if (res.data.images && res.data.images.length > 0) {
                                            setDatasetPath(projectData.datasetPath);
                                            setImages(res.data.images);
                                            if (projectData.currentImageIndex !== undefined) {
                                                setCurrentImageIndex(Math.min(projectData.currentImageIndex, res.data.images.length - 1));
                                            }
                                        }
                                    } catch (err) {
                                        console.error('Failed to load dataset:', err);
                                        alert('Project imported but dataset path not found. Please open the dataset manually.');
                                    }
                                }
                            } else {
                                alert('Invalid project file format');
                            }
                            setLoading(false);
                            return;
                        } catch (err) {
                            console.error('Failed to import project:', err);
                            alert('Failed to import project: ' + (err.message || 'Unknown error'));
                            setLoading(false);
                            return;
                        }
                    }
                    
                    // Validation before export (except for reports)
                    if (format !== 'report') {
                        const invalidAnnotations = annotations.filter(ann => 
                            ann.width <= 0 || ann.height <= 0 || 
                            ann.x < 0 || ann.y < 0
                        );
                        if (invalidAnnotations.length > 0) {
                            const proceed = window.confirm(
                                `Found ${invalidAnnotations.length} invalid annotation(s). Continue anyway?`
                            );
                            if (!proceed) return;
                        }
                    }
                    
                    try {
                        setLoading(true);
                        if (format === 'report') {
                            const res = await api.post('/export_report', {
                                dataset_path: datasetPath
                            });
                            const report = res.data.report;
                            const summary = report.summary;
                            const reportText = `Quality Report Generated!\n\n` +
                                `Dataset: ${datasetPath}\n` +
                                `Generated: ${new Date(report.generated_at).toLocaleString()}\n\n` +
                                `Summary:\n` +
                                `- Total Images: ${summary.total_images}\n` +
                                `- Annotated: ${summary.annotated_images} (${summary.completion_percentage.toFixed(1)}%)\n` +
                                `- Total Annotations: ${summary.total_annotations}\n` +
                                `- Invalid: ${summary.invalid_annotations}\n` +
                                `- Avg per Image: ${summary.avg_annotations_per_image.toFixed(1)}\n\n` +
                                `Report saved to: ${res.data.file}`;
                            alert(reportText);
                        } else {
                            const res = await api.post('/export', {
                                dataset_path: datasetPath,
                                format: format
                            });
                            if (format === 'coco') {
                                alert(`Exported to: ${res.data.file}`);
                            } else {
                                alert(`Exported ${res.data.count} files to: ${res.data.dir}`);
                            }
                        }
                    } catch (err) {
                        console.error(err);
                        const errorMsg = err.response?.data?.detail || err.message || "Export failed";
                        alert(`Export error: ${errorMsg}`);
                    } finally {
                        setLoading(false);
                    }
                }}
            />
            
            {/* Keyboard Shortcuts Help */}
            {showShortcuts && <KeyboardShortcuts onClose={() => setShowShortcuts(false)} />}
        </div>
        
        {/* Fullscreen Canvas */}
        {isFullscreen && images.length > 0 && currentImageIndex >= 0 && currentImageIndex < images.length && images[currentImageIndex] && (
            <div style={{ 
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                backgroundColor: '#000',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
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
            </div>
        )}
        </>
    );
}

export default App;
