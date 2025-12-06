import React from 'react';
import { BarChart3, CheckCircle, Circle, Image as ImageIcon } from 'lucide-react';

function StatsPanel({ images, annotations, classes, datasetPath }) {
    // Calculate statistics
    const totalImages = images.length;
    const annotatedImages = new Set();
    const annotationsByClass = {};
    
    // Count annotations per class
    classes.forEach(cls => {
        annotationsByClass[cls.id] = {
            name: cls.name,
            count: 0,
            color: cls.color
        };
    });
    
    // Process all images to count annotations
    // Note: We only have current image annotations, so this is approximate
    annotations.forEach(ann => {
        if (annotationsByClass[ann.class_id]) {
            annotationsByClass[ann.class_id].count++;
        }
    });
    
    const totalAnnotations = Object.values(annotationsByClass).reduce((sum, cls) => sum + cls.count, 0);
    const avgAnnotationsPerImage = totalImages > 0 ? (totalAnnotations / totalImages).toFixed(1) : 0;
    
    return (
        <div className="glass-panel" style={{ 
            width: '250px', 
            margin: '10px', 
            padding: '15px', 
            display: 'flex', 
            flexDirection: 'column',
            maxHeight: '300px',
            overflowY: 'auto'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <BarChart3 size={18} style={{ color: '#00e0ff' }} />
                <h3 className="neon-text" style={{ margin: 0, fontSize: '1rem' }}>Statistics</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Overall Stats */}
                <div style={{ padding: '8px', background: 'rgba(0, 224, 255, 0.05)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#aaa' }}>Total Images</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00e0ff' }}>{totalImages}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#aaa' }}>Current Annotations</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00e0ff' }}>{annotations.length}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', color: '#aaa' }}>Avg per Image</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00e0ff' }}>{avgAnnotationsPerImage}</span>
                    </div>
                </div>
                
                {/* Annotations by Class */}
                {Object.values(annotationsByClass).filter(cls => cls.count > 0).length > 0 && (
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#aaa', marginBottom: '8px' }}>By Class:</div>
                        {Object.values(annotationsByClass)
                            .filter(cls => cls.count > 0)
                            .sort((a, b) => b.count - a.count)
                            .map((cls, idx) => (
                                <div key={idx} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'space-between',
                                    padding: '4px 8px',
                                    marginBottom: '4px',
                                    borderRadius: '4px',
                                    background: 'rgba(255, 255, 255, 0.02)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <div style={{ 
                                            width: '8px', 
                                            height: '8px', 
                                            borderRadius: '50%', 
                                            background: cls.color,
                                            boxShadow: `0 0 4px ${cls.color}`
                                        }}></div>
                                        <span style={{ fontSize: '0.8rem' }}>{cls.name}</span>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#00e0ff' }}>
                                        {cls.count}
                                    </span>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default StatsPanel;

