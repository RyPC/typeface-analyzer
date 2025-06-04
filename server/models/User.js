// models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    initials: { type: String, required: true },
    password: { type: String, required: true }, // hashed
});

module.exports = mongoose.model("User", userSchema);
