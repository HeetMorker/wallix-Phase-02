const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const SMTPConfig = require("../models/smtpConfig.model");
const User = require("../models/User");
const ReportLog = require("../models/reportLog.model");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/",
  upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "excel", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { userId, reportTitle, format, reportKey } = req.body;
      const pdf = req.files["pdf"]?.[0];
      const excel = req.files["excel"]?.[0];

      // Validate required fields
      if (!userId || !reportTitle || !format || !reportKey) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      if ((format === "pdf" && !pdf) || (format === "excel" && !excel)) {
        return res
          .status(400)
          .json({ message: `Missing attached ${format} file` });
      }

      const user = await User.findById(userId);
      if (!user || !user.email) {
        return res.status(404).json({ message: "User or email not found" });
      }

      const smtpConfig = await SMTPConfig.findOne().sort({ updatedAt: -1 });
      if (!smtpConfig) {
        return res
          .status(500)
          .json({ message: "SMTP configuration not found" });
      }

      const transporter = nodemailer.createTransport({
        host: smtpConfig.server,
        port: smtpConfig.port,
        secure: smtpConfig.protocol === "SMTPS",
        auth: {
          user: smtpConfig.username,
          pass: smtpConfig.password,
        },
        authMethod:
          smtpConfig.authMethod !== "Automatic"
            ? smtpConfig.authMethod
            : undefined,
      });

      const attachments = [];
      if (pdf) {
        attachments.push({
          filename: "report.pdf",
          content: pdf.buffer,
        });
      }
      if (excel) {
        attachments.push({
          filename: "report.xlsx",
          content: excel.buffer,
        });
      }

      const mailOptions = {
        from: `"${smtpConfig.senderName}" <${smtpConfig.senderEmail}>`,
        to: user.email,
        subject: `${reportTitle} - ${user.username}`,
        text: `Attached is your ${reportTitle}`,
        attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent:", info.messageId);
      console.log("SMTP Accepted:", info.accepted);
      console.log("SMTP Rejected:", info.rejected);
      console.log("SMTP Response:", info.response);

      // Log success
      await ReportLog.create({
        userId,
        reportKey,
        reportName: reportTitle,
        format,
        status: "sent",
        message: `Email sent successfully to ${user.email}`,
      });

      res.status(200).json({ message: "Email sent and log saved" });
    } catch (error) {
      console.error("[/api/send-report] Error:", error.message);

      try {
        const { userId, reportTitle, format, reportKey } = req.body;
        await ReportLog.create({
          userId,
          reportKey,
          reportName: reportTitle || "Unknown Report",
          format: format || "pdf",
          status: "failed",
          message: error.message,
        });
      } catch (logErr) {
        console.error("Failed to log email error:", logErr.message);
      }

      res
        .status(500)
        .json({ message: "Failed to send email", error: error.message });
    }
  }
);

module.exports = router;
