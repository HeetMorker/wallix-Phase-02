const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");
const Authorization = require("../models/authorization.model");

const agent = new https.Agent({ rejectUnauthorized: false });
const username = "admin";

async function fetchAuthorizations() {
  try {
    const ipAddresses = await IPAddress.find({ api: "authorizations" });

    const promises = ipAddresses.map(async (ip) => {
      const { ipAddress, authKey } = ip;
      try {
        const response = await axios.get(
          `https://${ipAddress}/api/authorizations`,
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

        const filteredData = response.data.map((app) => ({
          user_group: app.user_group,
          target_group: app.target_group,
          ipAddress: ip.ipAddress,
        }));

        await Authorization.insertMany(filteredData);
        console.log(`Data from ${ipAddress} stored successfully.`);
        return { success: true, data: filteredData };
      } catch (error) {
        console.error(
          `Error fetching data from ${ipAddress} : ${error.message}`
        );
        return { success: false, ip: ip.ipAddress, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    const failed = results.filter((result) => !result.success);
    if (failed.length > 0) {
      console.log(
        "Some IPs failed:",
        failed.map((f) => f.ip)
      );
    }
    return results.flatMap((result) => result.data || []);
  } catch (error) {
    console.error("Error in fetchAuthorizations function:", error.message);
    throw error;
  }
}

router.get("/", async (req, res) => {
  try {
    const data = await fetchAuthorizations();
    res.json(data);
  } catch (error) {
    console.error("Error fetching Authorizations data:", error);
    res.status(500).json({ message: "Failed to fetch Authorizations data" });
  }
});

router.get("/fromdb", async (req, res) => {
  try {
    const authorization = await Authorization.find();
    res.json(authorization);
  } catch (error) {
    console.error(
      "An error occurred while fetching data from the database:",
      error
    );
    res.status(500).json({ message: "Failed to retrieve devices" });
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

    const filtered = await Authorization.find({
      $or: [
        { createdAt: { $gte: fromDate, $lte: toDate } },
        { updatedAt: { $gte: fromDate, $lte: toDate } },
      ],
    });

    res.json(filtered);
  } catch (error) {
    console.error("❌ Error fetching filtered Authorization:", error.message);
    res
      .status(500)
      .json({ message: "Failed to retrieve filtered Authorization" });
  }
});

module.exports = { router, fetchAuthorizations };
