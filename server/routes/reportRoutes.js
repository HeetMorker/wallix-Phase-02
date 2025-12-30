// routes/report.js
const express = require("express");
const router = express.Router();
const { generateReport } = require("./reportGenerator");
const UserGroupMappingReport = require("../models/userGroupMappingReport.model");

// Route to generate the report
router.get("/generate", async (req, res) => {
  try {
    const data = await generateReport();
    res.status(200).json({ message: "Report generated successfully", data });
  } catch (error) {
    console.error("Error generating report:", error.message);
    res
      .status(500)
      .json({ message: "Failed to generate report", error: error.message });
  }
});

// Route to fetch the report from the database
router.get("/fromdb", async (req, res) => {
  try {
    const report = await UserGroupMappingReport.find();
    res.status(200).json(report);
  } catch (error) {
    console.error("Error fetching report from database:", error.message);
    res
      .status(500)
      .json({ message: "Failed to fetch report", error: error.message });
  }
});

router.get("/filtered", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: "Missing from/to query params" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const filtered = await UserGroupMappingReport.find({
      $or: [
        { createdAt: { $gte: fromDate, $lte: toDate } },
        { updatedAt: { $gte: fromDate, $lte: toDate } },
      ],
    });

    res.json(filtered);
  } catch (error) {
    console.error(
      "❌ Error fetching filtered UserGroupMappingReport:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Failed to retrieve filtered UserGroupMappingReport" });
  }
});

module.exports = router;
