import React, { useState } from 'react';
import { Keyboard, X } from 'lucide-react';

function KeyboardShortcuts({ onClose }) {
    const shortcuts = [
        { category: 'Navigation', items: [
            { key: '← / →', desc: 'Navigate between images' },
            { key: 'Home / End', desc: 'Go to first/last image' },
            { key: 'N', desc: 'Next unannotated image' },
            { key: 'Shift+N', desc: 'Previous unannotated image' },
            { key: 'Alt+← / Alt+→', desc: 'Navigation history (back/forward)' },
        ]},
        { category: 'Annotation', items: [
            { key: 'Click & Drag', desc: 'Draw new annotation' },
            { key: 'Click', desc: 'Select annotation' },
            { key: 'Ctrl+Click', desc: 'Multi-select annotations' },
            { key: 'Drag', desc: 'Move annotation' },
            { key: 'Resize handles', desc: 'Resize annotation' },
            { key: 'Delete / Backspace', desc: 'Delete selected annotation(s)' },
            { key: 'Ctrl+A', desc: 'Select all annotations' },
            { key: '1-9', desc: 'Change class of selected annotation(s)' },
            { key: 'Ctrl+D', desc: 'Duplicate selected annotation' },
            { key: 'T', desc: 'Toggle annotations visibility' },
            { key: 'Z', desc: 'Zoom to selected annotation' },
        ]},
        { category: 'Edit', items: [
            { key: 'Ctrl+Z', desc: 'Undo' },
            { key: 'Ctrl+Y', desc: 'Redo' },
            { key: 'Ctrl+C', desc: 'Copy annotation' },
            { key: 'Ctrl+V', desc: 'Paste annotation' },
        ]},
        { category: 'Canvas', items: [
            { key: 'Mouse Wheel', desc: 'Zoom in/out' },
            { key: 'Ctrl + / -', desc: 'Zoom in/out' },
            { key: 'Ctrl+0', desc: 'Reset zoom' },
            { key: 'Middle Click / Shift+Drag', desc: 'Pan canvas' },
            { key: 'R', desc: 'Rotate image clockwise' },
            { key: 'Shift+R', desc: 'Rotate image counter-clockwise' },
            { key: 'H', desc: 'Flip image horizontally' },
            { key: 'V', desc: 'Flip image vertically' },
            { key: 'F11', desc: 'Toggle fullscreen mode' },
        ]},
    ];

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
        }} onClick={onClose}>
            <div className="glass-panel" style={{
                maxWidth: '800px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '30px',
                position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Keyboard size={24} style={{ color: '#00e0ff' }} />
                        <h2 className="neon-text" style={{ margin: 0 }}>Keyboard Shortcuts</h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#aaa',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            padding: '0',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    {shortcuts.map((category, idx) => (
                        <div key={idx} style={{
                            background: 'rgba(0, 224, 255, 0.05)',
                            padding: '15px',
                            borderRadius: '8px',
                            border: '1px solid rgba(0, 224, 255, 0.2)'
                        }}>
                            <h3 style={{ 
                                margin: '0 0 12px 0', 
                                color: '#00e0ff', 
                                fontSize: '1rem',
                                borderBottom: '1px solid rgba(0, 224, 255, 0.2)',
                                paddingBottom: '8px'
                            }}>
                                {category.category}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {category.items.map((item, itemIdx) => (
                                    <div key={itemIdx} style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '6px 0',
                                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                    }}>
                                        <span style={{ fontSize: '0.85rem', color: '#aaa' }}>{item.desc}</span>
                                        <kbd style={{
                                            background: 'rgba(0, 224, 255, 0.1)',
                                            border: '1px solid rgba(0, 224, 255, 0.3)',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            fontSize: '0.75rem',
                                            color: '#00e0ff',
                                            fontFamily: 'monospace',
                                            minWidth: '80px',
                                            textAlign: 'center'
                                        }}>
                                            {item.key}
                                        </kbd>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div style={{ 
                    marginTop: '20px', 
                    padding: '15px', 
                    background: 'rgba(0, 224, 255, 0.05)', 
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: '#aaa',
                    textAlign: 'center'
                }}>
                    Press <kbd style={{ 
                        background: 'rgba(0, 224, 255, 0.1)', 
                        border: '1px solid rgba(0, 224, 255, 0.3)', 
                        borderRadius: '4px', 
                        padding: '2px 6px',
                        fontSize: '0.75rem',
                        color: '#00e0ff'
                    }}>?</kbd> or <kbd style={{ 
                        background: 'rgba(0, 224, 255, 0.1)', 
                        border: '1px solid rgba(0, 224, 255, 0.3)', 
                        borderRadius: '4px', 
                        padding: '2px 6px',
                        fontSize: '0.75rem',
                        color: '#00e0ff'
                    }}>F1</kbd> to toggle this help
                </div>
            </div>
        </div>
    );
}

export default KeyboardShortcuts;

