// routes/scheduledReports.js

const express = require("express");
const router = express.Router();
const ScheduledReport = require("../models/scheduleReport.model");
const { auth, authorize } = require("../middleware/auth");

// GET all scheduled reports (admin only)
router.get("/", auth, authorize("admin"), async (req, res) => {
  try {
    const schedules = await ScheduledReport.find().populate(
      "userId",
      "username email"
    );
    res.status(200).json(schedules);
  } catch (err) {
    console.error("[GET /scheduled-reports] Error:", err.message);
    res.status(500).json({ message: "Failed to fetch scheduled reports" });
  }
});

// POST new or update existing schedule for user
router.post("/", auth, authorize("admin"), async (req, res) => {
  const { userId, selectedApis, format } = req.body;

  if (!userId || !selectedApis || !format) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const schedules = await ScheduledReport.find({ userId, format });

    // ✅ Check for exact match of selectedApis (regardless of order)
    const duplicate = schedules.find((s) => {
      const existing = [...s.selectedApis].sort().join(",");
      const incoming = [...selectedApis].sort().join(",");
      return existing === incoming;
    });

    if (duplicate) {
      return res.status(409).json({
        message:
          "A schedule with the same user, reports, and format already exists.",
      });
    }

    const newSchedule = await ScheduledReport.create({
      userId,
      selectedApis,
      format,
    });

    res.status(201).json({
      message: "Schedule created",
      schedule: newSchedule,
    });
  } catch (err) {
    console.error("[POST /scheduled-reports] Error:", err.message);
    res.status(500).json({ message: "Failed to save scheduled report" });
  }
});

// PUT update by ID
router.put("/:id", auth, authorize("admin"), async (req, res) => {
  const { id } = req.params;
  const { selectedApis, format } = req.body;

  try {
    const updated = await ScheduledReport.findByIdAndUpdate(
      id,
      { selectedApis, format },
      { new: true }
    );
    res.status(200).json({ message: "Schedule updated", schedule: updated });
  } catch (err) {
    console.error("[PUT /scheduled-reports/:id] Error:", err.message);
    res.status(500).json({ message: "Failed to update scheduled report" });
  }
});

// DELETE by ID
router.delete("/:id", auth, authorize("admin"), async (req, res) => {
  try {
    await ScheduledReport.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Schedule deleted" });
  } catch (err) {
    console.error("[DELETE /scheduled-reports/:id] Error:", err.message);
    res.status(500).json({ message: "Failed to delete scheduled report" });
  }
});

module.exports = router;
