// const express = require("express");
// const router = express.Router();
// const axios = require("axios");
// const https = require("https");
// const IPAddress = require("../models/ipAddress.model");
// const Approval = require("../models/approvals.model");

// const agent = new https.Agent({ rejectUnauthorized: false });
// const username = "admin";

// async function fetchApprovals() {
//   try {
//     const ipAddresses = await IPAddress.find({ api: "approvals" });

//     const promises = ipAddresses.map(async (ip) => {
//       const { ipAddress, authKey, bastionName } = ip;
//       try {
//         const response = await axios.get(`https://${ipAddress}/api/approvals`, {
//           httpsAgent: agent,
//           headers: {
//             "X-Auth-Key": authKey,
//             "X-Auth-User": username,
//             Accept: "application/json",
//             "Content-Type": "application/json",
//           },
//         });

//         // Prepare bulkWrite operations
//         const bulkOperations = response.data.map((approval) => ({
//           updateOne: {
//             filter: { id: approval.id }, // Match by unique ID
//             update: {
//               $set: {
//                 user_name: approval.user_name,
//                 target_name: approval.target_name,
//                 creation: new Date(approval.creation),
//                 begin: new Date(approval.begin),
//                 end: approval.end ? new Date(approval.end) : null,
//                 ticket: approval.ticket,
//                 email: approval.email,
//                 ipAddress: ip.ipAddress,
//                 bastionName: bastionName || "Unknown",
//                 duration: approval.duration,
//                 comment: approval.comment,
//                 quorum: approval.quorum,
//                 answers: approval.answers || [],
//               },
//             },
//             upsert: true, // Insert if not found
//           },
//         }));

//         // Execute bulkWrite for deduplication
//         const result = await Approval.bulkWrite(bulkOperations);
//         console.log(
//           `Data from ${ipAddress} processed successfully. Inserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}`
//         );

//         return { success: true, data: response.data };
//       } catch (error) {
//         console.error(
//           `Error fetching data from ${ipAddress}: ${error.message}`
//         );
//         return { success: false, ip: ipAddress, error: error.message };
//       }
//     });

//     const results = await Promise.all(promises);
//     const failed = results.filter((result) => !result.success);
//     if (failed.length > 0) {
//       console.log(
//         "Some IPs failed:",
//         failed.map((f) => f.ip)
//       );
//     }
//     return results.flatMap((result) => result.data || []);
//   } catch (error) {
//     console.error("Error in fetchApprovals function:", error.message);
//     throw error;
//   }
// }

// router.get("/", async (req, res) => {
//   try {
//     const data = await fetchApprovals();
//     res.json(data);
//   } catch (error) {
//     console.error("Error fetching approvals data:", error);
//     res.status(500).json({ message: "Failed to fetch approvals data" });
//   }
// });

// router.get("/fromdb", async (req, res) => {
//   try {
//     const approvals = await Approval.find();
//     res.json(approvals);
//   } catch (error) {
//     console.error(
//       "An error occurred while fetching data from the database:",
//       error
//     );
//     res.status(500).json({ message: "Failed to retrieve devices" });
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

//     const filtered = await Approval.find({
//       $or: [
//         { createdAt: { $gte: fromDate, $lte: toDate } },
//         { updatedAt: { $gte: fromDate, $lte: toDate } },
//       ],
//     });

//     res.json(filtered);
//   } catch (error) {
//     console.error("❌ Error fetching filtered Approvals:", error.message);
//     res.status(500).json({ message: "Failed to retrieve filtered approvals" });
//   }
// });

// module.exports = { router, fetchApprovals };
const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");
const Approval = require("../models/approvals.model");

const agent = new https.Agent({ rejectUnauthorized: false });
const username = "admin";

/* ---------- helpers ---------- */
function ymdToLocal(ymd, endOfDay = false) {
  if (!ymd) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const [, yStr, mStr, dStr] = m;
  const y = Number(yStr),
    mon = Number(mStr),
    d = Number(dStr);
  return endOfDay
    ? new Date(y, mon - 1, d, 23, 59, 59, 999)
    : new Date(y, mon - 1, d, 0, 0, 0, 0);
}
const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

/* ---------- fetch & upsert ---------- */
async function fetchApprovals() {
  try {
    const ipAddresses = await IPAddress.find({ api: "approvals" });

    const promises = ipAddresses.map(async (ip) => {
      const { ipAddress, authKey, bastionName } = ip;
      try {
        const response = await axios.get(`https://${ipAddress}/api/approvals`, {
          httpsAgent: agent,
          headers: {
            "X-Auth-Key": authKey,
            "X-Auth-User": username,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: 30000,
        });

        const bulkOperations = (response.data || []).map((approval) => ({
          updateOne: {
            filter: { id: approval.id },
            update: {
              $set: {
                user_name: approval.user_name,
                target_name: approval.target_name,
                creation: approval.creation
                  ? new Date(approval.creation)
                  : null,
                begin: approval.begin ? new Date(approval.begin) : null,
                end: approval.end ? new Date(approval.end) : null,
                ticket: approval.ticket,
                email: approval.email,
                ipAddress: ip.ipAddress,
                bastionName: bastionName || "Unknown",
                duration: approval.duration,
                comment: approval.comment,
                quorum: approval.quorum,
                answers: approval.answers || [],
              },
            },
            upsert: true,
          },
        }));

        if (bulkOperations.length) {
          await Approval.bulkWrite(bulkOperations, { ordered: false });
        }

        return { success: true };
      } catch (error) {
        console.error(
          `Error fetching data from ${ipAddress}: ${error.message}`
        );
        return { success: false, ip: ipAddress, error: error.message };
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error("Error in fetchApprovals function:", error.message);
    throw error;
  }
}

/* ---------- existing endpoints (unchanged behavior) ---------- */
router.get("/", async (req, res) => {
  try {
    const data = await fetchApprovals();
    res.json(data);
  } catch (error) {
    console.error("Error fetching approvals data:", error);
    res.status(500).json({ message: "Failed to fetch approvals data" });
  }
});

router.get("/fromdb", async (req, res) => {
  try {
    const approvals = await Approval.find();
    res.json(approvals);
  } catch (error) {
    console.error(
      "An error occurred while fetching data from the database:",
      error
    );
    res.status(500).json({ message: "Failed to retrieve devices" });
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

    const filtered = await Approval.find({
      $or: [
        { createdAt: { $gte: fromDate, $lte: toDate } },
        { updatedAt: { $gte: fromDate, $lte: toDate } },
      ],
    });

    res.json(filtered);
  } catch (error) {
    console.error("❌ Error fetching filtered Approvals:", error.message);
    res.status(500).json({ message: "Failed to retrieve filtered approvals" });
  }
});

/* ---------- NEW: range for UI ---------- */
/** GET /api/approvals/range?from=YYYY-MM-DD&to=YYYY-MM-DD&by=creation|begin|end
 *  - Default by=creation. Inclusive local-day bounds.
 *  - Open-ended ranges supported (?from only, ?to only).
 */
router.get("/range", async (req, res) => {
  try {
    const { from, to, by = "creation" } = req.query;

    if (!from && !to) {
      const rows = await Approval.find().lean();
      return res.json(rows);
    }

    const validKeys = new Set(["creation", "begin", "end"]);
    const byKey = validKeys.has(by) ? by : "creation";

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
    const rows = await Approval.find(query).lean();
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching ranged approvals:", error);
    res.status(500).json({ message: "Failed to retrieve ranged approvals" });
  }
});

module.exports = { router, fetchApprovals };
