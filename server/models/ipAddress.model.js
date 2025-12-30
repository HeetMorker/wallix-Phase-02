const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ipAddressSchema = new Schema(
  {
    api: { type: String, required: true },
    ipAddress: { type: String, required: true },
    bastionName: { type: String },
    authKey: { type: String, required: true },
  },
  { timestamps: true }
);

const IPAddress = mongoose.model("IPAddress", ipAddressSchema);
module.exports = IPAddress;
