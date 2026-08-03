/**
 * Reusable collapsible panel (stats, validation, analytics…).
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

function CollapsiblePanel({
    title,
    icon: Icon,
    children,
    defaultCollapsed = false,
    headerStyle = {},
    containerStyle = {},
}) {
    const { t } = useI18n();
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    return (
        <div
            className="glass-panel"
            style={{
                width: '100%',
                padding: isCollapsed ? '8px 12px' : '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                transition: 'padding 160ms ease',
                ...containerStyle,
            }}
        >
            <div
                className="panel-header"
                style={{
                    marginBottom: isCollapsed ? 0 : 10,
                    cursor: 'pointer',
                    ...headerStyle,
                }}
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {Icon && <Icon size={16} style={{ color: 'var(--accent)' }} />}
                    <h3 className="panel-title" style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                        {title}
                    </h3>
                </div>
                <button
                    type="button"
                    className="btn-icon"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCollapsed(!isCollapsed);
                    }}
                    title={isCollapsed ? t('panel.expand') : t('panel.collapse')}
                >
                    {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </button>
            </div>

            {!isCollapsed && <div style={{ flex: 1, minHeight: 0 }}>{children}</div>}
        </div>
    );
}

export default CollapsiblePanel;
