// import { useEffect } from "react";
// import axios from "axios";

// const exportMap = {
//   devicereport: {
//     title: "Device Report",
//     pdf: () =>
//       import("../exports/DeviceReport/exportDeviceReportPDF").then(
//         (m) => m.default
//       ),
//     excel: () =>
//       import("../exports/DeviceReport/exportDeviceReportExcel").then(
//         (m) => m.default
//       ),
//   },
//   scans: {
//     title: "Account And Device Discovery Report",
//     pdf: () =>
//       import("../exports/ScansReport/exportScansReportPDF").then(
//         (m) => m.default
//       ),
//     excel: () =>
//       import("../exports/ScansReport/exportScansReportExcel").then(
//         (m) => m.default
//       ),
//   },
//   applications: {
//     title: "Application Report",
//     pdf: () =>
//       import("../exports/ApplicationsReport/exportApplicationsReportPDF").then(
//         (m) => m.default
//       ),
//     excel: () =>
//       import(
//         "../exports/ApplicationsReport/exportApplicationsReportExcel"
//       ).then((m) => m.default),
//   },
//   approvals: {
//     title: "Approvals Report",
//     pdf: () =>
//       import("../exports/ApprovalsReport/exportApprovalsReportPDF").then(
//         (m) => m.default
//       ),
//     excel: () =>
//       import("../exports/ApprovalsReport/exportApprovalsReportExcel").then(
//         (m) => m.default
//       ),
//   },
//   authentications: {
//     title: "Authentications Report",
//     pdf: () =>
//       import(
//         "../exports/AuthenticationsReport/exportAuthenticationsReportPDF"
//       ).then((m) => m.default),
//     excel: () =>
//       import(
//         "../exports/AuthenticationsReport/exportAuthenticationsReportExcel"
//       ).then((m) => m.default),
//   },
//   scanjobs: {
//     title: "Scan Jobs Report",
//     pdf: () =>
//       import("../exports/ScanJobsReport/exportScanJobsReportPDF").then(
//         (m) => m.default
//       ),
//     excel: () =>
//       import("../exports/ScanJobsReport/exportScanJobsReportExcel").then(
//         (m) => m.default
//       ),
//   },
//   targetgrouprestrictions: {
//     title: "Target Group Restrictions Report",
//     pdf: () =>
//       import(
//         "../exports/TargetGroupRestrictions/exportTargetgroupRestrictionsPDF"
//       ).then((m) => m.default),
//     excel: () =>
//       import(
//         "../exports/TargetGroupRestrictions/exportTargetgroupRestrictionsExcel"
//       ).then((m) => m.default),
//   },
//   sessions: {
//     title: "User Activity Report",
//     pdf: () =>
//       import(
//         "../exports/UserGroupActivityReport/exportUserGroupActivityPDF"
//       ).then((m) => m.default),
//     excel: () =>
//       import(
//         "../exports/UserGroupActivityReport/exportUserGroupActivityExcel"
//       ).then((m) => m.default),
//   },
//   usergroups: {
//     title: "User Groups Report",
//     pdf: () =>
//       import("../exports/UserGroupReport/exportUserGroupPDF").then(
//         (m) => m.default
//       ),
//     excel: () =>
//       import("../exports/UserGroupReport/exportUserGroupExcel").then(
//         (m) => m.default
//       ),
//   },
//   usergroupmapping: {
//     title: "User Group  Mapping Report",
//     pdf: () =>
//       import(
//         "../exports/UserGroupMappingReport/exportUserGroupMappingPDF"
//       ).then((m) => m.default),
//     excel: () =>
//       import(
//         "../exports/UserGroupMappingReport/exportUserGroupMappingExcel"
//       ).then((m) => m.default),
//   },
//   usergrouprestrictions: {
//     title: "User Group Restrictions Report",
//     pdf: () =>
//       import(
//         "../exports/UsergroupRestrictionsReport/exportUsergroupRestrictionsPDF"
//       ).then((m) => m.default),
//     excel: () =>
//       import(
//         "../exports/UsergroupRestrictionsReport/exportUsergroupRestrictionsExcel"
//       ).then((m) => m.default),
//   },
// };

