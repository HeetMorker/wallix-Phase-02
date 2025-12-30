const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Subschema for each account in the session
const accountSchema = new Schema(
  {
    device: { type: String, default: null }, // To store device name, can be null
    application: { type: String, default: null }, // To store application name, can be null
  },
  { _id: false } // Prevents _id field for each subdocument
);

// Main schema for target groups, which includes the session object
const targetGroupSchema = new Schema(
  {
    group_name: { type: String, required: true }, // Group name is required
    session: {
      accounts: [accountSchema], // Stores array of accounts (device and application)
    },
    ipAddress: { type: String, required: true },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

// Create a model from the schema
const TargetGroup = mongoose.model("TargetGroup", targetGroupSchema);

module.exports = TargetGroup;
