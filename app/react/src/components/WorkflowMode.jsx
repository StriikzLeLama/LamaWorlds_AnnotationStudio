/**
 * @fileoverview WorkflowMode Component - Workflow Mode Selector
 * 
 * This component provides workflow mode selection:
 * - Normal: Standard annotation mode
 * - Speed: Fast annotation with Quick Draw enabled
 * - Review: Review mode with measurements enabled
 * - Precision: Precision mode with measurements enabled
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.currentMode - Current workflow mode
 * @param {Function} props.onModeChange - Function to change mode
 * @param {Function} props.onToggleQuickDraw - Function to toggle quick draw
 * @param {Function} props.onToggleMeasurements - Function to toggle measurements
 * @returns {JSX.Element} The rendered workflow mode component
 */

import React, { useState } from 'react';
import { Zap, CheckCircle, Gauge, Settings } from 'lucide-react';

/**
 * Workflow modes configuration
 * @constant {Object}
 */
const WORKFLOW_MODES = {
    'normal': {
        name: 'Normal',
        icon: Settings,
        description: 'Standard annotation mode',
        quickDraw: false,
        autoSave: true,
        showMeasurements: false
    },
    'speed': {
        name: 'Speed',
        icon: Zap,
        description: 'Fast annotation mode',
        quickDraw: true,
        autoSave: true,
        showMeasurements: false
    },
    'review': {
        name: 'Review',
        icon: CheckCircle,
        description: 'Review and validate annotations',
        quickDraw: false,
        autoSave: false,
        showMeasurements: true
    },
    'precision': {
        name: 'Precision',
        icon: Gauge,
        description: 'Precise annotation with measurements',
        quickDraw: false,
        autoSave: true,
        showMeasurements: true
    }
};

function WorkflowMode({ currentMode, onModeChange, onToggleQuickDraw, onToggleMeasurements }) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = React.useRef(null);

    React.useEffect(() => {
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

    const handleModeSelect = (modeKey) => {
        const mode = WORKFLOW_MODES[modeKey];
        if (mode.quickDraw !== undefined && onToggleQuickDraw) {
            // Only toggle if different
            const currentQuickDraw = currentMode === 'speed';
            if (mode.quickDraw !== currentQuickDraw) {
                onToggleQuickDraw();
            }
        }
        if (mode.showMeasurements !== undefined && onToggleMeasurements) {
            const currentMeasurements = currentMode === 'review' || currentMode === 'precision';
            if (mode.showMeasurements !== currentMeasurements) {
                onToggleMeasurements();
            }
        }
        onModeChange(modeKey);
        setShowMenu(false);
    };

    const currentModeData = WORKFLOW_MODES[currentMode] || WORKFLOW_MODES['normal'];
    const Icon = currentModeData.icon;

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
                title="Workflow Mode"
            >
                <Icon size={14} />
                {currentModeData.name}
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
                    {Object.entries(WORKFLOW_MODES).map(([key, mode]) => {
                        const ModeIcon = mode.icon;
                        const isActive = currentMode === key;
                        return (
                            <button
                                key={key}
                                onClick={() => handleModeSelect(key)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    marginBottom: '4px',
                                    background: isActive
                                        ? 'rgba(0, 224, 255, 0.2)'
                                        : 'rgba(255, 255, 255, 0.05)',
                                    border: isActive
                                        ? '1px solid rgba(0, 224, 255, 0.5)'
                                        : '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '4px',
                                    color: isActive ? '#00e0ff' : '#aaa',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.target.style.background = 'rgba(0, 224, 255, 0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                    }
                                }}
                            >
                                <ModeIcon size={16} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 'bold' }}>{mode.name}</div>
                                    <div style={{ fontSize: '0.65rem', color: '#666' }}>{mode.description}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default WorkflowMode;

