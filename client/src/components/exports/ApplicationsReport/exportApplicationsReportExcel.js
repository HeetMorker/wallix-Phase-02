// components/exports/ApplicationsReport/exportApplicationsReportExcel.js

import * as XLSX from "xlsx";

const exportApplicationsReportExcel = async (data, username) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([]);
  const dateStr = new Date().toLocaleString();

  XLSX.utils.sheet_add_aoa(worksheet, [
    [`Username: ${username}`],
    ["Report: Applications Report"],
    [`Date: ${dateStr}`],
    [""],
  ]);

  const headers = [
    "Application Name",
    "Host",
    "Bastion Name",
    "Connection Policy",
    "Application Path",
    "Parameters",
    "Target Cluster Name",
    "Last Connection",
  ];

  const rows = data.map((item) => [
    item.application_name || "-",
    item.ipAddress || "-",
    item.bastionName || "-",
    item.connection_policy || "-",
    item.application_path || "-",
    item.parameters || "-",
    item.target_cluster_name || "-",
    item.last_connection
      ? new Date(item.last_connection).toLocaleString()
      : "-",
  ]);

  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");

  const buffer = await XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export default exportApplicationsReportExcel;
