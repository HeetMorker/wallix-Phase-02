import { jsPDF } from "jspdf";
import "jspdf-autotable";

const exportUserActivityPDF = async (data, username) => {
  const doc = new jsPDF("landscape");
  const dateStr = new Date().toLocaleString();

  doc.text(`Username: ${username}`, 15, 10);
  doc.text("Report: User Activity Report", 15, 20);
  doc.text(`Date: ${dateStr}`, 15, 30);

  const headers = [
    "Bastion Name",
    "Username",
    "Target Account",
    "Target Host",
    "Protocol",
    "Start Time",
    "End Time",
    "Target Group",
  ];

  const rows = data.map((item) => [
    item.bastionName || "-",
    item.username || "-",
    item.target_account || "-",
    item.target_host || "-",
    item.target_protocol || "-",
    item.begin ? new Date(item.begin).toLocaleString() : "-",
    item.end ? new Date(item.end).toLocaleString() : "-",
    item.target_group || "-",
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

export default exportUserActivityPDF;
