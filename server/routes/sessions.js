

// module.exports = { router, fetchSessions };
const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");
const Session = require("../models/sessions.model");
const { fetchOtpFromIps } = require("./otp.route");

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

/* ---------- fetcher ---------- */
async function fetchSessions() {
  try {
    const otpRecords = await fetchOtpFromIps();
    const otpByIp = new Map(
      otpRecords.map((record) => [record.ipAddress, record.one_time_password])
    );
    const ipAddresses = await IPAddress.find({ api: "sessions" });

    const promises = ipAddresses.map(async (ip) => {
      const { ipAddress, authKey, bastionName } = ip;
      try {
        const otp = otpByIp.get(ipAddress);
        if (!otp) {
          throw new Error(`Missing OTP for ${ipAddress}`);
        }

        const query = new URLSearchParams({
          "WAB-OTP-Password-Base64": otp,
          from_date: "2023-02-01",
          to_date: "2025-12-04",
          limit: "35000",
        });

        const response = await axios.get(
          `https://${ipAddress}/api/sessions?${query.toString()}`,
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

        const bulkOperations = (response.data || []).map((session) => ({
          updateOne: {
            filter: { id: session.id },
            update: {
              $set: {
                username: session.username,
                target_account: session.target_account,
                target_host: session.target_host || "",
                target_protocol: session.target_protocol,
                begin: session.begin,
                end: session.end,
                target_group: session.target_group,
                ipAddress: ip.ipAddress,
                bastionName: bastionName || "Unknown",
              },
            },
            upsert: true,
          },
        }));

        const result = await Session.bulkWrite(bulkOperations);
        console.log(
          `Sessions from ${ipAddress} processed. Inserted: ${result.upsertedCount}, Updated: ${result.modifiedCount}`
        );

        return { success: true, data: response.data };
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
    console.error("Error in fetchSessions function:", error.message);
    throw error;
  }
}

/* ---------- existing endpoints ---------- */
router.get("/", async (req, res) => {
  try {
    const data = await fetchSessions();
    res.json(data);
  } catch (error) {
    console.error("Error fetching DeviceReport data:", error);
    res.status(500).json({ message: "Failed to fetch DeviceReport data" });
  }
});

router.get("/fromdb", async (req, res) => {
  try {
    const devices = await Session.find();
    res.json(devices.reverse());
  } catch (error) {
    console.error(
      "An error occurred while fetching data from the database:",
      error
    );
    res.status(500).json({ message: "Failed to retrieve devices" });
  }
});

// DO NOT MODIFY – used by report automation
router.get("/filtered", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: "Missing from/to query params" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const filtered = await Session.find({
      $or: [
        { createdAt: { $gte: fromDate, $lte: toDate } },
        { updatedAt: { $gte: fromDate, $lte: toDate } },
      ],
    });

    res.json(filtered);
  } catch (error) {
    console.error("❌ Error fetching filtered Session:", error.message);
    res.status(500).json({ message: "Failed to retrieve filtered Session" });
  }
});

/* ---------- NEW: range endpoint for UI ---------- */
/** GET /api/sessions/range?from=YYYY-MM-DD&to=YYYY-MM-DD&by=begin|end
 *  - Filters by chosen field (default: begin)
 *  - Inclusive local-day bounds
 *  - Open-ended supported (?from only, ?to only)
 */
router.get("/range", async (req, res) => {
  try {
    const { from, to, by = "begin" } = req.query;

    if (!from && !to) {
      const all = await Session.find().lean();
      return res.json(all);
    }

    const byKey = by === "end" ? "end" : "begin";

    const fromDate = from ? ymdToLocal(from, false) : null;
    const toDate = to ? ymdToLocal(to, true) : null;

    if ((from && !isValidDate(fromDate)) || (to && !isValidDate(toDate))) {
      return res
        .status(400)
        .json({ message: "Invalid date. Use YYYY-MM-DD for from/to." });
    }

    const rangeCond = {};
    if (fromDate) rangeCond.$gte = fromDate;
    if (toDate) rangeCond.$lte = toDate;

    const query = { [byKey]: rangeCond };
    const rows = await Session.find(query).lean();
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching ranged sessions:", error);
    res.status(500).json({ message: "Failed to retrieve ranged sessions" });
  }
});

module.exports = { router, fetchSessions };
