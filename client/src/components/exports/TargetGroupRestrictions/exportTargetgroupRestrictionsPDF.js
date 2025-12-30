import { jsPDF } from "jspdf";
import "jspdf-autotable";

const exportTargetGroupRestrictionsPDF = async (data, username) => {
  const doc = new jsPDF("landscape");
  const dateStr = new Date().toLocaleString();

  doc.text(`Username: ${username}`, 15, 10);
  doc.text("Report: Targetgroup Restrictions Report", 15, 20);
  doc.text(`Date: ${dateStr}`, 15, 30);

  const headers = [
    "Group Name",
    "IP Address",
    "Restrictions",
    "Subprotocol",
    "Action",
    "Created At",
    "Updated At",
  ];

  const rows = data.map((item) => [
    item.group_name || "-",
    item.ipAddress || "-",
    item.restrictions || "-",
    item.subprotocol || "-",
    item.action || "-",
    item.createdAt ? new Date(item.createdAt).toLocaleString() : "-",
    item.updatedAt ? new Date(item.updatedAt).toLocaleString() : "-",
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

export default exportTargetGroupRestrictionsPDF;
