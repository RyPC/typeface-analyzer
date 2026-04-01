const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const verifyToken = require("../middleware/auth");

router.post("/register", async (req, res) => {
    try {
        const { username, password, firstName, lastName, initials } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = new User({ username, password: hashedPassword, firstName, lastName, initials });
        await user.save();
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Error registering user" });
    }
});

router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "24h" });
        const userInfo = {
            id: user._id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            initials: user.initials,
        };
        res.json({ token, user: userInfo });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Error during login" });
    }
});

router.post("/logout", verifyToken, async (req, res) => {
    try {
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Error during logout" });
    }
});

router.get("/verify", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        res.json({ valid: true, user });
    } catch (error) {
        console.error("Token verification error:", error);
        res.status(401).json({ message: "Invalid token" });
    }
});

module.exports = router;
