// const UserGroupMappingReport = require("../models/userGroupMappingReport.model");
// const Authorization = require("../models/authorization.model");
// const UserGroup = require("../models/usergroup.model");
// const TargetGroup = require("../models/targetgroup.schema");
// const DeviceReport = require("../models/devicereport.schema");
// const axios = require("axios");
// const https = require("https");
// const IPAddress = require("../models/ipAddress.model");

// const agent = new https.Agent({ rejectUnauthorized: false });
// const username = "admin";

// async function fetchExternalGroup(ipAddress, authKey, groupName) {
//   try {
//     const res = await axios.get(
//       `https://${ipAddress}/api/usergroups/${groupName}/mappings`,
//       {
//         httpsAgent: agent,
//         headers: {
//           "X-Auth-Key": authKey,
//           "X-Auth-User": username,
//           Accept: "application/json",
//           "Content-Type": "application/json",
//         },
//         timeout: 5000,
//       }
//     );

//     const externalGroups = Array.isArray(res.data)
//       ? res.data
//           .map((m) => m.external_group)
//           .filter((g) => typeof g === "string" && g.trim())
//       : [];

//     const result = externalGroups.length > 0 ? externalGroups.join(", ") : "-";
//     console.log(
//       `✅ Success: External group fetched for '${groupName}' from ${ipAddress}`
//     );
//     return result;
//   } catch (error) {
//     console.warn(
//       `❌ Failed: Could not fetch external group for '${groupName}' from ${ipAddress} - ${error.message}`
//     );
//     return "-";
//   }
// }

// async function generateReport() {
//   const loggedNoDevices = new Set();

//   try {
//     const ipAddresses = await IPAddress.find({ api: "usergroups" });
//     const authorizations = await Authorization.find({});
//     if (authorizations.length === 0) {
//       console.log("No authorizations found.");
//       return [];
//     }

//     for (const auth of authorizations) {
//       const { user_group, target_group } = auth;

//       const userGroupData = await UserGroup.findOne({ group_name: user_group });
//       let users = "N/A";
//       let external_group = "-";
//       let bastionName = "Unknown";

//       if (userGroupData && Array.isArray(userGroupData.users)) {
//         users =
//           userGroupData.users.length > 0
//             ? userGroupData.users.join(", ")
//             : "N/A";

//         // ✅ Fetch external_group from correct API using group_name
//         for (const ip of ipAddresses) {
//           try {
//             const result = await fetchExternalGroup(
//               ip.ipAddress,
//               ip.authKey,
//               user_group
//             );
//             if (result !== "-") {
//               external_group = result;
//               bastionName = ip.bastionName || "Unknown";
//               console.log(
//                 `➡️ Using external group from IP: ${ip.ipAddress} for '${user_group}'`
//               );
//               break;
//             }
//           } catch (err) {
//             console.warn(
//               `⚠️ Skipped IP ${ip.ipAddress} due to error: ${err.message}`
//             );
//             continue;
//           }
//         }
//       }

//       const targetGroupData = await TargetGroup.findOne({
//         group_name: target_group,
//       });
//       if (
//         !targetGroupData ||
//         !targetGroupData.session ||
//         !Array.isArray(targetGroupData.session.accounts)
//       ) {
//         console.log(`⚠️ No valid accounts for target group: ${target_group}`);
//         continue;
//       }

//       const accounts = targetGroupData.session.accounts;
//       const devices = accounts.map((a) => a.device).filter(Boolean);

//       if (devices.length === 0) {
//         if (!loggedNoDevices.has(target_group)) {
//           console.log(`⚠️ No devices found for target group: ${target_group}`);
//           loggedNoDevices.add(target_group);
//         }
//         continue;
//       }

//       for (const device of devices) {
//         const deviceData = await DeviceReport.findOne({ device_name: device });
//         if (!deviceData) continue;

//         const protocol =
//           deviceData.services?.map((s) => s.protocol).join(", ") || "N/A";
//         const host = deviceData.host || "N/A";
//         if (bastionName === "Unknown" && deviceData.ip) {
//           const ipRecord = await IPAddress.findOne({
//             ipAddress: deviceData.ip,
//           });
//           if (ipRecord?.bastionName) {
//             bastionName = ipRecord.bastionName;
//           }
//         }
//         await UserGroupMappingReport.findOneAndUpdate(
//           {
//             user_group,
//             target_group,
//             devices: device,
//             host,
//             protocol,
//           },
//           { users, external_group, bastionName },
//           { upsert: true, new: true, setDefaultsOnInsert: true }
//         );
//       }
//     }

//     console.log("✅ UserGroupMapping Report generated successfully.");
//   } catch (error) {
//     console.error("❌ Error generating report:", error.message);
//     throw error;
//   }
// }

// module.exports = { generateReport };

const UserGroupMappingReport = require("../models/userGroupMappingReport.model");
const Authorization = require("../models/authorization.model");
const UserGroup = require("../models/usergroup.model");
const TargetGroup = require("../models/targetgroup.schema");
const DeviceReport = require("../models/devicereport.schema");
const axios = require("axios");
const https = require("https");
const IPAddress = require("../models/ipAddress.model");

