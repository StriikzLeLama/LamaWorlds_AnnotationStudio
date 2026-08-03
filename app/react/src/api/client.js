/**
 * Client HTTP partagé pour le backend FastAPI (localhost:8000).
 * Évite de dupliquer axios.create dans chaque composant.
 */
import axios from 'axios';

export const API_URL = 'http://localhost:8000';

/** Instance Axios configurée pour le backend local. */
const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

/**
 * En cas d'échec réseau (backend pas encore prêt au démarrage Electron),
 * on retente une fois après 2s.
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isNetwork =
            error.code === 'ECONNREFUSED' ||
            error.code === 'ERR_NETWORK' ||
            (error.message && error.message.includes('Network Error'));

        if (isNetwork && error.config && !error.config._retry) {
            error.config._retry = true;
            console.error('Backend connection error, retrying…', error.message);
            return new Promise((resolve) => {
                setTimeout(() => resolve(api.request(error.config)), 2000);
            });
        }
        return Promise.reject(error);
    }
);

export default api;
