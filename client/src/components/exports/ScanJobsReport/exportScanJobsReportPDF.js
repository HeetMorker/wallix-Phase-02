// components/exports/ScanJobsReport/exportScanJobsReportPDF.js
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const exportScanJobsReportPDF = async (data, username) => {
  const doc = new jsPDF("landscape");
  const dateStr = new Date().toLocaleString();

  doc.text(`Username: ${username}`, 15, 10);
  doc.text("Report: Scan Jobs Report", 15, 20);
  doc.text(`Date: ${dateStr}`, 15, 30);

  const headers = ["Type", "Start", "End", "IP", "Protocol", "Port", "Banner"];

  const rows = data.map((item) => [
    item.type || "-",
    item.start ? new Date(item.start).toLocaleString() : "-",
    item.end ? new Date(item.end).toLocaleString() : "-",
    item.ip || "-",
    item.protocol || "-",
    item.port || "-",
    item.banner || "-",
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

export default exportScanJobsReportPDF;