const agent = new https.Agent({ rejectUnauthorized: false });
const username = "admin";

async function fetchExternalGroup(ipAddress, authKey, groupName) {
  try {
    const res = await axios.get(
      `https://${ipAddress}/api/usergroups/${encodeURIComponent(
        groupName
      )}/mappings`,
      {
        httpsAgent: agent,
        headers: {
          "X-Auth-Key": authKey,
          "X-Auth-User": username,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        timeout: 5000,
      }
    );

    const externalGroups = Array.isArray(res.data)
      ? res.data
          .map((m) => m?.external_group)
          .filter((g) => typeof g === "string" && g.trim())
      : [];

    return externalGroups.length > 0 ? externalGroups.join(", ") : "-";
  } catch (error) {
    return "-";
  }
}

function normalizeIpDoc(doc) {
  return {
    ip: doc.ipAddress || doc.ip || doc.address || "",
    bastionName: doc.bastionName || doc.bastion_name || doc.name || "Unknown",
    authKey: doc.authKey || doc.apiKey || doc.token || "",
  };
}

async function generateReport() {
  const loggedNoDevices = new Set();

  try {
    // Normalize IPAddress documents & build quick lookup
    const ipDocsRaw = await IPAddress.find({ api: "usergroups" });
    const ipDocs = ipDocsRaw.map(normalizeIpDoc);
    const ipToBastion = new Map(
      ipDocs.map((d) => [String(d.ip).trim(), d.bastionName])
    );

    const authorizations = await Authorization.find({});
    if (authorizations.length === 0) {
      console.log("No authorizations found.");
      return [];
    }

    for (const auth of authorizations) {
      const { user_group, target_group } = auth;

      const userGroupData = await UserGroup.findOne({ group_name: user_group });
      let users = "N/A";
      let external_group = "-";
      let bastionName = "Unknown";

      if (userGroupData && Array.isArray(userGroupData.users)) {
        users =
          userGroupData.users.length > 0
            ? userGroupData.users.join(", ")
            : "N/A";

        // Try each bastion; as soon as we call one, we can set its name.
        for (const ip of ipDocs) {
          // Pre-set bastion name because we are querying this bastion
          if (ip.bastionName) bastionName = ip.bastionName;

          const result = await fetchExternalGroup(
            ip.ip,
            ip.authKey,
            user_group
          );
          if (result !== "-") {
            external_group = result;
            // bastionName already set above; keep it.
            break;
          }
          // If result is "-", continue to next bastion; keep last seen name as a weak hint.
        }
      }

      const tg = await TargetGroup.findOne({ group_name: target_group });
      if (!tg || !tg.session || !Array.isArray(tg.session.accounts)) {
        if (!loggedNoDevices.has(target_group)) {
          console.log(`⚠️ No valid accounts for target group: ${target_group}`);
          loggedNoDevices.add(target_group);
        }
        continue;
      }

      const accounts = tg.session.accounts;
      const devices = accounts.map((a) => a.device).filter(Boolean);
      if (devices.length === 0) {
        if (!loggedNoDevices.has(target_group)) {
          console.log(`⚠️ No devices found for target group: ${target_group}`);
          loggedNoDevices.add(target_group);
        }
        continue;
      }

      for (const device of devices) {
        const deviceData = await DeviceReport.findOne({ device_name: device });
        if (!deviceData) continue;

        const protocol =
          deviceData.services?.map((s) => s.protocol).join(", ") || "N/A";
        const host = deviceData.host || "N/A";

        // Fallback 1: resolve bastion by deviceData.ip if we still have "Unknown"
        if (bastionName === "Unknown") {
          const devIp = String(
            deviceData.ip || deviceData.address || ""
          ).trim();
          if (devIp && ipToBastion.has(devIp)) {
            bastionName = ipToBastion.get(devIp);
          } else if (devIp) {
            // try direct lookup with multiple field names
            const ipRecord = await IPAddress.findOne({
              $or: [{ ipAddress: devIp }, { ip: devIp }, { address: devIp }],
            });
            if (ipRecord) {
              const norm = normalizeIpDoc(ipRecord);
              if (norm.bastionName) bastionName = norm.bastionName;
            }
          }
        }

        // Fallback 2: if host looks like an IP and matches a bastion record
        if (bastionName === "Unknown") {
          const hostIp = String(host).trim();
          if (ipToBastion.has(hostIp)) {
            bastionName = ipToBastion.get(hostIp);
          }
        }

        await UserGroupMappingReport.findOneAndUpdate(
          {
            user_group,
            target_group,
            devices: device,
            host,
            protocol,
          },
          {
            users,
            external_group,
            bastionName,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }

    console.log("✅ UserGroupMapping Report generated successfully.");
  } catch (error) {
    console.error("❌ Error generating report:", error.message);
    throw error;
  }
}

module.exports = { generateReport };
