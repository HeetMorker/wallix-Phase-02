// routes/targetgroupRestrictions.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");
const TargetgroupRestriction = require("../models/targetgroupRestriction.model");

const agent = new https.Agent({ rejectUnauthorized: false });
const username = "admin";

// Main fetch function
async function fetchTargetgroupRestrictions() {
  try {
    const ipAddresses = await IPAddress.find({ api: "targetgroups" });

    const promises = ipAddresses.map(async (ip) => {
      const { ipAddress, authKey, bastionName } = ip;

      try {
        const targetGroupRes = await axios.get(
          `https://${ipAddress}/api/targetgroups`,
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

        for (const group of targetGroupRes.data) {
          const restrictionUrl = `https://${ipAddress}/api/targetgroups/${group.id}/restrictions`;
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
                restrictions: restriction.rules || "-",
                subprotocol: restriction.subprotocol || "-",
                action: restriction.action || "-",
                ipAddress: ipAddress,
                bastionName: bastionName || "-",
              };

              await TargetgroupRestriction.findOneAndUpdate(
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
              `Error fetching restrictions for target group ${group.id}: ${err.message}`
            );
          }
        }

        console.log(`Fetched & saved targetgroup data from ${ipAddress}`);
        return { success: true, data: mergedData };
      } catch (err) {
        console.error(
          `Failed to fetch targetgroups from ${ipAddress}: ${err.message}`
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
    console.error("Error in fetchTargetgroupRestrictions:", err.message);
    throw err;
  }
}

router.get("/", async (req, res) => {
  try {
    const data = await fetchTargetgroupRestrictions();
    res.json(data);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch targetgroup restrictions" });
  }
});

router.get("/fromdb", async (req, res) => {
  try {
    const records = await TargetgroupRestriction.find();
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

    const filtered = await TargetgroupRestriction.find({
      $or: [
        { createdAt: { $gte: fromDate, $lte: toDate } },
        { updatedAt: { $gte: fromDate, $lte: toDate } },
      ],
    });

    res.json(filtered);
  } catch (error) {
    console.error(
      "❌ Error fetching filtered TargetgroupRestriction:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Failed to retrieve filtered TargetgroupRestriction" });
  }
});

module.exports = { router, fetchTargetgroupRestrictions };
