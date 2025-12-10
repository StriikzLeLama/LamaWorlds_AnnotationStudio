import React, { useMemo } from 'react';
import { Eye, Download, X, FileText, Image as ImageIcon } from 'lucide-react';

function ExportPreview({ images, annotations, classes, datasetPath, onExport, onClose }) {
    const exportStats = useMemo(() => {
        if (!images || !annotations || !classes) {
            return {
                totalImages: 0,
                annotatedImages: 0,
                totalAnnotations: 0,
                annotationsByClass: {},
                format: 'YOLO'
            };
        }

        const annotatedImages = new Set();
        const annotationsByClass = {};
        let totalAnnotations = 0;

        // Initialize class counts
        classes.forEach(cls => {
            if (cls && cls.id !== undefined) {
                annotationsByClass[cls.id] = {
                    name: cls.name || `Class ${cls.id}`,
                    count: 0,
                    color: cls.color || '#00e0ff'
                };
            }
        });

        // Count annotations (assuming annotations is an array for current image)
        // For full dataset, we'd need to iterate through all images
        if (Array.isArray(annotations)) {
            annotations.forEach(ann => {
                if (ann && typeof ann.class_id === 'number') {
                    totalAnnotations++;
                    if (annotationsByClass[ann.class_id]) {
                        annotationsByClass[ann.class_id].count++;
                    }
                }
            });
        }

        return {
            totalImages: images.length,
            annotatedImages: annotatedImages.size,
            totalAnnotations,
            annotationsByClass,
            format: 'YOLO'
        };
    }, [images, annotations, classes]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            backdropFilter: 'blur(5px)'
        }}>
            <div className="glass-panel" style={{
                width: '600px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                overflowY: 'auto'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Eye size={18} style={{ color: '#00e0ff' }} />
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#00e0ff' }}>Export Preview</h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '4px 8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            color: '#aaa',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Export Format */}
                <div style={{ padding: '12px', background: 'rgba(0, 224, 255, 0.05)', borderRadius: '6px', border: '1px solid rgba(0, 224, 255, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <FileText size={14} style={{ color: '#00e0ff' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00e0ff' }}>Export Format</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                        {exportStats.format} (YOLO format - .txt files)
                    </div>
                </div>

                {/* Statistics */}
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <ImageIcon size={14} style={{ color: '#00e0ff' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00e0ff' }}>Dataset Statistics</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#aaa' }}>Total Images:</span>
                            <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>{exportStats.totalImages}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#aaa' }}>Annotated Images:</span>
                            <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>{exportStats.annotatedImages}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#aaa' }}>Total Annotations:</span>
                            <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>{exportStats.totalAnnotations}</span>
                        </div>
                    </div>
                </div>

                {/* Annotations by Class */}
                {Object.keys(exportStats.annotationsByClass).length > 0 && (
                    <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00e0ff', marginBottom: '10px' }}>
                            Annotations by Class
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                            {Object.values(exportStats.annotationsByClass)
                                .filter(cls => cls.count > 0)
                                .sort((a, b) => b.count - a.count)
                                .map((cls, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '6px 8px',
                                            background: 'rgba(255, 255, 255, 0.02)',
                                            borderRadius: '4px',
                                            border: `1px solid ${cls.color}33`
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{
                                                width: '10px',
                                                height: '10px',
                                                borderRadius: '50%',
                                                background: cls.color,
                                                boxShadow: `0 0 6px ${cls.color}`
                                            }}></div>
                                            <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{cls.name}</span>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#00e0ff' }}>
                                            {cls.count}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Export Location */}
                <div style={{ padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '4px' }}>
                        Export Location:
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>
                        {datasetPath || 'Not specified'}
                    </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button
                        onClick={() => {
                            if (onExport) onExport();
                            if (onClose) onClose();
                        }}
                        style={{
                            flex: 1,
                            padding: '10px',
                            background: 'rgba(0, 224, 255, 0.2)',
                            border: '1px solid rgba(0, 224, 255, 0.5)',
                            borderRadius: '6px',
                            color: '#00e0ff',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(0, 224, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(0, 224, 255, 0.2)';
                        }}
                    >
                        <Download size={16} />
                        Export Dataset
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            color: '#aaa',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ExportPreview;

