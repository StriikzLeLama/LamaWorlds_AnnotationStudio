import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Image as ImageIcon, Box, Search, Filter, CheckCircle, Circle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

function RightPanel({ images, currentIndex, setIndex, annotations, onDeleteAnnotation, onExport, classes, datasetPath, onChangeAnnotationClass, selectedAnnotationId, onSelectAnnotation, searchQuery, setSearchQuery, filterAnnotated, setFilterAnnotated, annotatedImages, filterClassId, setFilterClassId, annotationCache }) {
    const activeRef = useRef(null);
    const [imagesByClass, setImagesByClass] = useState(new Set());
    const [loadingClassFilter, setLoadingClassFilter] = useState(false);

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
                    setImagesByClass(new Set(res.data.annotated_images));
                } else {
                    setImagesByClass(new Set());
                }
            })
            .catch(err => {
                console.error('Failed to load images by class:', err);
                setImagesByClass(new Set());
            })
            .finally(() => {
                setLoadingClassFilter(false);
            });
        } else {
            setImagesByClass(new Set());
        }
    }, [filterClassId, datasetPath]);

    const getName = (path) => {
        // Handle both / and \ 
        const parts = path.split(/[/\\]/);
        return parts[parts.length - 1];
    };

    const getClassName = (classId) => {
        const cls = classes.find(c => c.id === classId);
        return cls ? cls.name : `Class ${classId}`;
    };

    const handleClassChange = (annId, newClassId) => {
        if (onChangeAnnotationClass) {
            onChangeAnnotationClass(annId, parseInt(newClassId));
        }
    };
    
    // Filter and search images
    const filteredImages = useMemo(() => {
        if (!images || !Array.isArray(images)) return [];
        
        return images.filter((img) => {
            if (!img) return false;
            
            const name = getName(img).toLowerCase();
            const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase());
            const hasAnnotations = annotatedImages ? annotatedImages.has(img) : false;
            const matchesFilter = filterAnnotated === null || 
                (filterAnnotated === true && hasAnnotations) || 
                (filterAnnotated === false && !hasAnnotations);
            
            // Filter by class if specified
            let matchesClass = true;
            if (filterClassId !== null) {
                // Use backend-filtered images set if available
                if (imagesByClass.size > 0) {
                    matchesClass = imagesByClass.has(img);
                } else if (hasAnnotations && annotationCache && annotationCache.current) {
                    // Fallback to cache if backend hasn't loaded yet
                    const cachedAnns = annotationCache.current[img] || [];
                    matchesClass = cachedAnns.some(ann => ann && ann.class_id === filterClassId);
                } else {
                    // If no data available, don't filter (show all)
                    matchesClass = true;
                }
            }
            
            return matchesSearch && matchesFilter && matchesClass;
        });
    }, [images, searchQuery, filterAnnotated, annotatedImages, filterClassId, annotationCache, imagesByClass]);
    
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
                </div>
            </div>

            {/* Image List */}
            <div style={{ flex: 1, padding: '15px', overflowY: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h4 className="neon-text" style={{ margin: 0, fontSize: '0.95rem' }}>
                        Images ({filteredImages.length}/{images.length})
                    </h4>
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
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                                onClick={() => setFilterAnnotated && setFilterAnnotated(null)}
                                style={{
                                    flex: 1,
                                    padding: '4px 8px',
                                    background: filterAnnotated === null ? 'rgba(0, 224, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '4px',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer'
                                }}
                            >
                                All
                            </button>
                        <button
                            onClick={() => setFilterAnnotated && setFilterAnnotated(true)}
                            style={{
                                flex: 1,
                                padding: '4px 8px',
                                background: filterAnnotated === true ? 'rgba(0, 224, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                            }}
                        >
                            <CheckCircle size={12} />
                            Annotated
                        </button>
                        <button
                            onClick={() => setFilterAnnotated && setFilterAnnotated(false)}
                            style={{
                                flex: 1,
                                padding: '4px 8px',
                                background: filterAnnotated === false ? 'rgba(0, 224, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.75rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                            }}
                        >
                            <Circle size={12} />
                            Empty
                        </button>
                        </div>
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
                                    <div style={{ fontSize: '0.7rem', color: '#666', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {hasAnnotations ? (
                                            <><CheckCircle size={10} style={{ color: '#00ff00' }} /> Annotated</>
                                        ) : (
                                            <><Circle size={10} style={{ color: '#666' }} /> Empty</>
                                        )}
                                    </div>
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
            </div>

            {/* Export Button */}
            <div style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <button className="btn-primary" style={{ width: '100%', marginBottom: '8px' }} onClick={() => onExport('coco')}>
                    EXPORT COCO
                </button>
                <button className="btn-primary" style={{ width: '100%', marginBottom: '8px' }} onClick={() => onExport('voc')}>
                    EXPORT VOC
                </button>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => onExport('report')}>
                    EXPORT REPORT
                </button>
            </div>
        </div>
    );
}

export default RightPanel;
