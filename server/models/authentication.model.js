const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const authenticationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    bastionName: { type: String, required: true },
    username: { type: String, required: true },
    login: { type: Date, required: true },
    logout: { type: Date },
    result: { type: Boolean, required: true },
    source_ip: { type: String, required: true },
    ipAddress: { type: String, required: true }, // From where the API was fetched
  },
  { timestamps: true }
);

const Authentication = mongoose.model("Authentication", authenticationSchema);
module.exports = Authentication;
