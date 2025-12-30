const mongoose = require("mongoose");

const logoSchema = new mongoose.Schema({
  base64: { type: String, required: true }, // base64 image string
  contentType: { type: String }, // e.g., image/png
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Logo", logoSchema);
