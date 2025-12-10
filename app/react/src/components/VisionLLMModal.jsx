import React, { useState, useMemo } from 'react';
import { X, Sparkles, Eye, CheckCircle, RefreshCw, Filter, Loader, TrendingUp, AlertCircle, CheckCircle2, XCircle, Clock, Image as ImageIcon, Settings } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
const api = axios.create({ baseURL: API_URL, timeout: 600000 }); // 10 minutes timeout

function VisionLLMModal({ isOpen, onClose, images, annotations, classes, datasetPath, annotatedImages, onUpdateAnnotations }) {
    const [apiProvider, setApiProvider] = useState('openai');
    const [apiKey, setApiKey] = useState('');
    const [apiEndpoint, setApiEndpoint] = useState('https://api.openai.com/v1/chat/completions');
    const [model, setModel] = useState('gpt-4-vision-preview');
    const [ggufModelPath, setGgufModelPath] = useState('');
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, currentImage: '', percentage: 0 });
    const [results, setResults] = useState(null);
    const [mode, setMode] = useState('verify');
    const [autoApply, setAutoApply] = useState(false);
    
    // Filter states
    const [filterAnnotated, setFilterAnnotated] = useState(null); // null = all, true = annotated, false = not annotated
    const [filterClassId, setFilterClassId] = useState(null);
    const [maxImages, setMaxImages] = useState(null); // Limit number of images to process

    // Calculate filtered images
    const filteredImages = useMemo(() => {
        if (!images || !Array.isArray(images)) return [];
        
        let filtered = [...images];
        
        // Filter by annotation status
        if (filterAnnotated !== null) {
            filtered = filtered.filter(img => {
                const isAnnotated = annotatedImages && annotatedImages.has && annotatedImages.has(img);
                return filterAnnotated ? isAnnotated : !isAnnotated;
            });
        }
        
        // Filter by class
        if (filterClassId !== null && annotations && Array.isArray(annotations)) {
            const imagesWithClass = new Set();
            annotations.forEach(ann => {
                if (ann && ann.class_id === filterClassId && ann.image_name) {
                    imagesWithClass.add(ann.image_name);
                }
            });
            filtered = filtered.filter(img => {
                const imgName = img.split(/[/\\]/).pop();
                return imagesWithClass.has(imgName);
            });
        }
        
        // Limit number of images
        if (maxImages && maxImages > 0) {
            filtered = filtered.slice(0, maxImages);
        }
        
        return filtered;
    }, [images, filterAnnotated, filterClassId, maxImages, annotations, annotatedImages]);

    const handleProcess = async () => {
        if (!filteredImages || filteredImages.length === 0) {
            alert('No images to process with current filters');
            return;
        }

        if (!apiKey && apiProvider !== 'custom' && apiProvider !== 'gguf') {
            alert('Please enter an API key');
            return;
        }

        if (apiProvider === 'gguf' && !ggufModelPath) {
            alert('Please select a .gguf model file');
            return;
        }

        setIsProcessing(true);
        setProgress({ current: 0, total: filteredImages.length, currentImage: '', percentage: 0 });
        setResults(null);

        const endpoint = mode === 'verify' ? '/vision_llm/verify_all' 
                      : mode === 'annotate' ? '/vision_llm/annotate_all'
                      : '/vision_llm/modify_annotations';

        try {
            const requestData = {
                images: filteredImages,
                annotations: mode !== 'annotate' ? annotations : [],
                classes: classes,
                dataset_path: datasetPath,
                api_provider: apiProvider,
                api_key: apiKey,
                api_endpoint: apiEndpoint,
                model: model,
                gguf_model_path: ggufModelPath,
                confidence_threshold: confidenceThreshold,
                mode: mode,
                auto_apply: autoApply
            };

            // Use a custom axios instance with progress tracking
            const response = await api.post(endpoint, requestData, {
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setProgress(prev => ({
                            ...prev,
                            percentage: Math.min(percent, 95) // Cap at 95% until complete
                        }));
                    }
                }
            });

            setProgress(prev => ({ ...prev, percentage: 100 }));
            setResults(response.data);
            
            if (autoApply && response.data.annotations) {
                if (onUpdateAnnotations) {
                    response.data.annotations.forEach((annData) => {
                        if (annData.image_path && annData.annotations) {
                            onUpdateAnnotations(annData.image_path, annData.annotations);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Vision LLM error:', error);
            alert('Error: ' + (error.response?.data?.detail || error.message || 'Unknown error'));
        } finally {
            setIsProcessing(false);
        }
    };

    const applyResults = () => {
        if (!results || !onUpdateAnnotations) return;

        if (mode === 'annotate' && results.annotations) {
            results.annotations.forEach((annData) => {
                if (annData.image_path && annData.annotations) {
                    onUpdateAnnotations(annData.image_path, annData.annotations);
                }
            });
        } else if (mode === 'modify' && results.modifications) {
            results.modifications.forEach((modData) => {
                if (modData.image_path && modData.annotations) {
                    onUpdateAnnotations(modData.image_path, modData.annotations);
                }
            });
        }
        
        alert('Annotations applied successfully!');
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            overflow: 'auto'
        }} onClick={onClose}>
            <div className="glass-panel" style={{
                width: '90%',
                maxWidth: '1200px',
                maxHeight: '95vh',
                padding: '30px',
                position: 'relative',
                overflowY: 'auto',
                background: 'rgba(20, 20, 35, 0.95)',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(0, 224, 255, 0.3)',
                boxShadow: '0 0 30px rgba(0, 224, 255, 0.2)'
            }} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '2px solid rgba(0, 224, 255, 0.2)', paddingBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Sparkles size={28} style={{ color: '#00e0ff' }} />
                        <h2 className="neon-text" style={{ margin: 0, fontSize: '1.5rem' }}>Vision LLM Assistant</h2>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#aaa',
                            cursor: 'pointer',
                            fontSize: '1.5rem',
                            padding: '5px',
                            width: '35px',
                            height: '35px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '4px',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => { e.target.style.background = 'rgba(255, 0, 0, 0.2)'; e.target.style.color = '#ff4444'; }}
                        onMouseLeave={(e) => { e.target.style.background = 'none'; e.target.style.color = '#aaa'; }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Loading Overlay */}
                {isProcessing && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                        borderRadius: '8px'
                    }}>
                        <Loader size={48} className="spin" style={{ color: '#00e0ff', marginBottom: '20px', animation: 'spin 1s linear infinite' }} />
                        <div style={{ fontSize: '1.2rem', color: '#00e0ff', marginBottom: '10px', fontWeight: 'bold' }}>
                            Processing Images...
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#aaa', marginBottom: '20px' }}>
                            {progress.current} / {progress.total} images
                        </div>
                        {progress.currentImage && (
                            <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '20px', maxWidth: '400px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                Current: {progress.currentImage.split(/[/\\]/).pop()}
                            </div>
                        )}
                        <div style={{ width: '400px', height: '8px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                            <div style={{
                                width: `${progress.percentage}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #00e0ff, #56b0ff)',
                                transition: 'width 0.3s ease',
                                boxShadow: '0 0 10px rgba(0, 224, 255, 0.5)'
                            }}></div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            {progress.percentage}% complete
                        </div>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    {/* Left Column - Configuration */}
                    <div>
                        <h3 style={{ color: '#00e0ff', marginBottom: '15px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Settings size={18} />
                            Configuration
                        </h3>

                        {/* Mode Selection */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '6px', display: 'block' }}>Mode:</label>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                    className={mode === 'verify' ? 'btn-primary' : 'btn-secondary'}
                                    style={{ flex: 1, fontSize: '0.8rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                    onClick={() => setMode('verify')}
                                    disabled={isProcessing}
                                >
                                    <Eye size={14} />
                                    Verify
                                </button>
                                <button
                                    className={mode === 'annotate' ? 'btn-primary' : 'btn-secondary'}
                                    style={{ flex: 1, fontSize: '0.8rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                    onClick={() => setMode('annotate')}
                                    disabled={isProcessing}
                                >
                                    <CheckCircle size={14} />
                                    Annotate
                                </button>
                                <button
                                    className={mode === 'modify' ? 'btn-primary' : 'btn-secondary'}
                                    style={{ flex: 1, fontSize: '0.8rem', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                                    onClick={() => setMode('modify')}
                                    disabled={isProcessing}
                                >
                                    <RefreshCw size={14} />
                                    Modify
                                </button>
                            </div>
                        </div>

                        {/* API Provider */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '6px', display: 'block' }}>API Provider:</label>
                            <select
                                value={apiProvider}
                                onChange={(e) => setApiProvider(e.target.value)}
                                style={{ width: '100%', fontSize: '0.85rem' }}
                                disabled={isProcessing}
                            >
                                <option value="openai">OpenAI (GPT-4 Vision)</option>
                                <option value="claude">Claude (Anthropic)</option>
                                <option value="gguf">Local Model (.gguf)</option>
                                <option value="custom">Custom API</option>
                            </select>
                        </div>

                        {/* GGUF Model */}
                        {apiProvider === 'gguf' && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '6px', display: 'block' }}>GGUF Model File:</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                        type="text"
                                        value={ggufModelPath}
                                        onChange={(e) => setGgufModelPath(e.target.value)}
                                        placeholder="C:\path\to\model.gguf"
                                        style={{ flex: 1, fontSize: '0.85rem' }}
                                        disabled={isProcessing}
                                    />
                                    <button
                                        className="btn-secondary"
                                        style={{ fontSize: '0.8rem', padding: '8px 12px' }}
                                        onClick={async () => {
                                            if (window.electronAPI && window.electronAPI.showOpenDialog) {
                                                try {
                                                    const result = await window.electronAPI.showOpenDialog({
                                                        filters: [
                                                            { name: 'GGUF Models', extensions: ['gguf'] },
                                                            { name: 'All Files', extensions: ['*'] }
                                                        ],
                                                        properties: ['openFile']
                                                    });
                                                    if (result && !result.canceled && result.filePaths && result.filePaths.length > 0) {
                                                        setGgufModelPath(result.filePaths[0]);
                                                    }
                                                } catch (err) {
                                                    console.error('Error selecting file:', err);
                                                }
                                            } else {
                                                const path = prompt('Enter the path to your .gguf model file:');
                                                if (path) setGgufModelPath(path);
                                            }
                                        }}
                                        disabled={isProcessing}
                                    >
                                        Browse
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* API Key */}
                        {apiProvider !== 'custom' && apiProvider !== 'gguf' && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '6px', display: 'block' }}>API Key:</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Enter API key"
                                    style={{ width: '100%', fontSize: '0.85rem' }}
                                    disabled={isProcessing}
                                />
                            </div>
                        )}

                        {/* Custom API Endpoint */}
                        {apiProvider === 'custom' && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '6px', display: 'block' }}>API Endpoint:</label>
                                <input
                                    type="text"
                                    value={apiEndpoint}
                                    onChange={(e) => setApiEndpoint(e.target.value)}
                                    placeholder="https://api.example.com/v1/vision"
                                    style={{ width: '100%', fontSize: '0.85rem' }}
                                    disabled={isProcessing}
                                />
                            </div>
                        )}

                        {/* Model */}
                        {apiProvider !== 'gguf' && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '6px', display: 'block' }}>Model:</label>
                                <input
                                    type="text"
                                    value={model}
                                    onChange={(e) => setModel(e.target.value)}
                                    placeholder="gpt-4-vision-preview"
                                    style={{ width: '100%', fontSize: '0.85rem' }}
                                    disabled={isProcessing}
                                />
                            </div>
                        )}

                        {/* Confidence Threshold */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '6px', display: 'block' }}>
                                Confidence Threshold: {confidenceThreshold}
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={confidenceThreshold}
                                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                                style={{ width: '100%' }}
                                disabled={isProcessing}
                            />
                        </div>

                        {/* Auto Apply */}
                        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="autoApply"
                                checked={autoApply}
                                onChange={(e) => setAutoApply(e.target.checked)}
                                disabled={isProcessing}
                            />
                            <label htmlFor="autoApply" style={{ fontSize: '0.85rem', color: '#aaa', cursor: 'pointer' }}>
                                Auto-apply results
                            </label>
                        </div>
                    </div>

                    {/* Right Column - Filters */}
                    <div>
                        <h3 style={{ color: '#00e0ff', marginBottom: '15px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Filter size={18} />
                            Image Filters
                        </h3>

                        {/* Annotation Status Filter */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '6px', display: 'block' }}>Annotation Status:</label>
                            <select
                                value={filterAnnotated === null ? 'all' : filterAnnotated ? 'annotated' : 'not_annotated'}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFilterAnnotated(val === 'all' ? null : val === 'annotated');
                                }}
                                style={{ width: '100%', fontSize: '0.85rem' }}
                                disabled={isProcessing}
                            >
                                <option value="all">All Images</option>
                                <option value="annotated">Annotated Only</option>
                                <option value="not_annotated">Not Annotated Only</option>
                            </select>
                        </div>

                        {/* Class Filter */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '6px', display: 'block' }}>Filter by Class:</label>
                            <select
                                value={filterClassId === null ? 'all' : filterClassId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setFilterClassId(val === 'all' ? null : parseInt(val));
                                }}
                                style={{ width: '100%', fontSize: '0.85rem' }}
                                disabled={isProcessing}
                            >
                                <option value="all">All Classes</option>
                                {classes && Array.isArray(classes) && classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Max Images Limit */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#aaa', marginBottom: '6px', display: 'block' }}>Max Images (0 = all):</label>
                            <input
                                type="number"
                                value={maxImages || ''}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setMaxImages(isNaN(val) || val <= 0 ? null : val);
                                }}
                                placeholder="All images"
                                min="0"
                                style={{ width: '100%', fontSize: '0.85rem' }}
                                disabled={isProcessing}
                            />
                        </div>

                        {/* Filter Summary */}
                        <div style={{ 
                            padding: '12px', 
                            background: 'rgba(0, 224, 255, 0.1)', 
                            borderRadius: '6px', 
                            border: '1px solid rgba(0, 224, 255, 0.3)',
                            marginBottom: '15px'
                        }}>
                            <div style={{ fontSize: '0.85rem', color: '#00e0ff', marginBottom: '6px', fontWeight: 'bold' }}>
                                Filter Summary:
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#aaa' }}>
                                <div>Total Images: {images ? images.length : 0}</div>
                                <div>Filtered Images: {filteredImages.length}</div>
                                <div style={{ marginTop: '4px', color: filteredImages.length > 0 ? '#00ff00' : '#ff4444' }}>
                                    {filteredImages.length > 0 ? 'Ready to process' : 'No images match filters'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results */}
                {results && !isProcessing && (
                    <div style={{ 
                        marginTop: '20px', 
                        padding: '20px', 
                        background: 'rgba(0, 224, 255, 0.1)', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(0, 224, 255, 0.3)'
                    }}>
                        <h3 style={{ color: '#00e0ff', marginBottom: '15px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={18} />
                            Results
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                            {results.overall_score !== undefined && (
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>Overall Score</div>
                                    <div style={{ fontSize: '1.5rem', color: results.overall_score >= 0.7 ? '#00ff00' : results.overall_score >= 0.5 ? '#ffaa00' : '#ff4444', fontWeight: 'bold' }}>
                                        {(results.overall_score * 100).toFixed(1)}%
                                    </div>
                                </div>
                            )}
                            {results.verified_count !== undefined && (
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>Verified</div>
                                    <div style={{ fontSize: '1.5rem', color: '#00e0ff', fontWeight: 'bold' }}>
                                        {results.verified_count} / {results.total_count || filteredImages.length}
                                    </div>
                                </div>
                            )}
                            {results.annotations_count !== undefined && (
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>Annotations Created</div>
                                    <div style={{ fontSize: '1.5rem', color: '#00e0ff', fontWeight: 'bold' }}>
                                        {results.annotations_count}
                                    </div>
                                </div>
                            )}
                            {results.modifications_count !== undefined && (
                                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '4px' }}>Modifications</div>
                                    <div style={{ fontSize: '1.5rem', color: '#00e0ff', fontWeight: 'bold' }}>
                                        {results.modifications_count}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* Detailed Results - Show confidence breakdown for annotations */}
                        {mode === 'annotate' && results.annotations && results.annotations.length > 0 && (
                            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <h4 style={{ color: '#00e0ff', marginBottom: '10px', fontSize: '0.95rem' }}>Annotation Details</h4>
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                    {results.annotations.map((annData, idx) => {
                                        if (!annData.annotations || annData.annotations.length === 0) return null;
                                        const avgConfidence = annData.annotations.reduce((sum, ann) => sum + (ann.confidence || 1.0), 0) / annData.annotations.length;
                                        const minConfidence = Math.min(...annData.annotations.map(ann => ann.confidence || 1.0));
                                        const maxConfidence = Math.max(...annData.annotations.map(ann => ann.confidence || 1.0));
                                        return (
                                            <div key={idx} style={{ 
                                                padding: '8px', 
                                                marginBottom: '8px', 
                                                background: 'rgba(255,255,255,0.05)', 
                                                borderRadius: '6px',
                                                fontSize: '0.8rem'
                                            }}>
                                                <div style={{ color: '#aaa', marginBottom: '4px', wordBreak: 'break-all' }}>
                                                    {annData.image_path?.split(/[/\\]/).pop() || `Image ${idx + 1}`}
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ color: '#888' }}>{annData.annotations.length} annotation(s)</span>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <span style={{ color: '#888', fontSize: '0.75rem' }}>Avg:</span>
                                                        <span style={{ 
                                                            color: avgConfidence >= 0.7 ? '#00ff00' : avgConfidence >= 0.5 ? '#ffaa00' : '#ff4444',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            {(avgConfidence * 100).toFixed(1)}%
                                                        </span>
                                                        <span style={{ color: '#666', fontSize: '0.7rem' }}>
                                                            ({Math.round(minConfidence * 100)}-{Math.round(maxConfidence * 100)}%)
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        
                        {!autoApply && (mode === 'annotate' || mode === 'modify') && (
                            <button
                                className="btn-primary"
                                style={{ width: '100%', padding: '10px', fontSize: '0.9rem', marginTop: '15px' }}
                                onClick={applyResults}
                            >
                                Apply Results
                            </button>
                        )}
                    </div>
                )}

                {/* Action Button */}
                <div style={{ marginTop: '25px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        className="btn-secondary"
                        onClick={onClose}
                        style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleProcess}
                        disabled={isProcessing || filteredImages.length === 0}
                        style={{ 
                            padding: '10px 30px', 
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: (isProcessing || filteredImages.length === 0) ? 0.5 : 1,
                            cursor: (isProcessing || filteredImages.length === 0) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isProcessing ? (
                            <>
                                <Loader size={16} className="spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={16} />
                                Start {mode === 'verify' ? 'Verification' : mode === 'annotate' ? 'Annotation' : 'Modification'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}

export default VisionLLMModal;

