/**
 * @fileoverview useSettings Hook - Settings Management
 * 
 * Custom React hook that provides settings management with:
 * - Default settings configuration
 * - localStorage persistence
 * - Nested key support (e.g., 'shortcuts.nextImage')
 * - Automatic saving on changes
 * 
 * @module hooks/useSettings
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Default settings configuration
 * @constant {Object}
 */
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
    quickDrawMode: false, // Keep class selected for rapid annotation
    annotationTemplates: [], // Saved annotation templates
    enableAnnotationGroups: false, // Group annotations together
    
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
    resetTransformOnImageChange: true, // Reset rotation/flip when changing image
    lockTransformAcrossImages: false, // Lock rotation/flip across all images
    
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

/**
 * Load settings from localStorage
 * Merges saved settings with defaults to handle new settings
 * 
 * @returns {Object} Settings object
 */
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

/**
 * Save settings to localStorage
 * 
 * @param {Object} settings - Settings object to save
 */
export const saveSettings = (settings) => {
    try {
        localStorage.setItem('annotationStudio_settings', JSON.stringify(settings));
    } catch (err) {
        console.error('Failed to save settings:', err);
    }
};

/**
 * Custom hook for settings management
 * 
 * Provides settings state and update functions with automatic persistence.
 * Supports nested keys for complex settings structure.
 * 
 * @returns {Object} Settings API
 * @returns {Object} returns.settings - Current settings object
 * @returns {Function} returns.setSettings - Function to set all settings
 * @returns {Function} returns.updateSetting - Function to update a single setting (supports nested keys)
 * @returns {Function} returns.updateSettings - Function to update multiple settings at once
 * @returns {Function} returns.resetSettings - Function to reset to default settings
 * @returns {Function} returns.getSetting - Function to get a setting value (supports nested keys)
 * 
 * @example
 * const { settings, updateSetting, getSetting } = useSettings();
 * updateSetting('snapToGrid', true);
 * updateSetting('shortcuts.nextImage', 'ArrowRight');
 * const snapToGrid = getSetting('snapToGrid', false);
 */
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

