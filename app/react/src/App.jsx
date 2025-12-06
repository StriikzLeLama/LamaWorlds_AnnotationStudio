import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import AnnotationCanvas from './components/AnnotationCanvas';
import StatsPanel from './components/StatsPanel';
import { useUndoRedo } from './hooks/useUndoRedo';
import './styles/index.css';

// Configure Axios
const API_URL = 'http://localhost:8000';
const api = axios.create({ baseURL: API_URL });

function App() {
    const [datasetPath, setDatasetPath] = useState('');
    const [images, setImages] = useState([]);
    const [currentImageIndex, setCurrentImageIndex] = useState(-1);
    const [annotations, setAnnotations] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState(0);
    const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
    const [selectedAnnotationIds, setSelectedAnnotationIds] = useState(new Set()); // Multiple selection
    const [loading, setLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState('Saved');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterAnnotated, setFilterAnnotated] = useState(null); // null = all, true = annotated, false = not annotated
    const [copiedAnnotation, setCopiedAnnotation] = useState(null);
    const annotationCache = useRef({}); // Cache for annotations
    
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

    // Save state whenever relevant values change
    useEffect(() => {
        if (datasetPath) {
            saveState();
        }
    }, [datasetPath, currentImageIndex, selectedClassId, saveState]);

    // Define saveAnnotations first using useCallback
    const saveAnnotations = useCallback(async (newAnnotations, addToHistory = true) => {
        if (currentImageIndex < 0 || !datasetPath) return;
        
        // Add to undo history
        if (addToHistory) {
            setUndoRedoState(annotations);
        }
        
        setSaveStatus('Saving...');
        try {
            await api.post('/save_annotation', {
                image_name: images[currentImageIndex],
                dataset_path: datasetPath,
                boxes: newAnnotations
            });
            setAnnotations(newAnnotations);
            // Cache annotations
            if (currentImageIndex >= 0 && images[currentImageIndex]) {
                annotationCache.current[images[currentImageIndex]] = newAnnotations;
            }
            setTimeout(() => setSaveStatus('Saved'), 500);
        } catch (err) {
            console.error("Failed to save", err);
            setSaveStatus('Error');
            setTimeout(() => setSaveStatus('Saved'), 2000);
        }
    }, [currentImageIndex, images, datasetPath, annotations, setUndoRedoState]);
    
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
    
    // Copy/Paste annotations
    const copyAnnotation = useCallback(() => {
        if (selectedAnnotationId) {
            const ann = annotations.find(a => a.id === selectedAnnotationId);
            if (ann) {
                setCopiedAnnotation(ann);
            }
        }
    }, [selectedAnnotationId, annotations]);
    
    const pasteAnnotation = useCallback(() => {
        if (copiedAnnotation) {
            const newAnn = {
                ...copiedAnnotation,
                id: uuidv4(),
                x: copiedAnnotation.x + 20, // Offset slightly
                y: copiedAnnotation.y + 20
            };
            saveAnnotations([...annotations, newAnn]);
        }
    }, [copiedAnnotation, annotations, saveAnnotations]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
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
            if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedAnnotationId || selectedAnnotationIds.size > 0)) {
                let idsToDelete = new Set();
                if (selectedAnnotationId) idsToDelete.add(selectedAnnotationId);
                selectedAnnotationIds.forEach(id => idsToDelete.add(id));
                
                const newAnns = annotations.filter(a => !idsToDelete.has(a.id));
                saveAnnotations(newAnns);
                setSelectedAnnotationId(null);
                setSelectedAnnotationIds(new Set());
                e.preventDefault();
            }
            
            // Arrow keys to navigate images (only if not typing in input)
            if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
                if (e.key === 'ArrowRight' && !e.ctrlKey && !e.metaKey) {
                    if (currentImageIndex < images.length - 1) {
                        setCurrentImageIndex(currentImageIndex + 1);
                        e.preventDefault();
                    }
                }
                if (e.key === 'ArrowLeft' && !e.ctrlKey && !e.metaKey) {
                    if (currentImageIndex > 0) {
                        setCurrentImageIndex(currentImageIndex - 1);
                        e.preventDefault();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedAnnotationId, selectedAnnotationIds, annotations, currentImageIndex, images, saveAnnotations, handleUndo, handleRedo, copyAnnotation, pasteAnnotation, copiedAnnotation]);

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
        const newAnns = annotations.map(a => a.id === annId ? { ...a, class_id: newClassId } : a);
        setAnnotations(newAnns);
        // Auto-save
        setSaveStatus('Saving...');
        try {
            await api.post('/save_annotation', {
                image_name: images[currentImageIndex],
                dataset_path: datasetPath,
                boxes: newAnns
            });
            setTimeout(() => setSaveStatus('Saved'), 500);
        } catch (err) {
            console.error(err);
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
            const errorMsg = err.response?.data?.detail || err.message || "Failed to import YAML";
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
                } catch (err) {
                    console.error(err);
                    const errorMsg = err.response?.data?.detail || err.message || "Failed to load dataset";
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
    const annotatedCount = images.filter((img, idx) => {
        // Simplified - would need backend to check all images
        return idx === currentIndex ? annotations.length > 0 : false;
    }).length;
    const progress = images.length > 0 ? ((annotatedCount / images.length) * 100).toFixed(1) : 0;

    return (
        <div className="app-container" style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#050510', color: 'white' }}>
            {/* Sidebar - Class Manager */}
            <Sidebar
                classes={classes}
                setClasses={onUpdateClasses}
                selectedClassId={selectedClassId}
                setSelectedClassId={setSelectedClassId}
                selectedAnnotationId={selectedAnnotationId}
                onChangeAnnotationClass={onChangeAnnotationClass}
                onImportYaml={handleImportYaml}
            />

            {/* Stats Panel */}
            {datasetPath && <StatsPanel images={images} annotations={annotations} classes={classes} datasetPath={datasetPath} />}

            {/* Main Canvas Area */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Top Bar */}
                <div className="glass-panel title-drag-region" style={{ height: '60px', display: 'flex', alignItems: 'center', padding: '0 20px', justifyContent: 'space-between', margin: '10px', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div className="neon-text" style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>LAMA ANNOTATION STUDIO</div>
                            <div style={{ fontSize: '0.8rem', color: saveStatus === 'Error' ? '#ff4444' : '#00ff00', border: '1px solid rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                                {saveStatus}
                            </div>
                            {(canUndo || canRedo) && (
                                <div style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#aaa' }}>
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
                                </div>
                            )}
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
                    {images.length > 0 ? (
                        <AnnotationCanvas
                            imageUrl={images[currentImageIndex]}
                            annotations={annotations}
                            onChange={saveAnnotations}
                            selectedClassId={selectedClassId}
                            classes={classes}
                            selectedId={selectedAnnotationId}
                            onSelect={setSelectedAnnotationId}
                        />
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#555' }}>
                            No images loaded
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel - Image List & Info */}
            <RightPanel
                images={images}
                currentIndex={currentImageIndex}
                setIndex={setCurrentImageIndex}
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
                datasetPath={datasetPath}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                filterAnnotated={filterAnnotated}
                setFilterAnnotated={setFilterAnnotated}
                onExport={async (format) => {
                    if (!datasetPath) {
                        alert('Please open a dataset first');
                        return;
                    }
                    // Validation before export
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
                    
                    try {
                        setLoading(true);
                        const res = await api.post('/export', {
                            dataset_path: datasetPath,
                            format: format
                        });
                        if (format === 'coco') {
                            alert(`Exported to: ${res.data.file}`);
                        } else {
                            alert(`Exported ${res.data.count} files to: ${res.data.dir}`);
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
        </div>
    );
}

export default App;
