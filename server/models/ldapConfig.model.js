// models/ldapConfig.model.js
const mongoose = require("mongoose");

const ldapConfigSchema = new mongoose.Schema(
  {
    name: String,
    server: String,
    port: Number,
    timeout: Number,
    encryption: { type: String, enum: ["none", "starttls", "ssl"] },
    bindMethod: { type: String, enum: ["simple"] },
    baseDN: String,
    loginAttr: String,
    usernameAttr: String,
    user: String,
    password: String,
    usePrimaryDomain: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("LDAPConfig", ldapConfigSchema);
