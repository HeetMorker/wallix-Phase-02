import * as XLSX from "xlsx";

const exportUserGroupMappingExcel = async (data, username) => {
  const dateStr = new Date().toLocaleString();

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([]);

  XLSX.utils.sheet_add_aoa(worksheet, [
    [`Username: ${username}`],
    ["Report: User Group Mapping"],
    [`Date: ${dateStr}`],
    [""],
  ]);

  const headers = [
    "User Group",
    "Target Group",
    "External Group",
    "Users",
    "Host",
    "Devices",
    "Protocol",
  ];

  const rows = data.map((item) => [
    item.user_group || "-",
    item.target_group || "-",
    item.external_group || "-",
    Array.isArray(item.users) ? item.users.join(", ") : item.users || "-",
    item.host || "-",
    item.devices || "-",
    Array.isArray(item.protocol)
      ? item.protocol.join(", ")
      : item.protocol || "-",
  ]);

  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "UserGroupMapping");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export default exportUserGroupMappingExcel;
