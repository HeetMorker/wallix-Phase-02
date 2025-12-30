// const splunkjs = require("splunk-sdk");
// const db = require("../config/database");
// const { saveMultipleSplunkData } = require("../services/splunkData.service");

// const searchQuery = 'search source="udp:514" sourcetype="syslog" credential';

// function formatDate(timestamp) {
//   const date = new Date(timestamp);
//   const day = date.getDate().toString().padStart(2, "0");
//   const month = (date.getMonth() + 1).toString().padStart(2, "0");
//   const year = date.getFullYear();
//   return `${day}-${month}-${year}`;
// }

// function calculateAge(timestamp) {
//   const date = new Date(timestamp);
//   const today = new Date();
//   // const diffYears = today.getFullYear() - date.getFullYear();
//   // const diffMonths = today.getMonth() - date.getMonth();

//   // let age = diffYears;
//   // if (diffMonths < 0 || (diffMonths === 0 && today.getDate() < date.getDate())) {
//   // age--;
//   // }

//   // return `${age} year & ${Math.abs(diffMonths)} months`;

//   const diffDays = (today - date) / (60 * 60 * 24 * 1000);

//   return `${parseInt(diffDays)} day(s)`;
// }

// async function fetchSplunkData() {
//   await db();

//   try {
//     const service = new splunkjs.Service({
//       scheme: "https",
//       host: "localhost",
//       port: "8089",
//       username: "admin",
//       password: "P@ssw0rd",
//       version: "default",
//     });

//     await service.login();
//     console.log("Login successful");

//     let job = await service.search(searchQuery, { exec_mode: "blocking" });
//     console.log("Search completed");

//     job = await job.fetch();

//     let results;
//     [{ results }, job] = await job.results({ output_mode: "json" });

//     const regex =
//       /type="([^"]*)"\s*action="([^"]*)"\s*account="([^"]*)"\s*credential type="[^"]*"\s*result="([^"]*)"\s*reason="([^"]*)"/;

//     results = results
//       .map(({ _raw: data, _time, host }) => {
//         const match = data.match(regex);

//         if (match) {
//           data = {
//             type: match[1],
//             action: match[2],
//             account: match[3],
//             result: match[4],
//             reason: match[5],
//             date: formatDate(_time),
//             age: calculateAge(_time),
//             host,
//           };
//         } else {
//           console.log("No match found");
//           return null;
//         }
//         return data;
//       })
//       .filter(Boolean); // Filter out any null results

//     console.log(results);

//     if (results.length > 0) {
//       await saveMultipleSplunkData(results);
//     }

//     return results;
//   } catch (err) {
//     console.log(err);
//     return [];
//   }
// }

// module.exports = { fetchSplunkData };

// const splunkjs = require("splunk-sdk");
// const db = require("../config/database");
// const { saveMultipleSplunkData } = require("../services/splunkData.service");

// const searchQuery = 'search source="udp:514" sourcetype="syslog" credential';

// function formatDate(timestamp) {
//   const date = new Date(timestamp);
//   const day = date.getDate().toString().padStart(2, "0");
//   const month = (date.getMonth() + 1).toString().padStart(2, "0");
//   const year = date.getFullYear();
//   return `${day}-${month}-${year}`;
// }

// function calculateAge(timestamp) {
//   const date = new Date(timestamp);
//   const today = new Date();
//   const diffDays = (today - date) / (60 * 60 * 24 * 1000);
//   return `${parseInt(diffDays)} day(s)`;
// }

// // Define all regex patterns and their respective mapping logic
// const regexHandlers = [
//   {
//     // OLD FORMAT
//     regex:
//       /type="([^"]*)"\s*action="([^"]*)"\s*account="([^"]*)"\s*credential type="[^"]*"\s*result="([^"]*)"\s*reason="([^"]*)"/,
//     handler: (match, _time, host) => ({
//       type: match[1],
//       action: match[2],
//       account: match[3],
//       result: match[4],
//       reason: match[5],
//       date: formatDate(_time),
//       age: calculateAge(_time),
//       host,
//     }),
//   },
//   {
//     // NEW FORMAT: [wallixplugins] Windows plugin: Credentials change for Testuser: Password successfully changed
//     regex: /\[wallixplugins\] (.+?): Credentials change for ([^:]+): (.+)/,
//     handler: (match, _time, host) => ({
//       type: match[1], // e.g., Windows plugin
//       action: "Credentials change",
//       account: match[2], // Testuser
//       result: match[3], // Password successfully changed
//       reason: "",
//       date: formatDate(_time),
//       age: calculateAge(_time),
//       host,
//     }),
//   },
//   // Add more regex formats here as needed
// ];

// async function fetchSplunkData() {
//   await db();

//   try {
//     const service = new splunkjs.Service({
//       scheme: "https",
//       host: "localhost",
//       port: "8089",
//       username: "admin",
//       password: "P@ssw0rd",
//       version: "default",
//     });

//     await service.login();
//     console.log("Login successful");

//     let job = await service.search(searchQuery, { exec_mode: "blocking" });
//     console.log("Search completed");

//     job = await job.fetch();

//     let results;
//     [{ results }, job] = await job.results({ output_mode: "json" });

