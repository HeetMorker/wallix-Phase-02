import * as XLSX from "xlsx";

const exportTargetGroupRestrictionsExcel = async (data, username) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([]);

  const dateStr = new Date().toLocaleString();

  XLSX.utils.sheet_add_aoa(worksheet, [
    [`Username: ${username}`],
    ["Report: Targetgroup Restrictions Report"],
    [`Date: ${dateStr}`],
    [""],
  ]);

  const headers = [
    "Group Name",
    "IP Address",
    "Restrictions",
    "Subprotocol",
    "Action",
    "Created At",
    "Updated At",
  ];

  const rows = data.map((item) => [
    item.group_name || "-",
    item.ipAddress || "-",
    item.restrictions || "-",
    item.subprotocol || "-",
    item.action || "-",
    item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
    item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-",
  ]);

  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "TargetgroupRestrictions");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export default exportTargetGroupRestrictionsExcel;
