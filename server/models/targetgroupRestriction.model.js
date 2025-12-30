const mongoose = require("mongoose");

const targetgroupRestrictionSchema = new mongoose.Schema(
  {
    group_id: { type: String, required: true },
    group_name: { type: String, required: true },

    // New fields from the restrictions API
    restrictions: { type: String },
    subprotocol: { type: String },
    action: { type: String },
    bastionName: { type: String },
    ipAddress: { type: String, required: true },
  },
  { timestamps: true }
);

targetgroupRestrictionSchema.index(
  { group_id: 1, restrictions: 1, ipAddress: 1 },
  { unique: true }
);

const TargetgroupRestriction = mongoose.model(
  "TargetgroupRestriction",
  targetgroupRestrictionSchema
);

module.exports = TargetgroupRestriction;
