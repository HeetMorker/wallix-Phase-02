const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the Splunk Data schema
const splunkDataSchema = new Schema(
  {
    type: { type: String },
    action: { type: String },
    account: { type: String },
    result: { type: String },
    reason: { type: String, required: false, default: "No reason provided" },
    date: { type: String },
    age: { type: String },
    host: { type: String },
    target_server: { type: String },
  },
  { timestamps: true }
);

// Create the Splunk Data model
const SplunkData = mongoose.model("SplunkData", splunkDataSchema);

module.exports = SplunkData;
