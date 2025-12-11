/**
 * @fileoverview BatchImageActions Component - Batch Operations Toolbar
 * 
 * This component provides a floating toolbar for batch operations on selected images:
 * - Export selected images
 * - Tag selected images
 * - Delete selected images
 * - Clear selection
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Set<string>} props.selectedImages - Set of selected image paths
 * @param {Function} props.onClearSelection - Function to clear selection
 * @param {Function} props.onBatchDelete - Function to delete selected images
 * @param {Function} props.onBatchTag - Function to tag selected images
 * @param {Function} props.onBatchExport - Function to export selected images
 * @returns {JSX.Element|null} The rendered batch actions toolbar or null if no selection
 */

import React, { useState } from 'react';
import { Download, Trash2, Tag, X, CheckCircle } from 'lucide-react';

function BatchImageActions({ 
    selectedImages, 
    onClearSelection, 
    onBatchDelete, 
    onBatchTag,
    onBatchExport 
}) {
    if (selectedImages.size === 0) return null;

    const [showMenu, setShowMenu] = useState(false);

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0, 224, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 224, 255, 0.5)',
            borderRadius: '12px',
            padding: '12px 16px',
            zIndex: 10000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} style={{ color: '#00e0ff' }} />
                <span style={{ color: '#00e0ff', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {selectedImages.size} image{selectedImages.size > 1 ? 's' : ''} selected
                </span>
            </div>
            
            <div style={{ display: 'flex', gap: '6px' }}>
                {onBatchExport && (
                    <button
                        onClick={() => {
                            if (onBatchExport) {
                                onBatchExport(Array.from(selectedImages));
                            }
                        }}
                        style={{
                            padding: '6px 12px',
                            background: 'rgba(0, 224, 255, 0.2)',
                            border: '1px solid rgba(0, 224, 255, 0.5)',
                            borderRadius: '6px',
                            color: '#00e0ff',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        title="Export selected images"
                    >
                        <Download size={14} />
                        Export
                    </button>
                )}
                
                {onBatchTag && (
                    <button
                        onClick={() => {
                            const tags = prompt('Enter tags (comma-separated):');
                            if (tags && onBatchTag) {
                                onBatchTag(Array.from(selectedImages), tags.split(',').map(t => t.trim()));
                            }
                        }}
                        style={{
                            padding: '6px 12px',
                            background: 'rgba(0, 224, 255, 0.2)',
                            border: '1px solid rgba(0, 224, 255, 0.5)',
                            borderRadius: '6px',
                            color: '#00e0ff',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        title="Tag selected images"
                    >
                        <Tag size={14} />
                        Tag
                    </button>
                )}
                
                {onBatchDelete && (
                    <button
                        onClick={() => {
                            if (window.confirm(`Delete ${selectedImages.size} selected image(s)?`)) {
                                if (onBatchDelete) {
                                    onBatchDelete(Array.from(selectedImages));
                                }
                                if (onClearSelection) {
                                    onClearSelection();
                                }
                            }
                        }}
                        style={{
                            padding: '6px 12px',
                            background: 'rgba(255, 68, 68, 0.2)',
                            border: '1px solid rgba(255, 68, 68, 0.5)',
                            borderRadius: '6px',
                            color: '#ff4444',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                        title="Delete selected images"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                )}
                
                <button
                    onClick={() => {
                        if (onClearSelection) {
                            onClearSelection();
                        }
                    }}
                    style={{
                        padding: '6px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: '#aaa',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                    title="Clear selection"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

export default BatchImageActions;

