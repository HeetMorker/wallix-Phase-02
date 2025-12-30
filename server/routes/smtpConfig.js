//smtpConfig.js
const express = require("express");
const router = express.Router();
const SMTPConfig = require("../models/smtpConfig.model");
const { auth, authorize } = require("../middleware/auth");
const nodemailer = require("nodemailer");

// 🔐 Get current SMTP config (admin only)
router.get("/", auth, authorize("admin"), async (req, res) => {
  try {
    const config = await SMTPConfig.findOne().sort({ updatedAt: -1 });
    if (!config) return res.status(404).json({ message: "No config found" });
    res.json(config);
  } catch (error) {
    console.error("[GET /smtp-config] Error:", error.message);
    res.status(500).json({ message: "Failed to fetch SMTP config" });
  }
});

// 💾 Create or Update SMTP config
router.post("/", auth, authorize("admin"), async (req, res) => {
  try {
    const {
      protocol,
      authMethod,
      server,
      port,
      postmasterEmail,
      senderName,
      senderEmail,
      username,
      password,
      testRecipients,
      scheduledTime,
    } = req.body;

    if (
      !protocol ||
      !authMethod ||
      !server ||
      !port ||
      !postmasterEmail ||
      !senderName ||
      !senderEmail ||
      !username ||
      !password ||
      !scheduledTime
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await SMTPConfig.findOne();
    if (existing) {
      Object.assign(existing, {
        protocol,
        authMethod,
        server,
        port,
        postmasterEmail,
        senderName,
        senderEmail,
        username,
        password,
        testRecipients,
        scheduledTime,
        updatedAt: new Date(),
      });
      await existing.save();
      return res.json({
        message: "SMTP configuration updated",
        config: existing,
      });
    }

    const newConfig = await SMTPConfig.create({
      protocol,
      authMethod,
      server,
      port,
      postmasterEmail,
      senderName,
      senderEmail,
      username,
      password,
      testRecipients,
      scheduledTime,
    });

    res
      .status(201)
      .json({ message: "SMTP configuration saved", config: newConfig });
  } catch (error) {
    console.error("[POST /smtp-config] Error:", error.message);
    res.status(500).json({ message: "Failed to save SMTP configuration" });
  }
});

// 📧 Send test email
router.post("/test", auth, authorize("admin"), async (req, res) => {
  const { to } = req.body;
  if (!to)
    return res
      .status(400)
      .json({ message: "Recipient email (to) is required." });

  try {
    const config = await SMTPConfig.findOne().sort({ updatedAt: -1 });
    if (!config)
      return res.status(404).json({ message: "No SMTP configuration found." });

    const transporter = nodemailer.createTransport({
      host: config.server,
      port: config.port,
      secure: config.protocol === "smtps", // true for SMTPS
      auth: {
        user: config.username,
        pass: config.password,
      },
      authMethod:
        config.authMethod !== "Automatic" ? config.authMethod : undefined,
    });

    const info = await transporter.sendMail({
      from: `"${config.senderName}" <${config.senderEmail}>`,
      to,
      subject: "SMTP Test Email",
      text: "This is a test email to verify the SMTP configuration.",
    });

    res.status(200).json({
      message: "Test email sent successfully.",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("[POST /smtp-config/test] Error:", error.message);
    res
      .status(500)
      .json({ message: "Failed to send test email", error: error.message });
  }
});

module.exports = router;
