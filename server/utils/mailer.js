// utils/mailer.js
const nodemailer = require("nodemailer");
const SMTPConfig = require("../models/smtpConfig.model");

async function getSMTPTransporter() {
  const config = await SMTPConfig.findOne().sort({ updatedAt: -1 });

  if (!config) {
    throw new Error("No SMTP configuration found in database.");
  }

  const secure = config.protocol === "SMTPS";

  const transporterOptions = {
    host: config.server,
    port: config.port,
    secure,
    auth: {
      user: config.username,
      pass: config.password,
    },
  };

  if (config.authMethod && config.authMethod !== "Automatic") {
    transporterOptions.authMethod = config.authMethod;
  }

  return nodemailer.createTransport(transporterOptions);
}

async function sendReportEmail({ to, subject, text, attachments }) {
  try {
    const config = await SMTPConfig.findOne().sort({ updatedAt: -1 });
    if (!config) throw new Error("No SMTP configuration found");

    const transporter = await getSMTPTransporter();

    const info = await transporter.sendMail({
      from: `\"${config.senderName}\" <${config.senderEmail}>`,
      to,
      subject,
      text,
      attachments: [
        {
          filename: "report.pdf",
          content: pdfBuffer,
        },
      ],
    });

    console.log(`[Email] Sent to ${to}, ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Email Error]", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { sendReportEmail };
