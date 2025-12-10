import React, { useState, useCallback } from 'react';
import { Settings, X, RotateCcw, Save, Keyboard, Palette, Zap, Eye, Download, BarChart3 } from 'lucide-react';

function SettingsPanel({ settings, updateSetting, updateSettings, resetSettings, onClose }) {
    const [activeTab, setActiveTab] = useState('annotation');
    const [tempSettings, setTempSettings] = useState(() => {
        // Deep clone settings to avoid mutating the original
        return JSON.parse(JSON.stringify(settings));
    });
    
    const handleChange = useCallback((key, value) => {
        setTempSettings(prev => {
            const newSettings = { ...prev };
            const keys = key.split('.');
            let current = newSettings;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newSettings;
        });
    }, []);
    
    const handleSave = useCallback(() => {
        updateSettings(tempSettings);
        if (onClose) onClose();
    }, [tempSettings, updateSettings, onClose]);
    
    const handleReset = useCallback(() => {
        if (window.confirm('Reset all settings to defaults?')) {
            resetSettings();
            const defaultSettings = loadSettings();
            setTempSettings(JSON.parse(JSON.stringify(defaultSettings)));
        }
    }, [resetSettings]);
    
    const getValue = (key) => {
        const keys = key.split('.');
        let current = tempSettings;
        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                return null;
            }
        }
        return current;
    };
    
    const tabs = [
        { id: 'annotation', label: 'Annotation', icon: Zap },
        { id: 'productivity', label: 'Productivity', icon: BarChart3 },
        { id: 'validation', label: 'Validation', icon: Eye },
        { id: 'display', label: 'Display', icon: Eye },
        { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
        { id: 'export', label: 'Export', icon: Download },
        { id: 'theme', label: 'Theme', icon: Palette },
        { id: 'advanced', label: 'Advanced', icon: Settings },
    ];
    
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
        }} onClick={onClose}>
            <div className="glass-panel" style={{
                width: '90%',
                maxWidth: '900px',
                maxHeight: '90vh',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative'
            }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
                    <h2 className="neon-text" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Settings size={24} />
                        Settings
                    </h2>
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
                
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '8px 16px',
                                    background: activeTab === tab.id ? 'rgba(0, 224, 255, 0.2)' : 'transparent',
                                    border: `1px solid ${activeTab === tab.id ? 'rgba(0, 224, 255, 0.5)' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '6px',
                                    color: activeTab === tab.id ? '#00e0ff' : '#aaa',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.85rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
                
                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                    {activeTab === 'annotation' && (
                        <AnnotationSettings tempSettings={tempSettings} handleChange={handleChange} getValue={getValue} />
                    )}
                    {activeTab === 'productivity' && (
                        <ProductivitySettings tempSettings={tempSettings} handleChange={handleChange} getValue={getValue} />
                    )}
                    {activeTab === 'validation' && (
                        <ValidationSettings tempSettings={tempSettings} handleChange={handleChange} getValue={getValue} />
                    )}
                    {activeTab === 'display' && (
                        <DisplaySettings tempSettings={tempSettings} handleChange={handleChange} getValue={getValue} />
                    )}
                    {activeTab === 'shortcuts' && (
                        <ShortcutsSettings tempSettings={tempSettings} handleChange={handleChange} getValue={getValue} />
                    )}
                    {activeTab === 'export' && (
                        <ExportSettings tempSettings={tempSettings} handleChange={handleChange} getValue={getValue} />
                    )}
                    {activeTab === 'theme' && (
                        <ThemeSettings tempSettings={tempSettings} handleChange={handleChange} getValue={getValue} />
                    )}
                    {activeTab === 'advanced' && (
                        <AdvancedSettings tempSettings={tempSettings} handleChange={handleChange} getValue={getValue} />
                    )}
                </div>
                
                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={handleReset}
                        style={{
                            padding: '8px 16px',
                            background: 'rgba(255, 68, 68, 0.1)',
                            border: '1px solid rgba(255, 68, 68, 0.3)',
                            borderRadius: '6px',
                            color: '#ffaaaa',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <RotateCcw size={16} />
                        Reset to Defaults
                    </button>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '6px',
                                color: '#aaa',
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="btn-primary"
                            style={{
                                padding: '8px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            <Save size={16} />
                            Save Settings
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Annotation Settings Component
function AnnotationSettings({ tempSettings, handleChange, getValue }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0, color: '#00e0ff', fontSize: '1.1rem' }}>Annotation Tools</h3>
            
            <SettingRow
                label="Snap to Grid"
                description="Automatically align annotations to grid"
                value={getValue('snapToGrid')}
                onChange={(v) => handleChange('snapToGrid', v)}
                type="checkbox"
            />
            
            {getValue('snapToGrid') && (
                <SettingRow
                    label="Grid Size"
                    description="Size of the grid in pixels"
                    value={getValue('gridSize')}
                    onChange={(v) => handleChange('gridSize', parseInt(v) || 10)}
                    type="number"
                    min={1}
                    max={100}
                />
            )}
            
            <SettingRow
                label="Pixel Move Step"
                description="Pixels to move with arrow keys"
                value={getValue('pixelMoveStep')}
                onChange={(v) => handleChange('pixelMoveStep', parseInt(v) || 1)}
                type="number"
                min={1}
                max={50}
            />
            
            <SettingRow
                label="Shift Pixel Move Step"
                description="Pixels to move with Shift+arrow keys"
                value={getValue('shiftPixelMoveStep')}
                onChange={(v) => handleChange('shiftPixelMoveStep', parseInt(v) || 10)}
                type="number"
                min={1}
                max={100}
            />
            
            <SettingRow
                label="Lock Aspect Ratio"
                description="Maintain aspect ratio when resizing"
                value={getValue('lockAspectRatio')}
                onChange={(v) => handleChange('lockAspectRatio', v)}
                type="checkbox"
            />
            
            <SettingRow
                label="Smart Paste"
                description="Paste annotations respecting image bounds"
                value={getValue('smartPaste')}
                onChange={(v) => handleChange('smartPaste', v)}
                type="checkbox"
            />
        </div>
    );
}

// Productivity Settings Component
function ProductivitySettings({ tempSettings, handleChange, getValue }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0, color: '#00e0ff', fontSize: '1.1rem' }}>Productivity</h3>
            
            <SettingRow
                label="Auto Advance"
                description="Automatically go to next image after annotation"
                value={getValue('autoAdvance')}
                onChange={(v) => handleChange('autoAdvance', v)}
                type="checkbox"
            />
            
            {getValue('autoAdvance') && (
                <SettingRow
                    label="Auto Advance Delay (ms)"
                    description="Delay before advancing to next image"
                    value={getValue('autoAdvanceDelay')}
                    onChange={(v) => handleChange('autoAdvanceDelay', parseInt(v) || 500)}
                    type="number"
                    min={0}
                    max={5000}
                />
            )}
            
            <SettingRow
                label="Show Recent Classes"
                description="Show recently used classes in quick access"
                value={getValue('showRecentClasses')}
                onChange={(v) => handleChange('showRecentClasses', v)}
                type="checkbox"
            />
            
            {getValue('showRecentClasses') && (
                <SettingRow
                    label="Recent Classes Count"
                    description="Number of recent classes to show"
                    value={getValue('recentClassesCount')}
                    onChange={(v) => handleChange('recentClassesCount', parseInt(v) || 5)}
                    type="number"
                    min={1}
                    max={20}
                />
            )}
            
            <SettingRow
                label="Quick Annotation Mode"
                description="Enable quick annotation shortcuts"
                value={getValue('quickAnnotationMode')}
                onChange={(v) => handleChange('quickAnnotationMode', v)}
                type="checkbox"
            />
        </div>
    );
}

// Validation Settings Component
function ValidationSettings({ tempSettings, handleChange, getValue }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0, color: '#00e0ff', fontSize: '1.1rem' }}>Validation</h3>
            
            <SettingRow
                label="Validate Min Size"
                description="Warn on annotations smaller than minimum size"
                value={getValue('validateMinSize')}
                onChange={(v) => handleChange('validateMinSize', v)}
                type="checkbox"
            />
            
            <SettingRow
                label="Validate Max Size"
                description="Warn on annotations larger than maximum size"
                value={getValue('validateMaxSize')}
                onChange={(v) => handleChange('validateMaxSize', v)}
                type="checkbox"
            />
            
            <SettingRow
                label="Warn on Overlap"
                description="Show warning when annotations overlap"
                value={getValue('warnOnOverlap')}
                onChange={(v) => handleChange('warnOnOverlap', v)}
                type="checkbox"
            />
            
            {getValue('warnOnOverlap') && (
                <SettingRow
                    label="Overlap Threshold"
                    description="Minimum overlap ratio to trigger warning (0-1)"
                    value={getValue('overlapThreshold')}
                    onChange={(v) => handleChange('overlapThreshold', parseFloat(v) || 0.3)}
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                />
            )}
        </div>
    );
}

// Display Settings Component
function DisplaySettings({ tempSettings, handleChange, getValue }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0, color: '#00e0ff', fontSize: '1.1rem' }}>Display</h3>
            
            <SettingRow
                label="Show Mini Map"
                description="Show overview map of image with annotations"
                value={getValue('showMiniMap')}
                onChange={(v) => handleChange('showMiniMap', v)}
                type="checkbox"
            />
            
            <SettingRow
                label="Show Tooltips"
                description="Show helpful tooltips"
                value={getValue('showTooltips')}
                onChange={(v) => handleChange('showTooltips', v)}
                type="checkbox"
            />
            
            <SettingRow
                label="Show Grid"
                description="Display grid overlay"
                value={getValue('showGrid')}
                onChange={(v) => handleChange('showGrid', v)}
                type="checkbox"
            />
            
            {getValue('showGrid') && (
                <SettingRow
                    label="Grid Opacity"
                    description="Opacity of the grid (0-1)"
                    value={getValue('gridOpacity')}
                    onChange={(v) => handleChange('gridOpacity', parseFloat(v) || 0.3)}
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                />
            )}
            
            <SettingRow
                label="Annotation Opacity"
                description="Opacity of annotation boxes (0-1)"
                value={getValue('annotationOpacity')}
                onChange={(v) => handleChange('annotationOpacity', parseFloat(v) || 0.7)}
                type="number"
                min={0}
                max={1}
                step={0.1}
            />
            
            <SettingRow
                label="Show Annotation Labels"
                description="Display class names on annotations"
                value={getValue('showAnnotationLabels')}
                onChange={(v) => handleChange('showAnnotationLabels', v)}
                type="checkbox"
            />
            
            <SettingRow
                label="Show Annotation IDs"
                description="Display annotation IDs"
                value={getValue('showAnnotationIds')}
                onChange={(v) => handleChange('showAnnotationIds', v)}
                type="checkbox"
            />
            
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <h4 style={{ color: '#00e0ff', fontSize: '0.95rem', marginBottom: '10px' }}>Image Transformations</h4>
                
                <SettingRow
                    label="Reset Transform on Image Change"
                    description="Reset rotation and flip when changing images"
                    value={getValue('resetTransformOnImageChange')}
                    onChange={(v) => {
                        handleChange('resetTransformOnImageChange', v);
                        // Disable lock if reset is enabled
                        if (v) {
                            handleChange('lockTransformAcrossImages', false);
                        }
                    }}
                    type="checkbox"
                />
                
                <SettingRow
                    label="Lock Transform Across Images"
                    description="Apply same rotation/flip to all images"
                    value={getValue('lockTransformAcrossImages')}
                    onChange={(v) => {
                        handleChange('lockTransformAcrossImages', v);
                        // Disable reset if lock is enabled
                        if (v) {
                            handleChange('resetTransformOnImageChange', false);
                        }
                    }}
                    type="checkbox"
                />
            </div>
        </div>
    );
}

// Shortcuts Settings Component
function ShortcutsSettings({ tempSettings, handleChange, getValue }) {
    const shortcuts = getValue('shortcuts') || {};
    const shortcutKeys = Object.keys(shortcuts);
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0, color: '#00e0ff', fontSize: '1.1rem' }}>Keyboard Shortcuts</h3>
            <p style={{ color: '#aaa', fontSize: '0.85rem', margin: 0 }}>
                Click on a shortcut to change it. Press the new key combination.
            </p>
            
            {shortcutKeys.map(key => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                    <div>
                        <div style={{ color: '#00e0ff', fontWeight: 'bold' }}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</div>
                        <div style={{ color: '#888', fontSize: '0.75rem' }}>{getShortcutDescription(key)}</div>
                    </div>
                    <input
                        type="text"
                        value={shortcuts[key] || ''}
                        onChange={(e) => {
                            const newShortcuts = { ...shortcuts };
                            newShortcuts[key] = e.target.value;
                            handleChange('shortcuts', newShortcuts);
                        }}
                        onKeyDown={(e) => {
                            e.preventDefault();
                            const keyName = e.key === ' ' ? 'Space' : e.key;
                            const modifiers = [];
                            if (e.ctrlKey) modifiers.push('Ctrl');
                            if (e.shiftKey) modifiers.push('Shift');
                            if (e.altKey) modifiers.push('Alt');
                            if (e.metaKey) modifiers.push('Meta');
                            
                            const fullKey = modifiers.length > 0 
                                ? `${modifiers.join('+')}+${keyName}`
                                : keyName;
                            
                            const newShortcuts = { ...shortcuts };
                            newShortcuts[key] = fullKey;
                            handleChange('shortcuts', newShortcuts);
                        }}
                        style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(0, 224, 255, 0.3)',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            color: '#00e0ff',
                            fontSize: '0.85rem',
                            minWidth: '150px',
                            textAlign: 'center'
                        }}
                        placeholder="Press key..."
                    />
                </div>
            ))}
        </div>
    );
}

function getShortcutDescription(key) {
    const descriptions = {
        'nextImage': 'Navigate to next image',
        'prevImage': 'Navigate to previous image',
        'nextUnannotated': 'Go to next unannotated image',
        'prevUnannotated': 'Go to previous unannotated image',
        'duplicate': 'Duplicate selected annotation',
        'copy': 'Copy annotation',
        'paste': 'Paste annotation',
        'delete': 'Delete annotation',
        'undo': 'Undo last action',
        'redo': 'Redo last action',
        'zoomIn': 'Zoom in',
        'zoomOut': 'Zoom out',
        'resetZoom': 'Reset zoom',
        'toggleAnnotations': 'Toggle annotations visibility',
        'zoomToSelection': 'Zoom to selected annotation',
        'fullscreen': 'Toggle fullscreen',
        'toggleGrid': 'Toggle grid display',
        'snapToGrid': 'Toggle snap to grid',
    };
    return descriptions[key] || '';
}

// Export Settings Component
function ExportSettings({ tempSettings, handleChange, getValue }) {
    const formats = ['yolo', 'coco', 'voc', 'json'];
    const selectedFormats = getValue('exportFormats') || [];
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0, color: '#00e0ff', fontSize: '1.1rem' }}>Export</h3>
            
            <SettingRow
                label="Default Export Format"
                description="Default format for exports"
                value={getValue('defaultExportFormat')}
                onChange={(v) => handleChange('defaultExportFormat', v)}
                type="select"
                options={formats.map(f => ({ value: f, label: f.toUpperCase() }))}
            />
            
            <SettingRow
                label="Export Multiple Formats"
                description="Allow exporting in multiple formats simultaneously"
                value={getValue('exportMultipleFormats')}
                onChange={(v) => handleChange('exportMultipleFormats', v)}
                type="checkbox"
            />
            
            {getValue('exportMultipleFormats') && (
                <div>
                    <label style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '8px', display: 'block' }}>
                        Export Formats
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {formats.map(format => (
                            <label key={format} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={selectedFormats.includes(format)}
                                    onChange={(e) => {
                                        const newFormats = e.target.checked
                                            ? [...selectedFormats, format]
                                            : selectedFormats.filter(f => f !== format);
                                        handleChange('exportFormats', newFormats);
                                    }}
                                />
                                <span style={{ color: '#aaa' }}>{format.toUpperCase()}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}
            
            <SettingRow
                label="Export with Filters"
                description="Apply current filters when exporting"
                value={getValue('exportWithFilters')}
                onChange={(v) => handleChange('exportWithFilters', v)}
                type="checkbox"
            />
        </div>
    );
}

// Theme Settings Component
function ThemeSettings({ tempSettings, handleChange, getValue }) {
    const themes = ['dark', 'light', 'custom'];
    const customColors = getValue('customColors') || {};
    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0, color: '#00e0ff', fontSize: '1.1rem' }}>Theme</h3>
            
            <SettingRow
                label="Theme"
                description="Application theme"
                value={getValue('theme')}
                onChange={(v) => handleChange('theme', v)}
                type="select"
                options={themes.map(t => ({ value: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))}
            />
            
            {getValue('theme') === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ color: '#aaa', fontSize: '0.85rem' }}>Custom Colors</label>
                    {Object.keys(customColors).map(colorKey => (
                        <div key={colorKey} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: '#aaa', minWidth: '100px' }}>{colorKey}</span>
                            <input
                                type="color"
                                value={customColors[colorKey]}
                                onChange={(e) => {
                                    const newColors = { ...customColors };
                                    newColors[colorKey] = e.target.value;
                                    handleChange('customColors', newColors);
                                }}
                                style={{ width: '60px', height: '30px', cursor: 'pointer' }}
                            />
                            <input
                                type="text"
                                value={customColors[colorKey]}
                                onChange={(e) => {
                                    const newColors = { ...customColors };
                                    newColors[colorKey] = e.target.value;
                                    handleChange('customColors', newColors);
                                }}
                                style={{
                                    flex: 1,
                                    background: 'rgba(0, 0, 0, 0.3)',
                                    border: '1px solid rgba(0, 224, 255, 0.3)',
                                    borderRadius: '4px',
                                    padding: '6px',
                                    color: '#00e0ff'
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Advanced Settings Component
function AdvancedSettings({ tempSettings, handleChange, getValue }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h3 style={{ margin: 0, color: '#00e0ff', fontSize: '1.1rem' }}>Advanced</h3>
            
            <SettingRow
                label="Enable Scripts"
                description="Allow running custom Python scripts"
                value={getValue('enableScripts')}
                onChange={(v) => handleChange('enableScripts', v)}
                type="checkbox"
            />
            
            <SettingRow
                label="Auto Save Interval (ms)"
                description="Interval for automatic saves"
                value={getValue('autoSaveInterval')}
                onChange={(v) => handleChange('autoSaveInterval', parseInt(v) || 5000)}
                type="number"
                min={1000}
                max={60000}
            />
            
            <SettingRow
                label="Show Debug Info"
                description="Display debug information"
                value={getValue('showDebugInfo')}
                onChange={(v) => handleChange('showDebugInfo', v)}
                type="checkbox"
            />
            
            <SettingRow
                label="Log Level"
                description="Logging verbosity"
                value={getValue('logLevel')}
                onChange={(v) => handleChange('logLevel', v)}
                type="select"
                options={[
                    { value: 'error', label: 'Error' },
                    { value: 'warn', label: 'Warning' },
                    { value: 'info', label: 'Info' },
                    { value: 'debug', label: 'Debug' },
                ]}
            />
            
            <SettingRow
                label="Cache Size"
                description="Number of images to cache"
                value={getValue('cacheSize')}
                onChange={(v) => handleChange('cacheSize', parseInt(v) || 100)}
                type="number"
                min={10}
                max={1000}
            />
            
            <SettingRow
                label="Image Compression"
                description="Compress images for better performance"
                value={getValue('imageCompression')}
                onChange={(v) => handleChange('imageCompression', v)}
                type="checkbox"
            />
            
            {getValue('imageCompression') && (
                <SettingRow
                    label="Compression Quality"
                    description="Image compression quality (0-1)"
                    value={getValue('compressionQuality')}
                    onChange={(v) => handleChange('compressionQuality', parseFloat(v) || 0.8)}
                    type="number"
                    min={0}
                    max={1}
                    step={0.1}
                />
            )}
        </div>
    );
}

// Reusable Setting Row Component
function SettingRow({ label, description, value, onChange, type, options, min, max, step }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ color: '#00e0ff', fontWeight: 'bold', fontSize: '0.9rem' }}>{label}</label>
                {type === 'checkbox' ? (
                    <input
                        type="checkbox"
                        checked={value || false}
                        onChange={(e) => onChange(e.target.checked)}
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                    />
                ) : type === 'select' ? (
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(0, 224, 255, 0.3)',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            color: '#00e0ff',
                            fontSize: '0.85rem',
                            cursor: 'pointer'
                        }}
                    >
                        {options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={type}
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        min={min}
                        max={max}
                        step={step}
                        style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(0, 224, 255, 0.3)',
                            borderRadius: '4px',
                            padding: '6px 12px',
                            color: '#00e0ff',
                            fontSize: '0.85rem',
                            width: '150px'
                        }}
                    />
                )}
            </div>
            {description && (
                <div style={{ color: '#888', fontSize: '0.75rem', marginTop: '2px' }}>{description}</div>
            )}
        </div>
    );
}

export default SettingsPanel;

