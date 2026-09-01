import express, {} from "express";
import dotenv from 'dotenv';
import path from "path";
import cors from "cors";
import bodyParser from "body-parser";
import { register } from "./controllers/auth";
const app = express();
// create application/json parser
app.use(bodyParser.json());
// create application/x-www-form-urlencoded parser
app.use(bodyParser.urlencoded({ extended: false }));
let corsOption = {
    origin: "http://localhost:5173"
};
app.use(cors(corsOption));
const __dirname = import.meta.dirname;
//console.log(path.resolve(__dirname, "../.env"));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
/*
db.connect(err => {
    if (err) {
        console.log(err)
    } else {
        console.log("connected")
    }
});

*/
app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.post("/register", register);
app.listen(3000);
