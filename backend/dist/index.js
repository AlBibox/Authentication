import express, {} from "express";
import dotenv from 'dotenv';
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import mysql from 'mysql';
import { register, login } from "./controllers/auth.js";
const app = express();
// create application/json parser
app.use(bodyParser.json());
// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }));
let corsOptions = {
    origin: ['https://authentication-gray-beta.vercel.app', 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));
const __dirname = import.meta.dirname;
//console.log(path.resolve(__dirname, "../.env"));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
export const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: Number(process.env.DATABASE_PORT)
});
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
app.post("/register", register);
app.post("/login", login);
//If development environment, listen on port 3000
//if (process.env.NODE_ENV === 'development') {
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
//}
export default app;
