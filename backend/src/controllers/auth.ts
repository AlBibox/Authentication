import { type Request, type Response } from 'express'
import bcrypt from "bcrypt"
import { v4 as uuidv4 } from 'uuid'
import jwt, { type VerifyErrors } from "jsonwebtoken"
import dotenv from 'dotenv'
import mysql, { } from 'mysql'
import path from "path";
import crypto from "crypto"





const __dirname = import.meta.dirname;

//console.log(path.resolve(__dirname, "../../.env"));

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: Number(process.env.DATABASE_PORT)
})



/*db.connect(err => {
    if (err) {
        console.log(err)
    } else {
        console.log("connected")
    }
});*/
function generateTokens(user: { id: string, email: string, password: string }) {
    const accessToken = jwt.sign({ id: user.id }, process.env.ACCESS_SECRET as string, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.REFRESH_SECRET as string, { expiresIn: '7d' });
    return { accessToken, refreshToken };
}



export function register(req: Request, res: Response) {
    {
        //console.log(req.body)
        const { email, password }: { email: string, password: string } = req.body;
        db.query("SELECT email FROM users WHERE email = ?", [email], async (error, results) => {
            if (error) {
                console.log(error)
            }
            if (results.length > 0) {
                res.status(401)
                return res.json({
                    message: "Mail already in use"
                })
            }
            let hashedPassword = await bcrypt.hash(password, 8)
            db.query("INSERT INTO users SET ?", { email: email, password: hashedPassword }, (error, results) => {
                if (error) {
                    console.log(error)
                } else {
                    res.json({
                        response: "User successfully registered",
                        id: uuidv4()
                    })
                }
            })
        })
    }
}


export function login(req: Request, res: Response) {
    const { email, password }: { email: string, password: string } = req.body;
    db.query("SELECT * FROM users WHERE email = ?", [email], async (error, results) => {
        if (error) {
            console.log(error)
        }
        if (results.length === 0) {
            res.status(401)
            return res.json({
                message: "User not found"
            })
        }
        let user = results[0]
        //console.log(user)
        let isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            res.status(401)
            return res.json({
                message: "Invalid password"
            })
        }

        // Calcola la data di scadenza per MySQL (formato YYYY-MM-DD HH:MM:SS)
        const expiryDate = new Date();
        const createdAt = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        const query = `
            INSERT INTO refresh_tokens (selector, verifier_hash, user_id, expires_at, created_at) 
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                selector = VALUES(selector),
                verifier_hash = VALUES(verifier_hash), 
                expires_at = VALUES(expires_at),
                created_at = VALUES(created_at)
        `;

        const { refreshToken, accessToken } = generateTokens(user);
        //const refreshTokenLength = refreshToken.length;
        const selector = refreshToken.slice(0, Math.floor(refreshToken.length / 2));
        const verifier = refreshToken.slice(Math.floor(refreshToken.length / 2));

        const hashedVerifier = crypto
            .createHash('sha256')
            .update(verifier)
            .digest('hex');


        await db.query(query, [selector, hashedVerifier, user.id, expiryDate, createdAt]);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,     // JavaScript non può leggerlo (protezione XSS)
            secure: process.env.NODE_ENV === 'production', // Solo HTTPS in produzione
            sameSite: 'strict', // Protezione CSRF
            maxAge: 7 * 24 * 60 * 60 * 1000 // Scadenza di 7 giorni in millisecondi
        });

        res.json({
            response: "User successfully logged in",
            token: accessToken
        })
    })
}

interface RefreshTokenRow {
    //id: number;
    //selector: string;
    verifier_hash: string;
    user_id: number;
    //expires_at: Date;
}

