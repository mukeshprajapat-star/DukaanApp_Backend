import express  from "express";

import userRoutes from "./routes/user.js"
import productRoutes from "./routes/product.js"
import orderRoutes from "./routes/order.js"
import paymentRoutes from "./routes/payment.js"
import dashboardRoutes from "./routes/stats.js"





import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";

import NodeCache from "node-cache";

import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";

import cors from "cors"
import { fileURLToPath } from 'url';
import path from 'path';


const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);

config({
    path:"./.env"
})

const port=process.env.PORT || 5000;
const mongoURI=process.env.MONGO_URI || ""
const stripeKey=process.env.STRIPE_KEY|| ""


connectDB(mongoURI);

export const stripe=new Stripe(stripeKey);

export const myCache=new NodeCache();

const app =express();

app.use(express.json())
app.use(morgan("dev"))
app.use(cors())


app.use("/api/v1/user",userRoutes)
app.use("/api/v1/product",productRoutes)
app.use("/api/v1/order",orderRoutes)
app.use("/api/v1/payment",paymentRoutes)
app.use("/api/v1/dashboard",dashboardRoutes)


// app.use(express.static(path.join(__dirname,"../../frontend/dist")));

// app.get("*",(req,res)=>{
//     res.sendFile(path.resolve(__dirname,"../../frontend/dist/index.html"));
// });




app.use("/uploads",express.static("uploads"))

app.use(errorMiddleware)

app.listen(port,()=>{
    console.log(`Server is working on http://localhost:${port}`)
})