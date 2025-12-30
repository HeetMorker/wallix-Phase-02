// import axios from "axios";

// const exportMap = {
//   devicereport: {
//     title: "Device Report",
//     pdf: () =>
//       import("../components/exports/DeviceReport/exportDeviceReportPDF").then(
//         (m) => m.default
//       ),
//     excel: () =>
//       import("../components/exports/DeviceReport/exportDeviceReportExcel").then(
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
//     title: "User Group Mapping Report",
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

// const generatePreviousDayRange = () => {
//   const now = new Date();
//   const from = new Date(
//     Date.UTC(
//       now.getUTCFullYear(),
//       now.getUTCMonth(),
//       now.getUTCDate() - 1,
//       0,
//       0,
//       0
//     )
//   );
//   const to = new Date(
//     Date.UTC(
//       now.getUTCFullYear(),
//       now.getUTCMonth(),
//       now.getUTCDate() - 1,
//       23,
//       59,
//       59,
//       999
//     )
//   );
//   return { from, to };
// };

// const fetchScheduledReports = async () => {
//   const token = localStorage.getItem("token");
//   const res = await axios.get("/api/scheduled-reports", {
//     headers: { "x-auth-token": token },
//   });
//   return res.data;
// };

// const fetchReportData = async (reportKey, from, to) => {
//   const token = localStorage.getItem("token");
//   const url = `/api/${reportKey}/filtered?from=${from.toISOString()}&to=${to.toISOString()}`;
//   const res = await axios.get(url, {
//     headers: { "x-auth-token": token },
//   });
//   return res.data;
// };

// const sendToBackend = async (
//   userId,
//   reportKey,
//   reportTitle,
//   format,
//   fileBlob
// ) => {
//   const formData = new FormData();
//   formData.append("userId", userId);
//   formData.append("reportTitle", reportTitle);
//   formData.append("format", format);
//   formData.append("reportKey", reportKey);
//   formData.append(
//     format,
//     fileBlob,
//     `report.${format === "pdf" ? "pdf" : "xlsx"}`
//   );

//   await axios.post("/api/send-report", formData, {
//     headers: {
//       "x-auth-token": localStorage.getItem("token"),
//     },
//   });
// };

// const runMailerNow = async () => {
//   try {
//     const schedules = await fetchScheduledReports();
//     const { from, to } = generatePreviousDayRange();

//     for (const schedule of schedules) {
//       const { userId, selectedApis, format } = schedule;
//       const username = userId.username;

//       for (const reportKey of selectedApis) {
//         const config = exportMap[reportKey];
//         if (!config) {
//           console.warn(`⚠️ Skipping unknown reportKey: ${reportKey}`);
//           continue;
//         }

//         const reportTitle = config.title;
//         const data = await fetchReportData(reportKey, from, to);

//         if (!data || !Array.isArray(data) || data.length === 0) {
//           console.warn(
//             `⏭️ Skipped: No data for ${reportTitle} (${reportKey}) for ${username}`
//           );
//           continue;
//         }

//         const exportFn = await config[format]();
//         const blob = await exportFn(data, username);
//         await sendToBackend(userId._id, reportKey, reportTitle, format, blob);

//         console.log(`✅ Sent ${reportTitle} (${format}) to ${username}`);
//       }
//     }
//   } catch (err) {
//     console.error("❌ [AutomatedMailer Error]:", err.message);
//   }
// };

// const scheduleMailerAt1AM = () => {
//   const now = new Date();
//   const nextRun = new Date(now);
//   nextRun.setUTCHours(1, 0, 0, 0);
//   if (now >= nextRun) {
//     nextRun.setUTCDate(now.getUTCDate() + 1);
//   }
//   const delay = nextRun - now;

//   setTimeout(() => {
//     runMailerNow();
//   }, delay);
// };

// // Trigger the scheduler
// scheduleMailerAt1AM();

// // Export in case needed elsewhere
// export const runAutomatedMailer = runMailerNow;
import axios from "axios";

