/**
 * Language toggle — EN (default) ↔ FR
 */
import React from 'react';
import { Languages } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

function LanguageToggle() {
    const { toggleLocale, t } = useI18n();

    return (
        <button
            type="button"
            className="btn-ghost"
            onClick={toggleLocale}
            title={t('lang.title')}
            aria-label={t('lang.title')}
        >
            <Languages size={14} />
            <span style={{ fontWeight: 600, letterSpacing: '0.04em' }}>{t('lang.code')}</span>
            <span style={{ opacity: 0.65, fontSize: '0.72rem' }}>→ {t('lang.switchTo')}</span>
        </button>
    );
}

export default LanguageToggle;
