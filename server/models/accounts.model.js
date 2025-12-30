const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    onboard_status: { type: String, required: true }, 
    ipAddress: { type: String, required: true },   
    fetchedAt: { type: Date, default: Date.now },  
  },
  { timestamps: true }
);

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
