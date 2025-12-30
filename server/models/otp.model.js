const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    one_time_password: { type: String, required: true },
    ipAddress: { type: String, required: true },
  },
  { timestamps: true }
);

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;
