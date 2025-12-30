import * as XLSX from "xlsx";

const exportScansReportExcel = async (data, username) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([]);

  const dateStr = new Date().toLocaleString();

  XLSX.utils.sheet_add_aoa(worksheet, [
    [`Username: ${username}`],
    ["Report: Account and Device Discovery Report"],
    [`Date: ${dateStr}`],
    [""],
  ]);

  const headers = [
    "Type",
    "ID",
    "IP Address",
    "Start Time",
    "End Time",
    "Periodicity",
    "DN List",
    "Emails",
    "Active",
  ];

  const rows = data.map((item) => [
    item.type || "-",
    item.id || "-",
    item.ipAddress || "-",
    item.start ? new Date(item.start).toLocaleString() : "-",
    item.end ? new Date(item.end).toLocaleString() : "-",
    item.periodicity || "-",
    Array.isArray(item.dn_list) ? item.dn_list.join(", ") : "-",
    Array.isArray(item.emails) ? item.emails.join(", ") : "-",
    item.active === true ? "Yes" : item.active === false ? "No" : "-",
  ]);

  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Scans");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export default exportScansReportExcel;
