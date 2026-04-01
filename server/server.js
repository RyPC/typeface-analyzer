const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const statsRoutes = require("./routes/stats");
const photosRoutes = require("./routes/photos");
const batchRoutes = require("./routes/batch");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL || "*",
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
async function connectToMongo() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            dbName: "visualTextDB",
        });
        console.log("Connected to MongoDB - visualTextDB");
    } catch (error) {
        console.error("MongoDB connection error:", error);
    }
}

connectToMongo();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/photos", photosRoutes);
app.use("/api/batch", batchRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
