import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X, Upload } from 'lucide-react';

function Sidebar({ classes, setClasses, selectedClassId, setSelectedClassId, selectedAnnotationId, onChangeAnnotationClass, onImportYaml }) {
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [newClassName, setNewClassName] = useState('');

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
                <button 
                    className="btn-primary" 
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} 
                    onClick={onImportYaml}
                >
                    <Upload size={16} />
                    Import YAML
                </button>
            </div>
        </div>
    );
}

export default Sidebar;
