import axios from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from './authStore';
import { redirect } from "react-router";



const url = import.meta.env.MODE === "production" ? import.meta.env.VITE_API_ENDPOINT : "http://localhost:3000"
// 1. Crea l'istanza globale di Axios
const api = axios.create({
    baseURL: url,
    withCredentials: true // FONDAMENTALE: Invia automaticamente i cookie del Refresh Token
});

// Variabili per gestire la coda delle richieste simultanee durante il refresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// 2. INTERCEPTOR DI RICHIESTA: Inserisce l'Access Token se presente
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {

            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 3. INTERCEPTOR DI RISPOSTA: Intercetta il 401 e gestisce il refresh
api.interceptors.response.use(
    (response) => response, // Se la risposta ha successo, passa oltre
    async (error) => {
        const originalRequest = error.config;

        // Se l'errore è 401 e la richiesta non è già un tentativo di retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            
            // Se siamo già in fase di refresh, accodiamo questa richiesta
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then((token) => {
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
            }

            // Contrassegna la richiesta per evitare loop infiniti
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Chiamata Axios separata (per evitare gli intercettori di questa istanza)
                // Il server legge il cookie HttpOnly e restituisce il nuovo access token
                const response = await axios.post(`${url}/refresh`, {}, { withCredentials: true });
                const { accessToken } = response.data;

                setAccessToken(accessToken);
                
                // Rielabora tutte le richieste in coda con il nuovo token
                processQueue(null, accessToken);
                isRefreshing = false;

                // Aggiorna la richiesta corrente fallita e rieseguila
                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                return api(originalRequest);

            } catch (refreshError) {
                // Se il refresh fallisce, significa che anche il Refresh Token è scaduto/revocato
                processQueue(refreshError, null);
                isRefreshing = false;
                clearAccessToken();

                // REACT ROUTER: Forza il reindirizzamento immediato al Login
                redirect('/login');

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
