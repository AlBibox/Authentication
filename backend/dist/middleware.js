import {} from 'express';
import jwt from 'jsonwebtoken';
import path from "path";
import dotenv from 'dotenv';
const __dirname = import.meta.dirname;
//console.log(path.resolve(__dirname, "../../.env"));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
export const middlewareAutenticazione = (req, res, next) => {
    // 1. Recuperiamo l'header "Authorization" inviato dal client
    const authHeader = req.headers['authorization'];
    // L'header ha il formato "Bearer STRINGA_DEL_TOKEN", quindi prendiamo solo la seconda parte
    const token = authHeader && authHeader.split(' ')[1];
    // Se il client non ha inviato nessun token, blocchiamo subito la richiesta
    if (!token) {
        return res.status(401).json({ error: "Access Token mancante. Autenticazione richiesta." });
    }
    // 2. Proviamo a verificare il token usando la chiave segreta del tuo server
    try {
        // 'process.env.JWT_SECRET' è la password segreta che usi per firmare i tuoi JWT
        const datiUtente = jwt.verify(token, process.env.ACCESS_SECRET);
        // Se il token è valido, salviamo i dati dell'utente (es. l'id) dentro l'oggetto 'req'
        // In questo modo, l'API successiva saprà esattamente chi è l'utente connesso
        req.user = datiUtente;
        // Passiamo il controllo alla rotta successiva (es. /api/users/me)
        next();
    }
    catch (error) {
        // 3. Gestione degli errori (Qui capiamo se il token è scaduto!)
        if (error instanceof Error && error.name === 'TokenExpiredError') {
            // Il token è matematicamente corretto, ma è scaduto il tempo.
            // Rispondiamo 401: questo dirà al frontend di attivare la rotta di REFRESH
            return res.status(401).json({ error: "Access Token scaduto!" });
        }
        // Se l'errore è un altro (es. token inventato, alterato o firmato con una chiave diversa)
        // Rispondiamo 403 Forbidden perché il token è invalido o maligno
        return res.status(403).json({ error: "Token non valido o manomesso." });
    }
};
