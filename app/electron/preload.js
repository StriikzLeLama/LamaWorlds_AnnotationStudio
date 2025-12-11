const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    selectFolder: () => ipcRenderer.invoke('select-directory'), // Alias for selectDirectory
    selectFile: (filters) => ipcRenderer.invoke('select-file', filters),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
    showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
    onBackendError: (callback) => {
        ipcRenderer.on('backend-error', (event, error) => callback(error));
        // Return cleanup function
        return () => ipcRenderer.removeAllListeners('backend-error');
    },
    onBackendReady: (callback) => {
        ipcRenderer.on('backend-ready', () => callback());
        // Return cleanup function
        return () => ipcRenderer.removeAllListeners('backend-ready');
    }
});
