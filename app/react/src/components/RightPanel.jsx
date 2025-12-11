/**
 * @fileoverview RightPanel Component - Image List and Export Management
 * 
 * This component provides the right sidebar with:
 * - Image list/grid view with virtualization for performance
 * - Search and filtering capabilities
 * - Export menu with history
 * - Image tags and metadata
 * - Batch image selection
 * - Quick actions on hover
 * - Compact/expanded mode toggle
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Array<string>} props.images - Array of image file paths
 * @param {number} props.currentIndex - Currently selected image index
 * @param {Function} props.setIndex - Function to change image index
 * @param {Array<Object>} props.annotations - Current image annotations
 * @param {Function} props.onDeleteAnnotation - Function to delete annotation
 * @param {Function} props.onExport - Function to export dataset
 * @param {Array<Object>} props.classes - Annotation classes
 * @param {string} props.datasetPath - Current dataset path
 * @param {Function} props.onChangeAnnotationClass - Function to change annotation class
 * @param {string|null} props.selectedAnnotationId - Currently selected annotation ID
 * @param {Function} props.onSelectAnnotation - Function to select annotation
 * @param {string} props.searchQuery - Current search query
 * @param {Function} props.setSearchQuery - Function to set search query
 * @param {boolean|null} props.filterAnnotated - Filter by annotation status
 * @param {Function} props.setFilterAnnotated - Function to set annotation filter
 * @param {Set<string>} props.annotatedImages - Set of annotated image paths
 * @param {number|null} props.filterClassId - Filter by class ID
 * @param {Function} props.setFilterClassId - Function to set class filter
 * @param {React.MutableRefObject<Object>} props.annotationCache - Annotation cache ref
 * @param {Function} props.onDeleteImage - Function to delete image
 * @param {Function} props.setImages - Function to update images array
 * @param {Object} props.annotationComments - Annotation comments object
 * @param {Function} props.onUpdateAnnotationComment - Function to update comment
 * @param {Object} props.imageTags - Image tags object
 * @param {Function} props.onUpdateImageTag - Function to update image tags
 * @param {boolean} props.searchInAnnotations - Search in annotations toggle
 * @param {Function} props.setSearchInAnnotations - Function to toggle search in annotations
 * @param {Function} props.onOpenDatasetMerge - Function to open dataset merge modal
 * @param {Set<string>} props.selectedImages - Set of selected image paths
 * @param {Function} props.onToggleImageSelection - Function to toggle image selection
 * @param {Function} props.onImagePreview - Function to show image preview
 * @returns {JSX.Element} The rendered right panel component
 */
import React, { useRef, useEffect, useState, useMemo, createRef } from 'react';
import { Image as ImageIcon, Box, Search, Filter, CheckCircle, Circle, X, Trash2, SortAsc, SortDesc, Grid, List, Tag, ChevronDown, ChevronUp, Download, Upload, FileText, Merge, Eye, FileJson, FileCode, History, Maximize2, Minimize2, Zap, Check } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

