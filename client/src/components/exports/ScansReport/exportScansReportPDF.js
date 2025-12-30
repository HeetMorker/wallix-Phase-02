import { jsPDF } from "jspdf";
import "jspdf-autotable";

const exportScansReportPDF = async (data, username) => {
  const doc = new jsPDF("landscape");
  const dateStr = new Date().toLocaleString();

  doc.text(`Username: ${username}`, 15, 10);
  doc.text("Report: Account and Device Discovery Report", 15, 20);
  doc.text(`Date: ${dateStr}`, 15, 30);

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

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 40,
    theme: "grid",
    headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
    styles: { fontSize: 8 },
  });

  return new Blob([doc.output("blob")], { type: "application/pdf" });
};

export default exportScansReportPDF;
