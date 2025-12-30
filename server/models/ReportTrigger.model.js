const mongoose = require("mongoose");

const reportTriggerSchema = new mongoose.Schema({
  shouldSend: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ReportTrigger", reportTriggerSchema);
