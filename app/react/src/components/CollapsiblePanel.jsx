import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function CollapsiblePanel({ title, icon: Icon, children, defaultCollapsed = false, headerStyle = {}, containerStyle = {} }) {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (
        <div className="glass-panel" style={{ 
            width: '100%', 
            padding: isCollapsed ? '8px 15px' : '15px', 
            display: 'flex', 
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            ...containerStyle
        }}>
            <div 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    marginBottom: isCollapsed ? 0 : '10px',
                    ...headerStyle
                }}
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {Icon && <Icon size={18} style={{ color: '#00e0ff' }} />}
                    <h3 className="neon-text" style={{ margin: 0, fontSize: '1rem' }}>{title}</h3>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCollapsed(!isCollapsed);
                    }}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#00e0ff',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = 'rgba(0, 224, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                    }}
                    title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
                >
                    {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
            </div>
            {!isCollapsed && (
                <div style={{ 
                    overflow: isCollapsed ? 'hidden' : 'visible',
                    maxHeight: isCollapsed ? 0 : 'none',
                    transition: 'max-height 0.3s ease'
                }}>
                    {children}
                </div>
            )}
        </div>
    );
}

export default CollapsiblePanel;

