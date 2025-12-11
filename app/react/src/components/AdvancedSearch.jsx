/**
 * @fileoverview AdvancedSearch Component - Advanced Search and Filtering
 * 
 * This component provides advanced search capabilities with:
 * - Text search in image names and annotations
 * - Filter by class
 * - Filter by annotation size (min/max)
 * - Filter by date modified
 * - Filter by tags
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onSearch - Callback when search is performed
 * @param {Function} props.onFilterChange - Callback when filters change
 * @param {Object} props.filters - Current filter state
 * @param {Object} props.imageTags - Image tags object
 * @param {Array<Object>} props.classes - Annotation classes
 * @returns {JSX.Element} The rendered advanced search component
 */

import React, { useState } from 'react';
import { Search, X, Filter, Calendar, Ruler, Tag } from 'lucide-react';

function AdvancedSearch({ 
    onSearch, 
    onFilterChange, 
    filters, 
    imageTags = {},
    classes = []
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [classFilter, setClassFilter] = useState(null);
    const [minSize, setMinSize] = useState('');
    const [maxSize, setMaxSize] = useState('');
    const [minDate, setMinDate] = useState('');
    const [maxDate, setMaxDate] = useState('');
    const [tagFilter, setTagFilter] = useState('');

    const handleSearch = () => {
        if (onSearch) {
            onSearch({
                query: searchQuery,
                classId: classFilter,
                minSize: minSize ? parseFloat(minSize) : null,
                maxSize: maxSize ? parseFloat(maxSize) : null,
                minDate,
                maxDate,
                tag: tagFilter
            });
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setClassFilter(null);
        setMinSize('');
        setMaxSize('');
        setMinDate('');
        setMaxDate('');
        setTagFilter('');
        if (onSearch) {
            onSearch({});
        }
    };

    const allTags = new Set();
    Object.values(imageTags).forEach(tags => {
        if (Array.isArray(tags)) {
            tags.forEach(tag => allTags.add(tag));
        }
    });

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
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
                    gap: '6px'
                }}
                title="Advanced Search"
            >
                <Search size={14} />
                Advanced
            </button>
        );
    }

    return (
        <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '500px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            background: 'rgba(20, 20, 35, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(0, 224, 255, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            zIndex: 10000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            overflowY: 'auto'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="neon-text" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Search size={20} />
                    Advanced Search
                </h3>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#aaa',
                        cursor: 'pointer',
                        padding: '4px'
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* Text Search */}
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#aaa' }}>
                        Search Text
                    </label>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search in image names, annotations..."
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '0.85rem'
                        }}
                    />
                </div>

                {/* Class Filter */}
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#aaa' }}>
                        Filter by Class
                    </label>
                    <select
                        value={classFilter || ''}
                        onChange={(e) => setClassFilter(e.target.value ? parseInt(e.target.value) : null)}
                        style={{
                            width: '100%',
                            padding: '8px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '0.85rem'
                        }}
                    >
                        <option value="">All Classes</option>
                        {Array.isArray(classes) && classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                    </select>
                </div>

                {/* Size Filter */}
                <div>
                    <label style={{ marginBottom: '6px', fontSize: '0.85rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Ruler size={14} />
                        Annotation Size (px²)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input
                            type="number"
                            value={minSize}
                            onChange={(e) => setMinSize(e.target.value)}
                            placeholder="Min size"
                            style={{
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.85rem'
                            }}
                        />
                        <input
                            type="number"
                            value={maxSize}
                            onChange={(e) => setMaxSize(e.target.value)}
                            placeholder="Max size"
                            style={{
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.85rem'
                            }}
                        />
                    </div>
                </div>

                {/* Date Filter */}
                <div>
                    <label style={{ marginBottom: '6px', fontSize: '0.85rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        Date Modified
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input
                            type="date"
                            value={minDate}
                            onChange={(e) => setMinDate(e.target.value)}
                            style={{
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.85rem'
                            }}
                        />
                        <input
                            type="date"
                            value={maxDate}
                            onChange={(e) => setMaxDate(e.target.value)}
                            style={{
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.85rem'
                            }}
                        />
                    </div>
                </div>

                {/* Tag Filter */}
                {allTags.size > 0 && (
                    <div>
                    <label style={{ marginBottom: '6px', fontSize: '0.85rem', color: '#aaa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Tag size={14} />
                        Filter by Tag
                    </label>
                        <select
                            value={tagFilter}
                            onChange={(e) => setTagFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '4px',
                                color: 'white',
                                fontSize: '0.85rem'
                            }}
                        >
                            <option value="">All Tags</option>
                            {Array.from(allTags).map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button
                        onClick={handleSearch}
                        className="btn-primary"
                        style={{ flex: 1, padding: '8px' }}
                    >
                        Search
                    </button>
                    <button
                        onClick={clearFilters}
                        style={{
                            padding: '8px 16px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        Clear
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdvancedSearch;

