/**
 * @fileoverview Sidebar Component - Class Management and Tools
 * 
 * This component provides the left sidebar with:
 * - Class list with color management
 * - YAML import/export
 * - YOLO pre-annotation tools
 * - Vision LLM integration
 * - Quick draw and measurements toggles
 * - Annotation templates
 * - Compact dropdown menus for better organization
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Array<Object>} props.classes - Array of annotation classes
 * @param {Function} props.setClasses - Function to update classes
 * @param {number} props.selectedClassId - Currently selected class ID
 * @param {Function} props.setSelectedClassId - Function to set selected class
 * @param {string|null} props.selectedAnnotationId - Currently selected annotation ID
 * @param {Function} props.onChangeAnnotationClass - Function to change annotation class
 * @param {Function} props.onImportYaml - Function to import YAML classes
 * @param {Array<Object>} props.annotations - Current image annotations
 * @param {Function} props.onBatchDeleteClass - Function to batch delete by class
 * @param {Function} props.onBatchChangeClass - Function to batch change class
 * @param {Function} props.onAlignAnnotations - Function to align annotations
 * @param {Function} props.onPreAnnotate - Function to pre-annotate with YOLO
 * @param {string} props.yoloModelPath - Path to YOLO model
 * @param {Function} props.setYoloModelPath - Function to set YOLO model path
 * @param {number} props.yoloConfidence - YOLO confidence threshold
 * @param {Function} props.setYoloConfidence - Function to set confidence threshold
 * @param {Array<number>} props.recentClasses - Recently used class IDs
 * @param {boolean} props.quickDrawMode - Quick draw mode enabled
 * @param {Function} props.onToggleQuickDraw - Function to toggle quick draw
 * @param {boolean} props.showMeasurements - Show measurements enabled
 * @param {Function} props.onToggleMeasurements - Function to toggle measurements
 * @param {Array<Object>} props.annotationTemplates - Saved annotation templates
 * @param {Function} props.onSaveTemplate - Function to save template
 * @param {Function} props.onLoadTemplate - Function to load template
 * @param {Function} props.onDeleteTemplate - Function to delete template
 * @param {Function} props.onOpenVisionLLM - Function to open Vision LLM modal
 * @returns {JSX.Element} The rendered sidebar component
 */
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Upload, Download, Save, FolderOpen, Brain, Settings, Ruler, ChevronDown, ChevronUp, FileText, Zap, History, Search } from 'lucide-react';

