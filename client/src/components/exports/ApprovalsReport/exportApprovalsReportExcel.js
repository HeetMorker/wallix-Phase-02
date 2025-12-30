// components/exports/ApprovalsReport/exportApprovalsReportExcel.js

import * as XLSX from "xlsx";

const exportApprovalsReportExcel = async (data, username) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([]);
  const dateStr = new Date().toLocaleString();

  XLSX.utils.sheet_add_aoa(worksheet, [
    [`Username: ${username}`],
    ["Report: Approvals Report"],
    [`Date: ${dateStr}`],
    [""],
  ]);

  const headers = [
    "Bastion Name",
    "User Name",
    "Target Name",
    "Creation",
    "Begin",
    "End",
    "Duration",
    "Ticket",
    "User Comment",
    "Quorum",
    "Approver Name",
    "Approver Comment",
    "Email",
  ];

  const rows = data.map((item) => [
    item.bastionName || "-",
    item.user_name || "-",
    item.target_name || "-",
    item.creation ? new Date(item.creation).toLocaleString() : "-",
    item.begin ? new Date(item.begin).toLocaleString() : "-",
    item.end ? new Date(item.end).toLocaleString() : "-",
    item.duration || "-",
    item.ticket || "-",
    item.comment || "-",
    item.quorum || "-",
    item.answers?.[0]?.approver_name || "-",
    item.answers?.[0]?.comment || "-",
    item.email || "-",
  ]);

  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });

  XLSX.utils.book_append_sheet(workbook, worksheet, "Approvals");

  const buffer = await XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
};

export default exportApprovalsReportExcel;
