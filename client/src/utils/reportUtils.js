// // utils/reportUtils.js

// import jsPDF from "jspdf";
// import "jspdf-autotable";
// import * as XLSX from "xlsx";

// // 1. Fetch data based on reportKey
// export async function fetchReportData(reportKey, from, to) {
//   const url = `/api/${reportKey}/fromdb?from=${from.toISOString()}&to=${to.toISOString()}`;
//   const token = localStorage.getItem("token");

//   const response = await fetch(url, {
//     headers: { "x-auth-token": token },
//   });

//   if (!response.ok) {
//     throw new Error(`Failed to fetch data for ${reportKey}`);
//   }

//   return await response.json();
// }

// // 2. Generate PDF Blob
// export async function generatePDFBlob(data, username, title) {
//   const doc = new jsPDF("landscape");
//   const dateStr = new Date().toLocaleString();

//   doc.text(`Username: ${username}`, 15, 10);
//   doc.text(`Report: ${title}`, 15, 20);
//   doc.text(`Date: ${dateStr}`, 15, 30);

//   if (!data || data.length === 0) {
//     doc.text("No data available", 15, 50);
//     return new Blob([doc.output("blob")], { type: "application/pdf" });
//   }

//   const headers = Object.keys(data[0]);
//   const rows = data.map((row) =>
//     headers.map((key) => {
//       const val = row[key];
//       if (val instanceof Date) return new Date(val).toLocaleString();
//       if (Array.isArray(val)) return val.join(", ");
//       return val !== undefined && val !== null ? String(val) : "-";
//     })
//   );

//   doc.autoTable({
//     head: [headers],
//     body: rows,
//     startY: 40,
//     theme: "grid",
//     headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
//     styles: { fontSize: 8 },
//   });

//   return new Blob([doc.output("blob")], { type: "application/pdf" });
// }

// // 3. Generate Excel Blob
// export async function generateExcelBlob(data, username, title) {
//   const workbook = XLSX.utils.book_new();
//   const worksheet = XLSX.utils.aoa_to_sheet([]);

//   const dateStr = new Date().toLocaleString();

//   XLSX.utils.sheet_add_aoa(worksheet, [
//     [`Username: ${username}`],
//     [`Report: ${title}`],
//     [`Date: ${dateStr}`],
//     [""],
//   ]);

//   if (!data || data.length === 0) {
//     XLSX.utils.sheet_add_aoa(worksheet, [["No data available"]], {
//       origin: "A5",
//     });
//   } else {
//     const headers = Object.keys(data[0]);
//     const rows = data.map((row) =>
//       headers.map((key) => {
//         const val = row[key];
//         if (val instanceof Date) return new Date(val).toLocaleString();
//         if (Array.isArray(val)) return val.join(", ");
//         return val !== undefined && val !== null ? String(val) : "-";
//       })
//     );

//     XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
//     XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
//   }

//   XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

//   const buffer = await XLSX.write(workbook, {
//     bookType: "xlsx",
//     type: "array",
//   });

//   return new Blob([buffer], {
//     type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//   });
// }
// utils/reportUtils.js

// ✅ This file now only handles fetching report data for the previous day.
// ✅ All PDF/Excel generation is now handled by individual export files in /components/exports/

export async function fetchReportData(reportKey, from, to) {
  const url = `/api/${reportKey}/fromdb?from=${from.toISOString()}&to=${to.toISOString()}`;
  const token = localStorage.getItem("token");

  const response = await fetch(url, {
    headers: { "x-auth-token": token },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch data for ${reportKey}`);
  }

  return await response.json();
}