const exportMap = {
  devicereport: {
    title: "Device Report",
    pdf: () =>
      import("../components/exports/DeviceReport/exportDeviceReportPDF").then(
        (m) => m.default
      ),
    excel: () =>
      import("../components/exports/DeviceReport/exportDeviceReportExcel").then(
        (m) => m.default
      ),
  },
  scans: {
    title: "Account And Device Discovery Report",
    pdf: () =>
      import("../components/exports/ScansReport/exportScansReportPDF").then(
        (m) => m.default
      ),
    excel: () =>
      import("../components/exports/ScansReport/exportScansReportExcel").then(
        (m) => m.default
      ),
  },
  applications: {
    title: "Application Report",
    pdf: () =>
      import(
        "../components/exports/ApplicationsReport/exportApplicationsReportPDF"
      ).then((m) => m.default),
    excel: () =>
      import(
        "../components/exports/ApplicationsReport/exportApplicationsReportExcel"
      ).then((m) => m.default),
  },
  approvals: {
    title: "Approvals Report",
    pdf: () =>
      import(
        "../components/exports/ApprovalsReport/exportApprovalsReportPDF"
      ).then((m) => m.default),
    excel: () =>
      import(
        "../components/exports/ApprovalsReport/exportApprovalsReportExcel"
      ).then((m) => m.default),
  },
  authentications: {
    title: "Authentications Report",
    pdf: () =>
      import(
        "../components/exports/AuthenticationsReport/exportAuthenticationsReportPDF"
      ).then((m) => m.default),
    excel: () =>
      import(
        "../components/exports/AuthenticationsReport/exportAuthenticationsReportExcel"
      ).then((m) => m.default),
  },
  scanjobs: {
    title: "Scan Jobs Report",
    pdf: () =>
      import(
        "../components/exports/ScanJobsReport/exportScanJobsReportPDF"
      ).then((m) => m.default),
    excel: () =>
      import(
        "../components/exports/ScanJobsReport/exportScanJobsReportExcel"
      ).then((m) => m.default),
  },
  targetgrouprestrictions: {
    title: "Target Group Restrictions Report",
    pdf: () =>
      import(
        "../components/exports/TargetGroupRestrictions/exportTargetgroupRestrictionsPDF"
      ).then((m) => m.default),
    excel: () =>
      import(
        "../components/exports/TargetGroupRestrictions/exportTargetgroupRestrictionsExcel"
      ).then((m) => m.default),
  },
  sessions: {
    title: "User Activity Report",
    pdf: () =>
      import(
        "../components/exports/UserGroupActivityReport/exportUserGroupActivityPDF"
      ).then((m) => m.default),
    excel: () =>
      import(
        "../components/exports/UserGroupActivityReport/exportUserGroupActivityExcel"
      ).then((m) => m.default),
  },
  usergroups: {
    title: "User Groups Report",
    pdf: () =>
      import("../components/exports/UserGroupReport/exportUserGroupPDF").then(
        (m) => m.default
      ),
    excel: () =>
      import("../components/exports/UserGroupReport/exportUserGroupExcel").then(
        (m) => m.default
      ),
  },
  report: {
    title: "User Group Mapping Report",
    pdf: () =>
      import(
        "../components/exports/UserGroupMappingReport/exportUserGroupMappingPDF"
      ).then((m) => m.default),
    excel: () =>
      import(
        "../components/exports/UserGroupMappingReport/exportUserGroupMappingExcel"
      ).then((m) => m.default),
  },
  usergrouprestrictions: {
    title: "User Group Restrictions Report",
    pdf: () =>
      import(
        "../components/exports/UsergroupRestrictionsReport/exportUsergroupRestrictionsPDF"
      ).then((m) => m.default),
    excel: () =>
      import(
        "../components/exports/UsergroupRestrictionsReport/exportUsergroupRestrictionsExcel"
      ).then((m) => m.default),
  },
};
const generatePreviousDayRange = () => {
  const now = new Date();
  const from = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 1,
      0,
      0,
      0
    )
  );
  const to = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 1,
      23,
      59,
      59,
      999
    )
  );
  return { from, to };
};

const fetchScheduledReports = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn(
      "❌ [Frontend] No token found. Cannot fetch scheduled reports."
    );
    return [];
  }

  const res = await axios.get("/api/scheduled-reports", {
    headers: { "x-auth-token": token },
  });
  return res.data;
};

const fetchReportData = async (reportKey, from, to) => {
  const token = localStorage.getItem("token");
  const url = `/api/${reportKey}/filtered?from=${from.toISOString()}&to=${to.toISOString()}`;
  const res = await axios.get(url, {
    headers: { "x-auth-token": token },
  });
  return res.data;
};

const sendToBackend = async (
  userId,
  reportKey,
  reportTitle,
  format,
  fileBlob
) => {
  const formData = new FormData();
  formData.append("userId", userId);
  formData.append("reportTitle", reportTitle);
  formData.append("format", format);
  formData.append("reportKey", reportKey);
  formData.append(
    format,
    fileBlob,
    `report.${format === "pdf" ? "pdf" : "xlsx"}`
  );

  const token = localStorage.getItem("token");
  await axios.post("/api/send-report", formData, {
    headers: {
      "x-auth-token": token,
    },
  });
};

export const runAutomatedMailer = async () => {
  console.log("📤 [Frontend] Starting automated report mailer...");

  try {
    const schedules = await fetchScheduledReports();
    if (!schedules || schedules.length === 0) {
      console.log("⚠️ [Frontend] No scheduled reports found.");
      return;
    }

    const { from, to } = generatePreviousDayRange();

    for (const schedule of schedules) {
      const { userId, selectedApis, format } = schedule;
      const username = userId?.username || "Unknown User";

      console.log(`🔍 [Frontend] Processing schedule for ${username}`);

      for (const reportKey of selectedApis) {
        const config = exportMap[reportKey];
        if (!config) {
          console.warn(
            `⚠️ [Frontend] Skipping unknown reportKey: ${reportKey}`
          );
          continue;
        }

        const reportTitle = config.title;
        const data = await fetchReportData(reportKey, from, to);

        if (!data || !Array.isArray(data) || data.length === 0) {
          console.warn(
            `⏭️ [Frontend] Skipped: No data for ${reportTitle} for ${username}`
          );
          continue;
        }

        console.log(
          `📄 [Frontend] Exporting ${reportTitle} (${format}) for ${username}`
        );
        const exportFn = await config[format]();
        const blob = await exportFn(data, username);

        await sendToBackend(userId._id, reportKey, reportTitle, format, blob);
        console.log(
          `✅ [Frontend] Sent ${reportTitle} (${format}) to ${username}`
        );
      }
    }

    console.log("🎉 [Frontend] All scheduled reports processed.");
    // 🔄 Reset backend flag after successful execution
    console.log("🔄 Resetting trigger flag on backend...");
    await axios.post("/api/run-reports/reset");
  } catch (err) {
    console.error("❌ [Frontend] runAutomatedMailer failed:", err.message);
  }
};
