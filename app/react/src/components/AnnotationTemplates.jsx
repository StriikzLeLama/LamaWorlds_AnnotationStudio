import React, { useState } from 'react';
import { Save, FolderOpen, Trash2, Copy, Check } from 'lucide-react';

function AnnotationTemplates({ templates, onSaveTemplate, onLoadTemplate, onDeleteTemplate }) {
    const [templateName, setTemplateName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    const handleSave = () => {
        if (!templateName.trim()) {
            alert('Please enter a template name');
            return;
        }
        onSaveTemplate(templateName.trim());
        setTemplateName('');
        setShowSaveDialog(false);
    };

    return (
        <div className="glass-panel" style={{ padding: '15px', margin: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <FolderOpen size={16} style={{ color: '#00e0ff' }} />
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#00e0ff' }}>Annotation Templates</h4>
            </div>

            {!showSaveDialog ? (
                <>
                    <button
                        onClick={() => setShowSaveDialog(true)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            marginBottom: '15px',
                            background: 'rgba(0, 224, 255, 0.1)',
                            border: '1px solid rgba(0, 224, 255, 0.3)',
                            borderRadius: '6px',
                            color: '#00e0ff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            fontSize: '0.85rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.background = 'rgba(0, 224, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.background = 'rgba(0, 224, 255, 0.1)';
                        }}
                    >
                        <Save size={14} />
                        Save Current as Template
                    </button>

                    {templates && templates.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {templates.map((template, idx) => (
                                <div
                                    key={template.id || idx}
                                    style={{
                                        padding: '10px',
                                        background: 'rgba(255, 255, 255, 0.02)',
                                        borderRadius: '6px',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '8px'
                                    }}
                                >
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.85rem', color: '#00e0ff', fontWeight: 'bold', marginBottom: '4px' }}>
                                            {template.name}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                            {template.annotations ? template.annotations.length : 0} annotations
                                        </div>
                                        {template.timestamp && (
                                            <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '2px' }}>
                                                {new Date(template.timestamp).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => onLoadTemplate(template)}
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
                                                gap: '4px'
                                            }}
                                            title="Load template"
                                        >
                                            <Copy size={12} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm(`Delete template "${template.name}"?`)) {
                                                    onDeleteTemplate(template.id || idx);
                                                }
                                            }}
                                            style={{
                                                padding: '6px 10px',
                                                background: 'rgba(255, 0, 0, 0.1)',
                                                border: '1px solid rgba(255, 0, 0, 0.3)',
                                                borderRadius: '4px',
                                                color: '#ff4444',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}
                                            title="Delete template"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '0.85rem' }}>
                            No templates saved yet
                        </div>
                    )}
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Template name..."
                        style={{
                            padding: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '0.85rem'
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSave();
                            } else if (e.key === 'Escape') {
                                setShowSaveDialog(false);
                                setTemplateName('');
                            }
                        }}
                        autoFocus
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleSave}
                            style={{
                                flex: 1,
                                padding: '8px',
                                background: 'rgba(0, 224, 255, 0.2)',
                                border: '1px solid rgba(0, 224, 255, 0.3)',
                                borderRadius: '6px',
                                color: '#00e0ff',
                                cursor: 'pointer',
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}
                        >
                            <Check size={14} />
                            Save
                        </button>
                        <button
                            onClick={() => {
                                setShowSaveDialog(false);
                                setTemplateName('');
                            }}
                            style={{
                                flex: 1,
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '6px',
                                color: '#aaa',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AnnotationTemplates;

