// models/scanjobs.model.js

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const serviceSchema = new Schema({
  protocol: { type: String },
  port: { type: Number },
  banner: { type: String },
});

const resultSchema = new Schema({
  type: { type: String },
  ip: { type: String },
  services: [serviceSchema],
  name: { type: String, default: null },
});

const scanjobSchema = new Schema(
  {
    type: { type: String, required: true },
    start: { type: String, default: "" },
    end: { type: String, default: "" },
    result: [resultSchema],
  },
  { timestamps: true }
);

const ScanJob = mongoose.model("ScanJob", scanjobSchema);
module.exports = ScanJob;
