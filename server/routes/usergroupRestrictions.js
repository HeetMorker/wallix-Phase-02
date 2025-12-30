// routes/usergroupRestrictions.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");
const UsergroupRestriction = require("../models/usergroupRestriction.model");

const agent = new https.Agent({ rejectUnauthorized: false });
const username = "admin";

// Main fetch function
async function fetchUsergroupRestrictions() {
  try {
    const ipAddresses = await IPAddress.find({ api: "usergroups" });

    const promises = ipAddresses.map(async (ip) => {
      const { ipAddress, authKey, bastionName } = ip;

      try {
        const usergroupResponse = await axios.get(
          `https://${ipAddress}/api/usergroups`,
          {
            httpsAgent: agent,
            headers: {
              "X-Auth-Key": authKey,
              "X-Auth-User": username,
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          }
        );

        const mergedData = [];

        for (const group of usergroupResponse.data) {
          const restrictionUrl = `https://${ipAddress}/api/usergroups/${group.id}/restrictions`;
          try {
            const restrictionRes = await axios.get(restrictionUrl, {
              httpsAgent: agent,
              headers: {
                "X-Auth-Key": authKey,
                "X-Auth-User": username,
                Accept: "application/json",
                "Content-Type": "application/json",
              },
            });

            for (const restriction of restrictionRes.data) {
              const record = {
                group_id: group.id,
                group_name: group.group_name,
                users: group.users || [],
                restrictions: restriction.rules || "-",
                subprotocol: restriction.subprotocol || "-",
                action: restriction.action || "-",
                ipAddress: ipAddress,
                bastionName: bastionName || "-",
              };

              await UsergroupRestriction.findOneAndUpdate(
                {
                  group_id: record.group_id,
                  restrictions: record.restrictions,
                  ipAddress: record.ipAddress,
                },
                record,
                {
                  upsert: true,
                  new: true,
                  setDefaultsOnInsert: true,
                }
              );

              mergedData.push(record);
            }
          } catch (err) {
            console.error(
              `Error fetching restrictions for group ${group.id}: ${err.message}`
            );
          }
        }

        console.log(`Fetched & saved data from ${ipAddress}`);
        return { success: true, data: mergedData };
      } catch (err) {
        console.error(
          `Failed to fetch usergroups from ${ipAddress}: ${err.message}`
        );
        return { success: false, ip: ipAddress, error: err.message };
      }
    });

    const results = await Promise.all(promises);
    const failed = results.filter((r) => !r.success);
    if (failed.length) {
      console.warn(
        "Failures:",
        failed.map((f) => f.ip)
      );
    }
    return results.flatMap((r) => r.data || []);
  } catch (err) {
    console.error("Error in fetchUsergroupRestrictions:", err.message);
    throw err;
  }
}

router.get("/", async (req, res) => {
  try {
    const data = await fetchUsergroupRestrictions();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch usergroup restrictions" });
  }
});

router.get("/fromdb", async (req, res) => {
  try {
    const records = await UsergroupRestriction.find();
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch from DB" });
  }
});

router.get("/filtered", async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: "Missing from/to query params" });
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const filtered = await UsergroupRestriction.find({
      $or: [
        { createdAt: { $gte: fromDate, $lte: toDate } },
        { updatedAt: { $gte: fromDate, $lte: toDate } },
      ],
    });

    res.json(filtered);
  } catch (error) {
    console.error(
      "❌ Error fetching filtered UsergroupRestriction:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Failed to retrieve filtered UsergroupRestriction" });
  }
});

module.exports = { router, fetchUsergroupRestrictions };
