import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";

const app= express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req,res)=>{
    res.send("Ride Sharing API is running");
})

export default app;
