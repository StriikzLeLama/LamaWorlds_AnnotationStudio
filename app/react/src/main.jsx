/**
 * React entry — Tauri bridge + i18n (EN default).
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { installDesktopBridge } from './desktopApi.js';
import { I18nProvider } from './i18n/I18nContext.jsx';
import './styles/index.css';

installDesktopBridge();

console.log('React mounting (Tauri shell)…');

const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error('Root element not found!');
    document.body.innerHTML =
        '<div style="color:#e8edf4;padding:20px;background:#0e1116;height:100vh;display:flex;align-items:center;justify-content:center;flex-direction:column"><h1>Error: #root not found</h1></div>';
} else {
    try {
        ReactDOM.createRoot(rootElement).render(
            <React.StrictMode>
                <I18nProvider>
                    <App />
                </I18nProvider>
            </React.StrictMode>
        );
        console.log('React mounted successfully');
    } catch (error) {
        console.error('Error mounting React:', error);
        rootElement.innerHTML = `<div style="color:#e8edf4;padding:20px;background:#0e1116"><h1>React mount failed</h1><pre>${error.message}</pre></div>`;
    }
}
