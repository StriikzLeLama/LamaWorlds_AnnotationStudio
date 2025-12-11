import React, { useState } from 'react';
import { X, FolderOpen, Merge, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
const api = axios.create({ baseURL: API_URL, timeout: 300000 }); // 5 minutes timeout for large merges

function DatasetMergeModal({ isOpen, onClose, onMergeComplete }) {
    const [datasets, setDatasets] = useState([]);
    const [outputPath, setOutputPath] = useState('');
    const [merging, setMerging] = useState(false);
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState(null);
    const [mergeResult, setMergeResult] = useState(null);

    const addDataset = async () => {
        if (!window.electronAPI || !window.electronAPI.selectDirectory) {
            alert("Electron API not available. Please run in Electron.");
            return;
        }

        try {
            const dirPath = await window.electronAPI.selectDirectory();
            if (dirPath && !datasets.includes(dirPath)) {
                setDatasets([...datasets, dirPath]);
                setError(null);
            }
        } catch (err) {
            console.error('Error selecting directory:', err);
            setError('Failed to select directory');
        }
    };

    const removeDataset = (index) => {
        setDatasets(datasets.filter((_, i) => i !== index));
    };

    const selectOutputPath = async () => {
        if (!window.electronAPI || !window.electronAPI.selectDirectory) {
            alert("Electron API not available. Please run in Electron.");
            return;
        }

        try {
            const dirPath = await window.electronAPI.selectDirectory();
            if (dirPath) {
                setOutputPath(dirPath);
                setError(null);
            }
        } catch (err) {
            console.error('Error selecting output directory:', err);
            setError('Failed to select output directory');
        }
    };

    const handleMerge = async () => {
        if (datasets.length < 2) {
            setError('Please add at least 2 datasets to merge');
            return;
        }

        if (!outputPath) {
            setError('Please select an output directory');
            return;
        }

        setMerging(true);
        setError(null);
        setProgress({ message: 'Starting merge...', current: 0, total: datasets.length });
        setMergeResult(null);

        try {
            const response = await api.post('/merge_datasets', {
                dataset_paths: datasets,
                output_path: outputPath
            }, {
                timeout: 300000, // 5 minutes
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress({
                            message: 'Uploading data...',
                            current: percent,
                            total: 100
                        });
                    }
                }
            });

            setMergeResult(response.data);
            setProgress(null);
            
            if (onMergeComplete) {
                onMergeComplete(response.data);
            }
        } catch (err) {
            console.error('Merge error:', err);
            setError(err.response?.data?.detail || err.message || 'Failed to merge datasets');
            setProgress(null);
        } finally {
            setMerging(false);
        }
    };

    if (!isOpen) return null;

    return (
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
        }} onClick={onClose}>
            <div className="glass-panel" style={{
                minWidth: '600px',
                maxWidth: '800px',
                width: '90%',
                maxHeight: '90vh',
                padding: '20px',
                position: 'relative',
                overflowY: 'auto',
                background: 'rgba(20, 20, 35, 0.95)',
                backdropFilter: 'blur(10px)'
            }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 className="neon-text" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Merge size={24} />
                        Merge Datasets
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

                {error && (
                    <div style={{
                        padding: '12px',
                        background: 'rgba(255, 68, 68, 0.1)',
                        border: '1px solid #ff4444',
                        borderRadius: '6px',
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#ffaaaa'
                    }}>
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {mergeResult && (
                    <div style={{
                        padding: '12px',
                        background: 'rgba(0, 255, 0, 0.1)',
                        border: '1px solid #00ff00',
                        borderRadius: '6px',
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#aaffaa'
                    }}>
                        <CheckCircle size={18} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Merge completed successfully!</div>
                            <div style={{ fontSize: '0.85rem', color: '#88ff88' }}>
                                Merged {mergeResult.total_images} images and {mergeResult.total_annotations} annotations.
                                Created {mergeResult.total_classes} classes.
                            </div>
                        </div>
                    </div>
                )}

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#aaa' }}>
                        Datasets to Merge (at least 2 required):
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
                        {datasets.map((path, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '6px',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                <FolderOpen size={16} style={{ color: '#00e0ff' }} />
                                <span style={{ flex: 1, fontSize: '0.85rem', color: '#aaa', wordBreak: 'break-all' }}>
                                    {path}
                                </span>
                                <button
                                    onClick={() => removeDataset(index)}
                                    style={{
                                        background: 'rgba(255, 68, 68, 0.1)',
                                        border: '1px solid #ff4444',
                                        borderRadius: '4px',
                                        color: '#ff4444',
                                        cursor: 'pointer',
                                        padding: '4px 8px',
                                        fontSize: '0.75rem'
                                    }}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={addDataset}
                        className="btn-primary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        <FolderOpen size={16} />
                        Add Dataset
                    </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#aaa' }}>
                        Output Directory:
                    </label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={outputPath}
                            onChange={(e) => setOutputPath(e.target.value)}
                            placeholder="Select output directory..."
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
                        <button
                            onClick={selectOutputPath}
                            className="btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px' }}
                        >
                            <FolderOpen size={16} />
                            Browse
                        </button>
                    </div>
                </div>

                {progress && (
                    <div style={{
                        padding: '12px',
                        background: 'rgba(0, 224, 255, 0.1)',
                        border: '1px solid rgba(0, 224, 255, 0.3)',
                        borderRadius: '6px',
                        marginBottom: '15px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem', color: '#00e0ff' }}>
                            <span>{progress.message}</span>
                            <span>{progress.current} / {progress.total}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${(progress.current / progress.total) * 100}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #00e0ff, #56b0ff)',
                                transition: 'width 0.3s ease'
                            }}></div>
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onClose}
                        disabled={merging}
                        style={{
                            padding: '8px 16px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: merging ? 'not-allowed' : 'pointer',
                            fontSize: '0.85rem',
                            opacity: merging ? 0.5 : 1
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMerge}
                        disabled={merging || datasets.length < 2 || !outputPath}
                        className="btn-primary"
                        style={{
                            padding: '8px 16px',
                            fontSize: '0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: (merging || datasets.length < 2 || !outputPath) ? 0.5 : 1,
                            cursor: (merging || datasets.length < 2 || !outputPath) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Merge size={16} />
                        {merging ? 'Merging...' : 'Merge Datasets'}
                    </button>
                </div>

                <div style={{ marginTop: '20px', padding: '12px', background: 'rgba(0, 224, 255, 0.05)', borderRadius: '6px', fontSize: '0.8rem', color: '#888' }}>
                    <div style={{ fontWeight: 'bold', color: '#00e0ff', marginBottom: '6px' }}>What will be merged:</div>
                    <ul style={{ margin: 0, paddingLeft: '20px' }}>
                        <li>All images from all datasets</li>
                        <li>All annotations (labels will be updated to match merged classes)</li>
                        <li>All classes (merged into a single YAML file)</li>
                        <li>Duplicate class names will be merged into one class</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default DatasetMergeModal;

