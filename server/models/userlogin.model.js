const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Store the user's password
  loginTime: { type: Date, default: Date.now }, // Store the time of login
});

const UserLogin = mongoose.model("UserLogin", userSchema);

module.exports = UserLogin;

