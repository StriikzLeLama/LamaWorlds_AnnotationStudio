import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Upload, Download, Save, FolderOpen } from 'lucide-react';

function Sidebar({ classes, setClasses, selectedClassId, setSelectedClassId, selectedAnnotationId, onChangeAnnotationClass, onImportYaml, annotations, onBatchDeleteClass }) {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [newClassName, setNewClassName] = useState('');
    const [showBatchMenu, setShowBatchMenu] = useState(false);

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
        if (!newClassName.trim()) {
            return;
        }
        const colors = ["#00e0ff", "#56b0ff", "#ff6b6b", "#4ecdc4", "#ffe66d", "#a8e6cf", "#ff8b94", "#c7ceea"];
        const newId = classes.length > 0 ? Math.max(...classes.map(c => c.id)) + 1 : 0;
        const newClass = {
            id: newId,
            name: newClassName.trim(),
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
        <div className="glass-panel" style={{ width: '250px', margin: '10px', padding: '15px', display: 'flex', flexDirection: 'column' }}>
            <h3 className="neon-text" style={{ marginTop: 0 }}>Classes</h3>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {classes.map(cls => (
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
                
                <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                    <button 
                        className="btn-primary" 
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px' }} 
                        onClick={onImportYaml}
                    >
                        <Upload size={14} />
                        YAML
                    </button>
                    <button 
                        className="btn-primary" 
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px' }} 
                        onClick={loadTemplate}
                    >
                        <FolderOpen size={14} />
                        Load
                    </button>
                    <button 
                        className="btn-primary" 
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px' }} 
                        onClick={saveTemplate}
                    >
                        <Save size={14} />
                        Save
                    </button>
                </div>
                
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
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '8px' }}>Delete all annotations by class:</div>
                            {classes.map(cls => {
                                const count = annotations ? annotations.filter(a => a.class_id === cls.id).length : 0;
                                return (
                                    <button
                                        key={cls.id}
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
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Sidebar;
