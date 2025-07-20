import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'
const app = express();

app.use(cors({
     origin: process.env.CORS_ORIGIN,
     credentials: true
}));

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, 
    limit: "16kb"})) // extended ka matlab hota hai aap object ke ander bhi object de saktey ho 
app.use(express.static("public")) // static file folder store karney ke liye hota hai
app.use(cookieParser()) // user ke server se read write kar paayu
//    (err, req, res, next)


// routes import

import userRouter from "./routes/user.routes.js"


app.use("/api/v1/users", userRouter);

// https://localhost:8000/api/v1/users/register




export {app}

