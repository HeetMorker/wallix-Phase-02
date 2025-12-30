// exportDeviceReportExcel.js
import * as XLSX from "xlsx";

const exportDeviceReportExcel = async (data, username) => {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet([]);
  const dateStr = new Date().toLocaleString();

  XLSX.utils.sheet_add_aoa(worksheet, [
    [`Username: ${username}`],
    ["Report: Device Report"],
    [`Date: ${dateStr}`],
    [""],
  ]);

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

  XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
  XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
  XLSX.utils.book_append_sheet(workbook, worksheet, "DeviceReport");

  const blob = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "blob",
  });

  return blob;
};

export default exportDeviceReportExcel;
