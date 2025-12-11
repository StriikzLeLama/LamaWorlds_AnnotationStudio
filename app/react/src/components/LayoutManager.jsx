/**
 * @fileoverview LayoutManager Component - Layout Presets and Customization
 * 
 * This component provides layout management with:
 * - Preset layouts (Annotation Focus, Stats Focus, Balanced, Minimal)
 * - Custom layout saving and loading
 * - Toggle for statistics panels
 * - Fullscreen canvas toggle
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.currentLayout - Current layout configuration
 * @param {Function} props.onLayoutChange - Function to change layout
 * @param {boolean} props.showStatsPanels - Show statistics panels
 * @param {Function} props.onToggleStatsPanels - Function to toggle stats panels
 * @param {Function} props.onToggleFullscreen - Function to toggle fullscreen
 * @returns {JSX.Element} The rendered layout manager component
 */

import React, { useState, useEffect } from 'react';
import { Layout, Save, X, Eye, EyeOff, BarChart3, Maximize2 } from 'lucide-react';

/**
 * Layout presets configuration
 * @constant {Object}
 */
const LAYOUT_PRESETS = {
    'annotation-focus': {
        name: 'Annotation Focus',
        description: 'Maximize canvas space for annotation',
        showSidebar: true,
        showRightPanel: true,
        showStatsPanels: false,
        sidebarWidth: 200,
        rightPanelWidth: 280
    },
    'stats-focus': {
        name: 'Stats Focus',
        description: 'Show all statistics and analytics',
        showSidebar: true,
        showRightPanel: true,
        showStatsPanels: true,
        sidebarWidth: 250,
        rightPanelWidth: 320
    },
    'balanced': {
        name: 'Balanced',
        description: 'Equal space for all panels',
        showSidebar: true,
        showRightPanel: true,
        showStatsPanels: true,
        sidebarWidth: 250,
        rightPanelWidth: 320
    },
    'minimal': {
        name: 'Minimal',
        description: 'Minimal UI, maximum canvas',
        showSidebar: false,
        showRightPanel: false,
        showStatsPanels: false,
        sidebarWidth: 0,
        rightPanelWidth: 0
    }
};

function LayoutManager({ 
    currentLayout, 
    onLayoutChange, 
    showStatsPanels, 
    onToggleStatsPanels,
    onToggleFullscreen 
}) {
    const [showMenu, setShowMenu] = useState(false);
    const [customLayouts, setCustomLayouts] = useState([]);
    const menuRef = React.useRef(null);

    useEffect(() => {
        try {
            const saved = localStorage.getItem('custom_layouts');
            if (saved) {
                setCustomLayouts(JSON.parse(saved));
            }
        } catch (err) {
            console.error('Failed to load custom layouts:', err);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const saveCurrentLayout = () => {
        const name = prompt('Enter layout name:');
        if (!name) return;
        
        const layout = {
            id: Date.now().toString(),
            name,
            ...currentLayout,
            isCustom: true
        };
        
        const updated = [...customLayouts, layout];
        setCustomLayouts(updated);
        try {
            localStorage.setItem('custom_layouts', JSON.stringify(updated));
        } catch (err) {
            console.error('Failed to save layout:', err);
        }
    };

    const deleteCustomLayout = (id) => {
        const updated = customLayouts.filter(l => l.id !== id);
        setCustomLayouts(updated);
        try {
            localStorage.setItem('custom_layouts', JSON.stringify(updated));
        } catch (err) {
            console.error('Failed to delete layout:', err);
        }
    };

    const allLayouts = { ...LAYOUT_PRESETS, ...Object.fromEntries(customLayouts.map(l => [l.id, l])) };

    return (
        <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                    padding: '6px 10px',
                    background: 'rgba(0, 224, 255, 0.1)',
                    border: '1px solid rgba(0, 224, 255, 0.3)',
                    borderRadius: '4px',
                    color: '#00e0ff',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
                title="Layout Manager"
            >
                <Layout size={14} />
                Layout
            </button>

            {showMenu && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    background: 'rgba(20, 20, 35, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 224, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '8px',
                    zIndex: 10000,
                    minWidth: '200px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
                }}>
                    <div style={{ fontSize: '0.75rem', color: '#00e0ff', marginBottom: '8px', fontWeight: 'bold' }}>
                        Presets
                    </div>
                    {Object.entries(LAYOUT_PRESETS).map(([key, layout]) => (
                        <button
                            key={key}
                            onClick={() => {
                                onLayoutChange(layout);
                                setShowMenu(false);
                            }}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                marginBottom: '4px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '4px',
                                color: '#aaa',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                textAlign: 'left'
                            }}
                            onMouseEnter={(e) => e.target.style.background = 'rgba(0, 224, 255, 0.1)'}
                            onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                        >
                            <div style={{ fontWeight: 'bold', color: '#00e0ff' }}>{layout.name}</div>
                            <div style={{ fontSize: '0.65rem', color: '#666' }}>{layout.description}</div>
                        </button>
                    ))}
                    
                    {customLayouts.length > 0 && (
                        <>
                            <div style={{ fontSize: '0.75rem', color: '#00e0ff', marginTop: '12px', marginBottom: '8px', fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                                Custom
                            </div>
                            {customLayouts.map((layout) => (
                                <div key={layout.id} style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                                    <button
                                        onClick={() => {
                                            onLayoutChange(layout);
                                            setShowMenu(false);
                                        }}
                                        style={{
                                            flex: 1,
                                            padding: '6px 8px',
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '4px',
                                            color: '#aaa',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem',
                                            textAlign: 'left'
                                        }}
                                        onMouseEnter={(e) => e.target.style.background = 'rgba(0, 224, 255, 0.1)'}
                                        onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                                    >
                                        {layout.name}
                                    </button>
                                    <button
                                        onClick={() => deleteCustomLayout(layout.id)}
                                        style={{
                                            padding: '6px',
                                            background: 'rgba(255, 68, 68, 0.1)',
                                            border: '1px solid rgba(255, 68, 68, 0.3)',
                                            borderRadius: '4px',
                                            color: '#ff4444',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                    
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '8px', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <button
                            onClick={saveCurrentLayout}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                background: 'rgba(0, 224, 255, 0.1)',
                                border: '1px solid rgba(0, 224, 255, 0.3)',
                                borderRadius: '4px',
                                color: '#00e0ff',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                justifyContent: 'center'
                            }}
                        >
                            <Save size={12} />
                            Save Current Layout
                        </button>
                        <button
                            onClick={() => {
                                onToggleStatsPanels();
                                setShowMenu(false);
                            }}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                background: showStatsPanels ? 'rgba(0, 224, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(0, 224, 255, 0.3)',
                                borderRadius: '4px',
                                color: '#00e0ff',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                justifyContent: 'center'
                            }}
                        >
                            {showStatsPanels ? <EyeOff size={12} /> : <Eye size={12} />}
                            {showStatsPanels ? 'Hide Stats' : 'Show Stats'}
                        </button>
                        <button
                            onClick={() => {
                                onToggleFullscreen();
                                setShowMenu(false);
                            }}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                background: 'rgba(0, 224, 255, 0.1)',
                                border: '1px solid rgba(0, 224, 255, 0.3)',
                                borderRadius: '4px',
                                color: '#00e0ff',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                justifyContent: 'center'
                            }}
                        >
                            <Maximize2 size={12} />
                            Fullscreen Canvas
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LayoutManager;

