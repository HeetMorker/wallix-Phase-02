import * as XLSX from "xlsx";

const exportUserActivityExcel = async (data, username) => {
  const dateStr = new Date().toLocaleString();

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([]);

  XLSX.utils.sheet_add_aoa(worksheet, [
    [`Username: ${username}`],
    ["Report: User Activity Report"],
    [`Date: ${dateStr}`],
    [""],
  ]);

  const headers = [
    "Bastion Name",
    "Username",
    "Target Account",
    "Target Host",
    "Protocol",
    "Start Time",
    "End Time",
    "Target Group",
  ];

  const rows = data.map((item) => [
    item.bastionName || "-",
    item.username || "-",
    item.target_account || "-",
    item.target_host || "-",
    item.target_protocol || "-",
    item.begin ? new Date(item.begin).toLocaleString() : "-",
    item.end ? new Date(item.end).toLocaleString() : "-",
    item.target_group || "-",
  ]);

  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "UserActivity");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export default exportUserActivityExcel;
