import * as XLSX from "xlsx";

const exportUserGroupExcel = async (data, username) => {
  const dateStr = new Date().toLocaleString();

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([]);

  XLSX.utils.sheet_add_aoa(worksheet, [
    [`Username: ${username}`],
    ["Report: User Group Report"],
    [`Date: ${dateStr}`],
    [""],
  ]);

  const headers = [
    "Group Name",
    "Description",
    "Timeframe",
    "Users",
    "Profile",
  ];

  const rows = data.map((item) => [
    item.group_name || "-",
    item.description || "-",
    Array.isArray(item.timeframes) ? item.timeframes.join(", ") : "-",
    Array.isArray(item.users) ? item.users.join(", ") : "-",
    item.profile || "-",
  ]);

  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "UserGroup");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export default exportUserGroupExcel;
