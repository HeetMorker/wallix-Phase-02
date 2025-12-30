const mongoose = require("mongoose");

// Define the schema for applications
const applicationSchema = new mongoose.Schema(
  {
    application_name: { type: String, required: true },
    parameters: { type: String },
    last_connection: { type: Date },
    connection_policy: { type: String },
    application_path: { type: String }, // From paths[0].program
    target_cluster_name: { type: String }, // From target
    ipAddress: { type: String, required: true },
    bastionName: { type: String, default: "Unknown" },
  },
  { timestamps: true }
); // Automatically manage createdAt and updatedAt timestamps

applicationSchema.index(
  { application_name: 1, ipAddress: 1 },
  { unique: true }
);

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
