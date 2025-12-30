const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sessionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    username: { type: String }, // Username (e.g., "Bob@wallix.lab")
    target_account: { type: String }, // Target Account
    target_host: { type: String, default: "" }, // Target Host (might be empty)
    target_protocol: { type: String }, // Protocol (e.g., RDP)
    begin: { type: String }, // Start time
    end: { type: String }, // End time
    target_group: { type: String },
    ipAddress: { type: String },
    bastionName: { type: String },
  },
  { timestamps: true }
);

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