export async function refresh(req: Request, res: Response) {

    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "Token mancante" });

    const selector = refreshToken.slice(0, Math.floor(refreshToken.length / 2));
    const verifier = refreshToken.slice(Math.floor(refreshToken.length / 2));

    const query = `
  SELECT user_id, verifier_hash 
  FROM refresh_tokens 
  WHERE selector = ? AND expires_at > ?
  LIMIT 1
`;

    // 2. Esegui la query vecchio stile (con callback)
    db.query(query, [selector, new Date()], (error, results) => {
        if (error) return res.status(500).json({ message: "Errore del server" });

        // 3. Applica il Type Casting su results per dire a TS che expires_dateè un array della tua interfaccia
        const rows = results as RefreshTokenRow[]

        // Ora TypeScript non darà più errori su .length e su .user_id!
        if (rows.length === 0) {
            return res.status(403).json({ message: "Token non valido o scaduto" });
        }

        //VERIFICA CRITTOGRAFICA (L'operazione con Crypto)
        // Calcoliamo l'hash SHA-256 della seconda metà inviata dal client
        const hashToVerify = crypto
            .createHash('sha256')
            .update(verifier)
            .digest('hex');

        const isVerifierValid = crypto.timingSafeEqual(
            Buffer.from(hashToVerify, 'hex'),
            Buffer.from(rows[0]!.verifier_hash, 'hex')
        );

        if (!isVerifierValid) {
            //POTENZIALE ATTACCO: Il selettore esiste ma la chiave (verifier) è sbagliata!
            return { success: false, status: 401, message: "Token compromesso." };
        }


        const userId = rows[0]!.user_id;

        jwt.verify(refreshToken, process.env.REFRESH_SECRET!, (err: VerifyErrors | null) => {
            if (err) return res.status(403).json({ message: "Firma non valida" });

            const newAccessToken = jwt.sign(
                { id: userId },
                process.env.ACCESS_SECRET!,
                { expiresIn: '15m' }
            );

            return res.json({ accessToken: newAccessToken });
        });
    });
}

interface AuthenticatedRequest extends Request {
  user: {
    id?: string;
    email?: string;
  };
}

export function getMe(req: Request, res: Response) {
    try {
        // 1. Recuperiamo l'ID che il middleware JWT ha salvato in req.user
        const userId = (req as AuthenticatedRequest).user?.id;

        if (!userId) {
            res.status(401).json({ error: 'Non autorizzato: ID utente non trovato nel token.' });
            return;
        }

        const query = 'SELECT * FROM users WHERE id = ? LIMIT 1';

        db.query(query, [userId], (error, results) => {
            if (error) {
                console.error('Errore nella query del database:', error);
                res.status(500).json({ error: 'Errore interno del server durante il recupero del profilo.' });
                return;
            }

            if (results.length === 0) {
                res.status(404).json({ error: 'Utente non trovato nel database.' });
                return;
            }

            const utente = results[0];

            // 4. Rispondiamo inviando i dati al client (senza la password per sicurezza!)
            res.status(200).json({
                id: utente.id,
                email: utente.email,
            });

        })



    } catch (error) {
        console.error('Errore nel controller me:', error);
        res.status(500).json({ error: 'Errore interno del server durante il recupero del profilo.' });
    }
}

export async function logout(req: Request, res: Response) {
    try {
        // 1. Leggi il refresh token dai cookie del browser
        const refreshTokenCookie = req.cookies.refreshToken; // Assumendo che tu usi 'cookie-parser'

        if (refreshTokenCookie) {
            // 2. Estrai il selettore (la prima parte prima del punto)
            const selector = refreshTokenCookie.slice(0, Math.floor(refreshTokenCookie.length / 2));

            if (selector) {
                // 3. Cancella la riga da MySQL usando il selector
                await db.query('DELETE FROM refresh_tokens WHERE selector = ?', [selector]);
            }
        }

        // 4. Cancella il cookie dal browser impostando una scadenza immediata
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true, // true in produzione con HTTPS
            sameSite: 'strict'
        });

        // 5. Rispondi con successo
        return res.status(200).json({ message: "Logout effettuato con successo" });
    } catch (error) {
        return res.status(500).json({ error: "Errore durante il logout" });
    }
}
