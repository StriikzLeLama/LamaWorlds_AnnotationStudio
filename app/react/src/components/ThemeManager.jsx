/**
 * @fileoverview ThemeManager Component - Theme Selection and Management
 * 
 * This component provides theme management with:
 * - Dark theme (default)
 * - Light theme
 * - Cyberpunk theme
 * - Theme persistence in localStorage
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.currentTheme - Current theme name
 * @param {Function} props.onThemeChange - Function to change theme
 * @returns {JSX.Element} The rendered theme manager component
 */

import React, { useState, useEffect } from 'react';
import { Palette, Moon, Sun, Sparkles } from 'lucide-react';

/**
 * Available themes configuration
 * @constant {Object}
 */
const THEMES = {
    'dark': {
        name: 'Dark',
        icon: Moon,
        colors: {
            '--bg-dark': '#050510',
            '--bg-panel': 'rgba(20, 20, 35, 0.7)',
            '--neon-blue': '#00e0ff',
            '--neon-cyan': '#56b0ff',
            '--text-primary': '#ffffff',
            '--text-secondary': '#a0a0b0'
        }
    },
    'light': {
        name: 'Light',
        icon: Sun,
        colors: {
            '--bg-dark': '#f5f5f5',
            '--bg-panel': 'rgba(255, 255, 255, 0.9)',
            '--neon-blue': '#0066cc',
            '--neon-cyan': '#0088ff',
            '--text-primary': '#000000',
            '--text-secondary': '#333333'
        }
    },
    'cyberpunk': {
        name: 'Cyberpunk',
        icon: Sparkles,
        colors: {
            '--bg-dark': '#0a0a1a',
            '--bg-panel': 'rgba(20, 10, 30, 0.8)',
            '--neon-blue': '#ff00ff',
            '--neon-cyan': '#00ffff',
            '--text-primary': '#ffffff',
            '--text-secondary': '#ff00ff'
        }
    }
};

function ThemeManager({ currentTheme, onThemeChange }) {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        
        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    const applyTheme = (themeKey) => {
        const theme = THEMES[themeKey];
        if (!theme) return;

        Object.entries(theme.colors).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });

        if (onThemeChange) {
            onThemeChange(themeKey);
        }
        try {
            localStorage.setItem('app_theme', themeKey);
        } catch (err) {
            console.error('Failed to save theme:', err);
        }
    };

    useEffect(() => {
        const saved = localStorage.getItem('app_theme') || 'dark';
        applyTheme(saved);
    }, []);

    const currentThemeData = THEMES[currentTheme] || THEMES['dark'];
    const Icon = currentThemeData.icon;

    return (
        <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                onClick={() => setShowMenu(!showMenu)}
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
                title="Theme"
            >
                <Icon size={14} />
                Theme
            </button>

            {showMenu && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    background: 'rgba(20, 20, 35, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 224, 255, 0.3)',
                    borderRadius: '8px',
                    padding: '8px',
                    zIndex: 10000,
                    minWidth: '150px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
                }}>
                    {Object.entries(THEMES).map(([key, theme]) => {
                        const ThemeIcon = theme.icon;
                        const isActive = currentTheme === key;
                        return (
                            <button
                                key={key}
                                onClick={() => {
                                    applyTheme(key);
                                    setShowMenu(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    marginBottom: '4px',
                                    background: isActive
                                        ? 'rgba(0, 224, 255, 0.2)'
                                        : 'rgba(255, 255, 255, 0.05)',
                                    border: isActive
                                        ? '1px solid rgba(0, 224, 255, 0.5)'
                                        : '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '4px',
                                    color: isActive ? '#00e0ff' : '#aaa',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.target.style.background = 'rgba(0, 224, 255, 0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                                    }
                                }}
                            >
                                <ThemeIcon size={16} />
                                {theme.name}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ThemeManager;

