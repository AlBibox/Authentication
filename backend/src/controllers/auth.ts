import { type Request, type Response } from 'express'
import {db} from '../index.js'
import bcrypt from "bcrypt"
import { v4 as uuidv4 } from 'uuid'




/*db.connect(err => {
    if (err) {
        console.log(err)
    } else {
        console.log("connected")
    }
});*/



export function register (req: Request, res: Response) { {
    console.log(req.body)
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
}}
    

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
        let isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            res.status(401)
            return res.json({
                message: "Invalid password"
            })
        }
        res.json({
            response: "User successfully logged in",
            id: user.id
        })
    })
}