function RightPanel({ images, currentIndex, setIndex, annotations, onDeleteAnnotation, onExport, classes, datasetPath, onChangeAnnotationClass, selectedAnnotationId, onSelectAnnotation, searchQuery, setSearchQuery, filterAnnotated, setFilterAnnotated, annotatedImages, filterClassId, setFilterClassId, annotationCache, onDeleteImage, setImages, annotationComments = {}, onUpdateAnnotationComment, imageTags = {}, onUpdateImageTag, searchInAnnotations = false, setSearchInAnnotations, onOpenDatasetMerge, selectedImages = new Set(), onToggleImageSelection, onImagePreview }) {
    // State for class selector dropdowns (one per annotation)
    const [openSelectors, setOpenSelectors] = useState({});
    const [classSearchQueries, setClassSearchQueries] = useState({});
    const selectorRefs = useRef({});
    // State for image class filter selector
    const [isImageClassFilterOpen, setIsImageClassFilterOpen] = useState(false);
    const [imageClassFilterSearch, setImageClassFilterSearch] = useState('');
    const imageClassFilterRef = useRef(null);
    const activeRef = useRef(null);
    const [imagesByClass, setImagesByClass] = useState(new Map());
    const [loadingClassFilter, setLoadingClassFilter] = useState(false);
    const [sortOrder, setSortOrder] = useState('name-asc'); // 'name-asc', 'name-desc', 'date-asc', 'date-desc'
    // Note: selectedImages comes from props, no local state needed
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [showTagEditor, setShowTagEditor] = useState(false);
    const [tagEditorImage, setTagEditorImage] = useState(null);
    const [tagInput, setTagInput] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filterMinSize, setFilterMinSize] = useState('');
    const [filterMaxSize, setFilterMaxSize] = useState('');
    const [filterMinRatio, setFilterMinRatio] = useState('');
    const [filterMaxRatio, setFilterMaxRatio] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showExportHistory, setShowExportHistory] = useState(false);
    const [exportHistory, setExportHistory] = useState([]);
    const [compactMode, setCompactMode] = useState(false);
    const [hoveredImageIndex, setHoveredImageIndex] = useState(null);
    const exportMenuRef = useRef(null);
    const exportHistoryRef = useRef(null);
    
    // Load export history from localStorage
    useEffect(() => {
        try {
            const saved = localStorage.getItem('export_history');
            if (saved) {
                setExportHistory(JSON.parse(saved));
            }
        } catch (err) {
            console.error('Failed to load export history:', err);
        }
    }, []);
    
    // Save export to history
    const saveToExportHistory = (format, result) => {
        const newEntry = {
            format,
            timestamp: Date.now(),
            result: result || {}
        };
        const updated = [newEntry, ...exportHistory].slice(0, 10); // Keep last 10
        setExportHistory(updated);
        try {
            localStorage.setItem('export_history', JSON.stringify(updated));
        } catch (err) {
            console.error('Failed to save export history:', err);
        }
    };
    
    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
            if (exportHistoryRef.current && !exportHistoryRef.current.contains(event.target)) {
                setShowExportHistory(false);
            }
            // Close all open selectors when clicking outside
            const clickedInsideSelector = Object.values(selectorRefs.current).some(ref => 
                ref && ref.current && ref.current.contains(event.target)
            );
            if (!clickedInsideSelector) {
                setOpenSelectors({});
            }
            // Close image class filter selector when clicking outside
            if (imageClassFilterRef.current && !imageClassFilterRef.current.contains(event.target)) {
                setIsImageClassFilterOpen(false);
            }
        };
        
        if (showExportMenu || showExportHistory || Object.keys(openSelectors).length > 0 || isImageClassFilterOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showExportMenu, showExportHistory, openSelectors, isImageClassFilterOpen]);
    
    // Initialize selector refs
    useEffect(() => {
        if (Array.isArray(annotations)) {
            annotations.forEach(ann => {
                if (!selectorRefs.current[ann.id]) {
                    selectorRefs.current[ann.id] = createRef();
                }
            });
        }
    }, [annotations]);
    
    // Toggle selector open/closed
    const toggleSelector = (annId) => {
        setOpenSelectors(prev => ({
            ...prev,
            [annId]: !prev[annId]
        }));
        // Initialize search query if opening
        if (!openSelectors[annId]) {
            setClassSearchQueries(prev => ({
                ...prev,
                [annId]: ''
            }));
        }
    };
    
    // Filter classes based on search query
    const getFilteredClasses = (annId) => {
        if (!Array.isArray(classes)) return [];
        const searchQuery = classSearchQueries[annId] || '';
        if (!searchQuery) return classes;
        const searchLower = searchQuery.toLowerCase();
        return classes.filter(c => c && c.name && c.name.toLowerCase().includes(searchLower));
    };
    
    // Filter classes for image class filter
    const getFilteredClassesForImageFilter = () => {
        if (!Array.isArray(classes)) return [];
        if (!imageClassFilterSearch) return classes;
        const searchLower = imageClassFilterSearch.toLowerCase();
        return classes.filter(c => c && c.name && c.name.toLowerCase().includes(searchLower));
    };
    
    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'e' && !e.shiftKey) {
                e.preventDefault();
                setShowExportMenu(!showExportMenu);
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'i' && !e.shiftKey) {
                e.preventDefault();
                onExport && onExport('import_project');
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'm' && !e.shiftKey) {
                e.preventDefault();
                onOpenDatasetMerge && onOpenDatasetMerge();
            }
        };
        
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [showExportMenu, onExport, onOpenDatasetMerge]);

    useEffect(() => {
        if (activeRef.current) {
            activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [currentIndex]);

    // Load images filtered by class when filterClassId changes
    useEffect(() => {
        if (filterClassId !== null && datasetPath) {
            setLoadingClassFilter(true);
            api.post('/get_annotated_images', { 
                dataset_path: datasetPath, 
                class_id: filterClassId 
            })
            .then(res => {
                if (res.data && res.data.annotated_images) {
                    const filteredImages = res.data.annotated_images || [];
                    console.log(`Found ${filteredImages.length} images with class ${filterClassId}`);
                    // Store both normalized and original paths for flexible matching
                    const pathMap = new Map();
                    filteredImages.forEach(path => {
                        if (path) {
                            // Normalize: convert to lowercase and normalize slashes
                            const normalized = path.replace(/\\/g, '/').toLowerCase().trim();
                            pathMap.set(normalized, path);
                        }
                    });
                    setImagesByClass(pathMap);
                } else {
                    setImagesByClass(new Map());
                }
            })
            .catch(err => {
                console.error('Failed to load images by class:', err);
                console.error('Error details:', err.response?.data);
                setImagesByClass(new Map());
            })
            .finally(() => {
                setLoadingClassFilter(false);
            });
        } else {
            setImagesByClass(new Map());
        }
    }, [filterClassId, datasetPath]);

    const getName = (path) => {
        // Handle both / and \ 
        const parts = path.split(/[/\\]/);
        return parts[parts.length - 1];
    };

    const getClassName = (classId) => {
        if (!Array.isArray(classes) || typeof classId !== 'number') {
            return `Class ${classId || '?'}`;
        }
        if (!Array.isArray(classes)) return `Class ${classId}`;
        const cls = classes.find(c => c && c.id === classId);
        return cls && cls.name ? cls.name : `Class ${classId}`;
    };

    const handleClassChange = (annId, newClassId) => {
        if (onChangeAnnotationClass && annId) {
            const parsedId = parseInt(newClassId);
            if (!isNaN(parsedId)) {
                onChangeAnnotationClass(annId, parsedId);
            }
        }
    };
    
    const handleDeleteImage = async (imagePath, imageIndex) => {
        if (!onDeleteImage || !datasetPath) return;
        
        const imageName = getName(imagePath);
        const hasAnnotations = annotatedImages ? annotatedImages.has(imagePath) : false;
        
        const confirmMsg = `Are you sure you want to delete this image?\n\n` +
            `Image: ${imageName}\n` +
            (hasAnnotations ? `⚠️ This image has annotations that will also be deleted!\n\n` : '') +
            `This action cannot be undone.`;
        
        if (!window.confirm(confirmMsg)) {
            return;
        }
        
        try {
            await onDeleteImage(imagePath, imageIndex);
        } catch (err) {
            console.error('Failed to delete image:', err);
            alert('Failed to delete image: ' + (err.message || 'Unknown error'));
        }
    };
    
    // Filter, search and sort images
    const filteredImages = useMemo(() => {
        if (!images || !Array.isArray(images)) return [];
        
        let filtered = images.filter((img) => {
            if (!img) return false;
            
            const name = getName(img).toLowerCase();
            let matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase());
            
            // Search in annotations if enabled
            if (searchQuery && searchInAnnotations && annotationCache && annotationCache.current && annotationCache.current[img]) {
                const cachedAnns = annotationCache.current[img] || [];
                const searchLower = searchQuery.toLowerCase();
                const matchesInAnnotations = cachedAnns.some(ann => {
                    if (!ann) return false;
                    const cls = Array.isArray(classes) ? classes.find(c => c && c.id === ann.class_id) : null;
                    const className = cls ? cls.name.toLowerCase() : '';
                    const comment = (annotationComments && annotationComments[ann.id]) ? annotationComments[ann.id].toLowerCase() : '';
                    return className.includes(searchLower) || comment.includes(searchLower);
                });
                matchesSearch = matchesSearch || matchesInAnnotations;
            }
            
            // Search in tags if enabled
            if (searchQuery && imageTags && imageTags[img]) {
                const tags = imageTags[img] || [];
                const searchLower = searchQuery.toLowerCase();
                const matchesInTags = tags.some(tag => tag.toLowerCase().includes(searchLower));
                matchesSearch = matchesSearch || matchesInTags;
            }
            
            const hasAnnotations = annotatedImages ? annotatedImages.has(img) : false;
            const matchesFilter = filterAnnotated === null || 
                (filterAnnotated === true && hasAnnotations) || 
                (filterAnnotated === false && !hasAnnotations);
            
            // Filter by class if specified
            let matchesClass = true;
            if (filterClassId !== null) {
                // Normalize paths for comparison (handle both absolute and relative paths)
                const normalizePath = (path) => {
                    if (!path) return '';
                    try {
                        // Normalize slashes and convert to lowercase for comparison
                        return path.replace(/\\/g, '/').toLowerCase().trim();
                    } catch {
                        return String(path).toLowerCase().trim();
                    }
                };
                
                const normalizedImg = normalizePath(img);
                
                // Use backend-filtered images map if available
                if (imagesByClass.size > 0) {
                    // Check if normalized image path exists in the map
                    matchesClass = imagesByClass.has(normalizedImg);
                    
                    // Also try matching with original image path variations
                    if (!matchesClass) {
                        // Try matching against all normalized paths in the map
                        for (const [normalizedPath, originalPath] of imagesByClass.entries()) {
                            const normalizedOriginal = normalizePath(originalPath);
                            if (normalizedPath === normalizedImg || 
                                normalizedOriginal === normalizedImg ||
                                normalizedPath.endsWith(normalizedImg) ||
                                normalizedImg.endsWith(normalizedPath)) {
                                matchesClass = true;
                                break;
                            }
                        }
                    }
                } else if (hasAnnotations && annotationCache && annotationCache.current) {
                    // Fallback to cache if backend hasn't loaded yet
                    const cachedAnns = annotationCache.current[img] || [];
                    matchesClass = cachedAnns.some(ann => ann && parseInt(ann.class_id) === parseInt(filterClassId));
                } else {
                    // If no data available, don't filter (show all)
                    matchesClass = true;
                }
            }
            
            // Advanced filters: size and ratio
            let matchesAdvanced = true;
            if (showAdvancedFilters && (filterMinSize || filterMaxSize || filterMinRatio || filterMaxRatio)) {
                if (annotationCache && annotationCache.current && annotationCache.current[img]) {
                    const cachedAnns = annotationCache.current[img] || [];
                    if (cachedAnns.length > 0) {
                        // Check if any annotation matches the size/ratio filters
                        matchesAdvanced = cachedAnns.some(ann => {
                            if (!ann || typeof ann.width !== 'number' || typeof ann.height !== 'number') return false;
                            
                            const width = Math.abs(ann.width);
                            const height = Math.abs(ann.height);
                            const area = width * height;
                            const ratio = width > 0 ? height / width : 0;
                            
                            // Size filter
                            if (filterMinSize) {
                                const minSize = parseFloat(filterMinSize);
                                if (!isNaN(minSize) && area < minSize) return false;
                            }
                            if (filterMaxSize) {
                                const maxSize = parseFloat(filterMaxSize);
                                if (!isNaN(maxSize) && area > maxSize) return false;
                            }
                            
                            // Ratio filter
                            if (filterMinRatio) {
                                const minRatio = parseFloat(filterMinRatio);
                                if (!isNaN(minRatio) && ratio < minRatio) return false;
                            }
                            if (filterMaxRatio) {
                                const maxRatio = parseFloat(filterMaxRatio);
                                if (!isNaN(maxRatio) && ratio > maxRatio) return false;
                            }
                            
                            return true;
                        });
                    } else {
                        matchesAdvanced = false; // No annotations, doesn't match
                    }
                } else {
                    matchesAdvanced = false; // No cache, can't filter
                }
            }
            
            return matchesSearch && matchesFilter && matchesClass && matchesAdvanced;
        });
        
        // Sort images
        filtered = [...filtered].sort((a, b) => {
            const nameA = getName(a).toLowerCase();
            const nameB = getName(b).toLowerCase();
            
            switch (sortOrder) {
                case 'name-asc':
                    return nameA.localeCompare(nameB);
                case 'name-desc':
                    return nameB.localeCompare(nameA);
                default:
                    return 0;
            }
        });
        
        return filtered;
    }, [images, searchQuery, filterAnnotated, annotatedImages, filterClassId, annotationCache, imagesByClass, sortOrder]);
    
    // Create mapping from filtered to original index
    const filteredToOriginal = useMemo(() => {
        const mapping = new Map();
        filteredImages.forEach((filteredImg, filteredIdx) => {
            const originalIdx = images.indexOf(filteredImg);
            if (originalIdx >= 0) {
                mapping.set(filteredIdx, originalIdx);
            }
        });
        return mapping;
    }, [filteredImages, images]);

    return (
        <div className="glass-panel" style={{ 
            width: isCollapsed ? '60px' : '320px', 
            margin: '10px', 
            padding: isCollapsed ? '8px 15px' : '15px',
            display: 'flex', 
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            overflow: isCollapsed ? 'hidden' : 'visible'
        }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: isCollapsed ? 'center' : 'space-between',
                marginBottom: isCollapsed ? 0 : '10px',
                cursor: 'pointer',
                userSelect: 'none',
                borderBottom: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.1)',
                paddingBottom: isCollapsed ? 0 : '10px'
            }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {!isCollapsed && <h4 className="neon-text" style={{ margin: 0 }}>Images & Annotations</h4>}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCollapsed(!isCollapsed);
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#00e0ff',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(0, 224, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                    }}
                    title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
                >
                    {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
            </div>

            {!isCollapsed && (
                <>
            {/* Annotations List */}
            <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', height: '40%' }}>
                <h4 className="neon-text" style={{ margin: '0 0 10px 0' }}>Annotations ({Array.isArray(annotations) ? annotations.length : 0})</h4>
                <div style={{ height: 'calc(100% - 30px)', overflowY: 'auto' }}>
                    {Array.isArray(annotations) && annotations.map((ann, i) => {
                        const cls = Array.isArray(classes) ? classes.find(c => c && c.id === ann.class_id) : null;
                        const isSelected = selectedAnnotationId === ann.id;
                        const isOpen = openSelectors[ann.id] || false;
                        const filteredClasses = getFilteredClasses(ann.id);
                        
                        return (
                            <div 
                                key={ann.id} 
                                onClick={() => onSelectAnnotation && onSelectAnnotation(ann.id)}
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    padding: '8px', 
                                    fontSize: '0.9rem', 
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    background: isSelected ? 'rgba(0, 224, 255, 0.1)' : 'transparent',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    marginBottom: '2px',
                                    position: 'relative'
                                }}
                            >
                                <Box size={14} style={{ marginRight: '8px', color: cls?.color || '#56b0ff' }} />
                                
                                {/* Custom Class Selector */}
                                <div ref={selectorRefs.current[ann.id] || createRef()} style={{ flex: 1, position: 'relative', marginRight: '8px' }}>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelector(ann.id);
                                        }}
                                        style={{
                                            width: '100%',
                                            fontSize: '0.9rem',
                                            padding: '4px 8px',
                                            background: 'rgba(255,255,255,0.1)',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '4px',
                                            color: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <span>{cls?.name || `Class ${ann.class_id}`}</span>
                                        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                    </button>
                                    
                                    {/* Dropdown with search */}
                                    {isOpen && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            left: 0,
                                            right: 0,
                                            marginTop: '4px',
                                            background: 'rgba(20, 20, 35, 0.95)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(0, 224, 255, 0.3)',
                                            borderRadius: '8px',
                                            padding: '8px',
                                            zIndex: 1000,
                                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                                            maxHeight: '300px',
                                            display: 'flex',
                                            flexDirection: 'column'
                                        }}>
                                            {/* Search input */}
                                            <div style={{ position: 'relative', marginBottom: '8px' }}>
                                                <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666', zIndex: 1 }} />
                                                <input
                                                    type="text"
                                                    placeholder="Search classes..."
                                                    value={classSearchQueries[ann.id] || ''}
                                                    onChange={(e) => {
                                                        setClassSearchQueries(prev => ({
                                                            ...prev,
                                                            [ann.id]: e.target.value
                                                        }));
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                    autoFocus
                                                    style={{
                                                        width: '100%',
                                                        padding: '6px 8px 6px 30px',
                                                        background: 'rgba(255,255,255,0.1)',
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        borderRadius: '4px',
                                                        color: 'white',
                                                        fontSize: '0.85rem',
                                                        boxSizing: 'border-box'
                                                    }}
                                                />
                                            </div>
                                            
                                            {/* Class list */}
                                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                {filteredClasses.length > 0 ? (
                                                    filteredClasses.map(c => (
                                                        <div
                                                            key={c.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleClassChange(ann.id, c.id);
                                                                setOpenSelectors(prev => ({
                                                                    ...prev,
                                                                    [ann.id]: false
                                                                }));
                                                            }}
                                                            style={{
                                                                padding: '6px 8px',
                                                                cursor: 'pointer',
                                                                borderRadius: '4px',
                                                                background: ann.class_id === c.id ? 'rgba(0, 224, 255, 0.2)' : 'transparent',
                                                                border: ann.class_id === c.id ? '1px solid rgba(0, 224, 255, 0.5)' : '1px solid transparent',
                                                                marginBottom: '2px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '8px',
                                                                fontSize: '0.85rem'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                if (ann.class_id !== c.id) {
                                                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                                                }
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                if (ann.class_id !== c.id) {
                                                                    e.target.style.background = 'transparent';
                                                                }
                                                            }}
                                                        >
                                                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.color, boxShadow: `0 0 5px ${c.color}` }}></div>
                                                            <span>{c.name}</span>
                                                            {ann.class_id === c.id && <Check size={14} style={{ marginLeft: 'auto', color: '#00e0ff' }} />}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ padding: '8px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                                                        No classes found
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {ann.confidence !== undefined && ann.confidence < 1.0 && (
                                    <span 
                                        style={{ 
                                            fontSize: '0.75rem', 
                                            marginRight: '8px', 
                                            minWidth: '45px',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: ann.confidence >= 0.7 ? 'rgba(0, 255, 0, 0.2)' : ann.confidence >= 0.5 ? 'rgba(255, 170, 0, 0.2)' : 'rgba(255, 68, 68, 0.2)',
                                            color: ann.confidence >= 0.7 ? '#00ff00' : ann.confidence >= 0.5 ? '#ffaa00' : '#ff4444',
                                            fontWeight: 'bold',
                                            border: `1px solid ${ann.confidence >= 0.7 ? '#00ff00' : ann.confidence >= 0.5 ? '#ffaa00' : '#ff4444'}`,
                                            textAlign: 'center',
                                            display: 'inline-block'
                                        }}
                                        title={`Confidence: ${(ann.confidence * 100).toFixed(1)}%`}
                                    >
                                        {Math.round((ann.confidence || 1.0) * 100)}%
                                    </span>
                                )}
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteAnnotation(ann.id);
                                    }} 
                                    style={{ 
                                        background: 'rgba(255, 68, 68, 0.2)', 
                                        border: '1px solid rgba(255, 68, 68, 0.5)', 
                                        color: '#ff4444', 
                                        cursor: 'pointer', 
                                        fontSize: '0.85rem', 
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        minWidth: '32px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = 'rgba(255, 68, 68, 0.4)';
                                        e.target.style.borderColor = '#ff4444';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'rgba(255, 68, 68, 0.2)';
                                        e.target.style.borderColor = 'rgba(255, 68, 68, 0.5)';
                                    }}
                                    title="Delete annotation (Delete key)"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                    
                    {/* Annotation Comments */}
                    {Array.isArray(annotations) && annotations.length > 0 && (
                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                            <h5 style={{ fontSize: '0.8rem', color: '#aaa', margin: '0 0 8px 0' }}>Comments</h5>
                            {annotations.filter(ann => annotationComments && annotationComments[ann.id]).map(ann => (
                                <div key={ann.id} style={{ 
                                    padding: '6px', 
                                    marginBottom: '4px', 
                                    background: 'rgba(0, 224, 255, 0.05)', 
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    color: '#aaa'
                                }}>
                                    <div style={{ color: '#00e0ff', marginBottom: '2px' }}>
                                        {Array.isArray(classes) ? (classes.find(c => c && c.id === ann.class_id)?.name || 'Unknown') : 'Unknown'}
                                    </div>
                                    <div>{annotationComments[ann.id]}</div>
                                </div>
                            ))}
                            {selectedAnnotationId && (
                                <div style={{ marginTop: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder="Add comment..."
                                        value={(annotationComments && annotationComments[selectedAnnotationId]) || ''}
                                        onChange={(e) => {
                                            if (onUpdateAnnotationComment) {
                                                onUpdateAnnotationComment(selectedAnnotationId, e.target.value);
                                            }
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '4px 8px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.2)',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '0.75rem',
                                            outline: 'none'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#00e0ff'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Image List */}
            <div style={{ flex: 1, padding: '15px', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 className="neon-text" style={{ margin: 0, fontSize: '0.95rem' }}>
                        Images ({filteredImages.length}/{images.length})
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {/* View mode toggle */}
                        <div style={{ display: 'flex', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', padding: '2px' }}>
                            <button
                                onClick={() => setViewMode('list')}
                                style={{
                                    padding: '4px 8px',
                                    background: viewMode === 'list' ? 'rgba(0, 224, 255, 0.2)' : 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: viewMode === 'list' ? '#00e0ff' : '#aaa',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                title="List view"
                            >
                                <List size={12} />
                            </button>
                            <button
                                onClick={() => setViewMode('grid')}
                                style={{
                                    padding: '4px 8px',
                                    background: viewMode === 'grid' ? 'rgba(0, 224, 255, 0.2)' : 'transparent',
                                    border: 'none',
                                    borderRadius: '4px',
                                    color: viewMode === 'grid' ? '#00e0ff' : '#aaa',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                title="Grid view"
                            >
                                <Grid size={12} />
                            </button>
                        </div>
                        {/* Sort button */}
                        <button
                            onClick={() => {
                                const orders = ['name-asc', 'name-desc'];
                                const currentIdx = orders.indexOf(sortOrder);
                                setSortOrder(orders[(currentIdx + 1) % orders.length]);
                            }}
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
                            title={`Sort: ${sortOrder === 'name-asc' ? 'A-Z' : 'Z-A'}`}
                        >
                            {sortOrder === 'name-asc' ? <SortAsc size={12} /> : <SortDesc size={12} />}
                        </button>
                    </div>
                </div>
                
                {/* Search and Filter */}
                <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                        <input
                            type="text"
                            placeholder="Search images..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '6px 8px 6px 28px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.85rem',
                                outline: 'none'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#00e0ff'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                        />
                    </div>
                    {/* Search options */}
                    <div style={{ display: 'flex', gap: '4px', fontSize: '0.7rem', flexWrap: 'wrap' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#aaa', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={searchInAnnotations || false}
                                onChange={(e) => setSearchInAnnotations && setSearchInAnnotations(e.target.checked)}
                                style={{ cursor: 'pointer' }}
                            />
                            Search in annotations
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#aaa', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showAdvancedFilters}
                                onChange={(e) => setShowAdvancedFilters(e.target.checked)}
                                style={{ cursor: 'pointer' }}
                            />
                            Advanced filters
                        </label>
                    </div>
                    
                    {/* Advanced Filters */}
                    {showAdvancedFilters && (
                        <div style={{ 
                            padding: '10px', 
                            background: 'rgba(0, 224, 255, 0.05)', 
                            borderRadius: '6px', 
                            border: '1px solid rgba(0, 224, 255, 0.2)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            fontSize: '0.75rem'
                        }}>
                            <div style={{ fontWeight: 'bold', color: '#00e0ff', marginBottom: '4px' }}>Filter by Annotation Size:</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <input
                                    type="number"
                                    placeholder="Min area (px²)"
                                    value={filterMinSize}
                                    onChange={(e) => setFilterMinSize(e.target.value)}
                                    style={{
                                        padding: '4px 6px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '0.75rem'
                                    }}
                                />
                                <input
                                    type="number"
                                    placeholder="Max area (px²)"
                                    value={filterMaxSize}
                                    onChange={(e) => setFilterMaxSize(e.target.value)}
                                    style={{
                                        padding: '4px 6px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '0.75rem'
                                    }}
                                />
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#00e0ff', marginTop: '4px' }}>Filter by Aspect Ratio:</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Min ratio (H/W)"
                                    value={filterMinRatio}
                                    onChange={(e) => setFilterMinRatio(e.target.value)}
                                    style={{
                                        padding: '4px 6px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '0.75rem'
                                    }}
                                />
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Max ratio (H/W)"
                                    value={filterMaxRatio}
                                    onChange={(e) => setFilterMaxRatio(e.target.value)}
                                    style={{
                                        padding: '4px 6px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '0.75rem'
                                    }}
                                />
                            </div>
                            {(filterMinSize || filterMaxSize || filterMinRatio || filterMaxRatio) && (
                                <button
                                    onClick={() => {
                                        setFilterMinSize('');
                                        setFilterMaxSize('');
                                        setFilterMinRatio('');
                                        setFilterMaxRatio('');
                                    }}
                                    style={{
                                        padding: '4px 8px',
                                        background: 'rgba(255, 68, 68, 0.1)',
                                        border: '1px solid rgba(255, 68, 68, 0.3)',
                                        borderRadius: '4px',
                                        color: '#ffaaaa',
                                        cursor: 'pointer',
                                        fontSize: '0.7rem'
                                    }}
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setFilterAnnotated && setFilterAnnotated(null)}
                                style={{
                                    flex: 1,
                                    minWidth: '60px',
                                    padding: '4px 8px',
                                    background: filterAnnotated === null ? 'rgba(0, 224, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    border: filterAnnotated === null ? '1px solid rgba(0, 224, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '4px',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                All
                            </button>
                        <button
                            onClick={() => setFilterAnnotated && setFilterAnnotated(true)}
                            style={{
                                flex: 1,
                                minWidth: '60px',
                                padding: '4px 8px',
                                background: filterAnnotated === true ? 'rgba(0, 224, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: filterAnnotated === true ? '1px solid rgba(0, 224, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <CheckCircle size={12} />
                            Annotated
                        </button>
                        <button
                            onClick={() => setFilterAnnotated && setFilterAnnotated(false)}
                            style={{
                                flex: 1,
                                minWidth: '60px',
                                padding: '4px 8px',
                                background: filterAnnotated === false ? 'rgba(0, 224, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: filterAnnotated === false ? '1px solid rgba(0, 224, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Circle size={12} />
                            Empty
                        </button>
                        </div>
                        {/* Clear filters button */}
                        {(searchQuery || filterAnnotated !== null || filterClassId !== null) && (
                            <button
                                onClick={() => {
                                    if (setSearchQuery) setSearchQuery('');
                                    if (setFilterAnnotated) setFilterAnnotated(null);
                                    if (setFilterClassId) setFilterClassId(null);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '4px 8px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '4px',
                                    color: '#aaa',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px'
                                }}
                            >
                                <X size={12} />
                                Clear Filters
                            </button>
                        )}
                        {/* Class Filter - Custom Selector with Search */}
                        <div ref={imageClassFilterRef} style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsImageClassFilterOpen(!isImageClassFilterOpen);
                                    if (!isImageClassFilterOpen) {
                                        setImageClassFilterSearch('');
                                    }
                                }}
                                disabled={loadingClassFilter}
                                style={{
                                    width: '100%',
                                    fontSize: '0.75rem',
                                    padding: '4px 8px',
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '4px',
                                    color: 'white',
                                    cursor: loadingClassFilter ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    textAlign: 'left',
                                    opacity: loadingClassFilter ? 0.6 : 1
                                }}
                            >
                                <span>
                                    {filterClassId === null 
                                        ? 'All Classes' 
                                        : (Array.isArray(classes) && classes.find(c => c && c.id === filterClassId)?.name) || `Class ${filterClassId}`
                                    }
                                </span>
                                <ChevronDown size={14} style={{ transform: isImageClassFilterOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                            </button>
                            
                            {/* Dropdown with search */}
                            {isImageClassFilterOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: '4px',
                                    background: 'rgba(20, 20, 35, 0.95)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(0, 224, 255, 0.3)',
                                    borderRadius: '8px',
                                    padding: '8px',
                                    zIndex: 1000,
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                                    maxHeight: '300px',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}>
                                    {/* Search input */}
                                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                                        <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666', zIndex: 1 }} />
                                        <input
                                            type="text"
                                            placeholder="Search classes..."
                                            value={imageClassFilterSearch}
                                            onChange={(e) => setImageClassFilterSearch(e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                            onKeyDown={(e) => e.stopPropagation()}
                                            autoFocus
                                            style={{
                                                width: '100%',
                                                padding: '6px 8px 6px 30px',
                                                background: 'rgba(255,255,255,0.1)',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: '4px',
                                                color: 'white',
                                                fontSize: '0.85rem',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                    
                                    {/* Class list */}
                                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                        {/* "All Classes" option */}
                                        <div
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (setFilterClassId) setFilterClassId(null);
                                                setIsImageClassFilterOpen(false);
                                            }}
                                            style={{
                                                padding: '6px 8px',
                                                cursor: 'pointer',
                                                borderRadius: '4px',
                                                background: filterClassId === null ? 'rgba(0, 224, 255, 0.2)' : 'transparent',
                                                border: filterClassId === null ? '1px solid rgba(0, 224, 255, 0.5)' : '1px solid transparent',
                                                marginBottom: '2px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                fontSize: '0.85rem'
                                            }}
                                            onMouseEnter={(e) => {
                                                if (filterClassId !== null) {
                                                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (filterClassId !== null) {
                                                    e.target.style.background = 'transparent';
                                                }
                                            }}
                                        >
                                            <span>All Classes</span>
                                            {filterClassId === null && <Check size={14} style={{ marginLeft: 'auto', color: '#00e0ff' }} />}
                                        </div>
                                        
                                        {/* Filtered classes */}
                                        {getFilteredClassesForImageFilter().length > 0 ? (
                                            getFilteredClassesForImageFilter().map(c => (
                                                <div
                                                    key={c.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (setFilterClassId) setFilterClassId(c.id);
                                                        setIsImageClassFilterOpen(false);
                                                    }}
                                                    style={{
                                                        padding: '6px 8px',
                                                        cursor: 'pointer',
                                                        borderRadius: '4px',
                                                        background: filterClassId === c.id ? 'rgba(0, 224, 255, 0.2)' : 'transparent',
                                                        border: filterClassId === c.id ? '1px solid rgba(0, 224, 255, 0.5)' : '1px solid transparent',
                                                        marginBottom: '2px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        fontSize: '0.85rem'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (filterClassId !== c.id) {
                                                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (filterClassId !== c.id) {
                                                            e.target.style.background = 'transparent';
                                                        }
                                                    }}
                                                >
                                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.color, boxShadow: `0 0 5px ${c.color}` }}></div>
                                                    <span>{c.name}</span>
                                                    {filterClassId === c.id && <Check size={14} style={{ marginLeft: 'auto', color: '#00e0ff' }} />}
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ padding: '8px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                                                No classes found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                            
                            {loadingClassFilter && (
                                <div style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: '0.7rem',
                                    color: '#00e0ff',
                                    pointerEvents: 'none'
                                }}>
                                    Loading...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto' }} id="image-list-container">
                    {viewMode === 'grid' ? (
                        // Grid View with Virtual Scrolling for large lists
                        <VirtualizedImageGrid
                            images={filteredImages}
                            filteredToOriginal={filteredToOriginal}
                            currentIndex={currentIndex}
                            setIndex={setIndex}
                            annotatedImages={annotatedImages}
                            activeRef={activeRef}
                            annotationCache={annotationCache}
                            classes={classes}
                            imageTags={imageTags}
                            onUpdateImageTag={onUpdateImageTag}
                            setShowTagEditor={setShowTagEditor}
                            setTagEditorImage={setTagEditorImage}
                            onDeleteImage={handleDeleteImage}
                            getName={getName}
                            hoveredImageIndex={hoveredImageIndex}
                            setHoveredImageIndex={setHoveredImageIndex}
                            selectedImages={selectedImages}
                            onToggleImageSelection={onToggleImageSelection}
                        />
                    ) : (
                        // List View with Virtual Scrolling
                        <VirtualizedImageList
                            images={filteredImages}
                            filteredToOriginal={filteredToOriginal}
                            currentIndex={currentIndex}
                            setIndex={setIndex}
                            annotatedImages={annotatedImages}
                            activeRef={activeRef}
                            getName={getName}
                            hoveredImageIndex={hoveredImageIndex}
                            setHoveredImageIndex={setHoveredImageIndex}
                            onDeleteImage={handleDeleteImage}
                            selectedImages={selectedImages}
                            onToggleImageSelection={onToggleImageSelection}
                        />
                    )}
                </div>

                {/* Export & Actions - Compact Menu */}
                <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    {/* Compact Mode Toggle */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                        <button
                            onClick={() => setCompactMode(!compactMode)}
                            style={{
                                flex: 1,
                                padding: '6px',
                                background: compactMode ? 'rgba(0, 224, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: '#aaa',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                            }}
                            title={compactMode ? 'Switch to expanded view' : 'Switch to compact view'}
                        >
                            {compactMode ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
                            {compactMode ? 'Expand' : 'Compact'}
                        </button>
                    </div>
                    
                    {/* Export Menu Button */}
                    <div ref={exportMenuRef} style={{ position: 'relative', marginBottom: '8px' }}>
                        <button 
                            className="btn-primary" 
                            style={{ 
                                width: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                padding: compactMode ? '6px 8px' : '8px 12px',
                                fontSize: compactMode ? '0.75rem' : '0.85rem'
                            }} 
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            title="Export (Ctrl+E)"
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Download size={compactMode ? 14 : 16} />
                                {!compactMode && <span>Export</span>}
                            </div>
                            <ChevronDown size={14} style={{ transform: showExportMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </button>
                        
                        {/* Export Dropdown Menu */}
                        {showExportMenu && (
                            <div style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: 0,
                                right: 0,
                                marginBottom: '4px',
                                background: 'rgba(20, 20, 35, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(0, 224, 255, 0.3)',
                                borderRadius: '8px',
                                padding: '6px',
                                zIndex: 1000,
                                maxHeight: '400px',
                                overflowY: 'auto',
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                                minWidth: '200px',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '4px'
                            }}>
                                <button 
                                    className="btn-secondary"
                                    style={{ 
                                        padding: '6px 8px', 
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        justifyContent: 'flex-start'
                                    }} 
                                    onClick={() => { 
                                        if (onExport) {
                                            try {
                                                const result = onExport('preview');
                                                if (result && typeof result.then === 'function') {
                                                    result.then(res => saveToExportHistory('preview', res)).catch(() => {});
                                                } else {
                                                    saveToExportHistory('preview', result);
                                                }
                                            } catch (err) {
                                                console.error('Export error:', err);
                                            }
                                        }
                                        setShowExportMenu(false); 
                                    }}
                                    title="Preview export"
                                >
                                    <Eye size={14} />
                                    Preview
                                </button>
                                <button 
                                    className="btn-secondary"
                                    style={{ 
                                        padding: '6px 8px', 
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        justifyContent: 'flex-start'
                                    }} 
                                    onClick={() => { 
                                        if (onExport) {
                                            try {
                                                const result = onExport('coco');
                                                if (result && typeof result.then === 'function') {
                                                    result.then(res => saveToExportHistory('coco', res)).catch(() => {});
                                                } else {
                                                    saveToExportHistory('coco', result);
                                                }
                                            } catch (err) {
                                                console.error('Export error:', err);
                                            }
                                        }
                                        setShowExportMenu(false); 
                                    }}
                                    title="Export to COCO format"
                                >
                                    <FileJson size={14} />
                                    COCO
                                </button>
                                <button 
                                    className="btn-secondary"
                                    style={{ 
                                        padding: '6px 8px', 
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        justifyContent: 'flex-start'
                                    }} 
                                    onClick={() => { 
                                        if (onExport) {
                                            try {
                                                const result = onExport('voc');
                                                if (result && typeof result.then === 'function') {
                                                    result.then(res => saveToExportHistory('voc', res)).catch(() => {});
                                                } else {
                                                    saveToExportHistory('voc', result);
                                                }
                                            } catch (err) {
                                                console.error('Export error:', err);
                                            }
                                        }
                                        setShowExportMenu(false); 
                                    }}
                                    title="Export to VOC format"
                                >
                                    <FileCode size={14} />
                                    VOC
                                </button>
                                <button 
                                    className="btn-secondary"
                                    style={{ 
                                        padding: '6px 8px', 
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        justifyContent: 'flex-start'
                                    }} 
                                    onClick={() => { 
                                        if (onExport) {
                                            try {
                                                const result = onExport('report');
                                                if (result && typeof result.then === 'function') {
                                                    result.then(res => saveToExportHistory('report', res)).catch(() => {});
                                                } else {
                                                    saveToExportHistory('report', result);
                                                }
                                            } catch (err) {
                                                console.error('Export error:', err);
                                            }
                                        }
                                        setShowExportMenu(false); 
                                    }}
                                    title="Export statistics report"
                                >
                                    <FileText size={14} />
                                    Report
                                </button>
                                <button 
                                    className="btn-secondary"
                                    style={{ 
                                        padding: '6px 8px', 
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        justifyContent: 'flex-start',
                                        gridColumn: '1 / -1'
                                    }} 
                                    onClick={() => { 
                                        if (onExport) {
                                            try {
                                                const result = onExport('project');
                                                if (result && typeof result.then === 'function') {
                                                    result.then(res => saveToExportHistory('project', res)).catch(() => {});
                                                } else {
                                                    saveToExportHistory('project', result);
                                                }
                                            } catch (err) {
                                                console.error('Export error:', err);
                                            }
                                        }
                                        setShowExportMenu(false); 
                                    }}
                                    title="Export complete project"
                                >
                                    <Download size={14} />
                                    Export Project
                                </button>
                                {exportHistory.length > 0 && (
                                    <button 
                                        className="btn-secondary"
                                        style={{ 
                                            padding: '6px 8px', 
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            justifyContent: 'flex-start',
                                            gridColumn: '1 / -1',
                                            borderTop: '1px solid rgba(255,255,255,0.1)',
                                            marginTop: '4px',
                                            paddingTop: '8px'
                                        }} 
                                        onClick={() => { setShowExportHistory(!showExportHistory); setShowExportMenu(false); }}
                                        title="View export history"
                                    >
                                        <History size={14} />
                                        History ({exportHistory.length})
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    {/* Import & Merge - Compact buttons */}
                    <div style={{ display: 'grid', gridTemplateColumns: onOpenDatasetMerge ? '1fr 1fr' : '1fr', gap: '6px' }}>
                        <button 
                            className="btn-primary" 
                            style={{ 
                                padding: compactMode ? '6px 8px' : '8px 12px',
                                fontSize: compactMode ? '0.75rem' : '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }} 
                            onClick={() => { onExport && onExport('import_project'); }}
                            title="Import project (Ctrl+I)"
                        >
                            <Upload size={compactMode ? 14 : 16} />
                            {!compactMode && 'Import'}
                        </button>
                        {onOpenDatasetMerge && (
                            <button 
                                className="btn-primary" 
                                style={{ 
                                    padding: compactMode ? '6px 8px' : '8px 12px',
                                    fontSize: compactMode ? '0.75rem' : '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    background: 'rgba(0, 224, 255, 0.15)',
                                    border: '1px solid rgba(0, 224, 255, 0.5)'
                                }} 
                                onClick={onOpenDatasetMerge}
                                title="Merge multiple datasets (Ctrl+M)"
                            >
                                <Merge size={compactMode ? 14 : 16} />
                                {!compactMode && 'Merge'}
                            </button>
                        )}
                    </div>
                    
                    {/* Export History Dropdown */}
                    {showExportHistory && exportHistory.length > 0 && (
                        <div ref={exportHistoryRef} style={{
                            marginTop: '8px',
                            padding: '8px',
                            background: 'rgba(20, 20, 35, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(0, 224, 255, 0.3)',
                            borderRadius: '8px',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            maxWidth: '100%',
                            boxSizing: 'border-box'
                        }}>
                            <div style={{ fontSize: '0.75rem', color: '#00e0ff', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <History size={14} />
                                Recent Exports
                            </div>
                            {exportHistory.map((entry, idx) => (
                                <div key={idx} style={{
                                    padding: '6px',
                                    marginBottom: '4px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '4px',
                                    fontSize: '0.7rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ color: '#aaa' }}>{entry.format.toUpperCase()}</div>
                                        <div style={{ color: '#666', fontSize: '0.65rem' }}>
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (onExport) {
                                                onExport(entry.format);
                                            }
                                        }}
                                        style={{
                                            padding: '2px 6px',
                                            background: 'rgba(0, 224, 255, 0.1)',
                                            border: '1px solid rgba(0, 224, 255, 0.3)',
                                            borderRadius: '4px',
                                            color: '#00e0ff',
                                            cursor: 'pointer',
                                            fontSize: '0.65rem'
                                        }}
                                        title="Re-export"
                                    >
                                        <Zap size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
                </>
            )}
            
            {/* Tag Editor Modal */}
            {showTagEditor && tagEditorImage && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    zIndex: 10000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px'
                }} onClick={() => setShowTagEditor(false)}>
                    <div className="glass-panel" style={{
                        minWidth: '400px',
                        maxWidth: '600px',
                        padding: '20px',
                        position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 className="neon-text" style={{ margin: 0 }}>Edit Tags</h3>
                            <button
                                onClick={() => setShowTagEditor(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#aaa',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                    padding: '0',
                                    width: '30px',
                                    height: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div style={{ marginBottom: '10px', fontSize: '0.85rem', color: '#aaa', wordBreak: 'break-all' }}>
                            {getName(tagEditorImage)}
                        </div>
                        <input
                            type="text"
                            placeholder="Enter tags separated by commas (e.g., difficult, review, quality)"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.9rem',
                                outline: 'none',
                                marginBottom: '15px',
                                boxSizing: 'border-box'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#00e0ff'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const tags = tagInput.split(',').map(t => t.trim()).filter(t => t);
                                    if (onUpdateImageTag) {
                                        onUpdateImageTag(tagEditorImage, tags);
                                    }
                                    setShowTagEditor(false);
                                } else if (e.key === 'Escape') {
                                    setShowTagEditor(false);
                                }
                            }}
                            autoFocus
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowTagEditor(false)}
                                style={{
                                    padding: '6px 12px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '4px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    const tags = tagInput.split(',').map(t => t.trim()).filter(t => t);
                                    if (onUpdateImageTag) {
                                        onUpdateImageTag(tagEditorImage, tags);
                                    }
                                    setShowTagEditor(false);
                                }}
                                className="btn-primary"
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Virtualized Image Grid Component for performance
function VirtualizedImageGrid({ images, filteredToOriginal, currentIndex, setIndex, annotatedImages, activeRef, annotationCache, classes, imageTags, onUpdateImageTag, setShowTagEditor, setTagEditorImage, onDeleteImage, getName, hoveredImageIndex, setHoveredImageIndex, selectedImages = new Set(), onToggleImageSelection }) {
    const containerRef = useRef(null);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
    const ITEM_HEIGHT = 140; // Approximate height of grid item
    const ITEMS_PER_ROW = 3; // Adjust based on container width
    
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const rowHeight = ITEM_HEIGHT;
            const startRow = Math.floor(scrollTop / rowHeight);
            const endRow = Math.ceil((scrollTop + containerHeight) / rowHeight);
            
            const start = Math.max(0, startRow * ITEMS_PER_ROW - ITEMS_PER_ROW); // Buffer
            const end = Math.min(images.length, endRow * ITEMS_PER_ROW + ITEMS_PER_ROW * 2); // Buffer
            
            setVisibleRange({ start, end });
        };
        
        container.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial calculation
        
        return () => container.removeEventListener('scroll', handleScroll);
    }, [images.length]);
    
    const visibleImages = images.slice(visibleRange.start, visibleRange.end);
    const startOffset = Math.floor(visibleRange.start / ITEMS_PER_ROW) * ITEM_HEIGHT;
    
    return (
        <div 
            ref={containerRef}
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: '12px',
                padding: '4px',
                position: 'relative',
                height: '100%',
                overflowY: 'auto'
            }}
        >
            {/* Spacer for items before visible range */}
            {visibleRange.start > 0 && (
                <div style={{ gridColumn: '1 / -1', height: startOffset }} />
            )}
            
            {visibleImages.map((img, localIdx) => {
                const filteredIdx = visibleRange.start + localIdx;
                const originalIdx = filteredToOriginal.get(filteredIdx);
                const isCurrent = originalIdx !== undefined && originalIdx === currentIndex;
                const hasAnnotations = annotatedImages ? annotatedImages.has(img) : false;
                
                return (
                    <div
                        key={img}
                        ref={isCurrent ? activeRef : null}
                        onClick={(e) => {
                            if (e.ctrlKey || e.metaKey) {
                                // Multi-select
                                if (onToggleImageSelection) {
                                    onToggleImageSelection(img);
                                }
                            } else {
                                // Single select
                                if (originalIdx !== undefined && originalIdx >= 0) {
                                    setIndex(originalIdx);
                                }
                            }
                        }}
                        onMouseEnter={(e) => {
                            if (setHoveredImageIndex) {
                                setHoveredImageIndex(filteredIdx);
                            }
                            if (onImagePreview && annotationCache && annotationCache.current) {
                                const anns = annotationCache.current[img] || [];
                                onImagePreview({
                                    path: img,
                                    annotations: anns,
                                    position: { x: e.clientX, y: e.clientY }
                                });
                            }
                        }}
                        onMouseLeave={() => {
                            if (setHoveredImageIndex) {
                                setHoveredImageIndex(null);
                            }
                            if (onImagePreview) {
                                onImagePreview(null);
                            }
                        }}
                        style={{
                            position: 'relative',
                            cursor: 'pointer',
                            background: isCurrent 
                                ? 'rgba(0, 224, 255, 0.15)' 
                                : selectedImages.has(img)
                                ? 'rgba(0, 224, 255, 0.1)'
                                : 'rgba(255, 255, 255, 0.05)',
                            border: isCurrent 
                                ? '2px solid #00e0ff' 
                                : selectedImages.has(img)
                                ? '2px solid rgba(0, 224, 255, 0.5)'
                                : '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            transition: 'all 0.2s ease',
                            aspectRatio: '1'
                        }}
                    >
                        <img
                            src={img}
                            alt={getName(img)}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                display: 'block'
                            }}
                            loading="lazy"
                        />
                        {selectedImages.has(img) && (
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                left: '4px',
                                width: '20px',
                                height: '20px',
                                background: 'rgba(0, 224, 255, 0.9)',
                                border: '2px solid #00e0ff',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 5
                            }}>
                                <CheckCircle size={14} style={{ color: '#000' }} />
                            </div>
                        )}
                        {hasAnnotations && annotationCache && annotationCache.current && annotationCache.current[img] && Array.isArray(annotationCache.current[img]) && (
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                background: 'rgba(0, 224, 255, 0.8)',
                                color: 'white',
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                zIndex: 4
                            }}>
                                {annotationCache.current[img].length}
                            </div>
                        )}
                        {isCurrent && (
                            <div style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: 'rgba(0, 224, 255, 0.9)',
                                color: 'white',
                                fontSize: '0.7rem',
                                padding: '4px',
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }}>
                                Current
                            </div>
                        )}
                        {/* Quick Actions on Hover */}
                        {hoveredImageIndex === filteredIdx && !isCurrent && (
                            <div style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                display: 'flex',
                                gap: '4px',
                                zIndex: 10
                            }}>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (originalIdx !== undefined && originalIdx >= 0) {
                                            setIndex(originalIdx);
                                        }
                                    }}
                                    style={{
                                        padding: '4px',
                                        background: 'rgba(0, 224, 255, 0.9)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title="Open image"
                                >
                                    <Eye size={12} />
                                </button>
                                {onDeleteImage && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm(`Delete ${getName(img)}?`)) {
                                                onDeleteImage(img, originalIdx);
                                            }
                                        }}
                                        style={{
                                            padding: '4px',
                                            background: 'rgba(255, 68, 68, 0.9)',
                                            border: 'none',
                                            borderRadius: '4px',
                                            color: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title="Delete image"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
            
            {/* Spacer for items after visible range */}
            {visibleRange.end < images.length && (
                <div style={{ 
                    gridColumn: '1 / -1', 
                    height: Math.ceil((images.length - visibleRange.end) / ITEMS_PER_ROW) * ITEM_HEIGHT 
                }} />
            )}
        </div>
    );
}

// Virtualized Image List Component for performance
function VirtualizedImageList({ images, filteredToOriginal, currentIndex, setIndex, annotatedImages, activeRef, getName, hoveredImageIndex, setHoveredImageIndex, onDeleteImage, selectedImages = new Set(), onToggleImageSelection }) {
    const containerRef = useRef(null);
    const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
    const ITEM_HEIGHT = 40; // Height of each list item
    
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        const handleScroll = () => {
            const scrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 5); // Buffer
            const end = Math.min(images.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + 5); // Buffer
            
            setVisibleRange({ start, end });
        };
        
        container.addEventListener('scroll', handleScroll);
        handleScroll(); // Initial calculation
        
        return () => container.removeEventListener('scroll', handleScroll);
    }, [images.length]);
    
    const visibleImages = images.slice(visibleRange.start, visibleRange.end);
    const startOffset = visibleRange.start * ITEM_HEIGHT;
    
    return (
        <div 
            ref={containerRef}
            style={{
                position: 'relative',
                height: '100%',
                overflowY: 'auto'
            }}
        >
            {/* Spacer for items before visible range */}
            {visibleRange.start > 0 && (
                <div style={{ height: startOffset }} />
            )}
            
            {visibleImages.map((img, localIdx) => {
                const filteredIdx = visibleRange.start + localIdx;
                const originalIdx = filteredToOriginal.get(filteredIdx);
                const isCurrent = originalIdx !== undefined && originalIdx === currentIndex;
                const hasAnnotations = annotatedImages ? annotatedImages.has(img) : false;
                
                return (
                    <div
                        key={img}
                        ref={isCurrent ? activeRef : null}
                        onClick={() => {
                            if (originalIdx !== undefined && originalIdx >= 0) {
                                setIndex(originalIdx);
                            }
                        }}
                        style={{
                            padding: '8px',
                            background: isCurrent ? 'rgba(0, 224, 255, 0.1)' : 'transparent',
                            borderLeft: isCurrent ? '3px solid #00e0ff' : 'none',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            color: isCurrent ? '#00e0ff' : '#aaa',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            height: ITEM_HEIGHT,
                            boxSizing: 'border-box'
                        }}
                        onMouseEnter={() => setHoveredImageIndex && setHoveredImageIndex(filteredIdx)}
                        onMouseLeave={() => setHoveredImageIndex && setHoveredImageIndex(null)}
                    >
                        {selectedImages.has(img) && (
                            <div style={{
                                width: '16px',
                                height: '16px',
                                background: 'rgba(0, 224, 255, 0.3)',
                                border: '2px solid #00e0ff',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                            }}>
                                <CheckCircle size={12} style={{ color: '#00e0ff' }} />
                            </div>
                        )}
                        <ImageIcon size={16} style={{ flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getName(img)}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {hasAnnotations && (
                                <CheckCircle size={14} style={{ color: '#00e0ff', flexShrink: 0 }} />
                            )}
                            {hoveredImageIndex === filteredIdx && !isCurrent && onDeleteImage && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Delete ${getName(img)}?`)) {
                                            onDeleteImage(img, originalIdx);
                                        }
                                    }}
                                    style={{
                                        padding: '2px 4px',
                                        background: 'rgba(255, 68, 68, 0.2)',
                                        border: '1px solid rgba(255, 68, 68, 0.5)',
                                        borderRadius: '4px',
                                        color: '#ff4444',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title="Delete image"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
            
            {/* Spacer for items after visible range */}
            {visibleRange.end < images.length && (
                <div style={{ height: (images.length - visibleRange.end) * ITEM_HEIGHT }} />
            )}
        </div>
    );
}

export default RightPanel;
