// // --- fetchAll.js ---
// const express = require("express");
// const router = express.Router();

// // Report imports
// const accounts = require("./accounts");
// const sessions = require("./sessions");
// const usergroup = require("./userGroups");
// const applications = require("./application");
// const approvals = require("./approvals");
// const devicereport = require("./deviceReport");
// const targetgroup = require("./targetGroup");
// const authorization = require("./authorization");
// const authentications = require("./authentications");
// const usergrouprestrictions = require("./usergroupRestrictions");
// const targetgrouprestrictions = require("./targetgroupRestrictions");
// const scans = require("./scans");
// const scanjobs = require("./scanjobs");
// const generateReport = require("./reportGenerator");

// // Helper for timeout
// function withTimeout(promise, ms, name) {
//   const timeout = new Promise((_, reject) =>
//     setTimeout(() => reject(new Error(`Timeout: ${name} exceeded ${ms}ms`)), ms)
//   );
//   return Promise.race([promise, timeout]);
// }

// // Improved parallel fetch with resilience and timeout protection
// async function fetchAllAPIs() {
//   const reports = [
//     { name: "targetgroup", fn: targetgroup.fetchTargetGroups },
//     { name: "accounts", fn: accounts.fetchAccounts },
//     { name: "sessions", fn: sessions.fetchSessions },
//     { name: "usergroup", fn: usergroup.fetchUserGroup },
//     { name: "applications", fn: applications.fetchApplications },
//     { name: "approvals", fn: approvals.fetchApprovals },
//     { name: "devicereport", fn: devicereport.fetchDeviceReport },
//     { name: "scans", fn: scans.fetchScans },
//     { name: "authorization", fn: authorization.fetchAuthorizations },
//     { name: "authentications", fn: authentications.fetchAuthentications },
//     { name: "generateReport", fn: generateReport.generateReport },
//     {
//       name: "usergrouprestrictions",
//       fn: usergrouprestrictions.fetchUsergroupRestrictions,
//     },
//     {
//       name: "targetgrouprestrictions",
//       fn: targetgrouprestrictions.fetchTargetgroupRestrictions,
//     },
//     { name: "scanjobs", fn: scanjobs.fetchScanJobs },
//   ];

//   const results = await Promise.allSettled(
//     reports.map((r) => withTimeout(r.fn(), 10000, r.name)) // 10s max per report
//   );

//   const combined = results.map((r, i) => {
//     if (r.status === "fulfilled") return r.value;
//     console.warn(`Report failed [${reports[i].name}]: ${r.reason}`);
//     return [];
//   });

//   return combined.flat();
// }

// // Route to trigger all report data fetch
// router.post("/fetch-all", async (req, res) => {
//   try {
//     const data = await fetchAllAPIs();
//     res.status(200).json({ message: "Data fetched successfully", data });
//   } catch (error) {
//     console.error("Error in /fetch-all:", error.message);
//     res
//       .status(500)
//       .json({ message: "Error fetching data", error: error.message });
//   }
// });

// module.exports = router;
// --- fetchAll.js ---
// --- fetchAll.js ---
const express = require("express");
const router = express.Router();

// Report imports
const accounts = require("./accounts");
const sessions = require("./sessions");
const usergroup = require("./userGroups");
const applications = require("./application");
const approvals = require("./approvals");
const devicereport = require("./deviceReport");
const targetgroup = require("./targetGroup");
const authorization = require("./authorization");
const authentications = require("./authentications");
const usergrouprestrictions = require("./usergroupRestrictions");
const targetgrouprestrictions = require("./targetgroupRestrictions");
const scans = require("./scans");
const scanjobs = require("./scanjobs");
const generateReport = require("./reportGenerator");

// Helper for timeout
function withTimeout(promise, ms, name) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout: ${name} exceeded ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

async function fetchAllAPIs() {
  const reports = [
    { name: "targetgroup", fn: targetgroup.fetchTargetGroups },
    { name: "accounts", fn: accounts.fetchAccounts },
    { name: "sessions", fn: sessions.fetchSessions },
    { name: "usergroup", fn: usergroup.fetchUserGroup },
    { name: "applications", fn: applications.fetchApplications },
    { name: "approvals", fn: approvals.fetchApprovals },
    { name: "devicereport", fn: devicereport.fetchDeviceReport },
    { name: "scans", fn: scans.fetchScans },
    { name: "authorization", fn: authorization.fetchAuthorizations },
    { name: "authentications", fn: authentications.fetchAuthentications },
    { name: "generateReport", fn: generateReport.generateReport },
    {
      name: "usergrouprestrictions",
      fn: usergrouprestrictions.fetchUsergroupRestrictions,
    },
    {
      name: "targetgrouprestrictions",
      fn: targetgrouprestrictions.fetchTargetgroupRestrictions,
    },
    { name: "scanjobs", fn: scanjobs.fetchScanJobs },
  ];

  const results = await Promise.allSettled(
    reports.map((r) => {
      if (typeof r.fn !== "function") {
        console.error(`❌ Skipped [${r.name}]: r.fn is not a function`);
        return Promise.resolve([]); // Skip and avoid crashing
      }

      return withTimeout(
        r.fn().catch((err) => {
          console.warn(`⚠️ ${r.name} error: ${err.message}`);
          return [];
        }),
        10000,
        r.name
      );
    })
  );

  return results
    .map((res, i) => {
      const report = reports[i];
      if (res.status === "fulfilled") {
        console.log(`✅ ${report.name} fetched`);
        return res.value;
      } else {
        console.warn(`❌ ${report.name} failed: ${res.reason.message}`);
        return [];
      }
    })
    .flat();
}

// Route to fetch everything
router.post("/fetch-all", async (req, res) => {
  try {
    const data = await fetchAllAPIs();
    res.status(200).json({ message: "Data fetched successfully", data });
  } catch (error) {
    console.error("❌ Error in /fetch-all:", error.message);
    res
      .status(500)
      .json({ message: "Error fetching data", error: error.message });
  }
});

module.exports = router;
