import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

console.log("React mounting...");

// Check if root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
    console.error('Root element not found!');
    document.body.innerHTML = '<div style="color: white; padding: 20px; background: #050510; height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column;"><h1>Error: Root element not found</h1><p>Please check the HTML file.</p></div>';
} else {
    try {
        ReactDOM.createRoot(rootElement).render(
            <React.StrictMode>
                <App />
            </React.StrictMode>,
        );
        console.log("React mounted successfully");
    } catch (error) {
        console.error("Error mounting React:", error);
        rootElement.innerHTML = `<div style="color: white; padding: 20px; background: #050510; height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column;"><h1>Error: React failed to mount</h1><p>${error.message}</p><pre style="background: rgba(255,0,0,0.2); padding: 10px; border-radius: 4px; overflow: auto; max-width: 80%;">${error.stack}</pre></div>`;
    }
}
