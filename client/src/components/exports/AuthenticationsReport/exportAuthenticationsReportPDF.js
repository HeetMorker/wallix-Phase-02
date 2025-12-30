import { jsPDF } from "jspdf";
import "jspdf-autotable";

const exportAuthenticationsReportPDF = async (data, username) => {
  const doc = new jsPDF("landscape");
  const dateStr = new Date().toLocaleString();

  doc.text(`Username: ${username}`, 15, 10);
  doc.text("Report: Authentications Report", 15, 20);
  doc.text(`Date: ${dateStr}`, 15, 30);

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

export default exportAuthenticationsReportPDF;
