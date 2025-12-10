import React, { useMemo } from 'react';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';
import CollapsiblePanel from './CollapsiblePanel';

function AnalyticsPanel({ images, annotations, classes, annotatedImages }) {
    // Calculate statistics
    const stats = useMemo(() => {
        if (!images || !Array.isArray(images) || !annotations || !Array.isArray(annotations)) {
            return null;
        }
        
        const totalImages = images.length;
        const annotatedCount = annotatedImages ? Array.from(annotatedImages).length : 0;
        const unannotatedCount = totalImages - annotatedCount;
        
        // Annotations per class
        const classCounts = {};
        annotations.forEach(ann => {
            if (ann && ann.class_id !== undefined) {
                classCounts[ann.class_id] = (classCounts[ann.class_id] || 0) + 1;
            }
        });
        
        // Average annotations per image
        const avgAnnotations = annotatedCount > 0 ? (annotations.length / annotatedCount).toFixed(2) : 0;
        
        // Size distribution
        const sizes = annotations.map(ann => ann.width * ann.height).filter(s => s > 0);
        const avgSize = sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;
        const minSize = sizes.length > 0 ? Math.min(...sizes) : 0;
        const maxSize = sizes.length > 0 ? Math.max(...sizes) : 0;
        
        // Position distribution
        const centerX = annotations.map(ann => ann.x + ann.width / 2);
        const centerY = annotations.map(ann => ann.y + ann.height / 2);
        const avgX = centerX.length > 0 ? centerX.reduce((a, b) => a + b, 0) / centerX.length : 0;
        const avgY = centerY.length > 0 ? centerY.reduce((a, b) => a + b, 0) / centerY.length : 0;
        
        return {
            totalImages,
            annotatedCount,
            unannotatedCount,
            totalAnnotations: annotations.length,
            classCounts,
            avgAnnotations,
            avgSize,
            minSize,
            maxSize,
            avgX,
            avgY
        };
    }, [images, annotations, annotatedImages]);
    
    if (!stats) {
        return (
            <CollapsiblePanel title="Analytics" icon={BarChart3} containerStyle={{ margin: '10px' }}>
                <div style={{ color: '#aaa', fontSize: '0.85rem' }}>No data available</div>
            </CollapsiblePanel>
        );
    }
    
    // Get class name
    const getClassName = (classId) => {
        if (!classes || !Array.isArray(classes)) return `Class ${classId}`;
        const cls = classes.find(c => c && c.id === classId);
        return cls ? cls.name : `Class ${classId}`;
    };
    
    // Get class color
    const getClassColor = (classId) => {
        if (!classes || !Array.isArray(classes)) return '#00e0ff';
        const cls = classes.find(c => c && c.id === classId);
        return cls ? cls.color : '#00e0ff';
    };
    
    // Sort classes by count
    const sortedClasses = Object.entries(stats.classCounts)
        .map(([id, count]) => ({ id: parseInt(id), count }))
        .sort((a, b) => b.count - a.count);
    
    const maxCount = sortedClasses.length > 0 ? sortedClasses[0].count : 1;
    
    return (
        <CollapsiblePanel 
            title="Analytics" 
            icon={BarChart3}
            containerStyle={{ margin: '10px', maxHeight: '400px', overflowY: 'auto' }}
        >
            {/* Overview Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(0, 224, 255, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0, 224, 255, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>Total Images</div>
                    <div style={{ fontSize: '1.2rem', color: '#00e0ff', fontWeight: 'bold' }}>{stats.totalImages}</div>
                </div>
                <div style={{ background: 'rgba(0, 224, 255, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0, 224, 255, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>Annotated</div>
                    <div style={{ fontSize: '1.2rem', color: '#00e0ff', fontWeight: 'bold' }}>{stats.annotatedCount}</div>
                </div>
                <div style={{ background: 'rgba(0, 224, 255, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0, 224, 255, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>Total Annotations</div>
                    <div style={{ fontSize: '1.2rem', color: '#00e0ff', fontWeight: 'bold' }}>{stats.totalAnnotations}</div>
                </div>
                <div style={{ background: 'rgba(0, 224, 255, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0, 224, 255, 0.3)' }}>
                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>Avg per Image</div>
                    <div style={{ fontSize: '1.2rem', color: '#00e0ff', fontWeight: 'bold' }}>{stats.avgAnnotations}</div>
                </div>
            </div>
            
            {/* Class Distribution */}
            {sortedClasses.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '0.9rem', color: '#00e0ff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <PieChart size={16} />
                        Annotations by Class
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {sortedClasses.map(({ id, count }) => {
                            const percentage = (count / stats.totalAnnotations * 100).toFixed(1);
                            const barWidth = (count / maxCount * 100);
                            return (
                                <div key={id} style={{ marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: getClassColor(id), boxShadow: `0 0 3px ${getClassColor(id)}` }}></div>
                                            <span style={{ fontSize: '0.85rem', color: '#aaa' }}>{getClassName(id)}</span>
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#00e0ff', fontWeight: 'bold' }}>
                                            {count} ({percentage}%)
                                        </div>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ 
                                            width: `${barWidth}%`, 
                                            height: '100%', 
                                            background: getClassColor(id),
                                            transition: 'width 0.3s ease'
                                        }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* Size Statistics */}
            {stats.totalAnnotations > 0 && (
                <div style={{ marginBottom: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ fontSize: '0.9rem', color: '#00e0ff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={16} />
                        Size Statistics
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                        <div>
                            <div style={{ color: '#888' }}>Average</div>
                            <div style={{ color: '#00e0ff' }}>{(stats.avgSize / 1000).toFixed(1)}k px²</div>
                        </div>
                        <div>
                            <div style={{ color: '#888' }}>Min</div>
                            <div style={{ color: '#00e0ff' }}>{(stats.minSize / 1000).toFixed(1)}k px²</div>
                        </div>
                        <div>
                            <div style={{ color: '#888' }}>Max</div>
                            <div style={{ color: '#00e0ff' }}>{(stats.maxSize / 1000).toFixed(1)}k px²</div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Progress */}
            <div style={{ paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.9rem', color: '#00e0ff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={16} />
                    Progress
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px' }}>
                    <div style={{ 
                        width: `${(stats.annotatedCount / stats.totalImages) * 100}%`, 
                        height: '100%', 
                        background: 'linear-gradient(90deg, #00e0ff, #56b0ff)',
                        transition: 'width 0.3s ease'
                    }}></div>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#888', textAlign: 'center' }}>
                    {stats.annotatedCount} / {stats.totalImages} images annotated ({((stats.annotatedCount / stats.totalImages) * 100).toFixed(1)}%)
                </div>
            </div>
        </CollapsiblePanel>
    );
}

export default React.memo(AnalyticsPanel);

