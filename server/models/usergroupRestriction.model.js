const mongoose = require("mongoose");

const usergroupRestrictionSchema = new mongoose.Schema(
  {
    group_id: { type: String, required: true },
    group_name: { type: String, required: true },
    users: { type: [String], default: [] },

    // New fields from the restrictions API
    restrictions: { type: String },
    subprotocol: { type: String },
    action: { type: String },
    bastionName: { type: String },
    ipAddress: { type: String, required: true },
  },
  { timestamps: true }
);

usergroupRestrictionSchema.index(
  { group_id: 1, restrictions: 1, ipAddress: 1 },
  { unique: true }
);

const UsergroupRestriction = mongoose.model(
  "UsergroupRestriction",
  usergroupRestrictionSchema
);

module.exports = UsergroupRestriction;
