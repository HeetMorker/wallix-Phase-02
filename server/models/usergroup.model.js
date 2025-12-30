const mongoose = require("mongoose");

const userGroupSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    group_name: { type: String, required: true },
    users: { type: [String], default: [] }, // Define users as an array of strings
    timeframes: { type: [String], default: [] },
    description: { type: String, default: "N/A" },
    profile: { type: String, default: "No Profile" },
    ipAddress: { type: String, required: true },
  },
  { timestamps: true }
);

const UserGroup = mongoose.model("UserGroup", userGroupSchema);

module.exports = UserGroup;
