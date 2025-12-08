import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';
import { v4 as uuidv4 } from 'uuid';
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, Maximize2, FlipHorizontal, FlipVertical } from 'lucide-react';

const CanvasImage = ({ src, rotation = 0, flip = { horizontal: false, vertical: false } }) => {
    const [image] = useImage(src);
    
    if (!image) return null;
    
    // Calculate center point for rotation
    const centerX = image.width / 2;
    const centerY = image.height / 2;
    
    return (
        <KonvaImage 
            image={image}
            rotation={rotation}
            scaleX={flip.horizontal ? -1 : 1}
            scaleY={flip.vertical ? -1 : 1}
            offsetX={centerX}
            offsetY={centerY}
            x={centerX}
            y={centerY}
        />
    );
};

const AnnotationCanvas = ({ imageUrl, annotations, onChange, selectedClassId, classes, selectedId, onSelect, selectedIds, onSelectMultiple }) => {
    const [stageScale, setStageScale] = useState(1);
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
    const [newAnnotation, setNewAnnotation] = useState(null);
    const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
    const [isPanning, setIsPanning] = useState(false);
    const [lastPointerPos, setLastPointerPos] = useState({ x: 0, y: 0 });
    const [imageRotation, setImageRotation] = useState(0);
    const [imageFlip, setImageFlip] = useState({ horizontal: false, vertical: false });
    const [selectionBox, setSelectionBox] = useState(null);
    const [isSelecting, setIsSelecting] = useState(false);

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

    // Keyboard shortcuts for zoom and rotation
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle if not typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            // Zoom controls
            if ((e.ctrlKey || e.metaKey) && e.key === '=') {
                e.preventDefault();
                zoomIn();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '-') {
                e.preventDefault();
                zoomOut();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === '0') {
                e.preventDefault();
                resetZoom();
            }
            
            // Rotation
            if (e.key === 'r' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault();
                rotateImage('cw');
            }
            if (e.key === 'R' && e.shiftKey) {
                e.preventDefault();
                rotateImage('ccw');
            }
            
            // Flip
            if (e.key === 'h' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                flipImage('horizontal');
            }
            if (e.key === 'v' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                flipImage('vertical');
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const checkDeselect = (e) => {
        const clickedOnEmpty = e.target === stageRef.current || e.target === layerRef.current;
        if (clickedOnEmpty) {
            onSelect(null);
            if (onSelectMultiple) onSelectMultiple(new Set());
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

        // Ctrl/Cmd + Click for multi-select
        const isCtrlClick = e.evt.ctrlKey || e.evt.metaKey;
        
        // If clicking on an annotation
        if (e.target !== stageRef.current && e.target !== layerRef.current && e.target.getParent()?.className === 'Rect') {
            const annId = e.target.getParent().id();
            if (isCtrlClick && onSelectMultiple) {
                const newSelected = new Set(selectedIds || new Set());
                if (newSelected.has(annId)) {
                    newSelected.delete(annId);
                } else {
                    newSelected.add(annId);
                }
                onSelectMultiple(newSelected);
                onSelect(null); // Clear single selection
            } else {
                onSelect(annId);
                if (onSelectMultiple) onSelectMultiple(new Set([annId]));
            }
            return;
        }

        // If clicking empty area
        if (isCtrlClick || e.evt.button === 0) {
            // Start selection box
            const pos = stage.getRelativePointerPosition();
            if (pos) {
                setIsSelecting(true);
                setSelectionBox({
                    x: pos.x,
                    y: pos.y,
                    width: 0,
                    height: 0
                });
                if (!isCtrlClick) {
                    onSelect(null);
                    if (onSelectMultiple) onSelectMultiple(new Set());
                }
            }
            return;
        }

        if (selectedId) {
            checkDeselect(e);
            return;
        }

        // Start drawing annotation
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

        // Handle selection box
        if (isSelecting && selectionBox) {
            const pos = stage.getRelativePointerPosition();
            if (pos) {
                const width = pos.x - selectionBox.x;
                const height = pos.y - selectionBox.y;
                setSelectionBox({
                    ...selectionBox,
                    width,
                    height
                });
                
                // Select annotations within box
                if (onSelectMultiple) {
                    const boxX = width < 0 ? selectionBox.x + width : selectionBox.x;
                    const boxY = height < 0 ? selectionBox.y + height : selectionBox.y;
                    const boxW = Math.abs(width);
                    const boxH = Math.abs(height);
                    
                    const selected = new Set(selectedIds || new Set());
                    annotations.forEach(ann => {
                        const annRight = ann.x + ann.width;
                        const annBottom = ann.y + ann.height;
                        const boxRight = boxX + boxW;
                        const boxBottom = boxY + boxH;
                        
                        // Check if annotation overlaps with selection box
                        if (!(annRight < boxX || ann.x > boxRight || annBottom < boxY || ann.y > boxBottom)) {
                            selected.add(ann.id);
                        }
                    });
                    onSelectMultiple(selected);
                }
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

        // Stop selection
        if (isSelecting) {
            setIsSelecting(false);
            setSelectionBox(null);
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
        if (trRef.current && layerRef.current) {
            const nodes = [];
            if (selectedId) {
                const node = layerRef.current.findOne(`#${selectedId}`);
                if (node) nodes.push(node);
            }
            if (selectedIds && selectedIds.size > 0) {
                selectedIds.forEach(id => {
                    const node = layerRef.current.findOne(`#${id}`);
                    if (node) nodes.push(node);
                });
            }
            
            if (nodes.length > 0) {
                trRef.current.nodes(nodes);
                trRef.current.getLayer().batchDraw();
            } else {
                trRef.current.nodes([]);
            }
        }
    }, [selectedId, selectedIds, annotations]);

    // Reset view when image changes
    useEffect(() => {
        setStageScale(1);
        setStagePos({ x: 0, y: 0 });
        setImageRotation(0);
        setImageFlip({ horizontal: false, vertical: false });
    }, [imageUrl]);

    // Zoom functions
    const zoomIn = () => {
        setStageScale(prev => Math.min(5, prev * 1.2));
    };

    const zoomOut = () => {
        setStageScale(prev => Math.max(0.1, prev / 1.2));
    };

    const resetZoom = () => {
        setStageScale(1);
        setStagePos({ x: 0, y: 0 });
    };

    const fitToScreen = () => {
        if (!imageUrl || !containerRef.current) return;
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Get image dimensions (would need to load image first)
        // For now, just reset
        resetZoom();
    };

    const rotateImage = (direction) => {
        setImageRotation(prev => (prev + (direction === 'cw' ? 90 : -90)) % 360);
    };

    const flipImage = (axis) => {
        if (axis === 'horizontal') {
            setImageFlip(prev => ({ ...prev, horizontal: !prev.horizontal }));
        } else {
            setImageFlip(prev => ({ ...prev, vertical: !prev.vertical }));
        }
    };

    if (!imageUrl) {
        return (
            <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#555' }}>
                No image loaded
            </div>
        );
    }

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
            {/* Zoom Controls */}
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '8px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                <button
                    onClick={zoomIn}
                    style={{
                        background: 'rgba(0, 224, 255, 0.2)',
                        border: '1px solid rgba(0, 224, 255, 0.5)',
                        color: '#00e0ff',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Zoom In (Ctrl +)"
                >
                    <ZoomIn size={16} />
                </button>
                <button
                    onClick={zoomOut}
                    style={{
                        background: 'rgba(0, 224, 255, 0.2)',
                        border: '1px solid rgba(0, 224, 255, 0.5)',
                        color: '#00e0ff',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Zoom Out (Ctrl -)"
                >
                    <ZoomOut size={16} />
                </button>
                <button
                    onClick={resetZoom}
                    style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.7rem'
                    }}
                    title="Reset Zoom (Ctrl 0)"
                >
                    100%
                </button>
                <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.2)', margin: '4px 0' }} />
                <button
                    onClick={() => rotateImage('cw')}
                    style={{
                        background: 'rgba(0, 224, 255, 0.2)',
                        border: '1px solid rgba(0, 224, 255, 0.5)',
                        color: '#00e0ff',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Rotate Clockwise (R)"
                >
                    <RotateCw size={16} />
                </button>
                <button
                    onClick={() => rotateImage('ccw')}
                    style={{
                        background: 'rgba(0, 224, 255, 0.2)',
                        border: '1px solid rgba(0, 224, 255, 0.5)',
                        color: '#00e0ff',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Rotate Counter-clockwise (Shift+R)"
                >
                    <RotateCcw size={16} />
                </button>
                <button
                    onClick={() => flipImage('horizontal')}
                    style={{
                        background: 'rgba(0, 224, 255, 0.2)',
                        border: '1px solid rgba(0, 224, 255, 0.5)',
                        color: '#00e0ff',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Flip Horizontal (H)"
                >
                    <FlipHorizontal size={16} />
                </button>
                <button
                    onClick={() => flipImage('vertical')}
                    style={{
                        background: 'rgba(0, 224, 255, 0.2)',
                        border: '1px solid rgba(0, 224, 255, 0.5)',
                        color: '#00e0ff',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Flip Vertical (V)"
                >
                    <FlipVertical size={16} />
                </button>
            </div>

            {/* Zoom indicator */}
            <div style={{
                position: 'absolute',
                bottom: '10px',
                left: '10px',
                zIndex: 10,
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontSize: '0.85rem'
            }}>
                {Math.round(stageScale * 100)}%
            </div>

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
                    <CanvasImage src={imageUrl} rotation={imageRotation} flip={imageFlip} />

                    {annotations.map((ann, i) => {
                        const isSelected = selectedId === ann.id || (selectedIds && selectedIds.has(ann.id));
                        return (
                            <Rect
                                key={ann.id}
                                id={ann.id}
                                x={ann.x}
                                y={ann.y}
                                width={ann.width}
                                height={ann.height}
                                stroke={isSelected ? '#ffff00' : getColor(ann.class_id)}
                                strokeWidth={isSelected ? Math.max(2, 3 / stageScale) : Math.max(1, 2 / stageScale)}
                                fill={isSelected ? 'rgba(255, 255, 0, 0.1)' : 'transparent'}
                                draggable
                                onClick={(e) => { 
                                    e.cancelBubble = true;
                                    const isCtrlClick = e.evt.ctrlKey || e.evt.metaKey;
                                    if (isCtrlClick && onSelectMultiple) {
                                        const newSelected = new Set(selectedIds || new Set());
                                        if (newSelected.has(ann.id)) {
                                            newSelected.delete(ann.id);
                                        } else {
                                            newSelected.add(ann.id);
                                        }
                                        onSelectMultiple(newSelected);
                                        onSelect(null);
                                    } else {
                                        onSelect(ann.id);
                                        if (onSelectMultiple) onSelectMultiple(new Set([ann.id]));
                                    }
                                }}
                                onTap={(e) => {
                                    e.cancelBubble = true;
                                    onSelect(ann.id);
                                    if (onSelectMultiple) onSelectMultiple(new Set([ann.id]));
                                }}
                                onDragEnd={(e) => handleDragEnd(e, ann.id)}
                            />
                        );
                    })}

                    {/* Selection box */}
                    {selectionBox && (
                        <Rect
                            x={selectionBox.width < 0 ? selectionBox.x + selectionBox.width : selectionBox.x}
                            y={selectionBox.height < 0 ? selectionBox.y + selectionBox.height : selectionBox.y}
                            width={Math.abs(selectionBox.width)}
                            height={Math.abs(selectionBox.height)}
                            stroke="#00ffff"
                            strokeWidth={2 / stageScale}
                            fill="rgba(0, 255, 255, 0.1)"
                            dash={[5, 5]}
                        />
                    )}

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

                    {(selectedId || (selectedIds && selectedIds.size > 0)) && (
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
