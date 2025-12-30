// const express = require("express");
// const router = express.Router();
// const axios = require("axios");
// const https = require("https");
// const IPAddress = require("../models/ipAddress.model");
// const Application = require("../models/application.model");

// const agent = new https.Agent({ rejectUnauthorized: false });
// const username = "admin";

// async function fetchApplications() {
//   try {
//     const ipAddresses = await IPAddress.find({ api: "applications" });

//     const promises = ipAddresses.map(async (ip) => {
//       const { ipAddress, authKey, bastionName } = ip;
//       try {
//         const response = await axios.get(
//           `https://${ipAddress}/api/applications`,
//           {
//             httpsAgent: agent,
//             headers: {
//               "X-Auth-Key": authKey,
//               "X-Auth-User": username,
//               Accept: "application/json",
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         const bulkOperations = response.data.map((app) => ({
//           updateOne: {
//             filter: {
//               application_name: app.application_name,
//               ipAddress: ipAddress,
//             },
//             update: {
//               $set: {
//                 parameters: app.parameters,
//                 last_connection: new Date(app.last_connection),
//                 connection_policy: app.connection_policy || "-",
//                 application_path: app.paths?.[0]?.program || "-",
//                 target_cluster_name: app.target || "-",
//                 ipAddress: ipAddress,
//                 bastionName: bastionName || "Unknown", // ✅ Added field
//               },
//             },
//             upsert: true,
//           },
//         }));

//         const result = await Application.bulkWrite(bulkOperations);
//         console.log(
//           `✅ Data from ${ipAddress} (${bastionName}) processed. Inserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}`
//         );

//         return { success: true, data: response.data };
//       } catch (error) {
//         console.error(
//           `❌ Error fetching data from ${ipAddress} (${bastionName}): ${error.message}`
//         );
//         return { success: false, ip: ipAddress, error: error.message };
//       }
//     });

//     const results = await Promise.all(promises);
//     const failed = results.filter((result) => !result.success);
//     if (failed.length > 0) {
//       console.warn(
//         "⚠️ Some IPs failed:",
//         failed.map((f) => f.ip)
//       );
//     }
//     return results.flatMap((result) => result.data || []);
//   } catch (error) {
//     console.error("🔥 Error in fetchApplications function:", error.message);
//     throw error;
//   }
// }

// router.get("/", async (req, res) => {
//   try {
//     const data = await fetchApplications();
//     res.json(data);
//   } catch (error) {
//     console.error("❌ Error fetching Applications data:", error);
//     res.status(500).json({ message: "Failed to fetch Applications data" });
//   }
// });

// router.get("/fromdb", async (req, res) => {
//   try {
//     const applications = await Application.find();
//     res.json(applications);
//   } catch (error) {
//     console.error("❌ DB fetch error for Applications:", error);
//     res.status(500).json({ message: "Failed to retrieve applications" });
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

//     const filtered = await Application.find({
//       $or: [
//         { createdAt: { $gte: fromDate, $lte: toDate } },
//         { updatedAt: { $gte: fromDate, $lte: toDate } },
//       ],
//     });

//     res.json(filtered);
//   } catch (error) {
//     console.error("❌ Error fetching filtered Applications:", error.message);
//     res
//       .status(500)
//       .json({ message: "Failed to retrieve filtered applications" });
//   }
// });

// module.exports = { router, fetchApplications };
const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");
const Application = require("../models/application.model");

const agent = new https.Agent({ rejectUnauthorized: false });
const username = "admin";

/* ---------- helpers ---------- */

// local start/end of day from "YYYY-MM-DD"
function ymdToLocal(ymd, endOfDay = false) {
  if (!ymd) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const [, y, mon, d] = m.map(Number);
  return endOfDay
    ? new Date(y, mon - 1, d, 23, 59, 59, 999)
    : new Date(y, mon - 1, d, 0, 0, 0, 0);
}
const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

/* ---------- fetch & upsert ---------- */
async function fetchApplications() {
  try {
    const ipAddresses = await IPAddress.find({ api: "applications" });

    const promises = ipAddresses.map(async (ip) => {
      const { ipAddress, authKey, bastionName } = ip;
      try {
        const response = await axios.get(
          `https://${ipAddress}/api/applications`,
          {
            httpsAgent: agent,
            headers: {
              "X-Auth-Key": authKey,
              "X-Auth-User": username,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            timeout: 30000,
          }
        );

        const bulkOperations = (response.data || []).map((app) => {
          const lc = app.last_connection ? new Date(app.last_connection) : null;
          return {
            updateOne: {
              filter: { application_name: app.application_name, ipAddress },
              update: {
                $set: {
                  parameters: app.parameters,
                  last_connection: isValidDate(lc) ? lc : null, // store as Date or null
                  connection_policy: app.connection_policy || "-",
                  application_path: app.paths?.[0]?.program || "-",
                  target_cluster_name: app.target || "-",
                  ipAddress,
                  bastionName: bastionName || "Unknown",
                },
              },
              upsert: true,
            },
          };
        });

        if (bulkOperations.length) {
          await Application.bulkWrite(bulkOperations, { ordered: false });
        }
        return { success: true };
      } catch (error) {
        console.error(
          `❌ Error fetching data from ${ipAddress} (${bastionName}): ${error.message}`
        );
        return { success: false, ip: ipAddress, error: error.message };
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("🔥 Error in fetchApplications:", error.message);
    throw error;
  }
}

/* ---------- existing endpoints (unchanged) ---------- */
router.get("/", async (req, res) => {
  try {
    await fetchApplications();
    const all = await Application.find();
    res.json(all);
  } catch (error) {
    console.error("❌ Error fetching Applications data:", error);
    res.status(500).json({ message: "Failed to fetch Applications data" });
  }
});

router.get("/fromdb", async (req, res) => {
  try {
    const applications = await Application.find();
    res.json(applications);
  } catch (error) {
    console.error("❌ DB fetch error for Applications:", error);
    res.status(500).json({ message: "Failed to retrieve applications" });
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
    const filtered = await Application.find({
      $or: [
        { createdAt: { $gte: fromDate, $lte: toDate } },
        { updatedAt: { $gte: fromDate, $lte: toDate } },
      ],
    });
    res.json(filtered);
  } catch (error) {
    console.error("❌ Error fetching filtered Applications:", error.message);
    res
      .status(500)
      .json({ message: "Failed to retrieve filtered applications" });
  }
});

/* ---------- NEW range endpoint for UI ---------- */
/** GET /api/applications/range?from=YYYY-MM-DD&to=YYYY-MM-DD
 *  - filters by `last_connection` (inclusive, local day bounds)
 *  - also returns rows missing last_connection if their createdAt/updatedAt
 *    fall in the range (migration-friendly)
 *  - open-ended ranges supported (?from=... only, ?to=... only)
 */
router.get("/range", async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from && !to) {
      const apps = await Application.find().lean();
      return res.json(apps);
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

    const query = {
      $or: [
        { last_connection: rangeCond }, // normal case
        { last_connection: { $in: [null, "", "-"] }, createdAt: rangeCond }, // fallback
        { last_connection: { $in: [null, "", "-"] }, updatedAt: rangeCond }, // fallback
      ],
    };

    const rows = await Application.find(query).lean();
    res.json(rows);
  } catch (error) {
    console.error("❌ Error in /applications/range:", error);
    res.status(500).json({ message: "Failed to retrieve ranged applications" });
  }
});

module.exports = { router, fetchApplications };
