// const express = require("express");
// const router = express.Router();
// const axios = require("axios");
// const https = require("https");
// const IPAddress = require("../models/ipAddress.model");
// const DeviceReport = require("../models/devicereport.schema");

// const agent = new https.Agent({ rejectUnauthorized: false });
// const username = "admin";

// async function fetchDeviceReport() {
//   try {
//     const ipAddresses = await IPAddress.find({ api: "devicereport" });

//     const promises = ipAddresses.map(async (ip) => {
//       const { ipAddress, authKey, bastionName } = ip;
//       try {
//         const response = await axios.get(`https://${ipAddress}/api/devices`, {
//           httpsAgent: agent,
//           headers: {
//             "X-Auth-Key": authKey,
//             "X-Auth-User": username,
//             Accept: "application/json",
//             "Content-Type": "application/json",
//           },
//         });

//         const filteredData = response.data.map((device) => {
//           const services = (device.services || []).map((service) => ({
//             service_name: service.service_name,
//             protocol: service.protocol,
//             port: service.port,
//             connection_policy: service.connection_policy,
//             global_domains: service.global_domains || [],
//             subprotocols: service.subprotocols,
//           }));

//           return {
//             device_name: device.device_name,
//             host: device.host,
//             last_connection: device.last_connection
//               ? new Date(device.last_connection)
//               : null,
//             onboard_status: device.onboard_status || "-",
//             tags: device.tags || [],
//             local_domains: (device.local_domains || []).map(
//               (d) => d.domain_name
//             ),
//             services,
//             ipAddress: ip.ipAddress,
//             bastionName: bastionName || "Unknown",
//           };
//         });

//         // Create bulk operations
//         const bulkOperations = filteredData.map((device) => ({
//           updateOne: {
//             filter: { device_name: device.device_name, host: device.host }, // Match criteria
//             update: { $set: device }, // Update data
//             upsert: true, // Insert if not found
//           },
//         }));

//         // Execute bulkWrite
//         const result = await DeviceReport.bulkWrite(bulkOperations);
//         console.log(
//           `Data from ${ipAddress} processed successfully. Inserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}`
//         );
//         return { success: true, data: filteredData };
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
//     console.error("Error in fetchDeviceReport function:", error.message);
//     throw error;
//   }
// }

// router.get("/", async (req, res) => {
//   try {
//     const data = await fetchDeviceReport();
//     res.json(data);
//   } catch (error) {
//     console.error("Error fetching DeviceReport data:", error);
//     res.status(500).json({ message: "Failed to fetch DeviceReport data" });
//   }
// });

// router.get("/fromdb", async (req, res) => {
//   try {
//     const devices = await DeviceReport.find();
//     res.json(devices);
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

//     const filtered = await DeviceReport.find({
//       $or: [
//         { createdAt: { $gte: fromDate, $lte: toDate } },
//         { updatedAt: { $gte: fromDate, $lte: toDate } },
//       ],
//     });

//     res.json(filtered);
//   } catch (error) {
//     console.error("❌ Error fetching filtered DeviceReport:", error.message);
//     res
//       .status(500)
//       .json({ message: "Failed to retrieve filtered DeviceReport" });
//   }
// });

// module.exports = { router, fetchDeviceReport };
const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");
const DeviceReport = require("../models/devicereport.schema");

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
async function fetchDeviceReport() {
  try {
    const ipAddresses = await IPAddress.find({ api: "devicereport" });

    const promises = ipAddresses.map(async (ip) => {
      const { ipAddress, authKey, bastionName } = ip;
      try {
        const response = await axios.get(`https://${ipAddress}/api/devices`, {
          httpsAgent: agent,
          headers: {
            "X-Auth-Key": authKey,
            "X-Auth-User": username,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          timeout: 30000,
        });

        const filteredData = (response.data || []).map((device) => {
          const services = (device.services || []).map((service) => ({
            service_name: service.service_name,
            protocol: service.protocol,
            port: service.port,
            connection_policy: service.connection_policy,
            global_domains: service.global_domains || [],
            subprotocols: service.subprotocols,
          }));

          const lc = device.last_connection
            ? new Date(device.last_connection)
            : null;

          return {
            device_name: device.device_name,
            host: device.host,
            last_connection: isValidDate(lc) ? lc : null,
            onboard_status: device.onboard_status || "-",
            tags: device.tags || [],
            local_domains: (device.local_domains || []).map(
              (d) => d.domain_name
            ),
            services,
            ipAddress: ip.ipAddress,
            bastionName: bastionName || "Unknown",
          };
        });

        const bulkOperations = filteredData.map((device) => ({
          updateOne: {
            filter: { device_name: device.device_name, host: device.host },
            update: { $set: device },
            upsert: true,
          },
        }));

        if (bulkOperations.length) {
          await DeviceReport.bulkWrite(bulkOperations, { ordered: false });
        }

        console.log(`Data from ${ipAddress} processed successfully.`);
        return { success: true, data: filteredData };
      } catch (error) {
        console.error(
          `Error fetching data from ${ipAddress}: ${error.message}`
        );
        return { success: false, ip: ipAddress, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      console.log(
        "Some IPs failed:",
        failed.map((f) => f.ip)
      );
    }
    return results.flatMap((r) => r.data || []);
  } catch (error) {
    console.error("Error in fetchDeviceReport function:", error.message);
    throw error;
  }
}

/* ---------- existing endpoints (unchanged) ---------- */
router.get("/", async (req, res) => {
  try {
    const data = await fetchDeviceReport();
    res.json(data);
  } catch (error) {
    console.error("Error fetching DeviceReport data:", error);
    res.status(500).json({ message: "Failed to fetch DeviceReport data" });
  }
});

router.get("/fromdb", async (req, res) => {
  try {
    const devices = await DeviceReport.find();
    res.json(devices);
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

    const filtered = await DeviceReport.find({
      $or: [
        { createdAt: { $gte: fromDate, $lte: toDate } },
        { updatedAt: { $gte: fromDate, $lte: toDate } },
      ],
    });

    res.json(filtered);
  } catch (error) {
    console.error("❌ Error fetching filtered DeviceReport:", error.message);
    res
      .status(500)
      .json({ message: "Failed to retrieve filtered DeviceReport" });
  }
});

/* ---------- NEW: range for UI ---------- */
/** GET /api/devicereport/range?from=YYYY-MM-DD&to=YYYY-MM-DD
 *  - Filters by `last_connection` (inclusive, local day bounds)
 *  - Open-ended ranges supported (?from only, ?to only)
 */
router.get("/range", async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from && !to) {
      const all = await DeviceReport.find().lean();
      return res.json(all);
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

    const rows = await DeviceReport.find({ last_connection: rangeCond }).lean();
    res.json(rows);
  } catch (error) {
    console.error("❌ Error in /devicereport/range:", error);
    res.status(500).json({ message: "Failed to retrieve ranged DeviceReport" });
  }
});

module.exports = { router, fetchDeviceReport };
