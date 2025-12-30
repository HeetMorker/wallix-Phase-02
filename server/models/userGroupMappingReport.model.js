// models/userGroupMappingReport.model.js
const mongoose = require("mongoose");

const userGroupMappingReportSchema = new mongoose.Schema(
  {
    user_group: { type: String, required: true },
    target_group: { type: String, required: true },
    devices: { type: String, required: true },
    host: { type: String, required: true },
    protocol: { type: String, required: true },
    users: { type: String, required: true }, // Store usernames as a comma-separated string
    external_group: { type: String, default: "-" },
    bastionName: { type: String },
  },
  { timestamps: true }
);

const UserGroupMappingReport = mongoose.model(
  "UserGroupMappingReport",
  userGroupMappingReportSchema
);

module.exports = UserGroupMappingReport;