//     const parsedResults = results
//       .map(({ _raw: data, _time, host }) => {
//         for (const { regex, handler } of regexHandlers) {
//           const match = data.match(regex);
//           if (match) {
//             return handler(match, _time, host);
//           }
//         }
//         console.log("No regex matched for log:", data);
//         return null;
//       })
//       .filter(Boolean); // Remove nulls

//     console.log(parsedResults);

//     if (parsedResults.length > 0) {
//       await saveMultipleSplunkData(parsedResults);
//     }

//     return parsedResults;
//   } catch (err) {
//     console.error("Error fetching Splunk data:", err);
//     return [];
//   }
// }

// module.exports = { fetchSplunkData };

const splunkjs = require("splunk-sdk");
const db = require("../config/database");
const { saveMultipleSplunkData } = require("../services/splunkData.service");

const searchQuery = 'search source="udp:514" sourcetype="syslog" credential';

function formatDate(timestamp) {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function calculateAge(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const diffDays = (today - date) / (60 * 60 * 24 * 1000);
  return `${parseInt(diffDays)} day(s)`;
}

// Define all regex patterns and their respective mapping logic
const regexHandlers = [
  {
    // FLEXIBLE KEY=VALUE FORMAT (works for most logs)
    regex: /\[wallixplugins\] (.+?) plugin: (.+)/i,
    handler: (match, _time, host) => {
      const type = match[1];
      const rawFields = match[2];
      const fields = {};
      const kvRegex = /(\w+)="([^"]*)"/g;
      let kv;
      while ((kv = kvRegex.exec(rawFields)) !== null) {
        fields[kv[1]] = kv[2];
      }

      const result = (fields.result || "").toLowerCase().includes("success")
        ? "success"
        : "failure";

      return {
        type: type,
        action: fields.action || "",
        account: fields.account || "",
        result,
        reason: fields.reason || "",
        target_server: fields.device || "",
        date: formatDate(_time),
        age: calculateAge(_time),
        host,
      };
    },
  },
  {
    // SUCCESS FORMAT
    regex:
      /\[wallixplugins\] (.+?): Credentials change for ([^:]+): (Password successfully changed)/i,
    handler: (match, _time, host) => ({
      type: match[1],
      action: "Credentials change",
      account: match[2],
      result: "success",
      reason: match[3],
      target_server: "",
      date: formatDate(_time),
      age: calculateAge(_time),
      host,
    }),
  },
  {
    // FAILURE FORMAT
    regex:
      /\[wallixplugins\] (.+?): Credentials change for ([^:]+): (.+error:.+)/i,
    handler: (match, _time, host) => {
      const rawResult = match[3];
      const ipMatch = rawResult.match(
        /(?:on|using)\s+(\d{1,3}(?:\.\d{1,3}){3})/
      );
      const targetServer = ipMatch ? ipMatch[1] : "";

      return {
        type: match[1],
        action: "Credentials change",
        account: match[2],
        result: "failure",
        reason: rawResult,
        target_server: targetServer,
        date: formatDate(_time),
        age: calculateAge(_time),
        host,
      };
    },
  },
  {
    // REJECTED FORMAT
    regex:
      /\[wallixplugins\] (.+?): Credentials change for ([^:]+): (New credentials rejected:.+)/i,
    handler: (match, _time, host) => {
      const rawResult = match[3];
      const ipMatch = rawResult.match(/machine\s+(\d{1,3}(?:\.\d{1,3}){3})/);
      const targetServer = ipMatch ? ipMatch[1] : "";

      return {
        type: match[1],
        action: "Credentials change",
        account: match[2],
        result: "failure",
        reason: rawResult,
        target_server: targetServer,
        date: formatDate(_time),
        age: calculateAge(_time),
        host,
      };
    },
  },
  {
    // TRYING FORMAT — IGNORE THIS LOG (return null)
    regex: /\[wallixplugins\] (.+?): Credentials change for ([^:]+): Trying.+/i,
    handler: () => null, // Skip storing or displaying "Trying" logs
  },
];

async function fetchSplunkData() {
  await db();

  try {
    const service = new splunkjs.Service({
      scheme: "https",
      host: "localhost",
      port: "8089",
      username: "admin",
      password: "P@ssw0rd",
      version: "default",
    });

    await service.login();
    console.log("Login successful");

    let job = await service.search(searchQuery, { exec_mode: "blocking" });
    console.log("Search completed");

    job = await job.fetch();

    let results;
    [{ results }, job] = await job.results({ output_mode: "json" });

    const parsedResults = results
      .map(({ _raw: data, _time, host }) => {
        for (const { regex, handler } of regexHandlers) {
          const match = data.match(regex);
          if (match) {
            const parsed = handler(match, _time, host);
            return parsed;
          }
        }
        console.log("No regex matched for log:", data);
        return null;
      })
      .filter(Boolean); // Remove nulls and "trying" logs

    console.log(parsedResults);

    if (parsedResults.length > 0) {
      await saveMultipleSplunkData(parsedResults);
    }

    return parsedResults;
  } catch (err) {
    console.error("Error fetching Splunk data:", err);
    return [];
  }
}

module.exports = { fetchSplunkData };
