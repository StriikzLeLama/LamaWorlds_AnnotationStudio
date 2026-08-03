/**
 * i18n context — default English, toggle to French.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
    DEFAULT_LOCALE,
    LOCALE_STORAGE_KEY,
    translations,
} from './translations';

const I18nContext = createContext(null);

function interpolate(template, vars = {}) {
    if (!vars || typeof template !== 'string') return template;
    return template.replace(/\{(\w+)\}/g, (_, key) =>
        vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : `{${key}}`
    );
}

export function I18nProvider({ children }) {
    const [locale, setLocaleState] = useState(() => {
        try {
            const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
            if (saved && translations[saved]) return saved;
        } catch {
            /* ignore */
        }
        return DEFAULT_LOCALE;
    });

    const setLocale = useCallback((next) => {
        const value = translations[next] ? next : DEFAULT_LOCALE;
        setLocaleState(value);
        try {
            localStorage.setItem(LOCALE_STORAGE_KEY, value);
        } catch {
            /* ignore */
        }
        document.documentElement.lang = value === 'fr' ? 'fr' : 'en';
    }, []);

    useEffect(() => {
        document.documentElement.lang = locale === 'fr' ? 'fr' : 'en';
    }, [locale]);

    const t = useCallback(
        (key, vars) => {
            const table = translations[locale] || translations.en;
            const fallback = translations.en[key];
            const raw = table[key] ?? fallback ?? key;
            return interpolate(raw, vars);
        },
        [locale]
    );

    const toggleLocale = useCallback(() => {
        setLocale(locale === 'en' ? 'fr' : 'en');
    }, [locale, setLocale]);

    const value = useMemo(
        () => ({ locale, setLocale, toggleLocale, t }),
        [locale, setLocale, toggleLocale, t]
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
    const ctx = useContext(I18nContext);
    if (!ctx) {
        throw new Error('useI18n must be used within I18nProvider');
    }
    return ctx;
}
