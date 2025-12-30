// const express = require("express");
// const router = express.Router();
// const axios = require("axios");
// const https = require("https");
// const IPAddress = require("../models/ipAddress.model");
// const Scan = require("../models/scans.model");

// const agent = new https.Agent({ rejectUnauthorized: false });
// const username = "admin";

// // Fetch and merge scan data with scanjob data
// async function fetchScans() {
//   try {
//     const ipAddresses = await IPAddress.find({ api: "scans" });

//     const results = await Promise.all(
//       ipAddresses.map(async (ip) => {
//         const { ipAddress, authKey } = ip;

//         try {
//           const [scansRes, jobsRes] = await Promise.all([
//             axios.get(`https://${ipAddress}/api/scans`, {
//               httpsAgent: agent,
//               headers: {
//                 "X-Auth-Key": authKey,
//                 "X-Auth-User": username,
//                 Accept: "application/json",
//                 "Content-Type": "application/json",
//               },
//             }),
//             axios.get(`https://${ipAddress}/api/scanjobs`, {
//               httpsAgent: agent,
//               headers: {
//                 "X-Auth-Key": authKey,
//                 "X-Auth-User": username,
//                 Accept: "application/json",
//                 "Content-Type": "application/json",
//               },
//             }),
//           ]);

//           const scanJobs = jobsRes.data;

//           const enrichedScans = scansRes.data.map((scan) => {
//             const match = scanJobs.find(
//               (job) => job.type === scan.type && job.status === "success"
//             );

//             return {
//               ...scan,
//               start: match?.start || "-",
//               end: match?.end || "-",
//               ipAddress,
//             };
//           });

//           const bulkOps = enrichedScans.map((scan) => ({
//             updateOne: {
//               filter: { id: scan.id },
//               update: { $set: scan },
//               upsert: true,
//             },
//           }));

//           await Scan.bulkWrite(bulkOps);

//           return { success: true, data: enrichedScans };
//         } catch (err) {
//           console.error(`Error from ${ipAddress}: ${err.message}`);
//           return { success: false };
//         }
//       })
//     );

//     return results.flatMap((r) => r.data || []);
//   } catch (err) {
//     console.error("Failed in fetchScans():", err.message);
//     throw err;
//   }
// }

// router.get("/", async (req, res) => {
//   try {
//     const data = await fetchScans();
//     res.json(data);
//   } catch (error) {
//     console.error("Error fetching Scans data:", error);
//     res.status(500).json({ message: "Failed to fetch Scans data" });
//   }
// });

// router.get("/fromdb", async (req, res) => {
//   try {
//     const scans = await Scan.find();
//     res.json(scans);
//   } catch (error) {
//     console.error(
//       "An error occurred while fetching data from the database:",
//       error
//     );
//     res.status(500).json({ message: "Failed to retrieve scans" });
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

//     const filtered = await Scan.find({
//       $or: [
//         { createdAt: { $gte: fromDate, $lte: toDate } },
//         { updatedAt: { $gte: fromDate, $lte: toDate } },
//       ],
//     });

//     res.json(filtered);
//   } catch (error) {
//     console.error("❌ Error fetching filtered Scan:", error.message);
//     res.status(500).json({ message: "Failed to retrieve filtered Scan" });
//   }
// });

// module.exports = { router, fetchScans };
const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");
const Scan = require("../models/scans.model");

const agent = new https.Agent({ rejectUnauthorized: false });
const username = "admin";

/* ---------------- Helpers ---------------- */

// Local (server timezone) start/end of day from "YYYY-MM-DD"
function ymdToLocal(ymd, endOfDay = false) {
  if (!ymd) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const [, y, mon, d] = m.map(Number);
  // Local time to align with browser date inputs
  return endOfDay
    ? new Date(y, mon - 1, d, 23, 59, 59, 999)
    : new Date(y, mon - 1, d, 0, 0, 0, 0);
}

function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}

