import express, { type Express, type Request, type Response } from "express";
import dotenv from 'dotenv'
import path from "path";
import cors from "cors"
import bodyParser from "body-parser"
import mysql from 'mysql'
import { register, login } from "./controllers/auth"






const app: Express = express();
// create application/json parser
app.use(bodyParser.json())

// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }))

let corsOption = {
    origin: "*"
}

app.use(cors(corsOption));
const __dirname = import.meta.dirname;

//console.log(path.resolve(__dirname, "../.env"));

dotenv.config({ path: path.resolve(__dirname, "../.env") })

export const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    port: Number(process.env.DATABASE_PORT)
})
/*
db.connect(err => {
    if (err) {
        console.log(err)
    } else {
        console.log("connected")
    }
});

*/
app.get("/", (req: Request, res: Response) => {
    res.send("Hello World!");

})

app.post("/register", register)
app.post("/login", login)

app.listen(3000);