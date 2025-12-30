const mongoose = require("mongoose");

const smtpConfigSchema = new mongoose.Schema(
  {
    protocol: {
      type: String,
      enum: ["SMTP", "SMTPS", "SMTP + STARTTLS"],
      required: true,
    },
    authMethod: {
      type: String,
      enum: ["Automatic", "PLAIN", "LOGIN", "SCRAM-SHA-1", "CRAM-MD5", "NTLM"],
      default: "Automatic",
    },
    server: { type: String, required: true },
    port: { type: Number, required: true },
    postmasterEmail: { type: String, required: true },
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    testRecipients: { type: [String], default: [] },
    scheduledTime: {
      type: String,
      default: "01:00",
      match: /^([01]\d|2[0-3]):([0-5]\d)$/, // Ensures valid HH:MM format
    },
    createdBy: { type: String, default: "admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SMTPConfig", smtpConfigSchema);