/* -------- Fetch and upsert scans (enrich with scanjobs) -------- */
async function fetchScans() {
  try {
    const ipAddresses = await IPAddress.find({ api: "scans" });

    const results = await Promise.all(
      ipAddresses.map(async (ip) => {
        const { ipAddress, authKey } = ip;

        try {
          const [scansRes, jobsRes] = await Promise.all([
            axios.get(`https://${ipAddress}/api/scans`, {
              httpsAgent: agent,
              headers: {
                "X-Auth-Key": authKey,
                "X-Auth-User": username,
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              timeout: 30000,
            }),
            axios.get(`https://${ipAddress}/api/scanjobs`, {
              httpsAgent: agent,
              headers: {
                "X-Auth-Key": authKey,
                "X-Auth-User": username,
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              timeout: 30000,
            }),
          ]);

          const scanJobs = jobsRes.data || [];

          const enrichedScans = (scansRes.data || []).map((scan) => {
            const match = scanJobs.find(
              (job) => job.type === scan.type && job.status === "success"
            );

            const start = match?.start
              ? new Date(match.start)
              : scan.start
              ? new Date(scan.start)
              : null;

            const end = match?.end
              ? new Date(match.end)
              : scan.end
              ? new Date(scan.end)
              : null;

            return {
              ...scan,
              start: isValidDate(start) ? start : null,
              end: isValidDate(end) ? end : null,
              ipAddress,
            };
          });

          if (enrichedScans.length) {
            const bulkOps = enrichedScans.map((s) => ({
              updateOne: {
                filter: { id: s.id },
                update: { $set: s },
                upsert: true,
              },
            }));
            await Scan.bulkWrite(bulkOps, { ordered: false });
          }

          return { success: true, data: enrichedScans };
        } catch (err) {
          console.error(`Error from ${ipAddress}: ${err.message}`);
          return { success: false };
        }
      })
    );

    return results.flatMap((r) => r.data || []);
  } catch (err) {
    console.error("Failed in fetchScans():", err.message);
    throw err;
  }
}

/* ---------------- Existing routes (UNCHANGED) ---------------- */

router.get("/", async (req, res) => {
  try {
    const data = await fetchScans();
    res.json(data);
  } catch (error) {
    console.error("Error fetching Scans data:", error);
    res.status(500).json({ message: "Failed to fetch Scans data" });
  }
});

router.get("/fromdb", async (req, res) => {
  try {
    const scans = await Scan.find();
    res.json(scans);
  } catch (error) {
    console.error(
      "An error occurred while fetching data from the database:",
      error
    );
    res.status(500).json({ message: "Failed to retrieve scans" });
  }
});

// DO NOT TOUCH – automation
router.get("/filtered", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: "Missing from/to query params" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const filtered = await Scan.find({
      $or: [
        { createdAt: { $gte: fromDate, $lte: toDate } },
        { updatedAt: { $gte: fromDate, $lte: toDate } },
      ],
    });

    res.json(filtered);
  } catch (error) {
    console.error("❌ Error fetching filtered Scan:", error.message);
    res.status(500).json({ message: "Failed to retrieve filtered Scan" });
  }
});

/* ---------------- NEW UI Range Endpoint ----------------
 * GET /api/scans/range?from=YYYY-MM-DD&to=YYYY-MM-DD&by=start|activity
 * - by=start (default): filter primarily by 'start'
 *   ALSO include records with missing/invalid start via createdAt/updatedAt
 * - by=activity: filter only by createdAt/updatedAt
 * - open-ended ranges allowed
 */
router.get("/range", async (req, res) => {
  try {
    const { from, to, by = "start" } = req.query;

    if (!from && !to) {
      const scans = await Scan.find().lean();
      return res.json(scans);
    }

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

    let query;
    if (by === "activity") {
      query = { $or: [{ createdAt: rangeCond }, { updatedAt: rangeCond }] };
    } else {
      // Primary by start, plus fallback for rows with no usable start
      query = {
        $or: [
          { start: rangeCond }, // normal case
          { start: { $in: [null, "", "-"] }, createdAt: rangeCond }, // fallback
          { start: { $in: [null, "", "-"] }, updatedAt: rangeCond }, // fallback
        ],
      };
    }

    const items = await Scan.find(query).lean();
    return res.json(items);
  } catch (error) {
    console.error("Error in /range (scans):", error);
    res.status(500).json({ message: "Failed to retrieve ranged scans" });
  }
});

module.exports = { router, fetchScans };
