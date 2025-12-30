// components/exports/ApplicationsReport/exportApplicationsReportPDF.js

import { jsPDF } from "jspdf";
import "jspdf-autotable";

const exportApplicationsReportPDF = async (data, username) => {
  const doc = new jsPDF("landscape");
  const dateStr = new Date().toLocaleString();
  // const logoUrl = "assets/img/Mechsoft-Logo.png";

  // doc.addImage(logoUrl, "PNG", 250, 10, 30, 13);
  doc.text(`Username: ${username}`, 15, 10);
  doc.text("Report: Applications Report", 15, 20);
  doc.text(`Date: ${dateStr}`, 15, 30);

  const headers = [
    "Application Name",
    "Host",
    "Bastion Name",
    "Connection Policy",
    "Application Path",
    "Parameters",
    "Target Cluster Name",
    "Last Connection",
  ];

  const rows = data.map((item) => [
    item.application_name || "-",
    item.ipAddress || "-",
    item.bastionName || "-",
    item.connection_policy || "-",
    item.application_path || "-",
    item.parameters || "-",
    item.target_cluster_name || "-",
    item.last_connection
      ? new Date(item.last_connection).toLocaleString()
      : "-",
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

export default exportApplicationsReportPDF;
