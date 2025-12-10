import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer, Line, Text } from 'react-konva';
import useImage from 'use-image';
import { v4 as uuidv4 } from 'uuid';
import { ZoomIn, ZoomOut, RotateCw, RotateCcw, Maximize2, Minimize2, FlipHorizontal, FlipVertical, Eye, EyeOff } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import MiniMap from './MiniMap';

const CanvasImage = React.memo(({ src, rotation = 0, flip = { horizontal: false, vertical: false }, onImageLoad }) => {
    const [image] = useImage(src);
    const onImageLoadRef = React.useRef(onImageLoad);
    
    // Update ref when callback changes
    React.useEffect(() => {
        onImageLoadRef.current = onImageLoad;
    }, [onImageLoad]);
    
    React.useEffect(() => {
        if (image && onImageLoadRef.current) {
            onImageLoadRef.current(image);
        }
    }, [image]); // Only depend on image, not onImageLoad
    
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
});

const AnnotationCanvas = ({ imageUrl, annotations, onChange, selectedClassId, classes, selectedId, onSelect, selectedIds, onSelectMultiple, showAnnotations = true, onZoomToSelection, isFullscreen = false, onToggleFullscreen, quickDrawMode = false, showMeasurements = false, imageDimensions: propImageDimensions }) => {
    // Settings
    const { settings, getSetting } = useSettings();
    const snapToGrid = getSetting('snapToGrid', false);
    const gridSize = getSetting('gridSize', 10);
    const pixelMoveStep = getSetting('pixelMoveStep', 1);
    const shiftPixelMoveStep = getSetting('shiftPixelMoveStep', 10);
    const lockAspectRatio = getSetting('lockAspectRatio', false);
    const showGrid = getSetting('showGrid', false);
    const gridOpacity = getSetting('gridOpacity', 0.3);
    const annotationOpacity = getSetting('annotationOpacity', 0.7);
    const showAnnotationLabels = getSetting('showAnnotationLabels', true);
    const showAnnotationIds = getSetting('showAnnotationIds', false);
    const resetTransformOnImageChange = getSetting('resetTransformOnImageChange', true);
    const lockTransformAcrossImages = getSetting('lockTransformAcrossImages', false);
    
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
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

    // Use refs to store locked transforms if lockTransformAcrossImages is enabled
    const lockedRotationRef = useRef(0);
    const lockedFlipRef = useRef({ horizontal: false, vertical: false });

    const stageRef = useRef(null);
    const trRef = useRef(null);
    const layerRef = useRef(null);
    const containerRef = useRef(null);
    const imageRef = useRef(null);

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

    const getColor = useCallback((clsId) => {
        if (!classes || !Array.isArray(classes)) return '#00e0ff';
        const cls = classes.find(c => c && c.id === clsId);
        return cls ? cls.color : '#00e0ff';
    }, [classes]);

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

    // Zoom functions - memoized for performance (must be declared before useEffect that uses them)
    const zoomIn = useCallback(() => {
        setStageScale(prev => Math.min(5, prev * 1.2));
    }, []);

    const zoomOut = useCallback(() => {
        setStageScale(prev => Math.max(0.1, prev / 1.2));
    }, []);

    const resetZoom = useCallback(() => {
        setStageScale(1);
        if (containerRef.current && imageLoaded && imageRef.current) {
            const container = containerRef.current;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            const img = imageRef.current;
            
            if (img.width && img.height) {
                const centerX = containerWidth / 2;
                const centerY = containerHeight / 2;
                const imageCenterX = img.width / 2;
                const imageCenterY = img.height / 2;
                
                setStagePos({
                    x: centerX - imageCenterX,
                    y: centerY - imageCenterY
                });
            } else {
                setStagePos({ x: 0, y: 0 });
            }
        } else {
            setStagePos({ x: 0, y: 0 });
        }
    }, [imageLoaded]);

    const fitToScreen = useCallback(() => {
        resetZoom();
    }, [resetZoom]);

    const rotateImage = useCallback((direction) => {
        setImageRotation(prev => {
            const newRotation = (prev + (direction === 'cw' ? 90 : -90)) % 360;
            // Update locked rotation if lock is enabled
            if (lockTransformAcrossImages) {
                lockedRotationRef.current = newRotation;
            }
            return newRotation;
        });
    }, [lockTransformAcrossImages]);

    const flipImage = useCallback((axis) => {
        if (axis === 'horizontal') {
            setImageFlip(prev => {
                const newFlip = { ...prev, horizontal: !prev.horizontal };
                // Update locked flip if lock is enabled
                if (lockTransformAcrossImages) {
                    lockedFlipRef.current = { ...newFlip };
                }
                return newFlip;
            });
        } else {
            setImageFlip(prev => {
                const newFlip = { ...prev, vertical: !prev.vertical };
                // Update locked flip if lock is enabled
                if (lockTransformAcrossImages) {
                    lockedFlipRef.current = { ...newFlip };
                }
                return newFlip;
            });
        }
    }, [lockTransformAcrossImages]);

    // Keyboard shortcuts for zoom, rotation, and pixel movement
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Only handle if not typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            // Pixel movement with arrow keys (for selected annotations)
            if ((selectedId || (selectedIds && selectedIds.size > 0)) && !e.ctrlKey && !e.metaKey && !e.altKey && Array.isArray(annotations)) {
                const step = e.shiftKey ? shiftPixelMoveStep : pixelMoveStep;
                let moved = false;
                
                if (e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const newAnns = annotations.map(a => {
                        if (!a || !a.id) return a;
                        if (a && a.id && (a.id === selectedId || (selectedIds && selectedIds.has(a.id)))) {
                            let newX = a.x - step;
                            if (snapToGrid && gridSize > 0) {
                                newX = Math.round(newX / gridSize) * gridSize;
                            }
                            return { ...a, x: Math.max(0, newX) };
                        }
                        return a;
                    });
                    onChange(newAnns);
                    moved = true;
                } else if (e.key === 'ArrowRight') {
                    e.preventDefault();
                    const newAnns = annotations.map(a => {
                        if (!a || !a.id) return a;
                        if (a.id === selectedId || (selectedIds && selectedIds.has(a.id))) {
                            let newX = a.x + step;
                            if (snapToGrid && gridSize > 0) {
                                newX = Math.round(newX / gridSize) * gridSize;
                            }
                            return { ...a, x: newX };
                        }
                        return a;
                    });
                    onChange(newAnns);
                    moved = true;
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    const newAnns = annotations.map(a => {
                        if (!a || !a.id) return a;
                        if (a.id === selectedId || (selectedIds && selectedIds.has(a.id))) {
                            let newY = a.y - step;
                            if (snapToGrid && gridSize > 0) {
                                newY = Math.round(newY / gridSize) * gridSize;
                            }
                            return { ...a, y: Math.max(0, newY) };
                        }
                        return a;
                    });
                    onChange(newAnns);
                    moved = true;
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    const newAnns = annotations.map(a => {
                        if (!a || !a.id) return a;
                        if (a.id === selectedId || (selectedIds && selectedIds.has(a.id))) {
                            let newY = a.y + step;
                            if (snapToGrid && gridSize > 0) {
                                newY = Math.round(newY / gridSize) * gridSize;
                            }
                            return { ...a, y: newY };
                        }
                        return a;
                    });
                    onChange(newAnns);
                    moved = true;
                }
                
                if (moved) return;
            }
            
            // Toggle grid (G key)
            if (e.key === 'g' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                // Toggle handled by settings
            }
            
            // Toggle snap to grid (S key)
            if (e.key === 's' && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                // Toggle handled by settings
            }
            
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
    }, [selectedId, selectedIds, annotations, snapToGrid, gridSize, pixelMoveStep, shiftPixelMoveStep, onChange, zoomIn, zoomOut, resetZoom, rotateImage, flipImage]);

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

        // Apply snap to grid if enabled
        let x = pos.x;
        let y = pos.y;
        if (snapToGrid && gridSize > 0) {
            x = Math.round(x / gridSize) * gridSize;
            y = Math.round(y / gridSize) * gridSize;
        }

        setNewAnnotation({
            x, 
            y, 
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
            if (pointerPos && lastPointerPos && 
                typeof pointerPos.x === 'number' && typeof pointerPos.y === 'number' &&
                typeof lastPointerPos.x === 'number' && typeof lastPointerPos.y === 'number') {
                const dx = pointerPos.x - lastPointerPos.x;
                const dy = pointerPos.y - lastPointerPos.y;
                if (!isNaN(dx) && !isNaN(dy)) {
                    setStagePos({
                        x: (stagePos.x || 0) + dx,
                        y: (stagePos.y || 0) + dy
                    });
                    setLastPointerPos(pointerPos);
                }
            }
            return;
        }

        // Handle selection box
        if (isSelecting && selectionBox && typeof selectionBox.x === 'number' && typeof selectionBox.y === 'number') {
            const pos = stage.getRelativePointerPosition();
            if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
                const width = pos.x - selectionBox.x;
                const height = pos.y - selectionBox.y;
                setSelectionBox({
                    ...selectionBox,
                    width,
                    height
                });
                
                // Select annotations within box
                if (onSelectMultiple && Array.isArray(annotations)) {
                    const boxX = width < 0 ? selectionBox.x + width : selectionBox.x;
                    const boxY = height < 0 ? selectionBox.y + height : selectionBox.y;
                    const boxW = Math.abs(width);
                    const boxH = Math.abs(height);
                    
                    const selected = new Set(selectedIds || new Set());
                    annotations.forEach(ann => {
                        if (!ann || typeof ann.x !== 'number' || typeof ann.y !== 'number' ||
                            typeof ann.width !== 'number' || typeof ann.height !== 'number' || !ann.id) {
                            return;
                        }
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
        if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') return;
        
        if (typeof newAnnotation.x === 'number' && typeof newAnnotation.y === 'number') {
            let width = pos.x - newAnnotation.x;
            let height = pos.y - newAnnotation.y;
            
            // Apply snap to grid if enabled
            if (snapToGrid && gridSize > 0) {
                width = Math.round(width / gridSize) * gridSize;
                height = Math.round(height / gridSize) * gridSize;
            }
            
            // Lock aspect ratio if enabled
            if (lockAspectRatio && newAnnotation.width !== 0) {
                const aspectRatio = newAnnotation.width / newAnnotation.height;
                if (Math.abs(width) > Math.abs(height)) {
                    height = Math.sign(height) * Math.abs(width) / aspectRatio;
                } else {
                    width = Math.sign(width) * Math.abs(height) * aspectRatio;
                }
            }
            
            setNewAnnotation({
                ...newAnnotation,
                width,
                height
            });
        }
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

        if (!newAnnotation || typeof newAnnotation.x !== 'number' || typeof newAnnotation.y !== 'number') {
            setNewAnnotation(null);
            return;
        }
        
        // Normalize rect (width/height can be negative)
        const width = typeof newAnnotation.width === 'number' ? Math.abs(newAnnotation.width) : 0;
        const height = typeof newAnnotation.height === 'number' ? Math.abs(newAnnotation.height) : 0;
        const x = (typeof newAnnotation.width === 'number' && newAnnotation.width < 0) 
            ? newAnnotation.x + newAnnotation.width 
            : newAnnotation.x;
        const y = (typeof newAnnotation.height === 'number' && newAnnotation.height < 0) 
            ? newAnnotation.y + newAnnotation.height 
            : newAnnotation.y;

        if (width > 5 && height > 5 && !isNaN(x) && !isNaN(y) && !isNaN(width) && !isNaN(height) &&
            typeof newAnnotation.class_id === 'number' && !isNaN(newAnnotation.class_id)) {
            const finalAnnotation = {
                id: uuidv4(),
                class_id: newAnnotation.class_id,
                x, y, width, height,
                confidence: 1.0
            };
            if (Array.isArray(annotations)) {
                onChange([...annotations, finalAnnotation]);
            } else {
                onChange([finalAnnotation]);
            }
        }
        setNewAnnotation(null);
    };

    const handleDragEnd = (e, id, newX = null, newY = null) => {
        if (!annotations || !Array.isArray(annotations) || !id) return;
        const box = annotations.find(a => a && a.id === id);
        if (box && e.target && typeof e.target.x === 'function' && typeof e.target.y === 'function') {
            let finalX = newX !== null ? newX : e.target.x();
            let finalY = newY !== null ? newY : e.target.y();
            
            // Apply snap to grid if enabled
            if (snapToGrid && gridSize > 0) {
                finalX = Math.round(finalX / gridSize) * gridSize;
                finalY = Math.round(finalY / gridSize) * gridSize;
            }
            
            if (typeof finalX === 'number' && typeof finalY === 'number' && !isNaN(finalX) && !isNaN(finalY)) {
                const newAnns = annotations.map(a => {
                    if (a && a.id === id) {
                        return {
                            ...a,
                            x: finalX,
                            y: finalY
                        };
                    }
                    return a;
                });
                onChange(newAnns);
            }
        }
    };

    const handleTransformEnd = (e) => {
        if (!selectedId || !layerRef.current) return;
        const node = layerRef.current.findOne(`#${selectedId}`);
        if (!node || typeof node.x !== 'function' || typeof node.y !== 'function' ||
            typeof node.width !== 'function' || typeof node.height !== 'function' ||
            typeof node.scaleX !== 'function' || typeof node.scaleY !== 'function') return;

        const scaleX = node.scaleX();
        const scaleY = node.scaleY();

        // Validate scale values
        if (typeof scaleX !== 'number' || typeof scaleY !== 'number' || 
            isNaN(scaleX) || isNaN(scaleY) || scaleX <= 0 || scaleY <= 0) {
            console.warn('Invalid scale values in handleTransformEnd');
            return;
        }

        // update state
        node.scaleX(1);
        node.scaleY(1);

        if (!annotations || !Array.isArray(annotations)) return;
        
        const newX = node.x();
        const newY = node.y();
        const nodeWidth = node.width();
        const nodeHeight = node.height();
        
        if (typeof newX !== 'number' || typeof newY !== 'number' ||
            typeof nodeWidth !== 'number' || typeof nodeHeight !== 'number' ||
            isNaN(newX) || isNaN(newY) || isNaN(nodeWidth) || isNaN(nodeHeight)) {
            console.warn('Invalid position/size values in handleTransformEnd');
            return;
        }
        
        const newAnns = annotations.map(a => {
            if (a && a.id === selectedId) {
                return {
                    ...a,
                    x: newX,
                    y: newY,
                    width: Math.max(5, nodeWidth * scaleX),
                    height: Math.max(5, nodeHeight * scaleY)
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
    
    // Zoom to selection (smart zoom) - ONLY triggered by Z key or explicit event, NOT on click
    useEffect(() => {
        const handleZoomToSelection = () => {
            if ((selectedId || (selectedIds && selectedIds.size > 0)) && showAnnotations && annotations.length > 0) {
                const selectedAnn = annotations.find(a => a.id === selectedId || (selectedIds && selectedIds.has(a.id)));
                if (selectedAnn && stageRef.current && containerRef.current) {
                    const container = containerRef.current;
                    const containerWidth = container.clientWidth;
                    const containerHeight = container.clientHeight;
                    
                    // Calculate bounding box of selected annotation
                    const padding = 50;
                    const minX = selectedAnn.x;
                    const minY = selectedAnn.y;
                    const maxX = selectedAnn.x + selectedAnn.width;
                    const maxY = selectedAnn.y + selectedAnn.height;
                    
                    const annWidth = maxX - minX;
                    const annHeight = maxY - minY;
                    
                    if (annWidth > 0 && annHeight > 0) {
                        // Calculate scale to fit annotation with padding
                        const scaleX = (containerWidth - padding * 2) / annWidth;
                        const scaleY = (containerHeight - padding * 2) / annHeight;
                        const newScale = Math.min(scaleX, scaleY, 3); // Max zoom 3x
                        
                        // Center annotation
                        const centerX = minX + annWidth / 2;
                        const centerY = minY + annHeight / 2;
                        
                        setStageScale(newScale);
                        setStagePos({
                            x: containerWidth / 2 - centerX * newScale,
                            y: containerHeight / 2 - centerY * newScale
                        });
                    }
                }
            }
        };
        
        window.addEventListener('zoomToSelection', handleZoomToSelection);
        return () => window.removeEventListener('zoomToSelection', handleZoomToSelection);
    }, [selectedId, selectedIds, showAnnotations, annotations]);
    
    // Handle toggle annotations event
    useEffect(() => {
        const handleToggleAnnotations = () => {
            // This is handled by parent component
        };
        window.addEventListener('toggleAnnotations', handleToggleAnnotations);
        return () => window.removeEventListener('toggleAnnotations', handleToggleAnnotations);
    }, []);

    // Center image callback - use ref to prevent infinite loops
    const handleImageLoad = useCallback((image) => {
        if (!image || !containerRef.current) return;
        
        // Check if dimensions are already set to avoid unnecessary updates
        const newDimensions = { width: image.width || 0, height: image.height || 0 };
        if (newDimensions.width === 0 || newDimensions.height === 0) return;
        
        imageRef.current = image;
        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Only update if dimensions actually changed
        setImageDimensions(prev => {
            if (prev.width === newDimensions.width && prev.height === newDimensions.height) {
                return prev; // Return same object to prevent re-render
            }
            return newDimensions;
        });
        
        // Center the image in the container
        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;
        const imageCenterX = image.width / 2;
        const imageCenterY = image.height / 2;
        
        setStagePos({
            x: centerX - imageCenterX,
            y: centerY - imageCenterY
        });
        setImageLoaded(true);
    }, []);
    
    // Reset view and center image when image changes
    useEffect(() => {
        setStageScale(1);
        setImageLoaded(false);
        setImageDimensions({ width: 0, height: 0 }); // Reset dimensions
        setStagePos({ x: 0, y: 0 });
        
        // Handle rotation and flip based on settings
        if (lockTransformAcrossImages) {
            // Apply locked transforms
            setImageRotation(lockedRotationRef.current);
            setImageFlip({ ...lockedFlipRef.current });
        } else if (resetTransformOnImageChange) {
            // Reset transforms
            setImageRotation(0);
            setImageFlip({ horizontal: false, vertical: false });
            // Also reset locked refs
            lockedRotationRef.current = 0;
            lockedFlipRef.current = { horizontal: false, vertical: false };
        }
        // If neither option is enabled, keep current transforms (default behavior)
    }, [imageUrl, resetTransformOnImageChange, lockTransformAcrossImages]);

    // Handle minimap navigation
    const handleMinimapNavigate = useCallback((newPos) => {
        setStagePos(newPos);
    }, []);

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
                    onClick={() => {
                        if (onToggleFullscreen) onToggleFullscreen();
                    }}
                    style={{
                        background: isFullscreen ? 'rgba(0, 224, 255, 0.3)' : 'rgba(0, 224, 255, 0.2)',
                        border: '1px solid rgba(0, 224, 255, 0.5)',
                        color: '#00e0ff',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Toggle Fullscreen (F11)"
                >
                    {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
                <button
                    onClick={() => {
                        // Toggle annotations visibility - this will be handled by parent
                        const event = new CustomEvent('toggleAnnotations');
                        window.dispatchEvent(event);
                    }}
                    style={{
                        background: showAnnotations ? 'rgba(0, 224, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(0, 224, 255, 0.5)',
                        color: showAnnotations ? '#00e0ff' : '#666',
                        padding: '6px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Toggle Annotations (T)"
                >
                    {showAnnotations ? <Eye size={16} /> : <EyeOff size={16} />}
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
                    <CanvasImage src={imageUrl} rotation={imageRotation} flip={imageFlip} onImageLoad={handleImageLoad} />

                    {/* Grid overlay */}
                    {showGrid && imageDimensions.width > 0 && imageDimensions.height > 0 && gridSize > 0 && (
                        <>
                            {/* Vertical lines */}
                            {Array.from({ length: Math.ceil(imageDimensions.width / gridSize) + 1 }).map((_, i) => {
                                const x = i * gridSize;
                                return (
                                    <Line
                                        key={`v-${i}`}
                                        points={[x, 0, x, imageDimensions.height]}
                                        stroke="rgba(0, 224, 255, 0.3)"
                                        strokeWidth={1}
                                        opacity={gridOpacity}
                                        listening={false}
                                    />
                                );
                            })}
                            {/* Horizontal lines */}
                            {Array.from({ length: Math.ceil(imageDimensions.height / gridSize) + 1 }).map((_, i) => {
                                const y = i * gridSize;
                                return (
                                    <Line
                                        key={`h-${i}`}
                                        points={[0, y, imageDimensions.width, y]}
                                        stroke="rgba(0, 224, 255, 0.3)"
                                        strokeWidth={1}
                                        opacity={gridOpacity}
                                        listening={false}
                                    />
                                );
                            })}
                        </>
                    )}

                    {showAnnotations && Array.isArray(annotations) && annotations.map((ann) => {
                        if (!ann || !ann.id) return null;
                        const isSelected = selectedId === ann.id || (selectedIds && selectedIds.has(ann.id));
                        const className = Array.isArray(classes) ? classes.find(c => c && c.id === ann.class_id) : null;
                        const classColor = className ? className.color : '#00e0ff';
                        const classNameStr = className ? className.name : `Class ${ann.class_id}`;
                        const rgb = classColor.match(/\w\w/g)?.map(x => parseInt(x, 16)) || [0, 224, 255];
                        return (
                            <React.Fragment key={ann.id}>
                            <Rect
                                id={ann.id}
                                x={ann.x}
                                y={ann.y}
                                width={ann.width}
                                height={ann.height}
                                stroke={isSelected ? '#ffff00' : classColor}
                                strokeWidth={isSelected ? Math.max(2, 3 / stageScale) : Math.max(1, 2 / stageScale)}
                                fill={isSelected ? 'rgba(255, 255, 0, 0.1)' : `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${annotationOpacity * 0.2})`}
                                opacity={annotationOpacity}
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
                                onDragEnd={(e) => {
                                    let newX = e.target.x();
                                    let newY = e.target.y();
                                    
                                    // Apply snap to grid if enabled
                                    if (snapToGrid && gridSize > 0) {
                                        newX = Math.round(newX / gridSize) * gridSize;
                                        newY = Math.round(newY / gridSize) * gridSize;
                                    }
                                    
                                    handleDragEnd(e, ann.id, newX, newY);
                                }}
                            />
                            {/* Annotation labels */}
                            {(showAnnotationLabels || showAnnotationIds) && (
                                <>
                                    {showAnnotationLabels && (
                                        <>
                                            {/* Label background - expand if confidence is shown */}
                                            {ann.confidence !== undefined && ann.confidence < 1.0 ? (
                                                <>
                                                    <Rect
                                                        x={ann.x}
                                                        y={Math.max(0, ann.y - 20)}
                                                        width={Math.max(100, classNameStr.length * 7 + 50)}
                                                        height={18}
                                                        fill="rgba(0, 0, 0, 0.7)"
                                                        stroke={classColor}
                                                        strokeWidth={1}
                                                        opacity={annotationOpacity}
                                                        listening={false}
                                                    />
                                                    <Text
                                                        x={ann.x + 4}
                                                        y={Math.max(0, ann.y - 18)}
                                                        text={classNameStr}
                                                        fontSize={12}
                                                        fill={classColor}
                                                        opacity={annotationOpacity}
                                                        listening={false}
                                                    />
                                                    {/* Confidence percentage */}
                                                    <Text
                                                        x={ann.x + classNameStr.length * 7 + 8}
                                                        y={Math.max(0, ann.y - 18)}
                                                        text={`${Math.round((ann.confidence || 1.0) * 100)}%`}
                                                        fontSize={11}
                                                        fill={ann.confidence >= 0.7 ? '#00ff00' : ann.confidence >= 0.5 ? '#ffaa00' : '#ff4444'}
                                                        opacity={annotationOpacity}
                                                        listening={false}
                                                        fontStyle="bold"
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    <Rect
                                                        x={ann.x}
                                                        y={Math.max(0, ann.y - 20)}
                                                        width={Math.max(60, classNameStr.length * 7)}
                                                        height={18}
                                                        fill="rgba(0, 0, 0, 0.7)"
                                                        stroke={classColor}
                                                        strokeWidth={1}
                                                        opacity={annotationOpacity}
                                                        listening={false}
                                                    />
                                                    <Text
                                                        x={ann.x + 4}
                                                        y={Math.max(0, ann.y - 18)}
                                                        text={classNameStr}
                                                        fontSize={12}
                                                        fill={classColor}
                                                        opacity={annotationOpacity}
                                                        listening={false}
                                                    />
                                                </>
                                            )}
                                        </>
                                    )}
                                    {showAnnotationIds && (
                                        <Text
                                            x={ann.x + ann.width - 30}
                                            y={ann.y + 2}
                                            text={`#${String(ann.id || '').slice(0, 4)}`}
                                            fontSize={10}
                                            fill="#ffffff"
                                            opacity={annotationOpacity * 0.8}
                                            listening={false}
                                        />
                                    )}
                                </>
                            )}
                            {/* Measurements overlay */}
                            {showMeasurements && (ann.id === selectedId || (selectedIds && selectedIds.has(ann.id))) && (
                                <>
                                    {/* Width line */}
                                    <Line
                                        points={[ann.x, ann.y - 25, ann.x + ann.width, ann.y - 25]}
                                        stroke="#00e0ff"
                                        strokeWidth={1}
                                        dash={[5, 5]}
                                        listening={false}
                                    />
                                    <Text
                                        x={ann.x + ann.width / 2}
                                        y={ann.y - 40}
                                        text={`W: ${Math.abs(ann.width).toFixed(1)}px`}
                                        fontSize={11}
                                        fill="#00e0ff"
                                        align="center"
                                        listening={false}
                                        offsetX={30}
                                    />
                                    {/* Height line */}
                                    <Line
                                        points={[ann.x - 25, ann.y, ann.x - 25, ann.y + ann.height]}
                                        stroke="#00e0ff"
                                        strokeWidth={1}
                                        dash={[5, 5]}
                                        listening={false}
                                    />
                                    <Text
                                        x={ann.x - 40}
                                        y={ann.y + ann.height / 2}
                                        text={`H: ${Math.abs(ann.height).toFixed(1)}px`}
                                        fontSize={11}
                                        fill="#00e0ff"
                                        align="center"
                                        listening={false}
                                        offsetY={15}
                                    />
                                    {/* Area text */}
                                    <Text
                                        x={ann.x + ann.width / 2}
                                        y={ann.y + ann.height + 15}
                                        text={`Area: ${(Math.abs(ann.width) * Math.abs(ann.height)).toFixed(1)}px²`}
                                        fontSize={10}
                                        fill="#56b0ff"
                                        align="center"
                                        listening={false}
                                        offsetX={35}
                                    />
                                </>
                            )}
                            </React.Fragment>
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
            
            {/* Mini Map */}
            {getSetting('showMiniMap', true) && imageDimensions.width > 0 && imageDimensions.height > 0 && (
                <MiniMap
                    imageUrl={imageUrl}
                    annotations={annotations}
                    classes={classes}
                    stageScale={stageScale}
                    stagePos={stagePos}
                    stageSize={stageSize}
                    imageDimensions={imageDimensions}
                    onNavigate={handleMinimapNavigate}
                />
            )}
        </div>
    );
};

export default AnnotationCanvas;
