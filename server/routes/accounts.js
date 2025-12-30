// const express = require('express');
// const router = express.Router();
// const axios = require('axios');
// const https = require('https');
// const IPAddress = require('../models/ipAddress.model');
// const Account = require('../models/accounts.model');

// const agent = new https.Agent({ rejectUnauthorized: false });
// const username = 'admin';
// const authKey = '8OqA7Nlt6MJiU9wlXNAtb7n5RhoAe40Wm2DZwXx5REs';


// async function fetchWithRetry(url, options, retries = 3, delay = 5000) {
//   for (let i = 0; i < retries; i++) {
//     try {
//       return await axios.get(url, options);
//     } catch (error) {
//       if (error.code === 'ETIMEDOUT' && i < retries - 1) {
//         console.log(`Retrying request to ${url} (${i + 1}/${retries})...`);
//         await new Promise(resolve => setTimeout(resolve, delay)); // Wait before retrying
//         delay *= 2; // Exponential backoff
//       } else {
//         throw error;
//       }
//     }
//   }
// }
// // Fetch accounts for /fetch-all route
// async function fetchAccounts() {
//   try {
//     const ipAddresses = await IPAddress.find({ api: 'accounts' });

//     // Capture the time this batch of data is fetched
//     const currentFetchTime = new Date();

//     const promises = ipAddresses.map(async (ip) => {
//       const response = await axios.get(`http://${ip.ipAddress}/api/accounts`, {
//         httpsAgent: agent,
//         headers: {
//           'X-Auth-Key': authKey,
//           'X-Auth-User': username,
//           Accept: 'application/json',
//           'Content-Type': 'application/json',
//         },
//         params: {
//           limit: 100,
//         },
//       });

//       const filteredData = response.data.map((app) => ({
//         onboard_status: app.onboard_status,
//         ipAddress: ip.ipAddress,
//         fetchedAt: currentFetchTime,
//       }));

//       // Upsert (update if exists, insert if new) data based on `onboard_status` and `ipAddress`
//       for (const accountData of filteredData) {
//         await Account.findOneAndUpdate(
//           {
//             onboard_status: accountData.onboard_status,
//             ipAddress: accountData.ipAddress,
//           },
//           { $set: accountData },  // Update with latest fetch time
//           { upsert: true, new: true }
//         );
//       }
//       return filteredData;
//     });

//     const data = await Promise.all(promises);
//     return data.flat();
//   } catch (error) {
//     console.error('Error fetching accounts data:', error.message);
//     throw error;
//   }
// }

// // Route to fetch data from this specific API (optional, for testing)
// router.get('/', async (req, res) => {
//   try {
//     const data = await fetchAccounts();
//     res.json(data);
//   } catch (error) {
//     console.error('Error fetching accounts data:', error);
//     res.status(500).json({ message: 'Failed to fetch accounts data' });
//   }
// });

// // Fetch data from database
// router.get('/fromdb', async (req, res) => {
//   try {
//     const accounts = await Account.find();
//     res.json(accounts);
//   } catch (error) {
//     console.error("An error occurred while fetching data from the database:", error);
//     res.status(500).json({ message: "Failed to retrieve applications" });
//   }
// });

// module.exports = { router, fetchAccounts };





const express = require("express");
const router = express.Router();
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");
const Account = require("../models/accounts.model");

const agent = new https.Agent({ rejectUnauthorized: false });
const username = "admin";

async function fetchAccounts() {
  try {
    const ipAddresses = await IPAddress.find({ api: "accounts" });

    const promises = ipAddresses.map(async (ip) => {
      const { ipAddress, authKey } = ip;
      try {
        const response = await axios.get(`https://${ipAddress}/api/accounts`, {
          httpsAgent: agent,
          headers: {
            'X-Auth-Key': authKey,
            'X-Auth-User': username,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });

        const filteredData = response.data.map((app) => ({
          onboard_status: app.onboard_status,
          ipAddress: ip.ipAddress,
          // fetchedAt: currentFetchTime,
        }));

        await Account.insertMany(filteredData);
        console.log(`Data from ${ipAddress} stored successfully.`);
        return { success: true, data: filteredData };

      } catch (error) {
        console.error(`Error fetching data from ${ipAddress} : ${error.message}`);
        return { success: false, ip: ip.ipAddress, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    const failed = results.filter(result => !result.success);
    if (failed.length > 0) {
      console.log('Some IPs failed:', failed.map(f => f.ip));
    }
    return results.flatMap(result => result.data || []);

  } catch (error) {
    console.error('Error in fetchAccounts function:', error.message);
    throw error;
  }
}

router.get('/', async (req, res) => {
  try {
    const data = await fetchAccounts();
    res.json(data);
  } catch (error) {
    console.error('Error fetching accounts data:', error);
    res.status(500).json({ message: 'Failed to fetch accounts data' });
  }
});

router.get("/fromdb", async (req, res) => {
  try {
    const devices = await Account.find();
    res.json(devices);
  } catch (error) {
    console.error("An error occurred while fetching data from the database:", error);
    res.status(500).json({ message: "Failed to retrieve devices" });
  }
});

module.exports = { router, fetchAccounts };