const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");
const Authentication = require("../models/authentication.model");

const agent = new https.Agent({ rejectUnauthorized: false });
const username = "admin";

/* ---------------------- Helpers ---------------------- */

// Convert "YYYY-MM-DD" -> Date (UTC start/end of day)
function ymdToDate(ymd, endOfDay = false) {
  if (!ymd) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return null;
  const [_, y, mon, d] = m.map(Number);
  return endOfDay
    ? new Date(Date.UTC(y, mon - 1, d, 23, 59, 59, 999))
    : new Date(Date.UTC(y, mon - 1, d, 0, 0, 0, 0));
}

function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}

/* ----------------- Pull & Upsert to DB ---------------- */

async function fetchAuthentications() {
  try {
    const ipAddresses = await IPAddress.find({ api: "authentications" });

    const promises = ipAddresses.map(async (ip) => {
      const { ipAddress, authKey, bastionName } = ip;

      try {
        const response = await axios.get(
          `https://${ipAddress}/api/authentications`,
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

        const bulkOperations = (response.data || []).map((item) => ({
          updateOne: {
            filter: { id: item.id },
            update: {
              $set: {
                bastionName: bastionName || "Unknown",
                username: item.username,
                login: item.login ? new Date(item.login) : null,
                logout: item.logout ? new Date(item.logout) : null,
                result: item.result,
                source_ip: item.source_ip,
                ipAddress: ip.ipAddress,
              },
            },
            upsert: true,
          },
        }));

        if (bulkOperations.length) {
          const result = await Authentication.bulkWrite(bulkOperations, {
            ordered: false,
          });
          console.log(
            `Data from ${ipAddress} processed. Inserted: ${
              result.upsertedCount || 0
            }, Updated: ${result.modifiedCount || 0}`
          );
        } else {
          console.log(`No data returned from ${ipAddress}`);
        }

        return { success: true, data: response.data };
      } catch (error) {
        console.error(`Error fetching from ${ipAddress}: ${error.message}`);
        return { success: false, ip: ipAddress, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      console.warn(
        "Failed IPs:",
        failed.map((f) => f.ip)
      );
    }

    return results.flatMap((r) => r.data || []);
  } catch (error) {
    console.error("Error in fetchAuthentications:", error.message);
    throw error;
  }
}

/* ---------------------- Routes ----------------------- */

// Live pull (optional)
router.get("/", async (req, res) => {
  try {
    const data = await fetchAuthentications();
    res.json(data);
  } catch (error) {
    console.error("Error fetching authentications:", error);
    res.status(500).json({ message: "Failed to fetch authentications data" });
  }
});

// Return everything from DB (UNCHANGED)
router.get("/fromdb", async (req, res) => {
  try {
    const authentications = await Authentication.find();
    res.json(authentications);
  } catch (error) {
    console.error("Error fetching from DB:", error);
    res.status(500).json({ message: "Failed to retrieve authentication data" });
  }
});

// Legacy automation endpoint (DO NOT TOUCH) — UNCHANGED
router.get("/filtered", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: "Missing from/to query params" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const filtered = await Authentication.find({
      $or: [
        { createdAt: { $gte: fromDate, $lte: toDate } },
        { updatedAt: { $gte: fromDate, $lte: toDate } },
      ],
    });

    res.json(filtered);
  } catch (error) {
    console.error("❌ Error fetching filtered Authentications:", error.message);
    res
      .status(500)
      .json({ message: "Failed to retrieve filtered Authentications" });
  }
});

router.get("/range", async (req, res) => {
  try {
    const { from, to, by = "login" } = req.query;

    if (!from && !to) {
      // No bounds -> return all
      const all = await Authentication.find().lean();
      return res.json(all);
    }

    // Normalize to UTC day boundaries
    const fromDate = from ? ymdToDate(from, false) : null;
    const toDate = to ? ymdToDate(to, true) : null;

    if ((from && !isValidDate(fromDate)) || (to && !isValidDate(toDate))) {
      return res.status(400).json({
        message:
          "Invalid date format. Use YYYY-MM-DD for 'from' and 'to' (e.g., ?from=2025-08-01&to=2025-08-15).",
      });
    }

    const rangeCond = {};
    if (fromDate) rangeCond.$gte = fromDate;
    if (toDate) rangeCond.$lte = toDate;

    let query;

    if (by === "activity") {
      // Filter by audit activity timestamps
      query = {
        $or: [{ createdAt: rangeCond }, { updatedAt: rangeCond }],
      };
    } else {
      // Default: filter by login timestamp
      query = { login: rangeCond };
    }

    const items = await Authentication.find(query).lean();
    return res.json(items);
  } catch (error) {
    console.error("Error in /range:", error);
    res.status(500).json({ message: "Failed to retrieve ranged data" });
  }
});

module.exports = { router, fetchAuthentications };
