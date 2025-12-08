import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:8000';
const api = axios.create({ baseURL: API_URL, timeout: 10000 });

function ValidationPanel({ annotations, currentImagePath, datasetPath, onFixAnnotation }) {
    const [issues, setIssues] = useState([]);
    const [validating, setValidating] = useState(false);
    const [lastValidated, setLastValidated] = useState(null);

    const validateAnnotations = () => {
        if (!annotations || annotations.length === 0) {
            setIssues([]);
            return;
        }

        setValidating(true);
        const foundIssues = [];

        annotations.forEach((ann, idx) => {
            // Check for invalid dimensions
            if (ann.width <= 0 || ann.height <= 0) {
                foundIssues.push({
                    type: 'invalid',
                    severity: 'error',
                    annotation: ann,
                    index: idx,
                    message: `Annotation ${idx + 1}: Invalid dimensions (${ann.width.toFixed(1)}x${ann.height.toFixed(1)})`
                });
            }

            // Check for too small annotations
            if (ann.width < 5 || ann.height < 5) {
                foundIssues.push({
                    type: 'too_small',
                    severity: 'warning',
                    annotation: ann,
                    index: idx,
                    message: `Annotation ${idx + 1}: Very small (${ann.width.toFixed(1)}x${ann.height.toFixed(1)}px) - may be hard to detect`
                });
            }

            // Check for negative positions
            if (ann.x < 0 || ann.y < 0) {
                foundIssues.push({
                    type: 'negative_pos',
                    severity: 'error',
                    annotation: ann,
                    index: idx,
                    message: `Annotation ${idx + 1}: Negative position (x:${ann.x.toFixed(1)}, y:${ann.y.toFixed(1)})`
                });
            }
        });

        // Check for overlapping annotations (same class)
        annotations.forEach((ann1, idx1) => {
            annotations.forEach((ann2, idx2) => {
                if (idx1 >= idx2) return;
                if (ann1.class_id !== ann2.class_id) return;

                const overlap = calculateOverlap(ann1, ann2);
                if (overlap > 0.5) { // 50% overlap threshold
                    foundIssues.push({
                        type: 'overlap',
                        severity: 'warning',
                        annotation: ann1,
                        index: idx1,
                        message: `Annotations ${idx1 + 1} and ${idx2 + 1}: High overlap (${(overlap * 100).toFixed(0)}%) - possible duplicate`
                    });
                }
            });
        });

        setIssues(foundIssues);
        setValidating(false);
        setLastValidated(new Date());
    };

    const calculateOverlap = (ann1, ann2) => {
        const x1 = Math.max(ann1.x, ann2.x);
        const y1 = Math.max(ann1.y, ann2.y);
        const x2 = Math.min(ann1.x + ann1.width, ann2.x + ann2.width);
        const y2 = Math.min(ann1.y + ann1.height, ann2.y + ann2.height);

        if (x2 <= x1 || y2 <= y1) return 0;

        const intersection = (x2 - x1) * (y2 - y1);
        const area1 = ann1.width * ann1.height;
        const area2 = ann2.width * ann2.height;
        const union = area1 + area2 - intersection;

        return intersection / union;
    };

    useEffect(() => {
        validateAnnotations();
    }, [annotations]);

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    if (issues.length === 0 && !validating) {
        return (
            <div className="glass-panel" style={{
                width: '100%',
                padding: '15px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100px'
            }}>
                <CheckCircle size={24} style={{ color: '#00ff00', marginBottom: '8px' }} />
                <div style={{ color: '#00ff00', fontSize: '0.9rem', fontWeight: 'bold' }}>All Valid</div>
                <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '4px' }}>
                    {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} checked
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel" style={{
            width: '100%',
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '400px',
            overflowY: 'auto'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle size={18} style={{ color: errorCount > 0 ? '#ff4444' : '#ffaa00' }} />
                    <h4 className="neon-text" style={{ margin: 0, fontSize: '0.95rem' }}>Validation</h4>
                </div>
                <button
                    onClick={validateAnnotations}
                    disabled={validating}
                    style={{
                        background: 'rgba(0, 224, 255, 0.1)',
                        border: '1px solid rgba(0, 224, 255, 0.3)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        color: '#00e0ff',
                        cursor: validating ? 'wait' : 'pointer',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                    <RefreshCw size={12} style={{ animation: validating ? 'spin 1s linear infinite' : 'none' }} />
                    Refresh
                </button>
            </div>

            {(errorCount > 0 || warningCount > 0) && (
                <div style={{
                    padding: '8px',
                    background: errorCount > 0 ? 'rgba(255, 68, 68, 0.1)' : 'rgba(255, 170, 0, 0.1)',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    fontSize: '0.85rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#aaa' }}>Errors:</span>
                        <span style={{ color: '#ff4444', fontWeight: 'bold' }}>{errorCount}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ color: '#aaa' }}>Warnings:</span>
                        <span style={{ color: '#ffaa00', fontWeight: 'bold' }}>{warningCount}</span>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {issues.map((issue, idx) => (
                    <div
                        key={idx}
                        style={{
                            padding: '8px',
                            background: issue.severity === 'error' 
                                ? 'rgba(255, 68, 68, 0.1)' 
                                : 'rgba(255, 170, 0, 0.1)',
                            border: `1px solid ${issue.severity === 'error' ? '#ff4444' : '#ffaa00'}`,
                            borderRadius: '6px',
                            fontSize: '0.8rem'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'start', gap: '6px' }}>
                            {issue.severity === 'error' ? (
                                <XCircle size={14} style={{ color: '#ff4444', marginTop: '2px', flexShrink: 0 }} />
                            ) : (
                                <AlertTriangle size={14} style={{ color: '#ffaa00', marginTop: '2px', flexShrink: 0 }} />
                            )}
                            <div style={{ flex: 1, color: issue.severity === 'error' ? '#ffaaaa' : '#ffcc88' }}>
                                {issue.message}
                            </div>
                        </div>
                        {onFixAnnotation && issue.type === 'invalid' && (
                            <button
                                onClick={() => onFixAnnotation(issue.annotation.id)}
                                style={{
                                    marginTop: '6px',
                                    padding: '4px 8px',
                                    background: 'rgba(0, 224, 255, 0.2)',
                                    border: '1px solid rgba(0, 224, 255, 0.5)',
                                    borderRadius: '4px',
                                    color: '#00e0ff',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    width: '100%'
                                }}
                            >
                                Fix Annotation
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {lastValidated && (
                <div style={{
                    marginTop: '12px',
                    paddingTop: '12px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                    fontSize: '0.7rem',
                    color: '#666',
                    textAlign: 'center'
                }}>
                    Last validated: {lastValidated.toLocaleTimeString()}
                </div>
            )}
        </div>
    );
}

export default ValidationPanel;

