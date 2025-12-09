import { useState, useEffect, useCallback } from 'react';

// Default settings
const DEFAULT_SETTINGS = {
    // Annotation tools
    snapToGrid: false,
    gridSize: 10,
    pixelMoveStep: 1,
    shiftPixelMoveStep: 10,
    lockAspectRatio: false,
    smartPaste: true,
    
    // Productivity
    autoAdvance: false,
    autoAdvanceDelay: 500,
    showRecentClasses: true,
    recentClassesCount: 5,
    quickAnnotationMode: false,
    
    // Validation
    validateMinSize: true,
    validateMaxSize: true,
    minSizeByClass: {}, // { classId: minSize }
    maxSizeByClass: {}, // { classId: maxSize }
    warnOnOverlap: true,
    overlapThreshold: 0.3,
    
    // Display
    showMiniMap: true,
    showTooltips: true,
    showGrid: false,
    gridOpacity: 0.3,
    annotationOpacity: 0.7,
    showAnnotationLabels: true,
    showAnnotationIds: false,
    
    // Keyboard shortcuts (customizable)
    shortcuts: {
        'nextImage': 'ArrowRight',
        'prevImage': 'ArrowLeft',
        'nextUnannotated': 'n',
        'prevUnannotated': 'N',
        'duplicate': 'd',
        'copy': 'c',
        'paste': 'v',
        'delete': 'Delete',
        'undo': 'z',
        'redo': 'y',
        'zoomIn': '=',
        'zoomOut': '-',
        'resetZoom': '0',
        'toggleAnnotations': 't',
        'zoomToSelection': 'z',
        'fullscreen': 'F11',
        'toggleGrid': 'g',
        'snapToGrid': 's',
    },
    
    // Performance
    lazyLoading: true,
    cacheSize: 100,
    imageCompression: false,
    compressionQuality: 0.8,
    
    // Export
    defaultExportFormat: 'yolo',
    exportMultipleFormats: false,
    exportFormats: ['yolo'],
    exportWithFilters: false,
    
    // Theme
    theme: 'dark',
    customColors: {
        primary: '#00e0ff',
        secondary: '#56b0ff',
        background: '#050510',
        panel: 'rgba(20, 20, 35, 0.8)',
    },
    
    // Advanced
    enableScripts: false,
    autoSaveInterval: 5000,
    showDebugInfo: false,
    logLevel: 'warn',
};

// Load settings from localStorage
export const loadSettings = () => {
    try {
        const saved = localStorage.getItem('annotationStudio_settings');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Merge with defaults to handle new settings
            return { ...DEFAULT_SETTINGS, ...parsed };
        }
    } catch (err) {
        console.error('Failed to load settings:', err);
    }
    return DEFAULT_SETTINGS;
};

// Save settings to localStorage
export const saveSettings = (settings) => {
    try {
        localStorage.setItem('annotationStudio_settings', JSON.stringify(settings));
    } catch (err) {
        console.error('Failed to save settings:', err);
    }
};

// Custom hook for settings
export const useSettings = () => {
    const [settings, setSettings] = useState(() => loadSettings());
    
    // Save settings whenever they change
    useEffect(() => {
        saveSettings(settings);
    }, [settings]);
    
    // Update a specific setting
    const updateSetting = useCallback((key, value) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            // Handle nested keys (e.g., 'shortcuts.nextImage')
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
    
    // Update multiple settings at once
    const updateSettings = useCallback((updates) => {
        setSettings(prev => {
            const newSettings = { ...prev };
            Object.keys(updates).forEach(key => {
                const keys = key.split('.');
                let current = newSettings;
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) {
                        current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = updates[key];
            });
            return newSettings;
        });
    }, []);
    
    // Reset to defaults
    const resetSettings = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
        saveSettings(DEFAULT_SETTINGS);
    }, []);
    
    // Get a specific setting
    const getSetting = useCallback((key, defaultValue = null) => {
        const keys = key.split('.');
        let current = settings;
        for (const k of keys) {
            if (current && typeof current === 'object' && k in current) {
                current = current[k];
            } else {
                return defaultValue;
            }
        }
        return current;
    }, [settings]);
    
    return {
        settings,
        setSettings,
        updateSetting,
        updateSettings,
        resetSettings,
        getSetting,
    };
};

export default useSettings;

