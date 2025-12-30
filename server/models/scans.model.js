const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the main schema for the scan data
const scanSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    active: { type: Boolean, required: true },
    periodicity: { type: String, default: "-" },
    description: { type: String, default: "-" },
    start: { type: String, default: "-" },
    end: { type: String, default: "-" },
    emails: { type: [String], default: [] },

    dn_list: { type: [String], required: true },
    ipAddress: { type: String, required: true },
  },
  { timestamps: true }
);

const Scan = mongoose.model("Scan", scanSchema);

module.exports = Scan;
