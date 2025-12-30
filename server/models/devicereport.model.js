// const mongoose = require("mongoose");

// const deviceReportSchema = new mongoose.Schema(
//   {
//     device_name: { type: String, required: true },
//     host: { type: String, required: true },
//     last_connection: { type: Date },
//     onboard_status: { type: String, required: true },
//     protocols: { type: [String], required: true },
//     ipAddress: { type: String, required: true },
//   },
//   { timestamps: true }
// );

// const DeviceReport = mongoose.model("DeviceReport", deviceReportSchema);

// module.exports = DeviceReport;

const mongoose = require("mongoose");

// Subschema for services
const serviceSchema = new mongoose.Schema({
  service_name: { type: String },
  protocol: { type: String },
  port: { type: Number },
  subprotocols: { type: [String] }, // Array of subprotocols
});

// Main device schema
const deviceReportSchema = new mongoose.Schema(
  {
    device_name: { type: String, required: true },
    host: { type: String, required: true },
    last_connection: { type: Date },
    onboard_status: { type: String, required: true },
    services: [serviceSchema], // Nested schema for services
    ipAddress: { type: String, required: true },
  },
  { timestamps: true }
);

const DeviceReport = mongoose.model("DeviceReport", deviceReportSchema);

module.exports = DeviceReport;
