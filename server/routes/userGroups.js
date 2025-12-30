const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");
const UserGroup = require("../models/usergroup.model");

const agent = new https.Agent({ rejectUnauthorized: false });
const username = "admin";

async function fetchUserGroup() {
  try {
    const ipAddresses = await IPAddress.find({ api: "usergroups" });

    const promises = ipAddresses.map(async (ip) => {
      const { ipAddress, authKey } = ip;
      try {
        const response = await axios.get(
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

        const enrichedData = await Promise.all(
          response.data.map(async (group) => {
            const profiles = await Promise.all(
              (group.users || []).map(async (user) => {
                try {
                  const userResponse = await axios.get(
                    `https://${ipAddress}/api/users/${user}`,
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
                  return userResponse.data.profile || "No Profile";
                } catch (err) {
                  console.error(
                    `Error fetching profile for user ${user}: ${err.message}`
                  );
                  return "No Profile";
                }
              })
            );

            const enrichedGroup = {
              id: group.id, // Use 'id' as the unique identifier
              group_name: group.group_name,
              users: Array.isArray(group.users) ? group.users : [], // Ensure `users` is an array
              timeframes: group.timeframes || [],
              description: group.description || "N/A",
              profile: profiles.join(", "), // Combine profiles into a string
              ipAddress: ip.ipAddress,
            };

            // Use upsert to prevent duplication using 'id'
            await UserGroup.findOneAndUpdate(
              { id: group.id }, // Match by 'id'
              enrichedGroup, // Update with the enriched group
              { upsert: true, new: true, setDefaultsOnInsert: true } // Insert if not exists
            );

            return enrichedGroup;
          })
        );

        console.log(`Data from ${ipAddress} stored/updated successfully.`);
        return { success: true, data: enrichedData };
      } catch (error) {
        console.error(
          `Error fetching data from ${ipAddress}: ${error.message}`
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
    console.error("Error in fetchUserGroup function:", error.message);
    throw error;
  }
}

router.get("/", async (req, res) => {
  try {
    const data = await fetchUserGroup();
    res.json(data);
  } catch (error) {
    console.error("Error fetching UserGroup data:", error);
    res.status(500).json({ message: "Failed to fetch UserGroup data" });
  }
});

router.get("/fromdb", async (req, res) => {
  try {
    const userGroups = await UserGroup.find();
    res.json(userGroups);
  } catch (error) {
    console.error(
      "An error occurred while fetching data from the database:",
      error
    );
    res.status(500).json({ message: "Failed to retrieve user groups" });
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

    const filtered = await UserGroup.find({
      $or: [
        { createdAt: { $gte: fromDate, $lte: toDate } },
        { updatedAt: { $gte: fromDate, $lte: toDate } },
      ],
    });

    res.json(filtered);
  } catch (error) {
    console.error("❌ Error fetching filtered UserGroup:", error.message);
    res.status(500).json({ message: "Failed to retrieve filtered UserGroup" });
  }
});

module.exports = { router, fetchUserGroup };
