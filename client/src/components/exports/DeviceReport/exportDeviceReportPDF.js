// exportDeviceReportPDF.js
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const exportDeviceReportPDF = async (data, username) => {
  const doc = new jsPDF("landscape");
  const dateStr = new Date().toLocaleString();

  doc.text(`Username: ${username}`, 15, 10);
  doc.text("Report: Device Report", 15, 20);
  doc.text(`Date: ${dateStr}`, 15, 30);

  const headers = [
    "Device Name",
    "Host",
    "Last Connection",
    "Onboard Status",
    "Tags",
    "Local Domains",
    "Service Names",
    "Protocols",
    "Ports",
    "Connection Policies",
    "Global Domains",
  ];

  const rows = [];
  data.forEach((device) => {
    const services = device.services || [{}];
    services.forEach((svc) => {
      rows.push([
        device.device_name || "-",
        device.host || "-",
        device.last_connection
          ? new Date(device.last_connection).toLocaleString()
          : "-",
        device.onboard_status || "-",
        (device.tags || []).join(", ") || "-",
        (device.local_domains || []).join(", ") || "-",
        svc.service_name || "-",
        svc.protocol || "-",
        svc.port || "-",
        svc.connection_policy || "-",
        (svc.global_domains || []).join("; ") || "-",
      ]);
    });
  });

  doc.autoTable({
    head: [headers],
    body: rows,
    startY: 40,
    theme: "grid",
    headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 35 }, // Device Name
      1: { cellWidth: 30 }, // Host
      2: { cellWidth: 40 }, // Last Connection
    },
  });

  return doc.output("blob");
};

export default exportDeviceReportPDF;
