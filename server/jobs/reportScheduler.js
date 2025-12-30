// const cron = require("node-cron");
// const axios = require("axios");
// const SMTPConfig = require("../models/smtpConfig.model");

// function startReportScheduler() {
//   // Run every minute
//   cron.schedule("* * * * *", async () => {
//     const now = new Date();
//     const currentHour = String(now.getUTCHours()).padStart(2, "0");
//     const currentMinute = String(now.getUTCMinutes()).padStart(2, "0");
//     const currentTimeUTC = `${currentHour}:${currentMinute}`;

//     try {
//       const config = await SMTPConfig.findOne().sort({ updatedAt: -1 });
//       if (!config || !config.scheduledTime) {
//         console.warn("[Cron] No SMTP config or scheduledTime found.");
//         return;
//       }

//       if (config.scheduledTime === currentTimeUTC) {
//         console.log(
//           "[Cron] Scheduled time matched. Triggering report automation..."
//         );

//         // 🔁 Trigger frontend automation by calling backend endpoint
//         await axios.post("http://localhost:5000/api/run-reports");
//       } else {
//         console.log(
//           `[Cron] Waiting. Current UTC: ${currentTimeUTC}, Scheduled: ${config.scheduledTime}`
//         );
//       }
//     } catch (err) {
//       console.error("[Cron] Error during scheduled check:", err.message);
//     }
//   });
// }

// module.exports = { startReportScheduler };
const cron = require("node-cron");
const ReportTrigger = require("../models/ReportTrigger.model");
const SMTPConfig = require("../models/smtpConfig.model");

function startReportScheduler() {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    // ✅ Use local system time (not UTC)
    const localHour = String(now.getHours()).padStart(2, "0");
    const localMinute = String(now.getMinutes()).padStart(2, "0");
    const currentLocalTime = `${localHour}:${localMinute}`;

    try {
      const config = await SMTPConfig.findOne().sort({ updatedAt: -1 });
      if (!config || !config.scheduledTime) {
        console.warn("[Cron] No SMTP config or scheduledTime found.");
        return;
      }

      if (config.scheduledTime === currentLocalTime) {
        console.log(
          "[Cron] Scheduled time matched (local). Setting trigger..."
        );

        await ReportTrigger.findOneAndUpdate(
          {},
          { shouldSend: true, updatedAt: new Date() },
          { upsert: true }
        );

        console.log("[Cron] ✅ Flag set to TRUE in DB.");
      } else {
        console.log(
          `[Cron] ⏳ Waiting. Current Local: ${currentLocalTime}, Scheduled: ${config.scheduledTime}`
        );
      }
    } catch (err) {
      console.error("[Cron] ❌ Error during scheduled check:", err.message);
    }
  });
}

module.exports = { startReportScheduler };
