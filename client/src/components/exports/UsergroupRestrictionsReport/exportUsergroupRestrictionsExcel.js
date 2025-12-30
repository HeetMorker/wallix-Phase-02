import * as XLSX from "xlsx";

const exportUsergroupRestrictionsExcel = async (data, username) => {
  const dateStr = new Date().toLocaleString();

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([]);

  XLSX.utils.sheet_add_aoa(worksheet, [
    [`Username: ${username}`],
    ["Report: Usergroup Restrictions Report"],
    [`Date: ${dateStr}`],
    [""],
  ]);

  const headers = [
    "Group Name",
    "IP Address",
    "Restrictions",
    "Action",
    "Subprotocol",
    "Users",
    "Created At",
    "Updated At",
  ];

  const rows = data.map((item) => [
    item.group_name || "-",
    item.ipAddress || "-",
    item.restrictions || "-",
    item.action || "-",
    item.subprotocol || "-",
    Array.isArray(item.users) ? item.users.join(", ") : item.users || "-",
    item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
    item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-",
  ]);

  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "UsergroupRestrictions");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export default exportUsergroupRestrictionsExcel;
