// const express = require("express");
// const router = express.Router();
// const axios = require("axios");
// const https = require("https");
// const IPAddress = require("../models/ipAddress.model");
// const TargetGroup = require("../models/targetgroup.model");

// const agent = new https.Agent({ rejectUnauthorized: false });
// const username = "admin";

// async function fetchTargetGroups() {
//   try {
//     const ipAddresses = await IPAddress.find({ api: "targetgroup" });

//     const promises = ipAddresses.map(async (ip) => {
//       const { ipAddress, authKey } = ip;
//       try {
//         const response = await axios.get(
//           `https://${ipAddress}/api/targetgroups`,
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

//         const filteredData = response.data.map((app) => ({
//           target_group: app.target_group,
//           ipAddress: ip.ipAddress,
//         }));

//         await TargetGroup.insertMany(filteredData);
//         console.log(`Data from ${ipAddress} stored successfully.`);
//         return { success: true, data: filteredData };
//       } catch (error) {
//         console.error(
//           `Error fetching data from ${ipAddress} : ${error.message}`
//         );
//         return { success: false, ip: ip.ipAddress, error: error.message };
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
//     console.error("Error in fetchTargetGroups function:", error.message);
//     throw error;
//   }
// }

// router.get("/", async (req, res) => {
//   try {
//     const data = await fetchTargetGroups();
//     res.json(data);
//   } catch (error) {
//     console.error("Error fetching targetgroups data:", error);
//     res.status(500).json({ message: "Failed to fetch targetgroups data" });
//   }
// });

// router.get("/fromdb", async (req, res) => {
//   try {
//     const targetgroups = await TargetGroup.find();
//     res.json(targetgroups);
//   } catch (error) {
//     console.error(
//       "An error occurred while fetching data from the database:",
//       error
//     );
//     res.status(500).json({ message: "Failed to retrieve devices" });
//   }
// });

// module.exports = { router, fetchTargetGroups };

// const express = require("express");
// const router = express.Router();
// const axios = require("axios");
// const https = require("https");
// const IPAddress = require("../models/ipAddress.model");
// const TargetGroup = require("../models/targetgroup.schema");

// const agent = new https.Agent({ rejectUnauthorized: false });
// const username = "admin";

// async function fetchTargetGroups() {
//   try {
//     const ipAddresses = await IPAddress.find({ api: "targetgroups" });

//     const promises = ipAddresses.map(async (ip) => {
//       const { ipAddress, authKey } = ip;
//       try {
//         const response = await axios.get(
//           `https://${ipAddress}/api/targetgroups`,
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

//         const filteredData = response.data.map((app) => ({
//           target_group: app.target_group,
//           device: app.device,
//           ipAddress: ip.ipAddress,
//         }));

//         await TargetGroup.insertMany(filteredData);
//         console.log(`Data from ${ipAddress} stored successfully.`);
//         return { success: true, data: filteredData };
//       } catch (error) {
//         console.error(
//           `Error fetching data from ${ipAddress}: ${error.message}`
//         );
//         return { success: false, ip: ip.ipAddress, error: error.message };
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
//     console.error("Error in fetchTargetGroups function:", error.message);
//     throw error;
//   }
// }

// router.get("/", async (req, res) => {
//   try {
//     const data = await fetchTargetGroups();
//     res.json(data);
//   } catch (error) {
//     console.error("Error fetching TargetGroup data:", error);
//     res.status(500).json({ message: "Failed to fetch TargetGroup data" });
//   }
// });

// router.get("/fromdb", async (req, res) => {
//   try {
//     const targetGroups = await TargetGroup.find();
//     res.json(targetGroups);
//   } catch (error) {
//     console.error(
//       "An error occurred while fetching data from the database:",
//       error
//     );
//     res.status(500).json({ message: "Failed to retrieve target groups" });
//   }
// });

// module.exports = { router, fetchTargetGroups };
// const express = require("express");
// const router = express.Router();
// const axios = require("axios");
// const https = require("https");
// const IPAddress = require("../models/ipAddress.model");
// const TargetGroup = require("../models/targetgroup.model");

// const agent = new https.Agent({ rejectUnauthorized: false });
// const username = "admin";

// async function fetchTargetGroups() {
//   try {
//     const ipAddresses = await IPAddress.find({ api: "targetgroup" });

//     const promises = ipAddresses.map(async (ip) => {
//       const { ipAddress, authKey } = ip;
//       try {
//         const response = await axios.get(
//           `https://${ipAddress}/api/targetgroups`,
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

//         const filteredData = response.data.map((app) => ({
//           target_group: app.target_group,
//           ipAddress: ip.ipAddress,
//         }));

//         await TargetGroup.insertMany(filteredData);
//         console.log(`Data from ${ipAddress} stored successfully.`);
//         return { success: true, data: filteredData };
//       } catch (error) {
//         console.error(
//           `Error fetching data from ${ipAddress} : ${error.message}`
//         );
//         return { success: false, ip: ip.ipAddress, error: error.message };
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
//     console.error("Error in fetchTargetGroups function:", error.message);
//     throw error;
//   }
// }

