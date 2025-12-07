import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { v4 as uuidv4 } from 'uuid';

const CanvasImage = ({ src }) => {
    const [image] = useImage(src);
    return <KonvaImage image={image} />;
};

const AnnotationCanvas = ({ imageUrl, annotations, onChange, selectedClassId, classes, selectedId, onSelect }) => {
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [newAnnotation, setNewAnnotation] = useState(null);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPointerPos, setLastPointerPos] = useState({ x: 0, y: 0 });

    const stageRef = useRef(null);
    const trRef = useRef(null);
    const layerRef = useRef(null);
    const containerRef = useRef(null);

    // Update stage size on window resize
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setStageSize({ width: rect.width, height: rect.height });
            }
        };
        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    const getColor = (clsId) => {
        if (!classes || !Array.isArray(classes)) return '#00e0ff';
        const cls = classes.find(c => c && c.id === clsId);
        return cls ? cls.color : '#00e0ff';
    };

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = stageRef.current;
        if (!stage) return;
        
        const oldScale = stage.scaleX();
        const pointerPos = stage.getPointerPosition();
        if (!pointerPos) return;
        
        const mousePointTo = {
            x: (pointerPos.x - stage.x()) / oldScale,
            y: (pointerPos.y - stage.y()) / oldScale,
        };

        const newScale = Math.max(0.1, Math.min(5, e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy));
        setStageScale(newScale);

        const newPos = {
            x: pointerPos.x - mousePointTo.x * newScale,
            y: pointerPos.y - mousePointTo.y * newScale,
        };
        setStagePos(newPos);
    };

    const checkDeselect = (e) => {
        const clickedOnEmpty = e.target === stageRef.current;
        if (clickedOnEmpty) {
            onSelect(null);
        }
    };

    const handleMouseDown = (e) => {
        const stage = stageRef.current;
        if (!stage) return;

        // Middle mouse button or space + left click for panning
        const isMiddleClick = e.evt.button === 1;
        const isSpacePan = e.evt.button === 0 && e.evt.shiftKey;
        
        if (isMiddleClick || isSpacePan) {
            setIsPanning(true);
            const pointerPos = stage.getPointerPosition();
            if (pointerPos) {
                setLastPointerPos(pointerPos);
            }
            return;
        }

        if (selectedId) {
            checkDeselect(e);
            return;
        }

        // Start drawing
        const pos = stage.getRelativePointerPosition();
        if (!pos) return;

        setNewAnnotation({
            x: pos.x, 
            y: pos.y, 
            width: 0, 
            height: 0,
            class_id: selectedClassId,
            id: 'temp'
        });
    };

    const handleMouseMove = (e) => {
        const stage = stageRef.current;
        if (!stage) return;

        // Handle panning
        if (isPanning) {
            const pointerPos = stage.getPointerPosition();
            if (pointerPos && lastPointerPos) {
                const dx = pointerPos.x - lastPointerPos.x;
                const dy = pointerPos.y - lastPointerPos.y;
                setStagePos({
                    x: stagePos.x + dx,
                    y: stagePos.y + dy
                });
                setLastPointerPos(pointerPos);
            }
            return;
        }

        // Handle drawing
        if (!newAnnotation) return;
        const pos = stage.getRelativePointerPosition();
        if (!pos) return;

        setNewAnnotation({
            ...newAnnotation,
            width: pos.x - newAnnotation.x,
            height: pos.y - newAnnotation.y
        });
    };

    const handleMouseUp = (e) => {
        // Stop panning
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        if (!newAnnotation) return;
        // Normalize rect (width/height can be negative)
        const x = newAnnotation.width < 0 ? newAnnotation.x + newAnnotation.width : newAnnotation.x;
        const y = newAnnotation.height < 0 ? newAnnotation.y + newAnnotation.height : newAnnotation.y;
        const width = Math.abs(newAnnotation.width);
        const height = Math.abs(newAnnotation.height);

        if (width > 5 && height > 5) {
            const finalAnnotation = {
                id: uuidv4(),
                class_id: newAnnotation.class_id,
                x, y, width, height,
                confidence: 1.0
            };
            onChange([...annotations, finalAnnotation]);
        }
        setNewAnnotation(null);
    };

    const handleDragEnd = (e, id) => {
        if (!annotations || !Array.isArray(annotations)) return;
        const box = annotations.find(a => a && a.id === id);
        if (box && e.target) {
            const newAnns = annotations.map(a => {
                if (a && a.id === id) {
                    return {
                        ...a,
                        x: e.target.x(),
                        y: e.target.y()
                    };
                }
                return a;
            });
            onChange(newAnns);
        }
    };

    const handleTransformEnd = (e) => {
        if (!selectedId || !layerRef.current) return;
        const node = layerRef.current.findOne(`#${selectedId}`);
        if (!node) return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // update state
        node.scaleX(1);
        node.scaleY(1);

        if (!annotations || !Array.isArray(annotations)) return;
        const newAnns = annotations.map(a => {
            if (a && a.id === selectedId) {
                return {
                    ...a,
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(5, node.width() * scaleX),
                    height: Math.max(5, node.height() * scaleY)
                };
            }
            return a;
        });
        onChange(newAnns);
    };

    useEffect(() => {
        if (selectedId && trRef.current && layerRef.current) {
            // attach transformer
            const node = layerRef.current.findOne(`#${selectedId}`);
            if (node) {
                trRef.current.nodes([node]);
                trRef.current.getLayer().batchDraw();
            }
        } else if (trRef.current) {
            trRef.current.nodes([]);
        }
    }, [selectedId, annotations]);

    if (!imageUrl) {
        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#555' }}>
                No image loaded
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <Stage
                width={stageSize.width}
                height={stageSize.height}
                onWheel={handleWheel}
                scaleX={stageScale}
                scaleY={stageScale}
                x={stagePos.x}
                y={stagePos.y}
                draggable={false}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                ref={stageRef}
            >
                <Layer ref={layerRef}>
                    <CanvasImage src={imageUrl} />

                    {annotations.map((ann, i) => (
                        <Rect
                            key={ann.id}
                            id={ann.id}
                            x={ann.x}
                            y={ann.y}
                            width={ann.width}
                            height={ann.height}
                            stroke={getColor(ann.class_id)}
                            strokeWidth={Math.max(1, 2 / stageScale)} // Keep stroke constant but minimum 1
                            fill="transparent"
                            draggable
                            onClick={(e) => { 
                                e.cancelBubble = true; 
                                onSelect(ann.id); 
                            }}
                            onTap={(e) => {
                                e.cancelBubble = true;
                                onSelect(ann.id);
                            }}
                            onDragEnd={(e) => handleDragEnd(e, ann.id)}
                        />
                    ))}

                    {newAnnotation && (
                        <Rect
                            x={newAnnotation.x}
                            y={newAnnotation.y}
                            width={newAnnotation.width}
                            height={newAnnotation.height}
                            stroke={getColor(newAnnotation.class_id)}
                            strokeWidth={Math.max(1, 2 / stageScale)}
                            fill="transparent"
                            dash={[5, 5]}
                        />
                    )}

                    {selectedId && (
                        <Transformer
                            ref={trRef}
                            boundBoxFunc={(oldBox, newBox) => {
                                // limit resize if needed
                                if (newBox.width < 5 || newBox.height < 5) {
                                    return oldBox;
                                }
                                return newBox;
                            }}
                            onTransformEnd={handleTransformEnd}
                        />
                    )}
                </Layer>
            </Stage>
        </div>
    );
};

export default AnnotationCanvas;
