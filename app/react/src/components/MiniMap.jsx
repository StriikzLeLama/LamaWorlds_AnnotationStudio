/**
 * @fileoverview MiniMap Component - Dataset Overview Map
 * 
 * This component provides a visual overview of the entire dataset with:
 * - Grid view of all images
 * - Current image indicator
 * - Annotated/empty image indicators
 * - Quick navigation by clicking
 * - Zoom control
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Array<string>} props.images - Array of image file paths
 * @param {number} props.currentIndex - Currently selected image index
 * @param {Function} props.onImageSelect - Function to select image by index
 * @param {Set<string>} props.annotatedImages - Set of annotated image paths
 * @param {React.RefObject} props.viewportRef - Viewport reference (optional)
 * @returns {JSX.Element} The rendered mini map component
 */

import React, { useState, useRef, useEffect } from 'react';
import { Map, X, ZoomIn } from 'lucide-react';

function MiniMap({ images, currentIndex, onImageSelect, annotatedImages, viewportRef }) {
    const [isOpen, setIsOpen] = useState(false);
    const [zoom, setZoom] = useState(1);
    const containerRef = useRef(null);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    padding: '10px',
                    background: 'rgba(0, 224, 255, 0.2)',
                    border: '1px solid rgba(0, 224, 255, 0.5)',
                    borderRadius: '8px',
                    color: '#00e0ff',
                    cursor: 'pointer',
                    zIndex: 1000,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
                }}
                title="Show Mini Map"
            >
                <Map size={20} />
            </button>
        );
    }

    const totalImages = images.length;
    const imagesPerRow = Math.ceil(Math.sqrt(totalImages));
    const cellSize = Math.max(4, Math.min(20, 300 / imagesPerRow));

    return (
        <div
            ref={containerRef}
            style={{
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                width: '300px',
                maxHeight: '400px',
                background: 'rgba(20, 20, 35, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 224, 255, 0.3)',
                borderRadius: '12px',
                padding: '12px',
                zIndex: 10000,
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Map size={16} style={{ color: '#00e0ff' }} />
                    <span className="neon-text" style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                        Dataset Map ({totalImages} images)
                    </span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#aaa',
                        cursor: 'pointer',
                        padding: '4px'
                    }}
                >
                    <X size={16} />
                </button>
            </div>

            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: '#aaa' }}>Zoom:</span>
                <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    style={{ flex: 1 }}
                />
                <span style={{ fontSize: '0.75rem', color: '#00e0ff', minWidth: '30px' }}>
                    {Math.round(zoom * 100)}%
                </span>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${imagesPerRow}, ${cellSize * zoom}px)`,
                    gap: '2px',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    padding: '4px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '6px'
                }}
            >
                {images.map((img, idx) => {
                    const isCurrent = idx === currentIndex;
                    const hasAnnotations = annotatedImages ? annotatedImages.has(img) : false;
                    const name = img.split(/[/\\]/).pop() || `Image ${idx + 1}`;

                    return (
                        <div
                            key={idx}
                            onClick={() => {
                                if (onImageSelect) {
                                    onImageSelect(idx);
                                }
                            }}
                            style={{
                                width: `${cellSize * zoom}px`,
                                height: `${cellSize * zoom}px`,
                                background: isCurrent
                                    ? 'rgba(0, 224, 255, 0.8)'
                                    : hasAnnotations
                                    ? 'rgba(0, 255, 0, 0.3)'
                                    : 'rgba(255, 255, 255, 0.1)',
                                border: isCurrent
                                    ? '2px solid #00e0ff'
                                    : hasAnnotations
                                    ? '1px solid rgba(0, 255, 0, 0.5)'
                                    : '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: `${Math.max(8, cellSize * zoom * 0.3)}px`,
                                color: isCurrent ? '#000' : '#aaa',
                                fontWeight: isCurrent ? 'bold' : 'normal',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (!isCurrent) {
                                    e.currentTarget.style.background = 'rgba(0, 224, 255, 0.4)';
                                    e.currentTarget.style.borderColor = '#00e0ff';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isCurrent) {
                                    e.currentTarget.style.background = hasAnnotations
                                        ? 'rgba(0, 255, 0, 0.3)'
                                        : 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.borderColor = hasAnnotations
                                        ? 'rgba(0, 255, 0, 0.5)'
                                        : 'rgba(255, 255, 255, 0.2)';
                                }
                            }}
                            title={name}
                        >
                            {isCurrent ? '●' : hasAnnotations ? '✓' : idx + 1}
                        </div>
                    );
                })}
            </div>

            <div style={{ marginTop: '10px', fontSize: '0.7rem', color: '#666', display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', background: 'rgba(0, 224, 255, 0.8)', borderRadius: '2px' }}></div>
                    <span>Current</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', background: 'rgba(0, 255, 0, 0.3)', borderRadius: '2px' }}></div>
                    <span>Annotated</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px' }}></div>
                    <span>Empty</span>
                </div>
            </div>
        </div>
    );
}

export default MiniMap;
