const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");

const IPAddress = require("../models/ipAddress.model");
const Otp = require("../models/otp.model");

const agent = new https.Agent({ rejectUnauthorized: false });
const username = "admin";

// Core OTP fetching logic
async function fetchOtpFromIps() {
  try {
    const otpIPs = await IPAddress.find({ api: "otp" });

    const promises = otpIPs.map(async (ip) => {
      const { ipAddress, authKey } = ip;
      try {
        const response = await axios.get(`https://${ipAddress}/api/otp`, {
          httpsAgent: agent,
          headers: {
            "X-Auth-Key": authKey,
            "X-Auth-User": username,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        });

        const otpData = response.data;

        const updated = await Otp.findOneAndUpdate(
          { ipAddress: ipAddress }, // Match by IP address
          {
            id: otpData.id || `${ipAddress}-${Date.now()}`,
            one_time_password: otpData.one_time_password,
            ipAddress: ipAddress,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`✅ OTP updated for ${ipAddress}`);
        return updated;
      } catch (err) {
        console.error(`❌ Failed to fetch OTP from ${ipAddress}:`, err.message);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter(Boolean);
  } catch (error) {
    console.error("❌ Error in fetchOtpFromIps():", error.message);
    throw error;
  }
}

// GET /api/otp => fetch from live endpoints
router.get("/", async (req, res) => {
  try {
    const data = await fetchOtpFromIps();
    res.json(data);
  } catch (error) {
    console.error("Error in OTP fetch route:", error.message);
    res.status(500).json({ message: "Failed to fetch OTPs" });
  }
});

// GET /api/otp/fromdb => return from MongoDB
router.get("/fromdb", async (req, res) => {
  try {
    const otps = await Otp.find();
    res.json(otps);
  } catch (error) {
    console.error("DB fetch error:", error.message);
    res.status(500).json({ message: "Failed to fetch OTPs from DB" });
  }
});

module.exports = { router, fetchOtpFromIps };
