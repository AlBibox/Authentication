import express, {} from "express";
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from 'cookie-parser';
import * as authController from "./controllers/auth.js";
import { middlewareAutenticazione } from "./middleware.js";
const __dirname = import.meta.dirname;
const app = express();
// create application/json parser
app.use(bodyParser.json());
app.use(cookieParser());
// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }));
let corsOptions = {
    origin: ['https://authentication-gray-beta.vercel.app', 'http://localhost:5173', 'http://localhost:3000', 'https://authentication-bice-rho.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));
/*
db.connect(err => {
    if (err) {
        console.log(err)
    } else {
        console.log("connected")
    }
});

*/
app.use(express.static(path.join(__dirname, '../build')));
app.get(["/", "/login", "/register"], (req, res) => {
    res.sendFile(path.join(__dirname, '../build/index.html'));
});
app.post("/register", authController.register);
app.post("/login", authController.login);
app.post("/refresh", authController.refresh);
app.get("/me", middlewareAutenticazione, authController.getMe);
app.post("/logout", authController.logout);
//If development environment, listen on port 3000
if (process.env.NODE_ENV === 'development') {
    app.listen(3000, () => {
        console.log("Server is running on port 3000");
    });
}
export default app;
