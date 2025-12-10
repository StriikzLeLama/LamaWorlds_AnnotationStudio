import React, { useState, useEffect } from 'react';
import { BarChart3, CheckCircle, Circle, Image as ImageIcon, TrendingUp, Database } from 'lucide-react';
import CollapsiblePanel from './CollapsiblePanel';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

function StatsPanel({ images, annotations, classes, datasetPath, annotatedImages }) {
    const [datasetStats, setDatasetStats] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Load dataset-wide statistics
    useEffect(() => {
        if (!datasetPath) return;
        
        const loadStats = async () => {
            setLoading(true);
            try {
                // Get all annotated images
                const annotatedRes = await api.post('/get_annotated_images', { dataset_path: datasetPath });
                const allAnnotated = annotatedRes.data.annotated_images || [];
                
                // Count annotations per class across all images
                const classCounts = {};
                classes.forEach(cls => {
                    classCounts[cls.id] = { name: cls.name, count: 0, color: cls.color };
                });
                
                // For each annotated image, try to get its annotations
                // This is approximate since we'd need to load all files
                // For now, we'll use a simpler approach
                setDatasetStats({
                    totalAnnotated: allAnnotated.length,
                    totalImages: images.length,
                    progress: images.length > 0 ? ((allAnnotated.length / images.length) * 100).toFixed(1) : 0
                });
            } catch (err) {
                console.error('Failed to load dataset stats:', err);
            } finally {
                setLoading(false);
            }
        };
        
        loadStats();
    }, [datasetPath, images.length, classes]);
    
    // Calculate statistics for current image
    const totalImages = images.length;
    const annotationsByClass = {};
    
    // Count annotations per class
    classes.forEach(cls => {
        annotationsByClass[cls.id] = {
            name: cls.name,
            count: 0,
            color: cls.color
        };
    });
    
    // Process current image annotations
    annotations.forEach(ann => {
        if (annotationsByClass[ann.class_id]) {
            annotationsByClass[ann.class_id].count++;
        }
    });
    
    const totalAnnotations = Object.values(annotationsByClass).reduce((sum, cls) => sum + cls.count, 0);
    const currentAnnotatedCount = annotatedImages ? annotatedImages.size : 0;
    const progress = totalImages > 0 ? ((currentAnnotatedCount / totalImages) * 100).toFixed(1) : 0;
    
    return (
        <CollapsiblePanel 
            title="Statistics" 
            icon={BarChart3}
            containerStyle={{ maxHeight: '400px', overflowY: 'auto' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Dataset Progress */}
                <div style={{ padding: '10px', background: 'rgba(0, 224, 255, 0.05)', borderRadius: '6px', border: '1px solid rgba(0, 224, 255, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <Database size={14} style={{ color: '#00e0ff' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00e0ff' }}>Dataset Progress</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Annotated</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00e0ff' }}>
                            {currentAnnotatedCount} / {totalImages}
                        </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden', marginBottom: '4px' }}>
                        <div style={{ 
                            width: `${progress}%`, 
                            height: '100%', 
                            background: 'linear-gradient(90deg, #00e0ff, #56b0ff)',
                            transition: 'width 0.3s ease',
                            boxShadow: '0 0 10px rgba(0, 224, 255, 0.5)'
                        }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666' }}>
                        <span>{progress}% Complete</span>
                        <span>{totalImages - currentAnnotatedCount} Remaining</span>
                    </div>
                </div>
                
                {/* Current Image Stats */}
                <div style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '6px' }}>Current Image:</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.85rem', color: '#aaa' }}>Annotations</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00e0ff' }}>{annotations.length}</span>
                    </div>
                    {totalImages > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#666' }}>
                            <span>Image</span>
                            <span>{annotations.length > 0 ? '✓ Annotated' : '○ Empty'}</span>
                        </div>
                    )}
                </div>
                
                {/* Annotations by Class (Current Image) */}
                {totalAnnotations > 0 && (
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <TrendingUp size={12} />
                            Current Image by Class:
                        </div>
                        {Object.values(annotationsByClass)
                            .filter(cls => cls.count > 0)
                            .sort((a, b) => b.count - a.count)
                            .map((cls, idx) => {
                                const percentage = totalAnnotations > 0 ? ((cls.count / totalAnnotations) * 100).toFixed(0) : 0;
                                return (
                                    <div key={idx} style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between',
                                        padding: '6px 8px',
                                        marginBottom: '4px',
                                        borderRadius: '4px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        border: `1px solid ${cls.color}33`
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                                            <div style={{ 
                                                width: '10px', 
                                                height: '10px', 
                                                borderRadius: '50%', 
                                                background: cls.color,
                                                boxShadow: `0 0 6px ${cls.color}`
                                            }}></div>
                                            <span style={{ fontSize: '0.8rem', flex: 1 }}>{cls.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ 
                                                width: '40px', 
                                                height: '4px', 
                                                background: 'rgba(255, 255, 255, 0.1)', 
                                                borderRadius: '2px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{ 
                                                    width: `${percentage}%`, 
                                                    height: '100%', 
                                                    background: cls.color,
                                                    transition: 'width 0.3s ease'
                                                }}></div>
                                            </div>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#00e0ff', minWidth: '20px', textAlign: 'right' }}>
                                                {cls.count}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                )}
                
                {totalAnnotations === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                        No annotations on current image
                    </div>
                )}
            </div>
        </CollapsiblePanel>
    );
}

export default StatsPanel;

