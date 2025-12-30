const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const bcrypt = require("bcryptjs");

// Centralized list of all report keys (used system-wide)
const ALL_REPORT_APIS = [
  "sessions",
  "user-group",
  "applications",
  "approvals",
  "device-report",
  "scans",
  "user-group-maping",
  "DOCR",
  "credentials",
  "authentications",
];

// Register user (restricted to admins)
router.post("/register", async (req, res) => {
  const {
    username,
    password,
    role,
    status,
    allowedAPIs = [],
    dn,
    email,
  } = req.body;

  try {
    if (!username || !password || !role) {
      return res
        .status(400)
        .json({ message: "Please provide all required fields" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password: hashedPassword,
      role,
      status,
      email,
      dn,
      allowedAPIs: role === "admin" ? ALL_REPORT_APIS : allowedAPIs,
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