function Sidebar({ classes, setClasses, selectedClassId, setSelectedClassId, selectedAnnotationId, onChangeAnnotationClass, onImportYaml, annotations, onBatchDeleteClass, onBatchChangeClass, onAlignAnnotations, onPreAnnotate, yoloModelPath, setYoloModelPath, yoloConfidence, setYoloConfidence, recentClasses = [], quickDrawMode = false, onToggleQuickDraw, showMeasurements = false, onToggleMeasurements, annotationTemplates = [], onSaveTemplate, onLoadTemplate, onDeleteTemplate, onOpenVisionLLM }) {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [newClassName, setNewClassName] = useState('');
    const [classSearchQuery, setClassSearchQuery] = useState('');
    const [showBatchMenu, setShowBatchMenu] = useState(false);
    const [showYoloPanel, setShowYoloPanel] = useState(false);
    const [showShortcutsPanel, setShowShortcutsPanel] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showTemplatesMenu, setShowTemplatesMenu] = useState(false);
    const [showToolsMenu, setShowToolsMenu] = useState(false);
    const [showTogglesMenu, setShowTogglesMenu] = useState(false);
    const templatesMenuRef = useRef(null);
    const toolsMenuRef = useRef(null);
    const togglesMenuRef = useRef(null);
    
    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (templatesMenuRef.current && !templatesMenuRef.current.contains(event.target)) {
                setShowTemplatesMenu(false);
            }
            if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target)) {
                setShowToolsMenu(false);
            }
            if (togglesMenuRef.current && !togglesMenuRef.current.contains(event.target)) {
                setShowTogglesMenu(false);
            }
        };
        
        if (showTemplatesMenu || showToolsMenu || showTogglesMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showTemplatesMenu, showToolsMenu, showTogglesMenu]);

    const onClassClick = (clsId) => {
        if (selectedAnnotationId) {
            onChangeAnnotationClass(selectedAnnotationId, clsId);
        }
        setSelectedClassId(clsId);
    };

    const startEdit = (cls) => {
        setEditingId(cls.id);
        setEditName(cls.name);
    };

    const saveEdit = () => {
        if (editingId !== null && editName.trim()) {
            const updated = classes.map(cls => 
                cls.id === editingId ? { ...cls, name: editName.trim() } : cls
            );
            setClasses(updated);
            setEditingId(null);
            setEditName('');
        }
    };

    const deleteClass = (clsId) => {
        if (classes.length <= 1) {
            alert('Cannot delete the last class');
            return;
        }
        if (window.confirm('Are you sure you want to delete this class?')) {
            const updated = classes.filter(cls => cls.id !== clsId);
            // Reassign IDs
            const reindexed = updated.map((cls, idx) => ({ ...cls, id: idx }));
            setClasses(reindexed);
            if (selectedClassId === clsId) {
                setSelectedClassId(0);
            }
        }
    };

    const addClass = () => {
        if (!newClassName || typeof newClassName !== 'string' || !newClassName.trim()) {
            return;
        }
        
        if (!Array.isArray(classes)) {
            console.warn('Classes is not an array');
            return;
        }
        
        const colors = ["#00e0ff", "#56b0ff", "#ff6b6b", "#4ecdc4", "#ffe66d", "#a8e6cf", "#ff8b94", "#c7ceea"];
        let newId = 0;
        if (classes.length > 0) {
            const validIds = classes.filter(c => c && typeof c.id === 'number' && !isNaN(c.id)).map(c => c.id);
            if (validIds.length > 0) {
                newId = Math.max(...validIds) + 1;
            }
        }
        
        const trimmedName = newClassName.trim();
        if (trimmedName.length === 0 || trimmedName.length > 100) {
            alert('Class name must be between 1 and 100 characters');
            return;
        }
        
        const newClass = {
            id: newId,
            name: trimmedName,
            color: colors[newId % colors.length]
        };
        setClasses([...classes, newClass]);
        setNewClassName('');
        setSelectedClassId(newId);
    };

    const saveTemplate = () => {
        if (!window.electronAPI || !window.electronAPI.selectFile) {
            alert("Electron API not available");
            return;
        }
        
        const template = {
            version: "1.0",
            classes: classes,
            timestamp: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'classes_template.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const loadTemplate = async () => {
        if (!window.electronAPI || !window.electronAPI.selectFile) {
            alert("Electron API not available");
            return;
        }
        
        try {
            const filePath = await window.electronAPI.selectFile([
                { name: 'JSON Files', extensions: ['json'] },
                { name: 'All Files', extensions: ['*'] }
            ]);
            
            if (!filePath) return;
            
            const fileContent = await window.electronAPI.readFile(filePath);
            const template = JSON.parse(fileContent);
            
            if (template.classes && Array.isArray(template.classes)) {
                const action = window.confirm(
                    `Found ${template.classes.length} classes in template.\n\n` +
                    `Click OK to replace, or Cancel to merge.`
                );
                
                if (action) {
                    // Replace
                    setClasses(template.classes);
                } else {
                    // Merge
                    const existingNames = new Set(classes.map(c => c.name.toLowerCase()));
                    const newClasses = template.classes.filter(c => 
                        !existingNames.has(c.name.toLowerCase())
                    );
                    if (newClasses.length > 0) {
                        setClasses([...classes, ...newClasses]);
                        alert(`Added ${newClasses.length} new classes from template.`);
                    } else {
                        alert('All classes from template already exist.');
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load template:', err);
            alert('Failed to load template: ' + err.message);
        }
    };

    const handleBatchDelete = (classId) => {
        const classToDelete = classes.find(c => c.id === classId);
        if (!classToDelete) return;
        
        const count = annotations ? annotations.filter(a => a.class_id === classId).length : 0;
        if (count === 0) {
            alert('No annotations found for this class.');
            return;
        }
        
        if (window.confirm(`Delete all ${count} annotation(s) of class "${classToDelete.name}"?`)) {
            if (onBatchDeleteClass) {
                onBatchDeleteClass(classId);
            }
        }
    };

    return (
        <div className="glass-panel" style={{ 
            width: isCollapsed ? '60px' : '250px', 
            margin: '10px', 
            padding: isCollapsed ? '8px 15px' : '15px', 
            display: 'flex', 
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            overflow: isCollapsed ? 'hidden' : 'visible'
        }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: isCollapsed ? 'center' : 'space-between',
                marginBottom: isCollapsed ? 0 : '10px',
                cursor: 'pointer',
                userSelect: 'none'
            }}
            onClick={() => setIsCollapsed(!isCollapsed)}
            >
                {!isCollapsed && <h3 className="neon-text" style={{ margin: 0 }}>Classes</h3>}
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
                <>
                {/* Search bar for classes */}
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#666', zIndex: 1 }} />
                    <input
                        type="text"
                        placeholder="Search classes..."
                        value={classSearchQuery}
                        onChange={(e) => setClassSearchQuery(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '6px 8px 6px 30px', 
                            background: 'rgba(255,255,255,0.1)', 
                            border: '1px solid rgba(255,255,255,0.2)', 
                            borderRadius: '4px', 
                            color: 'white',
                            fontSize: '0.85rem',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                {classes
                    .filter(cls => {
                        if (!classSearchQuery) return true;
                        return cls.name.toLowerCase().includes(classSearchQuery.toLowerCase());
                    })
                    .map(cls => (
                    <div
                        key={cls.id}
                        onClick={() => onClassClick(cls.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '8px',
                            marginBottom: '5px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            background: selectedClassId === cls.id ? 'rgba(0, 224, 255, 0.2)' : 'transparent',
                            border: selectedClassId === cls.id ? '1px solid var(--neon-blue)' : '1px solid transparent'
                        }}
                    >
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cls.color, marginRight: '10px', boxShadow: `0 0 5px ${cls.color}` }}></div>

                        {editingId === cls.id ? (
                            <input
                                value={editName}
                                onChange={e => setEditName(e.target.value)}
                                onBlur={saveEdit}
                                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                autoFocus
                                style={{ width: '100px' }}
                            />
                        ) : (
                            <span style={{ flex: 1 }}>{cls.name}</span>
                        )}

                        <div style={{ display: 'flex', gap: '5px' }}>
                            <Edit2 size={14} style={{ opacity: 0.5 }} onClick={(e) => { e.stopPropagation(); startEdit(cls); }} />
                            <Trash2 size={14} style={{ opacity: 0.5, color: '#ff4444' }} onClick={(e) => { e.stopPropagation(); deleteClass(cls.id); }} />
                        </div>
                    </div>
                ))}
                </div>

                <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                <input
                    placeholder="New Class"
                    value={newClassName}
                    onChange={e => setNewClassName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addClass()}
                    style={{ width: '100%', boxSizing: 'border-box', marginBottom: '8px' }}
                />
                <button className="btn-primary" style={{ width: '100%', marginBottom: '8px' }} onClick={addClass}>Add Class</button>
                
                {/* Templates Menu - Compact */}
                <div ref={templatesMenuRef} style={{ position: 'relative', marginBottom: '8px' }}>
                    <button 
                        className="btn-primary" 
                        style={{ 
                            width: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            fontSize: '0.8rem'
                        }} 
                        onClick={() => setShowTemplatesMenu(!showTemplatesMenu)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FileText size={14} />
                            <span>Templates</span>
                        </div>
                        <ChevronDown size={14} style={{ transform: showTemplatesMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </button>
                    
                    {showTemplatesMenu && (
                        <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 0,
                            right: 0,
                            marginBottom: '4px',
                            background: 'rgba(20, 20, 35, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(0, 224, 255, 0.3)',
                            borderRadius: '8px',
                            padding: '6px',
                            zIndex: 1000,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            minWidth: '150px'
                        }}>
                            <button 
                                className="btn-secondary"
                                style={{ 
                                    padding: '6px 8px', 
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    justifyContent: 'flex-start'
                                }} 
                                onClick={() => { onImportYaml(); setShowTemplatesMenu(false); }}
                                title="Import classes from YAML file"
                            >
                                <Upload size={14} />
                                Import YAML
                            </button>
                            <button 
                                className="btn-secondary"
                                style={{ 
                                    padding: '6px 8px', 
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    justifyContent: 'flex-start'
                                }} 
                                onClick={() => { loadTemplate(); setShowTemplatesMenu(false); }}
                                title="Load class template"
                            >
                                <FolderOpen size={14} />
                                Load Template
                            </button>
                            <button 
                                className="btn-secondary"
                                style={{ 
                                    padding: '6px 8px', 
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    justifyContent: 'flex-start'
                                }} 
                                onClick={() => { saveTemplate(); setShowTemplatesMenu(false); }}
                                title="Save class template"
                            >
                                <Save size={14} />
                                Save Template
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Tools Menu - Compact */}
                <div ref={toolsMenuRef} style={{ position: 'relative', marginBottom: '8px' }}>
                    <button 
                        className="btn-primary" 
                        style={{ 
                            width: '100%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            fontSize: '0.8rem'
                        }} 
                        onClick={() => setShowToolsMenu(!showToolsMenu)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Zap size={14} />
                            <span>Tools</span>
                        </div>
                        <ChevronDown size={14} style={{ transform: showToolsMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                    </button>
                    
                    {showToolsMenu && (
                        <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 0,
                            right: 0,
                            marginBottom: '4px',
                            background: 'rgba(20, 20, 35, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(0, 224, 255, 0.3)',
                            borderRadius: '8px',
                            padding: '6px',
                            zIndex: 1000,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                            minWidth: '150px'
                        }}>
                            <button 
                                className="btn-secondary"
                                style={{ 
                                    padding: '6px 8px', 
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    justifyContent: 'flex-start'
                                }} 
                                onClick={() => { setShowYoloPanel(true); setShowToolsMenu(false); }}
                                title="YOLO Pre-annotation"
                            >
                                <Brain size={14} />
                                YOLO Pre-annotation
                            </button>
                            {onOpenVisionLLM && (
                                <button 
                                    className="btn-secondary"
                                    style={{ 
                                        padding: '6px 8px', 
                                        fontSize: '0.75rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        justifyContent: 'flex-start'
                                    }} 
                                    onClick={() => { onOpenVisionLLM(); setShowToolsMenu(false); }}
                                    title="Vision LLM Assistant"
                                >
                                    <Brain size={14} />
                                    Vision LLM
                                </button>
                            )}
                            <button 
                                className="btn-secondary"
                                style={{ 
                                    padding: '6px 8px', 
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    justifyContent: 'flex-start'
                                }} 
                                onClick={() => { setShowShortcutsPanel(true); setShowToolsMenu(false); }}
                                title="Custom Shortcuts"
                            >
                                <Settings size={14} />
                                Shortcuts
                            </button>
                        </div>
                    )}
                </div>
                
                {/* Toggles Menu - Compact */}
                {(onToggleQuickDraw || onToggleMeasurements) && (
                    <div ref={togglesMenuRef} style={{ position: 'relative', marginBottom: '8px' }}>
                        <button 
                            className="btn-primary" 
                            style={{ 
                                width: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                fontSize: '0.8rem'
                            }} 
                            onClick={() => setShowTogglesMenu(!showTogglesMenu)}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Settings size={14} />
                                <span>Options</span>
                            </div>
                            <ChevronDown size={14} style={{ transform: showTogglesMenu ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </button>
                        
                        {showTogglesMenu && (
                            <div style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: 0,
                                right: 0,
                                marginBottom: '4px',
                                background: 'rgba(20, 20, 35, 0.95)',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(0, 224, 255, 0.3)',
                                borderRadius: '8px',
                                padding: '6px',
                                zIndex: 1000,
                                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                minWidth: '150px'
                            }}>
                                {onToggleQuickDraw && (
                                    <button 
                                        className="btn-secondary"
                                        style={{ 
                                            padding: '6px 8px', 
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            justifyContent: 'space-between',
                                            background: quickDrawMode ? 'rgba(0, 224, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                            border: quickDrawMode ? '1px solid rgba(0, 224, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)'
                                        }} 
                                        onClick={() => { onToggleQuickDraw(); setShowTogglesMenu(false); }}
                                        title="Quick Draw Mode (Q)"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Check size={14} style={{ opacity: quickDrawMode ? 1 : 0.5 }} />
                                            <span>Quick Draw</span>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{quickDrawMode ? 'ON' : 'OFF'}</span>
                                    </button>
                                )}
                                {onToggleMeasurements && (
                                    <button 
                                        className="btn-secondary"
                                        style={{ 
                                            padding: '6px 8px', 
                                            fontSize: '0.75rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            justifyContent: 'space-between',
                                            background: showMeasurements ? 'rgba(0, 224, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                            border: showMeasurements ? '1px solid rgba(0, 224, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)'
                                        }} 
                                        onClick={() => { onToggleMeasurements(); setShowTogglesMenu(false); }}
                                        title="Show Measurements (M)"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Ruler size={14} style={{ opacity: showMeasurements ? 1 : 0.5 }} />
                                            <span>Measurements</span>
                                        </div>
                                        <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>{showMeasurements ? 'ON' : 'OFF'}</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
                
                {/* Batch Operations */}
                <div style={{ position: 'relative' }}>
                    <button 
                        className="btn-primary" 
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                        onClick={() => setShowBatchMenu(!showBatchMenu)}
                    >
                        <Download size={16} />
                        Batch Operations
                    </button>
                    
                    {showBatchMenu && (
                        <div style={{
                            position: 'absolute',
                            bottom: '100%',
                            left: 0,
                            right: 0,
                            marginBottom: '8px',
                            background: 'rgba(20, 20, 35, 0.95)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(0, 224, 255, 0.3)',
                            borderRadius: '8px',
                            padding: '12px',
                            zIndex: 1000,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            minWidth: '200px',
                            maxWidth: '100%'
                        }}>
                            {/* Delete Operations */}
                            <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '8px', fontWeight: 'bold' }}>Delete:</div>
                            {classes.map(cls => {
                                const count = annotations ? annotations.filter(a => a.class_id === cls.id).length : 0;
                                return (
                                    <button
                                        key={`delete-${cls.id}`}
                                        onClick={() => {
                                            handleBatchDelete(cls.id);
                                            setShowBatchMenu(false);
                                        }}
                                        disabled={count === 0}
                                        style={{
                                            width: '100%',
                                            padding: '6px 8px',
                                            marginBottom: '4px',
                                            background: count > 0 ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                                            border: `1px solid ${count > 0 ? '#ff4444' : 'rgba(255, 255, 255, 0.2)'}`,
                                            borderRadius: '4px',
                                            color: count > 0 ? '#ffaaaa' : '#666',
                                            cursor: count > 0 ? 'pointer' : 'not-allowed',
                                            fontSize: '0.8rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <span>{cls.name}</span>
                                        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>({count})</span>
                                    </button>
                                );
                            })}
                            
                            {/* Change Class Operations */}
                            {onBatchChangeClass && (
                                <>
                                    <div style={{ fontSize: '0.85rem', marginTop: '12px', marginBottom: '8px', color: '#aaa', fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>Change Class:</div>
                                    {classes.map(oldClass => {
                                        const count = annotations ? annotations.filter(a => a.class_id === oldClass.id).length : 0;
                                        if (count === 0) return null;
                                        return (
                                            <div key={`change-${oldClass.id}`} style={{ marginBottom: '8px' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>
                                                    Change {count} "{oldClass.name}" to:
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                    {classes.filter(c => c.id !== oldClass.id).map(newClass => (
                                                        <button
                                                            key={`change-${oldClass.id}-${newClass.id}`}
                                                            className="btn-secondary"
                                                            style={{ 
                                                                flex: '1 1 auto',
                                                                minWidth: '60px',
                                                                fontSize: '0.7rem',
                                                                padding: '4px 6px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}
                                                            onClick={() => {
                                                                onBatchChangeClass(oldClass.id, newClass.id);
                                                                setShowBatchMenu(false);
                                                            }}
                                                        >
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: newClass.color }}></div>
                                                            {newClass.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            )}
                            
                            {/* Alignment Operations */}
                            {onAlignAnnotations && (
                                <>
                                    <div style={{ fontSize: '0.85rem', marginTop: '12px', marginBottom: '8px', color: '#aaa', fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px' }}>Align:</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => { onAlignAnnotations('left'); setShowBatchMenu(false); }}>Left</button>
                                        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => { onAlignAnnotations('right'); setShowBatchMenu(false); }}>Right</button>
                                        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => { onAlignAnnotations('top'); setShowBatchMenu(false); }}>Top</button>
                                        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => { onAlignAnnotations('bottom'); setShowBatchMenu(false); }}>Bottom</button>
                                        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => { onAlignAnnotations('center-h'); setShowBatchMenu(false); }}>Center H</button>
                                        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => { onAlignAnnotations('center-v'); setShowBatchMenu(false); }}>Center V</button>
                                        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => { onAlignAnnotations('distribute-h'); setShowBatchMenu(false); }}>Distribute H</button>
                                        <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '6px' }} onClick={() => { onAlignAnnotations('distribute-v'); setShowBatchMenu(false); }}>Distribute V</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
                </>
            )}
            
            {/* YOLO Pre-annotation Panel */}
            {showYoloPanel && (
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
                }} onClick={() => setShowYoloPanel(false)}>
                    <div className="glass-panel" style={{
                        minWidth: '500px',
                        maxWidth: '700px',
                        padding: '20px',
                        position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 className="neon-text" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Brain size={20} />
                                YOLO Pre-annotation
                            </h3>
                            <button
                                onClick={() => setShowYoloPanel(false)}
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
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#aaa' }}>
                                Model Path (.pt or .onnx)
                            </label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    value={yoloModelPath || ''}
                                    onChange={(e) => setYoloModelPath && setYoloModelPath(e.target.value)}
                                    placeholder="Path to YOLO model file"
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        outline: 'none'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#00e0ff'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)'}
                                />
                                {window.electronAPI && window.electronAPI.selectFile && (
                                    <button
                                        className="btn-primary"
                                        onClick={async () => {
                                            try {
                                                const filePath = await window.electronAPI.selectFile([
                                                    { name: 'YOLO Models', extensions: ['pt', 'onnx'] },
                                                    { name: 'All Files', extensions: ['*'] }
                                                ]);
                                                if (filePath && setYoloModelPath) {
                                                    setYoloModelPath(filePath);
                                                }
                                            } catch (err) {
                                                console.error('Failed to select file:', err);
                                            }
                                        }}
                                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                                    >
                                        Browse
                                    </button>
                                )}
                            </div>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#aaa' }}>
                                Confidence Threshold: {(yoloConfidence || 0.25) * 100}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={yoloConfidence || 0.25}
                                onChange={(e) => setYoloConfidence && setYoloConfidence(parseFloat(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setShowYoloPanel(false)}
                                style={{
                                    padding: '6px 12px',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '4px',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (onPreAnnotate && yoloModelPath) {
                                        onPreAnnotate(yoloModelPath, yoloConfidence || 0.25);
                                        setShowYoloPanel(false);
                                    } else {
                                        alert('Please select a YOLO model file');
                                    }
                                }}
                                className="btn-primary"
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '0.85rem'
                                }}
                            >
                                Run Pre-annotation
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Custom Shortcuts Panel */}
            {showShortcutsPanel && (
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
                }} onClick={() => setShowShortcutsPanel(false)}>
                    <div className="glass-panel" style={{
                        minWidth: '500px',
                        maxWidth: '700px',
                        padding: '20px',
                        position: 'relative',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 className="neon-text" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Settings size={20} />
                                Custom Shortcuts
                            </h3>
                            <button
                                onClick={() => setShowShortcutsPanel(false)}
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
                        <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '15px' }}>
                            Custom shortcuts are saved in localStorage. Default shortcuts cannot be changed.
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                            Note: Custom shortcuts feature is available. You can extend this panel to add custom key mappings.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Sidebar;
