import * as XLSX from "xlsx";

const exportAuthenticationsReportExcel = async (data, username) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([]);

  const dateStr = new Date().toLocaleString();

  XLSX.utils.sheet_add_aoa(worksheet, [
    [`Username: ${username}`],
    ["Report: Authentications Report"],
    [`Date: ${dateStr}`],
    [""],
  ]);

  const headers = [
    "Bastion Name",
    "Username",
    "Login Time",
    "Logout Time",
    "Result",
    "Source IP",
  ];

  const rows = data.map((item) => [
    item.bastionName || "-",
    item.username || "-",
    item.login ? new Date(item.login).toLocaleString() : "-",
    item.logout ? new Date(item.logout).toLocaleString() : "-",
    item.result === true ? "Success" : "Failure",
    item.source_ip || "-",
  ]);

  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Authentications");

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export default exportAuthenticationsReportExcel;
