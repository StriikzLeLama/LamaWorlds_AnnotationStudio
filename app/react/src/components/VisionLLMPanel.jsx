import React, { useState } from 'react';
import { Eye, CheckCircle, XCircle, AlertTriangle, Loader, Sparkles, Settings, Play, Pause, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
const api = axios.create({ baseURL: API_URL, timeout: 300000 }); // 5 minutes timeout for LLM operations

function VisionLLMPanel({ images, annotations, classes, datasetPath, onUpdateAnnotations, onVerifyAll }) {
    const [showPanel, setShowPanel] = useState(false);
    const [apiProvider, setApiProvider] = useState('openai'); // 'openai', 'claude', 'custom', 'gguf'
    const [apiKey, setApiKey] = useState('');
    const [apiEndpoint, setApiEndpoint] = useState('https://api.openai.com/v1/chat/completions');
    const [model, setModel] = useState('gpt-4-vision-preview');
    const [ggufModelPath, setGgufModelPath] = useState('');
    const [confidenceThreshold, setConfidenceThreshold] = useState(0.7);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0, currentImage: '' });
    const [results, setResults] = useState(null);
    const [mode, setMode] = useState('verify'); // 'verify', 'annotate', 'modify'
    const [autoApply, setAutoApply] = useState(false);

    const handleVerifyAll = async () => {
        if (!images || images.length === 0) {
            alert('No images to verify');
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
        setProgress({ current: 0, total: images.length, currentImage: '' });
        setResults(null);

        try {
            const response = await api.post('/vision_llm/verify_all', {
                images: images,
                annotations: annotations,
                classes: classes,
                dataset_path: datasetPath,
                api_provider: apiProvider,
                api_key: apiKey,
                api_endpoint: apiEndpoint,
                model: model,
                gguf_model_path: ggufModelPath,
                confidence_threshold: confidenceThreshold,
                mode: mode
            }, {
                onUploadProgress: (progressEvent) => {
                    // Progress tracking would be handled by backend
                }
            });

            setResults(response.data);
            if (onVerifyAll) {
                onVerifyAll(response.data);
            }
        } catch (error) {
            console.error('Vision LLM verification error:', error);
            alert('Error during verification: ' + (error.response?.data?.detail || error.message));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAnnotateAll = async () => {
        if (!images || images.length === 0) {
            alert('No images to annotate');
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
        setProgress({ current: 0, total: images.length, currentImage: '' });
        setResults(null);

        try {
            const response = await api.post('/vision_llm/annotate_all', {
                images: images,
                classes: classes,
                dataset_path: datasetPath,
                api_provider: apiProvider,
                api_key: apiKey,
                api_endpoint: apiEndpoint,
                model: model,
                gguf_model_path: ggufModelPath,
                confidence_threshold: confidenceThreshold,
                auto_apply: autoApply
            });

            setResults(response.data);
            
            if (autoApply && response.data.annotations) {
                // Apply annotations automatically
                if (onUpdateAnnotations) {
                    response.data.annotations.forEach((annData, idx) => {
                        if (annData.image_path && annData.annotations) {
                            onUpdateAnnotations(annData.image_path, annData.annotations);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Vision LLM annotation error:', error);
            alert('Error during annotation: ' + (error.response?.data?.detail || error.message));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleModifyAnnotations = async () => {
        if (!images || images.length === 0 || !annotations || annotations.length === 0) {
            alert('No annotations to modify');
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
        setProgress({ current: 0, total: images.length, currentImage: '' });
        setResults(null);

        try {
            const response = await api.post('/vision_llm/modify_annotations', {
                images: images,
                annotations: annotations,
                classes: classes,
                dataset_path: datasetPath,
                api_provider: apiProvider,
                api_key: apiKey,
                api_endpoint: apiEndpoint,
                model: model,
                gguf_model_path: ggufModelPath,
                confidence_threshold: confidenceThreshold,
                auto_apply: autoApply
            });

            setResults(response.data);
            
            if (autoApply && response.data.modifications) {
                // Apply modifications automatically
                if (onUpdateAnnotations) {
                    response.data.modifications.forEach((modData) => {
                        if (modData.image_path && modData.annotations) {
                            onUpdateAnnotations(modData.image_path, modData.annotations);
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Vision LLM modification error:', error);
            alert('Error during modification: ' + (error.response?.data?.detail || error.message));
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

    if (!showPanel) {
        return (
            <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                <button
                    className="btn-primary"
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem', padding: '6px' }}
                    onClick={() => setShowPanel(true)}
                >
                    <Sparkles size={14} />
                    Vision LLM Assistant
                </button>
            </div>
        );
    }

    return (
        <div style={{ 
            marginTop: '10px', 
            borderTop: '1px solid rgba(255,255,255,0.1)', 
            paddingTop: '10px',
            background: 'rgba(0, 224, 255, 0.05)',
            borderRadius: '6px',
            padding: '10px'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#00e0ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} />
                    Vision LLM Assistant
                </h4>
                <button
                    onClick={() => setShowPanel(false)}
                    style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: '4px' }}
                >
                    <XCircle size={16} />
                </button>
            </div>

            {/* Mode Selection */}
            <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Mode:</label>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        className={mode === 'verify' ? 'btn-primary' : 'btn-secondary'}
                        style={{ flex: 1, fontSize: '0.75rem', padding: '4px' }}
                        onClick={() => setMode('verify')}
                    >
                        Verify
                    </button>
                    <button
                        className={mode === 'annotate' ? 'btn-primary' : 'btn-secondary'}
                        style={{ flex: 1, fontSize: '0.75rem', padding: '4px' }}
                        onClick={() => setMode('annotate')}
                    >
                        Annotate
                    </button>
                    <button
                        className={mode === 'modify' ? 'btn-primary' : 'btn-secondary'}
                        style={{ flex: 1, fontSize: '0.75rem', padding: '4px' }}
                        onClick={() => setMode('modify')}
                    >
                        Modify
                    </button>
                </div>
            </div>

            {/* API Configuration */}
            <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>API Provider:</label>
                <select
                    value={apiProvider}
                    onChange={(e) => setApiProvider(e.target.value)}
                    style={{ width: '100%', padding: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: 'white', fontSize: '0.75rem' }}
                >
                    <option value="openai">OpenAI (GPT-4 Vision)</option>
                    <option value="claude">Claude (Anthropic)</option>
                    <option value="gguf">Local Model (.gguf)</option>
                    <option value="custom">Custom API</option>
                </select>
            </div>

            {/* GGUF Model Selection */}
            {apiProvider === 'gguf' && (
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>GGUF Model File:</label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                            type="text"
                            value={ggufModelPath}
                            onChange={(e) => setGgufModelPath(e.target.value)}
                            placeholder="C:\path\to\model.gguf"
                            style={{ flex: 1, padding: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: 'white', fontSize: '0.75rem' }}
                        />
                        <button
                            className="btn-secondary"
                            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                            onClick={async () => {
                                // Use Electron's dialog to select file
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
                                        alert('Please enter the path manually');
                                    }
                                } else {
                                    // Fallback: prompt for path
                                    const path = prompt('Enter the path to your .gguf model file:');
                                    if (path) {
                                        setGgufModelPath(path);
                                    }
                                }
                            }}
                        >
                            Browse
                        </button>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>
                        Supports LLaVA and other vision models in .gguf format. Note: Full vision support requires models with vision capabilities.
                    </div>
                </div>
            )}

            {apiProvider !== 'custom' && apiProvider !== 'gguf' && (
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>API Key:</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="Enter API key"
                        style={{ width: '100%', padding: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: 'white', fontSize: '0.75rem' }}
                    />
                </div>
            )}

            {apiProvider === 'custom' && (
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>API Endpoint:</label>
                    <input
                        type="text"
                        value={apiEndpoint}
                        onChange={(e) => setApiEndpoint(e.target.value)}
                        placeholder="https://api.example.com/v1/vision"
                        style={{ width: '100%', padding: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: 'white', fontSize: '0.75rem' }}
                    />
                </div>
            )}

            {apiProvider !== 'gguf' && (
                <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>Model:</label>
                    <input
                        type="text"
                        value={model}
                        onChange={(e) => setModel(e.target.value)}
                        placeholder="gpt-4-vision-preview"
                        style={{ width: '100%', padding: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '4px', color: 'white', fontSize: '0.75rem' }}
                    />
                </div>
            )}

            <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px', display: 'block' }}>
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
                />
            </div>

            <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                    type="checkbox"
                    id="autoApply"
                    checked={autoApply}
                    onChange={(e) => setAutoApply(e.target.checked)}
                />
                <label htmlFor="autoApply" style={{ fontSize: '0.75rem', color: '#aaa', cursor: 'pointer' }}>
                    Auto-apply results
                </label>
            </div>

            {/* Progress */}
            {isProcessing && (
                <div style={{ marginBottom: '10px', padding: '8px', background: 'rgba(0, 224, 255, 0.1)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#00e0ff', marginBottom: '4px' }}>
                        Processing: {progress.current} / {progress.total}
                    </div>
                    {progress.currentImage && (
                        <div style={{ fontSize: '0.7rem', color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {progress.currentImage}
                        </div>
                    )}
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                        <div style={{ 
                            width: `${(progress.current / progress.total) * 100}%`, 
                            height: '100%', 
                            background: '#00e0ff',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                </div>
            )}

            {/* Results */}
            {results && !isProcessing && (
                <div style={{ marginBottom: '10px', padding: '8px', background: 'rgba(0, 224, 255, 0.1)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '0.75rem', color: '#00e0ff', marginBottom: '4px', fontWeight: 'bold' }}>
                        Results:
                    </div>
                    {results.overall_score !== undefined && (
                        <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px' }}>
                            Overall Score: <span style={{ color: results.overall_score >= 0.7 ? '#00ff00' : results.overall_score >= 0.5 ? '#ffaa00' : '#ff4444' }}>
                                {(results.overall_score * 100).toFixed(1)}%
                            </span>
                        </div>
                    )}
                    {results.verified_count !== undefined && (
                        <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px' }}>
                            Verified: {results.verified_count} / {results.total_count || images.length}
                        </div>
                    )}
                    {results.annotations_count !== undefined && (
                        <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px' }}>
                            Annotations Created: {results.annotations_count}
                        </div>
                    )}
                    {results.modifications_count !== undefined && (
                        <div style={{ fontSize: '0.75rem', color: '#aaa', marginBottom: '4px' }}>
                            Modifications: {results.modifications_count}
                        </div>
                    )}
                    {!autoApply && (mode === 'annotate' || mode === 'modify') && (
                        <button
                            className="btn-primary"
                            style={{ width: '100%', marginTop: '8px', fontSize: '0.75rem', padding: '4px' }}
                            onClick={applyResults}
                        >
                            Apply Results
                        </button>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {mode === 'verify' && (
                    <button
                        className="btn-primary"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={handleVerifyAll}
                        disabled={isProcessing}
                    >
                        {isProcessing ? <Loader size={14} className="spin" /> : <Eye size={14} />}
                        Verify All Images
                    </button>
                )}
                {mode === 'annotate' && (
                    <button
                        className="btn-primary"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={handleAnnotateAll}
                        disabled={isProcessing}
                    >
                        {isProcessing ? <Loader size={14} className="spin" /> : <CheckCircle size={14} />}
                        Annotate All Images
                    </button>
                )}
                {mode === 'modify' && (
                    <button
                        className="btn-primary"
                        style={{ width: '100%', fontSize: '0.75rem', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        onClick={handleModifyAnnotations}
                        disabled={isProcessing}
                    >
                        {isProcessing ? <Loader size={14} className="spin" /> : <RefreshCw size={14} />}
                        Modify Annotations
                    </button>
                )}
            </div>
        </div>
    );
}

export default VisionLLMPanel;

