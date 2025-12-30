const mongoose = require("mongoose");

// Subschema for services
const serviceSchema = new mongoose.Schema({
  service_name: String,
  protocol: String,
  port: Number,
  connection_policy: String,
  global_domains: [String],
  subprotocols: [String],
});

// Main device schema
const deviceReportSchema = new mongoose.Schema(
  {
    device_name: { type: String, required: true },
    host: { type: String, required: true },
    last_connection: Date,
    onboard_status: { type: String, required: true },
    tags: [String],
    local_domains: [String],
    services: [serviceSchema],
    ipAddress: { type: String, required: true },
    bastionName: { type: String },
  },
  { timestamps: true }
);

deviceReportSchema.index({ device_name: 1, host: 1 }, { unique: true });

const DeviceReport = mongoose.model("DeviceReport", deviceReportSchema);

module.exports = DeviceReport;
