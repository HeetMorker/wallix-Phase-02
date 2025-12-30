const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const authorizationSchema = new Schema(
  {
    user_group: { type: String, required: true },
    target_group: { type: String, required: true },
    ipAddress: { type: String, required: true },
  },
  { timestamps: true }
);

const Authorization = mongoose.model("Authorization", authorizationSchema);
module.exports = Authorization;
