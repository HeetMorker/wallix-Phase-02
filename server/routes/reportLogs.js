//routes/reportLogs.js
const express = require("express");
const router = express.Router();
const ReportLog = require("../models/reportLog.model");
const { auth, authorize } = require("../middleware/auth");

// Get all logs (admin only)
router.get("/", auth, authorize("admin"), async (req, res) => {
  try {
    const logs = await ReportLog.find()
      .populate("userId", "username email")
      .sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (err) {
    console.error("[GET /report-logs] Error:", err.message);
    res.status(500).json({ message: "Failed to fetch report logs" });
  }
});

// GET logs for a specific user
router.get("/user/:userId", auth, authorize("admin"), async (req, res) => {
  try {
    const logs = await ReportLog.find({ userId: req.params.userId })
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(logs);
  } catch (err) {
    console.error("[GET /report-logs/user/:userId] Error:", err.message);
    res.status(500).json({ message: "Failed to fetch logs" });
  }
});

module.exports = router;
