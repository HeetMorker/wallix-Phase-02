// components/exports/ApprovalsReport/exportApprovalsReportPDF.js

import { jsPDF } from "jspdf";
import "jspdf-autotable";

const exportApprovalsReportPDF = async (data, username) => {
  const doc = new jsPDF("landscape");
  const dateStr = new Date().toLocaleString();

  doc.setFontSize(10);

  doc.text(`Username: ${username}`, 15, 10);
  doc.text("Report: Approvals Report", 15, 17);
  doc.text(`Date: ${dateStr}`, 15, 24);

  const columns = [
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

  doc.autoTable({
    head: [columns],
    body: rows,
    startY: 30,
    theme: "grid",
    tableWidth: "wrap",
    styles: {
      fontSize: 7.2,
      overflow: "linebreak",
      cellPadding: 1.5,
    },
    headStyles: {
      fillColor: "#EC6708",
      textColor: "#FFFFFF",
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 15 }, // Bastion
      1: { cellWidth: 15 }, // User
      2: { cellWidth: 40 }, // Target
      3: { cellWidth: 16 }, // Creation
      4: { cellWidth: 26 }, // Begin
      5: { cellWidth: 26 }, // End
      6: { cellWidth: 11 }, // Duration
      7: { cellWidth: 16 }, // Ticket
      8: { cellWidth: 25 }, // User Comment
      9: { cellWidth: 14 }, // Quorum
      10: { cellWidth: 28 }, // Approver Name
      11: { cellWidth: 18 }, // Approver Comment
      12: { cellWidth: 25 }, // Email
    },
    pageBreak: "auto",
  });

  return new Blob([doc.output("blob")], { type: "application/pdf" });
};

export default exportApprovalsReportPDF;
