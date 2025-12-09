import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Image as ImageIcon, Box, Search, Filter, CheckCircle, Circle, X, Trash2, SortAsc, SortDesc, Grid, List, Tag } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

function RightPanel({ images, currentIndex, setIndex, annotations, onDeleteAnnotation, onExport, classes, datasetPath, onChangeAnnotationClass, selectedAnnotationId, onSelectAnnotation, searchQuery, setSearchQuery, filterAnnotated, setFilterAnnotated, annotatedImages, filterClassId, setFilterClassId, annotationCache, onDeleteImage, setImages, annotationComments = {}, onUpdateAnnotationComment, imageTags = {}, onUpdateImageTag, searchInAnnotations = false, setSearchInAnnotations }) {
    const activeRef = useRef(null);
    const [imagesByClass, setImagesByClass] = useState(new Map());
    const [loadingClassFilter, setLoadingClassFilter] = useState(false);
    const [sortOrder, setSortOrder] = useState('name-asc'); // 'name-asc', 'name-desc', 'date-asc', 'date-desc'
    const [selectedImages, setSelectedImages] = useState(new Set());
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
    const [showTagEditor, setShowTagEditor] = useState(false);
    const [tagEditorImage, setTagEditorImage] = useState(null);
    const [tagInput, setTagInput] = useState('');

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
                    const cls = classes.find(c => c.id === ann.class_id);
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
            
            return matchesSearch && matchesFilter && matchesClass;
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
        <div className="glass-panel" style={{ width: '320px', margin: '10px', display: 'flex', flexDirection: 'column' }}>

            {/* Annotations List */}
            <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', height: '40%' }}>
                <h4 className="neon-text" style={{ margin: '0 0 10px 0' }}>Annotations ({annotations.length})</h4>
                <div style={{ height: 'calc(100% - 30px)', overflowY: 'auto' }}>
                    {annotations.map((ann, i) => {
                        const cls = classes.find(c => c.id === ann.class_id);
                        const isSelected = selectedAnnotationId === ann.id;
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
                                    marginBottom: '2px'
                                }}
                            >
                                <Box size={14} style={{ marginRight: '8px', color: cls?.color || '#56b0ff' }} />
                                <select
                                    value={ann.class_id}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        handleClassChange(ann.id, e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        outline: 'none',
                                        marginRight: '8px'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#00e0ff'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                                >
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id} style={{ background: '#1a1a2e', color: 'white' }}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <span style={{ color: '#666', fontSize: '0.8rem', marginRight: '8px', minWidth: '40px' }}>
                                    {Math.round((ann.confidence || 1.0) * 100)}%
                                </span>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteAnnotation(ann.id);
                                    }} 
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: '#ff4444', 
                                        cursor: 'pointer', 
                                        fontSize: '1.2rem', 
                                        padding: '0 5px',
                                        opacity: 0.7
                                    }}
                                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                                    onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                    
                    {/* Annotation Comments */}
                    {annotations.length > 0 && (
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
                                        {classes.find(c => c.id === ann.class_id)?.name || 'Unknown'}
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
                    <div style={{ display: 'flex', gap: '4px', fontSize: '0.7rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#aaa', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={searchInAnnotations || false}
                                onChange={(e) => setSearchInAnnotations && setSearchInAnnotations(e.target.checked)}
                                style={{ cursor: 'pointer' }}
                            />
                            Search in annotations
                        </label>
                    </div>
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
                        {/* Class Filter */}
                        <div style={{ position: 'relative' }}>
                            <select
                                value={filterClassId === null ? '' : filterClassId}
                                onChange={(e) => setFilterClassId && setFilterClassId(e.target.value === '' ? null : parseInt(e.target.value))}
                                disabled={loadingClassFilter}
                                style={{
                                    width: '100%',
                                    padding: '4px 8px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '4px',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    cursor: loadingClassFilter ? 'wait' : 'pointer',
                                    outline: 'none',
                                    opacity: loadingClassFilter ? 0.6 : 1
                                }}
                            >
                                <option value="">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id} style={{ background: '#1a1a2e', color: 'white' }}>
                                        {cls.name}
                                    </option>
                                ))}
                            </select>
                            {loadingClassFilter && (
                                <div style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    fontSize: '0.7rem',
                                    color: '#00e0ff'
                                }}>
                                    Loading...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {viewMode === 'grid' ? (
                        // Grid View
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                            gap: '12px',
                            padding: '4px'
                        }}>
                            {filteredImages.map((img, filteredIdx) => {
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
                                            position: 'relative',
                                            cursor: 'pointer',
                                            background: isCurrent ? 'rgba(0, 224, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                            border: isCurrent ? '2px solid #00e0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '8px',
                                            overflow: 'hidden',
                                            transition: 'all 0.2s ease',
                                            aspectRatio: '1'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isCurrent) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                                e.currentTarget.style.borderColor = 'rgba(0, 224, 255, 0.3)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isCurrent) {
                                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                            }
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
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.innerHTML = '<div style="color: #666; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; height: 100%;">IMG</div>';
                                            }}
                                        />
                                        {/* Annotation overlay */}
                                        {hasAnnotations && annotationCache && annotationCache.current && annotationCache.current[img] && (
                                            <div style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                bottom: 0,
                                                pointerEvents: 'none'
                                            }}>
                                                {annotationCache.current[img].slice(0, 5).map((ann, annIdx) => {
                                                    const cls = classes.find(c => c.id === ann.class_id);
                                                    if (!cls) return null;
                                                    return (
                                                        <div
                                                            key={annIdx}
                                                            style={{
                                                                position: 'absolute',
                                                                left: `${(ann.x / 100) * 100}%`,
                                                                top: `${(ann.y / 100) * 100}%`,
                                                                width: `${(ann.width / 100) * 100}%`,
                                                                height: `${(ann.height / 100) * 100}%`,
                                                                border: `1px solid ${cls.color}`,
                                                                background: `${cls.color}33`,
                                                                boxShadow: `0 0 2px ${cls.color}`
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                        {/* Badge */}
                                        {hasAnnotations && annotationCache && annotationCache.current && annotationCache.current[img] && annotationCache.current[img].length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '4px',
                                                right: '4px',
                                                background: 'rgba(0, 224, 255, 0.9)',
                                                color: '#000',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                boxShadow: '0 0 4px rgba(0, 224, 255, 0.5)'
                                            }}>
                                                {annotationCache.current[img].length}
                                            </div>
                                        )}
                                        {/* Image name overlay */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                            padding: '8px 4px 4px',
                                            fontSize: '0.7rem',
                                            color: '#fff',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis'
                                        }}>
                                            {getName(img)}
                                        </div>
                                        {/* Delete button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteImage(img, originalIdx);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: '4px',
                                                left: '4px',
                                                background: 'rgba(255, 68, 68, 0.8)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '20px',
                                                height: '20px',
                                                color: '#fff',
                                                cursor: 'pointer',
                                                fontSize: '0.7rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                opacity: 0,
                                                transition: 'opacity 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.opacity = '1'}
                                            onMouseLeave={(e) => e.target.style.opacity = '0'}
                                            title="Delete image"
                                        >
                                            ×
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        // List View
                        <div>
                        {filteredImages.map((img, filteredIdx) => {
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
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '8px',
                                        cursor: 'pointer',
                                        color: isCurrent ? '#fff' : '#aaa',
                                        background: isCurrent ? 'rgba(0, 224, 255, 0.15)' : 'transparent',
                                        borderLeft: isCurrent ? '3px solid var(--neon-blue)' : '3px solid transparent',
                                        marginBottom: '4px',
                                        borderRadius: '4px',
                                        fontSize: '0.85rem',
                                        transition: 'all 0.2s ease',
                                        position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isCurrent) {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isCurrent) {
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                {/* Thumbnail with annotation preview */}
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    minWidth: '50px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '4px',
                                    marginRight: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    position: 'relative'
                                }}>
                                    <img 
                                        src={img} 
                                        alt=""
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.parentElement.innerHTML = '<div style="color: #666; font-size: 0.7rem;">IMG</div>';
                                        }}
                                    />
                                    {/* Show annotation count badge */}
                                    {hasAnnotations && annotationCache && annotationCache.current && annotationCache.current[img] && annotationCache.current[img].length > 0 && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '2px',
                                            right: '2px',
                                            background: 'rgba(0, 224, 255, 0.9)',
                                            color: '#000',
                                            borderRadius: '50%',
                                            width: '16px',
                                            height: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.65rem',
                                            fontWeight: 'bold',
                                            boxShadow: '0 0 4px rgba(0, 224, 255, 0.5)'
                                        }}>
                                            {annotationCache.current[img].length}
                                        </div>
                                    )}
                                    {/* Draw annotation boxes on thumbnail */}
                                    {hasAnnotations && annotationCache && annotationCache.current && annotationCache.current[img] && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            pointerEvents: 'none'
                                        }}>
                                            {annotationCache.current[img].slice(0, 3).map((ann, annIdx) => {
                                                const cls = classes.find(c => c.id === ann.class_id);
                                                if (!cls) return null;
                                                // Scale annotation to thumbnail size (assuming image is loaded)
                                                return (
                                                    <div
                                                        key={annIdx}
                                                        style={{
                                                            position: 'absolute',
                                                            left: `${(ann.x / 100) * 100}%`,
                                                            top: `${(ann.y / 100) * 100}%`,
                                                            width: `${(ann.width / 100) * 100}%`,
                                                            height: `${(ann.height / 100) * 100}%`,
                                                            border: `1px solid ${cls.color}`,
                                                            background: `${cls.color}33`,
                                                            boxShadow: `0 0 2px ${cls.color}`
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        marginBottom: '2px'
                                    }}>
                                        {getName(img)}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#666', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                        {hasAnnotations ? (
                                            <><CheckCircle size={10} style={{ color: '#00ff00' }} /> Annotated</>
                                        ) : (
                                            <><Circle size={10} style={{ color: '#666' }} /> Empty</>
                                        )}
                                        {/* Tags */}
                                        {imageTags && imageTags[img] && imageTags[img].length > 0 && (
                                            <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', marginLeft: '4px' }}>
                                                {imageTags[img].slice(0, 2).map((tag, idx) => (
                                                    <span key={idx} style={{
                                                        background: 'rgba(0, 224, 255, 0.2)',
                                                        color: '#00e0ff',
                                                        fontSize: '0.65rem',
                                                        padding: '1px 4px',
                                                        borderRadius: '3px',
                                                        border: '1px solid rgba(0, 224, 255, 0.3)'
                                                    }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                                {imageTags[img].length > 2 && (
                                                    <span style={{ color: '#666', fontSize: '0.65rem' }}>
                                                        +{imageTags[img].length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {/* Tag and Delete buttons */}
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setTagEditorImage(img);
                                            setTagInput((imageTags && imageTags[img] ? imageTags[img].join(', ') : ''));
                                            setShowTagEditor(true);
                                        }}
                                        style={{
                                            background: 'rgba(0, 224, 255, 0.1)',
                                            border: '1px solid rgba(0, 224, 255, 0.3)',
                                            borderRadius: '4px',
                                            padding: '4px 6px',
                                            color: '#00e0ff',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            opacity: 0.7,
                                            transition: 'opacity 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.opacity = '1'}
                                        onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                                        title="Edit tags"
                                    >
                                        <Tag size={12} />
                                    </button>
                                    {/* Delete button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteImage(img, originalIdx);
                                    }}
                                    style={{
                                        background: 'rgba(255, 68, 68, 0.1)',
                                        border: '1px solid rgba(255, 68, 68, 0.3)',
                                        borderRadius: '4px',
                                        padding: '4px 6px',
                                        color: '#ff4444',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity: 0.7,
                                        transition: 'opacity 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.opacity = '1'}
                                    onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                                    title="Delete image"
                                >
                                    <Trash2 size={12} />
                                </button>
                                </div>
                            </div>
                        );
                        })}
                        {filteredImages.length === 0 && (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                                No images found
                            </div>
                        )}
                        </div>
                    )}
                </div>
            </div>

            {/* Export Button */}
            <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button className="btn-primary" style={{ width: '100%', marginBottom: '8px' }} onClick={() => onExport('coco')}>
                    EXPORT COCO
                </button>
                <button className="btn-primary" style={{ width: '100%', marginBottom: '8px' }} onClick={() => onExport('voc')}>
                    EXPORT VOC
                </button>
                <button className="btn-primary" style={{ width: '100%', marginBottom: '8px' }} onClick={() => onExport('report')}>
                    EXPORT REPORT
                </button>
                <button className="btn-primary" style={{ width: '100%', marginBottom: '8px' }} onClick={() => onExport('project')}>
                    EXPORT PROJECT
                </button>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => onExport('import_project')}>
                    IMPORT PROJECT
                </button>
            </div>
            
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

export default RightPanel;
