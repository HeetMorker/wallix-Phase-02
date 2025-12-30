// const express = require("express");
// const router = express.Router();
// const ReportTrigger = require("../models/ReportTrigger.model");

// // POST: Set trigger
// router.post("/", async (req, res) => {
//   try {
//     await ReportTrigger.findOneAndUpdate(
//       {},
//       { shouldSend: true, updatedAt: new Date() },
//       { upsert: true }
//     );
//     console.log("[/api/run-reports] Flag set to TRUE in DB.");
//     res.status(200).json({ message: "Trigger set in DB." });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Failed to set flag.", error: err.message });
//   }
// });

// // GET: Check trigger
// router.get("/", async (req, res) => {
//   try {
//     const doc = await ReportTrigger.findOne({});
//     res.json({ shouldSend: doc?.shouldSend || false });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Failed to read flag.", error: err.message });
//   }
// });

// // POST: Reset trigger
// router.post("/reset", async (req, res) => {
//   try {
//     await ReportTrigger.findOneAndUpdate(
//       {},
//       { shouldSend: false, updatedAt: new Date() }
//     );
//     console.log("[/api/run-reports/reset] Flag reset to FALSE in DB.");
//     res.status(200).json({ message: "Trigger reset in DB." });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Failed to reset flag.", error: err.message });
//   }
// });

// module.exports = router;
const express = require("express");
const router = express.Router();
const ReportTrigger = require("../models/ReportTrigger.model");

/**
 * GET /api/run-reports
 * Check if automated reports should be sent.
 * Returns: { shouldSend: true/false }
 */
router.get("/", async (req, res) => {
  try {
    const doc = await ReportTrigger.findOne({});
    const shouldSend = doc?.shouldSend === true;
    res.status(200).json({ shouldSend });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to read flag.", error: err.message });
  }
});

/**
 * POST /api/run-reports
 * Set the flag to true to trigger frontend to send reports.
 */
router.post("/", async (req, res) => {
  try {
    await ReportTrigger.findOneAndUpdate(
      {},
      { shouldSend: true, updatedAt: new Date() },
      { upsert: true }
    );
    console.log("[/api/run-reports] Flag set to TRUE in DB.");
    res.status(200).json({ message: "Trigger set in DB." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to set flag.", error: err.message });
  }
});

/**
 * POST /api/run-reports/reset
 * Reset the flag to false after frontend finishes sending reports.
 */
router.post("/reset", async (req, res) => {
  try {
    await ReportTrigger.findOneAndUpdate(
      {},
      { shouldSend: false, updatedAt: new Date() }
    );
    console.log("[/api/run-reports/reset] Flag reset to FALSE in DB.");
    res.status(200).json({ message: "Trigger reset in DB." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to reset flag.", error: err.message });
  }
});

module.exports = router;
