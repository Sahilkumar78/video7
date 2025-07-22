// require('dotenv').config({path:'./env'})

import dotenv from "dotenv"
import connectDB from "./db/index.js";
// import express from "express";
// const app = express();

import {app} from "./app.js"
import { ApiResponse } from "./utils/ApiResponse.js";

dotenv.config({
    path: './.env',
    quiet: true,
})

// dotenv.config();


app.get('/', (req, res) => {
     res.send("<h1>Believe us we will not let your server down</h1>")
})


connectDB()  // connectDB returns a promise so we need to use .then and .catch
.then(() =>{

      app.on("error", (error) => {
           console.log("Error is: ",  error);
           throw error
      })

     app.listen(process.env.PORT || 8000, () => {
         console.log(`Server is running at port: ${process.env.PORT}`);
     })
})
.catch((err) => {
     console.log("mongoDB connection failed !! ", err);
})













/*
(async () => {

   try {
      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
       app.on("error", (error) => {
         console.log("Error", error);
         throw error
       })

       app.listen(process.env.PORT, () => {
           console.log(`App is listening on port ${process.env.PORT}`)
       })
    
   } catch (error) {
      console.error("Error", error);
      throw error
   }

})() // iife

*/