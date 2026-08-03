/**
 * Sélecteur de thème — applique les CSS variables sur :root.
 * Thèmes : Dark (défaut), Light, Studio (contraste élevé pour annotation longue).
 */
import React, { useState, useEffect, useRef } from 'react';
import { Palette, Moon, Sun, Focus } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

/** Définition des palettes (doivent rester alignées avec styles/index.css). */
const THEMES = {
    dark: {
        name: 'Dark',
        icon: Moon,
        colors: {
            '--bg-app': '#0e1116',
            '--bg-elevated': '#151a22',
            '--bg-panel': 'rgba(21, 26, 34, 0.92)',
            '--bg-hover': 'rgba(255, 255, 255, 0.04)',
            '--bg-active': 'rgba(45, 212, 191, 0.12)',
            '--bg-dark': '#0e1116',
            '--accent': '#2dd4bf',
            '--accent-soft': '#5eead4',
            '--accent-muted': 'rgba(45, 212, 191, 0.18)',
            '--accent-border': 'rgba(45, 212, 191, 0.35)',
            '--neon-blue': '#2dd4bf',
            '--neon-cyan': '#5eead4',
            '--text-primary': '#e8edf4',
            '--text-secondary': '#8b95a5',
            '--text-muted': '#5c6675',
        },
    },
    light: {
        name: 'Light',
        icon: Sun,
        colors: {
            '--bg-app': '#f4f6f9',
            '--bg-elevated': '#ffffff',
            '--bg-panel': 'rgba(255, 255, 255, 0.95)',
            '--bg-hover': 'rgba(0, 0, 0, 0.04)',
            '--bg-active': 'rgba(13, 148, 136, 0.1)',
            '--bg-dark': '#f4f6f9',
            '--accent': '#0d9488',
            '--accent-soft': '#14b8a6',
            '--accent-muted': 'rgba(13, 148, 136, 0.12)',
            '--accent-border': 'rgba(13, 148, 136, 0.35)',
            '--neon-blue': '#0d9488',
            '--neon-cyan': '#14b8a6',
            '--text-primary': '#0f172a',
            '--text-secondary': '#475569',
            '--text-muted': '#94a3b8',
        },
    },
    studio: {
        name: 'Studio',
        icon: Focus,
        colors: {
            '--bg-app': '#0a0c10',
            '--bg-elevated': '#12151c',
            '--bg-panel': 'rgba(18, 21, 28, 0.96)',
            '--bg-hover': 'rgba(255, 255, 255, 0.03)',
            '--bg-active': 'rgba(56, 189, 248, 0.12)',
            '--bg-dark': '#0a0c10',
            '--accent': '#38bdf8',
            '--accent-soft': '#7dd3fc',
            '--accent-muted': 'rgba(56, 189, 248, 0.16)',
            '--accent-border': 'rgba(56, 189, 248, 0.4)',
            '--neon-blue': '#38bdf8',
            '--neon-cyan': '#7dd3fc',
            '--text-primary': '#f1f5f9',
            '--text-secondary': '#94a3b8',
            '--text-muted': '#64748b',
        },
    },
};

function ThemeManager({ currentTheme, onThemeChange }) {
    const { t } = useI18n();
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    const applyTheme = (themeKey) => {
        const theme = THEMES[themeKey];
        if (!theme) return;

        Object.entries(theme.colors).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
        });

        onThemeChange?.(themeKey);
        try {
            localStorage.setItem('app_theme', themeKey);
        } catch (err) {
            console.error('Failed to save theme:', err);
        }
    };

    // Applique le thème sauvegardé au montage
    useEffect(() => {
        const saved = localStorage.getItem('app_theme') || 'dark';
        applyTheme(saved);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Ferme le menu au clic extérieur
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const currentThemeData = THEMES[currentTheme] || THEMES.dark;
    const Icon = currentThemeData.icon;

    return (
        <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowMenu(!showMenu)}
                title={t('toolbar.themeTitle')}
            >
                <Icon size={14} />
                {t('toolbar.theme')}
            </button>

            {showMenu && (
                <div
                    className="panel"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: 6,
                        padding: 8,
                        zIndex: 10000,
                        minWidth: 150,
                    }}
                >
                    {Object.entries(THEMES).map(([key, theme]) => {
                        const ThemeIcon = theme.icon;
                        const isActive = currentTheme === key;
                        const labelKey = `theme.${key}`;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => {
                                    applyTheme(key);
                                    setShowMenu(false);
                                }}
                                className={isActive ? 'btn-secondary' : 'btn-ghost'}
                                style={{
                                    width: '100%',
                                    marginBottom: 4,
                                    justifyContent: 'flex-start',
                                }}
                            >
                                <ThemeIcon size={16} />
                                {t(labelKey)}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default ThemeManager;
