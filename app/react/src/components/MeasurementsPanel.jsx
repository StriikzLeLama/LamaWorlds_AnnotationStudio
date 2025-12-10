import React, { useMemo } from 'react';
import { Ruler, Move, Maximize2 } from 'lucide-react';
import CollapsiblePanel from './CollapsiblePanel';

function MeasurementsPanel({ annotations, classes, imageDimensions, selectedId, selectedIds }) {
    const measurements = useMemo(() => {
        if (!annotations || !Array.isArray(annotations) || annotations.length === 0) {
            return [];
        }

        const selectedAnnotations = annotations.filter(ann => {
            if (!ann || !ann.id) return false;
            return ann.id === selectedId || (selectedIds && selectedIds.has(ann.id));
        });

        if (selectedAnnotations.length === 0) {
            return [];
        }

        return selectedAnnotations.map(ann => {
            if (!ann || typeof ann.x !== 'number' || typeof ann.y !== 'number' ||
                typeof ann.width !== 'number' || typeof ann.height !== 'number') {
                return null;
            }

            const cls = classes.find(c => c && c.id === ann.class_id);
            const className = cls ? cls.name : `Class ${ann.class_id}`;
            
            const width = Math.abs(ann.width);
            const height = Math.abs(ann.height);
            const area = width * height;
            const centerX = ann.x + width / 2;
            const centerY = ann.y + height / 2;
            const aspectRatio = width > 0 ? (height / width).toFixed(2) : 0;
            
            // Calculate distance from image center if image dimensions available
            let distanceFromCenter = null;
            if (imageDimensions && imageDimensions.width > 0 && imageDimensions.height > 0) {
                const imgCenterX = imageDimensions.width / 2;
                const imgCenterY = imageDimensions.height / 2;
                distanceFromCenter = Math.sqrt(
                    Math.pow(centerX - imgCenterX, 2) + 
                    Math.pow(centerY - imgCenterY, 2)
                ).toFixed(1);
            }

            return {
                id: ann.id,
                className,
                width: width.toFixed(1),
                height: height.toFixed(1),
                area: area.toFixed(1),
                centerX: centerX.toFixed(1),
                centerY: centerY.toFixed(1),
                aspectRatio,
                distanceFromCenter,
                position: { x: ann.x.toFixed(1), y: ann.y.toFixed(1) }
            };
        }).filter(m => m !== null);
    }, [annotations, classes, imageDimensions, selectedId, selectedIds]);

    return (
        <CollapsiblePanel 
            title={`Measurements${measurements.length > 0 ? ` (${measurements.length})` : ''}`}
            icon={Ruler}
            containerStyle={{ margin: '10px', maxHeight: '300px', overflowY: 'auto' }}
        >
            {measurements.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#666', margin: 0, padding: '10px' }}>
                    Select an annotation to see measurements
                </p>
            ) : (
                <>

            {measurements.map((m, idx) => (
                <div key={m.id || idx} style={{
                    padding: '12px',
                    marginBottom: '10px',
                    background: 'rgba(0, 224, 255, 0.05)',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 224, 255, 0.2)'
                }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#00e0ff', marginBottom: '8px' }}>
                        {m.className}
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Maximize2 size={12} style={{ color: '#888' }} />
                            <span style={{ color: '#aaa' }}>Width:</span>
                            <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>{m.width}px</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Maximize2 size={12} style={{ color: '#888' }} />
                            <span style={{ color: '#aaa' }}>Height:</span>
                            <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>{m.height}px</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Ruler size={12} style={{ color: '#888' }} />
                            <span style={{ color: '#aaa' }}>Area:</span>
                            <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>{m.area}px²</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#aaa' }}>Ratio:</span>
                            <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>{m.aspectRatio}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Move size={12} style={{ color: '#888' }} />
                            <span style={{ color: '#aaa' }}>X:</span>
                            <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>{m.position.x}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Move size={12} style={{ color: '#888' }} />
                            <span style={{ color: '#aaa' }}>Y:</span>
                            <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>{m.position.y}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#aaa' }}>Center X:</span>
                            <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>{m.centerX}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ color: '#aaa' }}>Center Y:</span>
                            <span style={{ color: '#00e0ff', fontWeight: 'bold' }}>{m.centerY}</span>
                        </div>
                    </div>

                    {m.distanceFromCenter !== null && (
                        <div style={{ 
                            marginTop: '8px', 
                            paddingTop: '8px', 
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            fontSize: '0.75rem',
                            color: '#666'
                        }}>
                            Distance from center: <span style={{ color: '#00e0ff' }}>{m.distanceFromCenter}px</span>
                        </div>
                    )}
                </div>
            ))}
                </>
            )}
        </CollapsiblePanel>
    );
}

export default MeasurementsPanel;

