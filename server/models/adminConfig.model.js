const mongoose = require("mongoose");

const adminConfigSchema = new mongoose.Schema({
  property: { type: String, required: true },
  value: { type: String, required: true },
});

const AdminConfig = mongoose.model(
  "AdminConfig",
  adminConfigSchema,
  "adminConfig"
);

module.exports = AdminConfig;
