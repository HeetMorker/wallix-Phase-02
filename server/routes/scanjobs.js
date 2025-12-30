// // routes/scanjobs.route.js

// const express = require("express");
// const router = express.Router();
// const axios = require("axios");
// const https = require("https");
// const IPAddress = require("../models/ipAddress.model");
// const ScanJob = require("../models/scanjobs.model");

// const agent = new https.Agent({ rejectUnauthorized: false });
// const username = "admin";

// async function fetchScanJobs() {
//   try {
//     const ipList = await IPAddress.find({ api: "scanjobs" });

//     for (const ipItem of ipList) {
//       const { ipAddress, authKey } = ipItem;

//       try {
//         const response = await axios.get(`https://${ipAddress}/api/scanjobs`, {
//           httpsAgent: agent,
//           headers: {
//             "X-Auth-Key": authKey,
//             "X-Auth-User": username,
//             Accept: "application/json",
//             "Content-Type": "application/json",
//           },
//         });

//         const jobs = response.data;
//         for (const job of jobs) {
//           await ScanJob.findOneAndUpdate(
//             {
//               type: job.type,
//               start: job.start,
//               end: job.end,
//             },
//             {
//               result: job.result || [],
//             },
//             {
//               upsert: true,
//               new: true,
//               setDefaultsOnInsert: true,
//             }
//           );
//         }

//         console.log(`Scanjobs from ${ipAddress} processed successfully.`);
//       } catch (err) {
//         console.error(`Failed to fetch from ${ipAddress}:`, err.message);
//       }
//     }
//   } catch (err) {
//     console.error("Error in fetchScanJobs function:", err.message);
//   }
// }

// router.get("/generate", async (req, res) => {
//   try {
//     await fetchScanJobs();
//     res.status(200).json({ message: "Scanjobs data fetched and saved." });
//   } catch (err) {
//     res
//       .status(500)
//       .json({ message: "Error generating scanjobs.", error: err.message });
//   }
// });

// router.get("/fromdb", async (req, res) => {
//   try {
//     const data = await ScanJob.find();
//     res.status(200).json(data);
//   } catch (err) {
//     console.error("Error fetching scanjobs from DB:", err.message);
//     res.status(500).json({ message: "Failed to fetch scanjobs from DB." });
//   }
// });

// router.get("/filtered", async (req, res) => {
//   try {
//     const { from, to } = req.query;
//     if (!from || !to) {
//       return res.status(400).json({ message: "Missing from/to query params" });
//     }

//     const fromDate = new Date(from);
//     const toDate = new Date(to);

//     const filtered = await ScanJob.find({
//       $or: [
//         { createdAt: { $gte: fromDate, $lte: toDate } },
//         { updatedAt: { $gte: fromDate, $lte: toDate } },
//       ],
//     });

//     res.json(filtered);
//   } catch (error) {
//     console.error("❌ Error fetching filtered ScanJob:", error.message);
//     res.status(500).json({ message: "Failed to retrieve filtered ScanJob" });
//   }
// });

// module.exports = { router, fetchScanJobs };

const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");
const ScanJob = require("../models/scanjobs.model");

const agent = new https.Agent({ rejectUnauthorized: false });
const username = "admin";

/* ---------- helpers ---------- */
function ymdToLocal(ymd, endOfDay = false) {
  if (!ymd) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const y = Number(m[1]),
    mon = Number(m[2]),
    d = Number(m[3]);
  return endOfDay
    ? new Date(y, mon - 1, d, 23, 59, 59, 999)
    : new Date(y, mon - 1, d, 0, 0, 0, 0);
}
const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

/* ---------- fetch & upsert ---------- */
async function fetchScanJobs() {
  try {
    const ipList = await IPAddress.find({ api: "scanjobs" });

    for (const ipItem of ipList) {
      const { ipAddress, authKey } = ipItem;

      try {
        const response = await axios.get(`https://${ipAddress}/api/scanjobs`, {
          httpsAgent: agent,
          headers: {
            "X-Auth-Key": authKey,
            "X-Auth-User": username,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: 30000,
        });

        const jobs = response.data || [];
        for (const job of jobs) {
          await ScanJob.findOneAndUpdate(
            {
              type: job.type,
              start: job.start,
              end: job.end,
            },
            {
              result: job.result || [],
            },
            {
              upsert: true,
              new: true,
              setDefaultsOnInsert: true,
            }
          );
        }

        console.log(`Scanjobs from ${ipAddress} processed successfully.`);
      } catch (err) {
        console.error(`Failed to fetch from ${ipAddress}:`, err.message);
      }
    }
  } catch (err) {
    console.error("Error in fetchScanJobs function:", err.message);
  }
}

/* ---------- existing endpoints ---------- */
router.get("/generate", async (req, res) => {
  try {
    await fetchScanJobs();
    res.status(200).json({ message: "Scanjobs data fetched and saved." });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error generating scanjobs.", error: err.message });
  }
});

router.get("/fromdb", async (req, res) => {
  try {
    const data = await ScanJob.find();
    res.status(200).json(data);
  } catch (err) {
    console.error("Error fetching scanjobs from DB:", err.message);
    res.status(500).json({ message: "Failed to fetch scanjobs from DB." });
  }
});

// DO NOT TOUCH – used by report automation
router.get("/filtered", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: "Missing from/to query params" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const filtered = await ScanJob.find({
      $or: [
        { createdAt: { $gte: fromDate, $lte: toDate } },
        { updatedAt: { $gte: fromDate, $lte: toDate } },
      ],
    });

    res.json(filtered);
  } catch (error) {
    console.error("❌ Error fetching filtered ScanJob:", error.message);
    res.status(500).json({ message: "Failed to retrieve filtered ScanJob" });
  }
});

/* ---------- NEW: UI range endpoint ---------- */
/** GET /api/scanjobs/range?from=YYYY-MM-DD&to=YYYY-MM-DD&by=start|end
 *  - Filters by the chosen field (default: start)
 *  - Inclusive local-day bounds
 *  - Open-ended supported (?from only, ?to only)
 */
router.get("/range", async (req, res) => {
  try {
    const { from, to, by = "start" } = req.query;

    if (!from && !to) {
      const rows = await ScanJob.find().lean();
      return res.json(rows);
    }

    const byKey = by === "end" ? "end" : "start";

    const fromDate = from ? ymdToLocal(from, false) : null;
    const toDate = to ? ymdToLocal(to, true) : null;

    if ((from && !isValidDate(fromDate)) || (to && !isValidDate(toDate))) {
      return res.status(400).json({
        message: "Invalid date format. Use YYYY-MM-DD for 'from' and 'to'.",
      });
    }

    const rangeCond = {};
    if (fromDate) rangeCond.$gte = fromDate;
    if (toDate) rangeCond.$lte = toDate;

    const query = { [byKey]: rangeCond };
    const rows = await ScanJob.find(query).lean();
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching ranged ScanJobs:", error);
    res.status(500).json({ message: "Failed to retrieve ranged ScanJobs" });
  }
});

module.exports = { router, fetchScanJobs };
