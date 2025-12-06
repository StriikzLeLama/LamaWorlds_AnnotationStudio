const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectDirectory: () => ipcRenderer.invoke('select-directory'),
    selectFile: (filters) => ipcRenderer.invoke('select-file', filters),
    readFile: (filePath) => ipcRenderer.invoke('read-file', filePath)
});
