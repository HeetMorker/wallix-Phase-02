// models/scheduledReport.model.js
const mongoose = require("mongoose");

const ScheduledReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  selectedApis: [{ type: String }], // e.g., ['sessions', 'approvals']
  format: { type: String, enum: ["pdf", "excel"], required: true },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, default: "user" }, // For future role-based permissions
});

module.exports = mongoose.model("ScheduledReport", ScheduledReportSchema);
