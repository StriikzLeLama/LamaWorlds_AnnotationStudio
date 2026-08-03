/**
 * UI strings — English (default) + French.
 * Use: const { t } = useI18n(); t('welcome.subtitle')
 */
export const translations = {
    en: {
        'lang.code': 'EN',
        'lang.switchTo': 'Français',
        'lang.title': 'Language',

        'brand.name': 'Lama',
        'brand.studio': 'Studio',
        'brand.full': 'Lama Worlds Annotation Studio',

        'welcome.subtitle':
            'Open a dataset folder (images + YOLO labels) to start annotating.',
        'welcome.openDataset': 'Open a dataset',
        'welcome.shortcut': 'Shortcut:',

        'toolbar.dataset': 'Dataset',
        'toolbar.datasetTitle': 'Open a dataset folder (Ctrl+O)',
        'toolbar.help': 'Help',
        'toolbar.helpTitle': 'Keyboard shortcuts (?)',
        'toolbar.settings': 'Settings',
        'toolbar.settingsTitle': 'Settings',
        'toolbar.undo': 'Undo',
        'toolbar.undoTitle': 'Undo (Ctrl+Z)',
        'toolbar.redo': 'Redo',
        'toolbar.redoTitle': 'Redo (Ctrl+Y)',
        'toolbar.theme': 'Theme',
        'toolbar.themeTitle': 'Theme',
        'toolbar.hideStats': 'Hide',
        'toolbar.hideStatsTitle': 'Hide statistics',
        'toolbar.showStatsTitle': 'Show statistics',
        'toolbar.imageProgress': 'Image {current} / {total}',

        'backend.error': 'Backend error',
        'backend.fixHint': 'Make sure Python 3.10+ is installed, then run:',
        'backend.toast': 'Backend:',

        'panel.expand': 'Expand',
        'panel.collapse': 'Collapse',
        'panel.classes': 'Classes',
        'panel.searchClasses': 'Search classes…',
        'panel.imagesAnnotations': 'Images & annotations',
        'panel.annotations': 'Annotations ({count})',
        'panel.newClass': 'New class',

        'alert.desktopApi': 'Desktop API unavailable. Launch with: npm run dev (Tauri).',
        'alert.openDatasetFirst': 'Please open a dataset first',
        'dialog.selectDataset': 'Select a dataset folder',

        'theme.dark': 'Dark',
        'theme.light': 'Light',
        'theme.studio': 'Studio',

        'loading.status': 'Starting Annotation Studio…',
        'loading.init': 'Loading UI…',
    },
    fr: {
        'lang.code': 'FR',
        'lang.switchTo': 'English',
        'lang.title': 'Langue',

        'brand.name': 'Lama',
        'brand.studio': 'Studio',
        'brand.full': 'Lama Worlds Annotation Studio',

        'welcome.subtitle':
            'Ouvrez un dossier dataset (images + labels YOLO) pour commencer l’annotation.',
        'welcome.openDataset': 'Ouvrir un dataset',
        'welcome.shortcut': 'Raccourci :',

        'toolbar.dataset': 'Dataset',
        'toolbar.datasetTitle': 'Ouvrir un dossier dataset (Ctrl+O)',
        'toolbar.help': 'Aide',
        'toolbar.helpTitle': 'Raccourcis clavier (?)',
        'toolbar.settings': 'Réglages',
        'toolbar.settingsTitle': 'Paramètres',
        'toolbar.undo': 'Annuler',
        'toolbar.undoTitle': 'Annuler (Ctrl+Z)',
        'toolbar.redo': 'Rétablir',
        'toolbar.redoTitle': 'Rétablir (Ctrl+Y)',
        'toolbar.theme': 'Thème',
        'toolbar.themeTitle': 'Thème',
        'toolbar.hideStats': 'Masquer',
        'toolbar.hideStatsTitle': 'Masquer les stats',
        'toolbar.showStatsTitle': 'Afficher les stats',
        'toolbar.imageProgress': 'Image {current} / {total}',

        'backend.error': 'Erreur backend',
        'backend.fixHint': 'Vérifiez Python 3.10+ puis :',
        'backend.toast': 'Backend :',

        'panel.expand': 'Développer',
        'panel.collapse': 'Réduire',
        'panel.classes': 'Classes',
        'panel.searchClasses': 'Rechercher une classe…',
        'panel.imagesAnnotations': 'Images & annotations',
        'panel.annotations': 'Annotations ({count})',
        'panel.newClass': 'Nouvelle classe',

        'alert.desktopApi':
            'API desktop indisponible. Lancez avec : npm run dev (Tauri).',
        'alert.openDatasetFirst': 'Veuillez d’abord ouvrir un dataset',
        'dialog.selectDataset': 'Sélectionner un dossier dataset',

        'theme.dark': 'Sombre',
        'theme.light': 'Clair',
        'theme.studio': 'Studio',

        'loading.status': 'Démarrage de l’annotation studio…',
        'loading.init': 'Chargement de l’interface…',
    },
};

export const DEFAULT_LOCALE = 'en';
export const LOCALE_STORAGE_KEY = 'app_locale';
