import React, { useState, useMemo } from 'react';
import { Users, Plus, Trash2, X, Check } from 'lucide-react';
import CollapsiblePanel from './CollapsiblePanel';

function AnnotationGroups({ annotations, groups, onCreateGroup, onDeleteGroup, onSelectGroup, selectedGroupId, classes }) {
    const [newGroupName, setNewGroupName] = useState('');
    const [showCreateDialog, setShowCreateDialog] = useState(false);

    const groupsWithInfo = useMemo(() => {
        if (!groups || !annotations) return [];
        
        return Object.entries(groups).map(([groupId, annotationIds]) => {
            const groupAnnotations = annotations.filter(ann => 
                ann && ann.id && annotationIds.includes(ann.id)
            );
            
            const classCounts = {};
            groupAnnotations.forEach(ann => {
                if (ann && typeof ann.class_id === 'number') {
                    classCounts[ann.class_id] = (classCounts[ann.class_id] || 0) + 1;
                }
            });
            
            return {
                id: groupId,
                name: `Group ${groupId}`,
                annotationIds,
                count: groupAnnotations.length,
                classCounts
            };
        });
    }, [groups, annotations]);

    const handleCreateGroup = () => {
        if (!newGroupName.trim()) {
            alert('Please enter a group name');
            return;
        }
        
        const selectedAnnotations = annotations.filter(ann => 
            ann && ann.id && document.querySelector(`[data-annotation-id="${ann.id}"]`)?.classList.contains('selected')
        );
        
        if (selectedAnnotations.length === 0) {
            alert('Please select annotations first');
            return;
        }
        
        const groupId = Date.now().toString();
        const annotationIds = selectedAnnotations.map(ann => ann.id);
        
        onCreateGroup(groupId, newGroupName.trim(), annotationIds);
        setNewGroupName('');
        setShowCreateDialog(false);
    };

    return (
        <CollapsiblePanel 
            title="Annotation Groups" 
            icon={Users}
            containerStyle={{ margin: '10px' }}
        >
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px' }}>
                <button
                    onClick={() => setShowCreateDialog(true)}
                    style={{
                        padding: '4px 8px',
                        background: 'rgba(0, 224, 255, 0.1)',
                        border: '1px solid rgba(0, 224, 255, 0.3)',
                        borderRadius: '4px',
                        color: '#00e0ff',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                    title="Create group from selected annotations"
                >
                    <Plus size={12} />
                    New
                </button>
            </div>

            {showCreateDialog ? (
                <div style={{ 
                    padding: '10px', 
                    background: 'rgba(0, 224, 255, 0.05)', 
                    borderRadius: '6px', 
                    border: '1px solid rgba(0, 224, 255, 0.2)',
                    marginBottom: '10px'
                }}>
                    <input
                        type="text"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Group name..."
                        style={{
                            width: '100%',
                            padding: '6px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '0.85rem',
                            marginBottom: '8px'
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleCreateGroup();
                            } else if (e.key === 'Escape') {
                                setShowCreateDialog(false);
                                setNewGroupName('');
                            }
                        }}
                        autoFocus
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                            onClick={handleCreateGroup}
                            style={{
                                flex: 1,
                                padding: '6px',
                                background: 'rgba(0, 224, 255, 0.2)',
                                border: '1px solid rgba(0, 224, 255, 0.3)',
                                borderRadius: '4px',
                                color: '#00e0ff',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                            }}
                        >
                            <Check size={12} />
                            Create
                        </button>
                        <button
                            onClick={() => {
                                setShowCreateDialog(false);
                                setNewGroupName('');
                            }}
                            style={{
                                flex: 1,
                                padding: '6px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: '#aaa',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                            }}
                        >
                            <X size={12} />
                            Cancel
                        </button>
                    </div>
                </div>
            ) : null}

            {groupsWithInfo.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {groupsWithInfo.map((group) => (
                        <div
                            key={group.id}
                            onClick={() => onSelectGroup && onSelectGroup(group.id)}
                            style={{
                                padding: '10px',
                                background: selectedGroupId === group.id 
                                    ? 'rgba(0, 224, 255, 0.15)' 
                                    : 'rgba(255, 255, 255, 0.02)',
                                borderRadius: '6px',
                                border: selectedGroupId === group.id
                                    ? '1px solid rgba(0, 224, 255, 0.5)'
                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                    fontSize: '0.85rem', 
                                    fontWeight: 'bold', 
                                    color: selectedGroupId === group.id ? '#00e0ff' : '#fff',
                                    marginBottom: '4px'
                                }}>
                                    {group.name}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                    {group.count} annotation{group.count !== 1 ? 's' : ''}
                                </div>
                                {classes && Object.keys(group.classCounts).length > 0 && (
                                    <div style={{ 
                                        display: 'flex', 
                                        gap: '4px', 
                                        marginTop: '4px',
                                        flexWrap: 'wrap'
                                    }}>
                                        {Object.entries(group.classCounts).map(([classId, count]) => {
                                            const cls = classes.find(c => c && c.id === parseInt(classId));
                                            return (
                                                <span
                                                    key={classId}
                                                    style={{
                                                        padding: '2px 6px',
                                                        background: cls ? `${cls.color}33` : 'rgba(255,255,255,0.1)',
                                                        border: `1px solid ${cls ? cls.color : '#666'}`,
                                                        borderRadius: '3px',
                                                        fontSize: '0.7rem',
                                                        color: cls ? cls.color : '#aaa'
                                                    }}
                                                >
                                                    {cls ? cls.name : `Class ${classId}`}: {count}
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (window.confirm(`Delete group "${group.name}"?`)) {
                                        onDeleteGroup && onDeleteGroup(group.id);
                                    }
                                }}
                                style={{
                                    padding: '4px 6px',
                                    background: 'rgba(255, 68, 68, 0.1)',
                                    border: '1px solid rgba(255, 68, 68, 0.3)',
                                    borderRadius: '4px',
                                    color: '#ffaaaa',
                                    cursor: 'pointer',
                                    fontSize: '0.7rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginLeft: '8px'
                                }}
                                title="Delete group"
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                    No groups created yet
                </div>
            )}
        </CollapsiblePanel>
    );
}

export default AnnotationGroups;

