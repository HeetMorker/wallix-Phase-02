const mongoose = require("mongoose");

const reportLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reportKey: { type: String, required: true }, // e.g. "useractivity"
  reportName: { type: String, required: true }, // e.g. "User Activity Report"
  format: { type: String, enum: ["pdf", "excel"], required: true },
  status: { type: String, enum: ["sent", "failed"], required: true },
  message: { type: String }, // Error message or success note
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ReportLog", reportLogSchema);
