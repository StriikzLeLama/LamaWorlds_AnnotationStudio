/**
 * @fileoverview ImagePreviewTooltip Component - Image Preview on Hover
 * 
 * This component displays a preview tooltip when hovering over images:
 * - Image thumbnail
 * - Image name
 * - Annotation count
 * - Class distribution
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.imagePath - Path to the image
 * @param {Array<Object>} props.annotations - Array of annotations for the image
 * @param {Array<Object>} props.classes - Annotation classes
 * @param {Object} props.position - Tooltip position {x: number, y: number}
 * @returns {JSX.Element|null} The rendered tooltip or null if no image
 */

import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

function ImagePreviewTooltip({ imagePath, annotations = [], classes = [], position = { x: 0, y: 0 } }) {
    if (!imagePath) return null;

    const getName = (path) => {
        const parts = path.split(/[/\\]/);
        return parts[parts.length - 1];
    };

    return (
        <div style={{
            position: 'fixed',
            left: `${position.x + 20}px`,
            top: `${position.y - 20}px`,
            width: '300px',
            maxHeight: '400px',
            background: 'rgba(20, 20, 35, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 224, 255, 0.3)',
            borderRadius: '12px',
            padding: '12px',
            zIndex: 100000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            pointerEvents: 'none'
        }}>
            <div style={{ marginBottom: '8px', fontSize: '0.85rem', color: '#00e0ff', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getName(imagePath)}
            </div>
            <img
                src={imagePath}
                alt={getName(imagePath)}
                style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '250px',
                    objectFit: 'contain',
                    borderRadius: '6px',
                    marginBottom: '8px'
                }}
            />
            {annotations.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                    <div style={{ marginBottom: '4px', color: '#00e0ff' }}>Annotations: {annotations.length}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {annotations.slice(0, 5).map((ann, idx) => {
                            const cls = Array.isArray(classes) ? classes.find(c => c && c.id === ann.class_id) : null;
                            return (
                                <div
                                    key={idx}
                                    style={{
                                        padding: '2px 6px',
                                        background: cls ? `${cls.color}33` : 'rgba(255, 255, 255, 0.1)',
                                        border: `1px solid ${cls ? cls.color : '#00e0ff'}`,
                                        borderRadius: '4px',
                                        fontSize: '0.7rem'
                                    }}
                                >
                                    {cls ? cls.name : `Class ${ann.class_id}`}
                                </div>
                            );
                        })}
                        {annotations.length > 5 && (
                            <div style={{ padding: '2px 6px', fontSize: '0.7rem', color: '#666' }}>
                                +{annotations.length - 5} more
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default ImagePreviewTooltip;