// router.get("/", async (req, res) => {
//   try {
//     const data = await fetchTargetGroups();
//     res.json(data);
//   } catch (error) {
//     console.error("Error fetching targetgroups data:", error);
//     res.status(500).json({ message: "Failed to fetch targetgroups data" });
//   }
// });

// router.get("/fromdb", async (req, res) => {
//   try {
//     const targetgroups = await TargetGroup.find();
//     res.json(targetgroups);
//   } catch (error) {
//     console.error(
//       "An error occurred while fetching data from the database:",
//       error
//     );
//     res.status(500).json({ message: "Failed to retrieve devices" });
//   }
// });

// module.exports = { router, fetchTargetGroups };

// const express = require("express");
// const router = express.Router();
// const axios = require("axios");
// const https = require("https");
// const IPAddress = require("../models/ipAddress.model");
// const TargetGroup = require("../models/targetgroup.schema");

// const agent = new https.Agent({ rejectUnauthorized: false });
// const username = "admin";

// async function fetchTargetGroups() {
//   try {
//     const ipAddresses = await IPAddress.find({ api: "targetgroups" });

//     const promises = ipAddresses.map(async (ip) => {
//       const { ipAddress, authKey } = ip;
//       try {
//         const response = await axios.get(
//           `https://${ipAddress}/api/targetgroups`,
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

//         const filteredData = response.data.map((app) => ({
//           target_group: app.target_group,
//           device: app.device,
//           ipAddress: ip.ipAddress,
//         }));

//         await TargetGroup.insertMany(filteredData);
//         console.log(`Data from ${ipAddress} stored successfully.`);
//         return { success: true, data: filteredData };
//       } catch (error) {
//         console.error(
//           `Error fetching data from ${ipAddress}: ${error.message}`
//         );
//         return { success: false, ip: ip.ipAddress, error: error.message };
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
//     console.error("Error in fetchTargetGroups function:", error.message);
//     throw error;
//   }
// }

// router.get("/", async (req, res) => {
//   try {
//     const data = await fetchTargetGroups();
//     res.json(data);
//   } catch (error) {
//     console.error("Error fetching TargetGroup data:", error);
//     res.status(500).json({ message: "Failed to fetch TargetGroup data" });
//   }
// });

// router.get("/fromdb", async (req, res) => {
//   try {
//     const targetGroups = await TargetGroup.find();
//     res.json(targetGroups);
//   } catch (error) {
//     console.error(
//       "An error occurred while fetching data from the database:",
//       error
//     );
//     res.status(500).json({ message: "Failed to retrieve target groups" });
//   }
// });

// module.exports = { router, fetchTargetGroups };
const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");
const TargetGroup = require("../models/targetgroup.schema");

const agent = new https.Agent({ rejectUnauthorized: false });
const username = "admin";

async function fetchTargetGroups() {
  try {
    const ipAddresses = await IPAddress.find({ api: "targetgroups" });

    const promises = ipAddresses.map(async (ip) => {
      const { ipAddress, authKey } = ip;
      try {
        const response = await axios.get(
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

        // Ensure we properly map the session.accounts structure, even if nested inside session object
        const filteredData = response.data.map((group) => {
          // Ensure session and accounts exist before processing
          const accounts = group.session?.accounts || [];
          return {
            group_name: group.group_name,
            session: {
              accounts: accounts.map((account) => ({
                device: account.device || "N/A", // Get device or default to "N/A"
                application: account.application || "N/A", // Get application or default to "N/A"
              })),
            },
            ipAddress: ip.ipAddress,
          };
        });

        // Save the data to the database
        await TargetGroup.insertMany(filteredData);
        console.log(`Data from ${ipAddress} stored successfully.`);
        return { success: true, data: filteredData };
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
    console.error("Error in fetchTargetGroups function:", error.message);
    throw error;
  }
}

router.get("/", async (req, res) => {
  try {
    const data = await fetchTargetGroups();
    res.json(data);
  } catch (error) {
    console.error("Error fetching TargetGroup data:", error);
    res.status(500).json({ message: "Failed to fetch TargetGroup data" });
  }
});

router.get("/fromdb", async (req, res) => {
  try {
    const targetGroup = await TargetGroup.find();
    res.json(targetGroup);
  } catch (error) {
    console.error(
      "An error occurred while fetching data from the database:",
      error
    );
    res.status(500).json({ message: "Failed to retrieve target groups" });
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

    const filtered = await TargetGroup.find({
      $or: [
        { createdAt: { $gte: fromDate, $lte: toDate } },
        { updatedAt: { $gte: fromDate, $lte: toDate } },
      ],
    });

    res.json(filtered);
  } catch (error) {
    console.error("❌ Error fetching filtered TargetGroup:", error.message);
    res
      .status(500)
      .json({ message: "Failed to retrieve filtered TargetGroup" });
  }
});

module.exports = { router, fetchTargetGroups };
