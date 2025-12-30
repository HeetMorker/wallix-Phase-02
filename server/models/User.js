// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    dn: { type: String }, // Common Name for LDAP lookup
    role: { type: String, required: true },
    status: { type: String, default: "active" },
    email: { type: String },
    allowedAPIs: [{ type: String }],
    authMethod: {
      type: String,
      enum: ["local", "ldap"],
      default: "local",
      required: true,
    },
    password: {
      type: String,
    },
  },
  { timestamps: true }
);

// Hash password before saving the user
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Method to compare input password with hashed password
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);

// utils/ldapAuth.js
const ldap = require("ldapjs");

const ldapClient = ldap.createClient({
  url: "ldap://192.168.3.23:389",
  reconnect: true,
  connectTimeout: 5000,
  timeout: 10000,
});
