import { jsPDF } from "jspdf";
import "jspdf-autotable";

const exportUserGroupMappingPDF = async (data, username) => {
  const doc = new jsPDF("landscape");
  const dateStr = new Date().toLocaleString();

  doc.text(`Username: ${username}`, 15, 10);
  doc.text("Report: User Group Mapping", 15, 20);
  doc.text(`Date: ${dateStr}`, 15, 30);

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

export default exportUserGroupMappingPDF;