// const ReportMailerTrigger = () => {
//   useEffect(() => {
//     if (window.__reportMailerExecuted__) return;
//     window.__reportMailerExecuted__ = true;

//     const sendScheduledReports = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         const { data: schedules } = await axios.get("/api/scheduled-reports", {
//           headers: { "x-auth-token": token },
//         });

//         const now = new Date();
//         const from = new Date(
//           Date.UTC(
//             now.getUTCFullYear(),
//             now.getUTCMonth(),
//             now.getUTCDate() - 1,
//             0,
//             0,
//             0
//           )
//         );
//         const to = new Date(
//           Date.UTC(
//             now.getUTCFullYear(),
//             now.getUTCMonth(),
//             now.getUTCDate() - 1,
//             23,
//             59,
//             59,
//             999
//           )
//         );

//         for (const schedule of schedules) {
//           const { userId, selectedApis, format } = schedule;
//           const username = userId.username;

//           for (const reportKey of selectedApis) {
//             const config = exportMap[reportKey];
//             if (!config) {
//               console.warn(`⚠️ Unknown reportKey: ${reportKey}`);
//               continue;
//             }

//             const url = `/api/${reportKey}/filtered?from=${from.toISOString()}&to=${to.toISOString()}`;
//             const { data } = await axios.get(url, {
//               headers: { "x-auth-token": token },
//             });

//             if (!data || !Array.isArray(data) || data.length === 0) {
//               console.warn(`⚠️ No data for ${reportKey} (${username})`);
//               continue;
//             }

//             const reportTitle = config.title;
//             const exportFn = await config[format]();
//             const blob = await exportFn(data, username);

//             const formData = new FormData();
//             formData.append(format, blob, `report.${format}`);
//             formData.append("userId", userId._id);
//             formData.append("reportTitle", reportTitle);
//             formData.append("format", format);
//             formData.append("reportKey", reportKey);

//             await axios.post("/api/send-report", formData, {
//               headers: {
//                 "x-auth-token": token,
//                 "Content-Type": "multipart/form-data",
//               },
//             });

//             console.log(
//               `✅ Sent ${format} report for ${username}: ${reportTitle}`
//             );
//           }
//         }
//       } catch (error) {
//         console.error("❌ ReportMailerTrigger failed:", error.message);
//       }
//     };

//     const scheduleAt1AM = () => {
//       const now = new Date();
//       const nextRun = new Date(now);
//       nextRun.setUTCHours(1, 0, 0, 0);
//       if (now >= nextRun) {
//         nextRun.setUTCDate(now.getUTCDate() + 1);
//       }
//       const delay = nextRun - now;
//       setTimeout(() => {
//         sendScheduledReports();
//       }, delay);
//     };

//     scheduleAt1AM();
//   }, []);

//   return null;
// };

// export default ReportMailerTrigger;
import { useEffect } from "react";
import axios from "axios";
import { runAutomatedMailer } from "../../utils/automatedReportMailer";

const ReportMailerTrigger = () => {
  useEffect(() => {
    const pollBackendForTrigger = async () => {
      try {
        const res = await axios.get("/api/run-reports");
        console.log("[Frontend] Trigger flag:", res.data);

        if (res.data?.shouldSend === true) {
          console.log("🚀 Trigger is TRUE — running mail automation...");
          await runAutomatedMailer();

          await axios.post("/api/run-reports/reset");
          console.log("✅ Trigger flag reset to FALSE after success.");
        } else {
          console.log("⏳ Trigger is still FALSE. Waiting...");
        }
      } catch (err) {
        console.error("❌ Error polling /api/run-reports:", err.message);
      }
    };

    const intervalId = setInterval(pollBackendForTrigger, 60000); // poll every 1 min
    pollBackendForTrigger(); // 👈 Run immediately on mount too

    return () => {
      console.log("🧹 Unmounted: clearing polling interval.");
      clearInterval(intervalId);
    };
  }, []);

  return null;
};

export default ReportMailerTrigger;
