import { jsPDF } from "jspdf";
import "jspdf-autotable";

const exportUserGroupPDF = async (data, username) => {
  const doc = new jsPDF("landscape");
  const dateStr = new Date().toLocaleString();

  doc.text(`Username: ${username}`, 15, 10);
  doc.text("Report: User Group Report", 15, 20);
  doc.text(`Date: ${dateStr}`, 15, 30);

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

export default exportUserGroupPDF;
