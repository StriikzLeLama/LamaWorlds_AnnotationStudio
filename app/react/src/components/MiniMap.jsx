import React, { useMemo, useCallback } from 'react';
import { Stage, Layer, Rect, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

function MiniMap({ imageUrl, annotations, classes, stageScale, stagePos, stageSize, imageDimensions, onNavigate, containerWidth = 200, containerHeight = 150 }) {
    const [image] = useImage(imageUrl);
    
    // Calculate scale to fit image in minimap
    const minimapScale = useMemo(() => {
        if (!image || !imageDimensions || !imageDimensions.width || !imageDimensions.height) return 1;
        const scaleX = containerWidth / imageDimensions.width;
        const scaleY = containerHeight / imageDimensions.height;
        return Math.min(scaleX, scaleY, 1);
    }, [image, imageDimensions, containerWidth, containerHeight]);
    
    // Calculate viewport rectangle
    const viewportRect = useMemo(() => {
        if (!imageDimensions || !imageDimensions.width || !imageDimensions.height) return null;
        
        // Calculate the visible area in image coordinates
        const imageCenterX = imageDimensions.width / 2;
        const imageCenterY = imageDimensions.height / 2;
        
        // Stage position relative to image center
        const stageX = stagePos.x - (stageSize.width / 2 - imageCenterX);
        const stageY = stagePos.y - (stageSize.height / 2 - imageCenterY);
        
        // Visible area in image coordinates
        const visibleWidth = stageSize.width / stageScale;
        const visibleHeight = stageSize.height / stageScale;
        
        const viewportX = -stageX / stageScale;
        const viewportY = -stageY / stageScale;
        
        return {
            x: viewportX * minimapScale,
            y: viewportY * minimapScale,
            width: visibleWidth * minimapScale,
            height: visibleHeight * minimapScale
        };
    }, [stagePos, stageScale, stageSize, imageDimensions, minimapScale]);
    
    const handleClick = useCallback((e) => {
        if (!image || !imageDimensions || !imageDimensions.width || !imageDimensions.height) return;
        
        const stage = e.target.getStage();
        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;
        
        // Convert minimap coordinates to image coordinates
        const imageX = (pointerPos.x / minimapScale) - (imageDimensions.width / 2);
        const imageY = (pointerPos.y / minimapScale) - (imageDimensions.height / 2);
        
        // Center view on clicked position
        if (onNavigate) {
            onNavigate({
                x: -imageX * stageScale + stageSize.width / 2,
                y: -imageY * stageScale + stageSize.height / 2
            });
        }
    }, [minimapScale, imageDimensions, stageScale, stageSize, onNavigate, image]);
    
    if (!image || !imageDimensions || !imageDimensions.width || !imageDimensions.height) {
        return null;
    }
    
    const getColor = (classId) => {
        if (!classes || !Array.isArray(classes)) return '#00e0ff';
        const cls = classes.find(c => c && c.id === classId);
        return cls ? cls.color : '#00e0ff';
    };
    
    return (
        <div style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            width: containerWidth,
            height: containerHeight,
            background: 'rgba(0, 0, 0, 0.8)',
            border: '1px solid rgba(0, 224, 255, 0.5)',
            borderRadius: '4px',
            overflow: 'hidden',
            zIndex: 100
        }}>
            <Stage width={containerWidth} height={containerHeight} onClick={handleClick}>
                <Layer>
                    {/* Mini image */}
                    <KonvaImage
                        image={image}
                        x={0}
                        y={0}
                        width={imageDimensions.width * minimapScale}
                        height={imageDimensions.height * minimapScale}
                        opacity={0.6}
                    />
                    
                    {/* Mini annotations */}
                    {Array.isArray(annotations) && annotations.map(ann => {
                        if (!ann || !ann.id || typeof ann.x !== 'number' || typeof ann.y !== 'number' || typeof ann.width !== 'number' || typeof ann.height !== 'number') return null;
                        return (
                        <Rect
                            key={ann.id}
                            x={ann.x * minimapScale}
                            y={ann.y * minimapScale}
                            width={ann.width * minimapScale}
                            height={ann.height * minimapScale}
                            stroke={getColor(ann.class_id)}
                            strokeWidth={1}
                            fill="transparent"
                            listening={false}
                        />
                        );
                    })}
                    
                    {/* Viewport rectangle */}
                    {viewportRect && (
                        <Rect
                            x={viewportRect.x}
                            y={viewportRect.y}
                            width={viewportRect.width}
                            height={viewportRect.height}
                            stroke="#ffff00"
                            strokeWidth={2}
                            fill="rgba(255, 255, 0, 0.1)"
                            listening={false}
                        />
                    )}
                </Layer>
            </Stage>
        </div>
    );
}

export default React.memo(MiniMap);

