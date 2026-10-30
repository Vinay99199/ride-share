import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import driverApplicationRoutes from "./rout1es/driverApplication.routes.js";
import adminRoutes from "./routes/admin.routes.js";
 
const app= express();

app.use(cors());
app.use(express.json());
app.use("/api/driver-applications", driverApplicationRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/auth", authRoutes);

app.get("/", (req,res)=>{
    res.send("Ride Sharing API is running");
})

export default app;
