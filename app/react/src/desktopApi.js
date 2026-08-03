/**
 * Bridge desktop Tauri — API compatible avec l'ancien `window.electronAPI`.
 * Dialogues natifs + lecture fichiers + événements backend.
 */
import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc, invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

const isTauri = () =>
    typeof window !== 'undefined' &&
    !!(window.__TAURI_INTERNALS__ || window.__TAURI__);

/**
 * Convertit un chemin disque absolu en URL chargeable par le WebView (asset://).
 * En navigateur pur (vite alone), renvoie le chemin tel quel.
 */
export function toAssetUrl(filePath) {
    if (!filePath) return filePath;
    if (/^(https?:|asset:|data:|blob:)/i.test(filePath)) return filePath;
    if (!isTauri()) {
        // Fallback Electron-like file URL (dev navigateur uniquement)
        if (filePath.startsWith('file:')) return filePath;
        return filePath;
    }
    try {
        return convertFileSrc(filePath);
    } catch (err) {
        console.warn('convertFileSrc failed:', err);
        return filePath;
    }
}

async function selectDirectory() {
    const selected = await open({
        directory: true,
        multiple: false,
        title: 'Select a dataset folder',
    });
    if (selected == null) return null;
    return Array.isArray(selected) ? selected[0] : selected;
}

async function selectFile(filters) {
    const tauriFilters = (filters || []).map((f) => ({
        name: f.name || 'Files',
        extensions: (f.extensions || ['*']).map((e) => e.replace(/^\./, '')),
    }));

    const selected = await open({
        multiple: false,
        filters: tauriFilters.length
            ? tauriFilters
            : [{ name: 'All', extensions: ['*'] }],
    });
    if (selected == null) return null;
    return Array.isArray(selected) ? selected[0] : selected;
}

async function readFile(filePath) {
    return invoke('read_text_file', { path: filePath });
}

async function showOpenDialog(options = {}) {
    const props = options.properties || ['openFile'];
    const directory = props.includes('openDirectory');
    const multiple = props.includes('multiSelections');

    const filters = (options.filters || []).map((f) => ({
        name: f.name || 'Files',
        extensions: (f.extensions || ['*']).map((e) => String(e).replace(/^\./, '')),
    }));

    const selected = await open({
        directory,
        multiple,
        filters: filters.length ? filters : undefined,
        title: options.title,
    });

    if (selected == null) {
        return { canceled: true, filePaths: [] };
    }
    const filePaths = Array.isArray(selected) ? selected : [selected];
    return { canceled: false, filePaths };
}

function onBackendError(callback) {
    let unlisten = () => {};
    listen('backend-error', (event) => callback(event.payload)).then((fn) => {
        unlisten = fn;
    });
    return () => unlisten();
}

function onBackendReady(callback) {
    let unlisten = () => {};
    listen('backend-ready', () => callback()).then((fn) => {
        unlisten = fn;
    });
    return () => unlisten();
}

/** API desktop exposée (compat Electron). */
export const desktopApi = {
    selectDirectory,
    selectFolder: selectDirectory,
    selectFile,
    readFile,
    showOpenDialog,
    onBackendError,
    onBackendReady,
    isTauri: isTauri(),
    toAssetUrl,
};

/** Installe `window.electronAPI` pour les composants existants. */
export function installDesktopBridge() {
    if (typeof window === 'undefined') return desktopApi;
    window.electronAPI = desktopApi;
    window.desktopApi = desktopApi;
    return desktopApi;
}

export default desktopApi;
