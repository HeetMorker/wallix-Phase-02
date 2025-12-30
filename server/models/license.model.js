const mongoose = require("mongoose");

const licenseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, 
    email: { type: String, required: true },
  },
);

const License = mongoose.model("License", licenseSchema, "license");

module.exports = License;
