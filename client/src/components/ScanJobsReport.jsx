// import axios from "axios";
// import { useEffect, useMemo, useState } from "react";
// import { jsPDF } from "jspdf";
// import "jspdf-autotable";
// import * as XLSX from "xlsx";
// import Pagination from "./Common/Pagination";
// import getLogoBase64 from "../utils/getLogoBase64";

// /* -------- Helpers -------- */
// const parseToDate = (v) => {
//   if (!v) return null;
//   const d = new Date(v);
//   return isNaN(d.getTime()) ? null : d;
// };
// const ymdToLocalDate = (ymd, endOfDay = false) => {
//   if (!ymd) return null;
//   const [y, m, d] = ymd.split("-").map(Number);
//   if (!y || !m || !d) return null;
//   return endOfDay
//     ? new Date(y, m - 1, d, 23, 59, 59, 999)
//     : new Date(y, m - 1, d, 0, 0, 0, 0);
// };
// const textIncludes = (hay, needle) =>
//   !needle
//     ? true
//     : String(hay ?? "")
//         .toLowerCase()
//         .includes(String(needle).toLowerCase());

// /* -------- Component -------- */
// const ScanJobsReport = () => {
//   const [reportData, setReportData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [totalPages, setTotalPages] = useState(0);
//   const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

//   const defaultColumns = [
//     { label: "Type", key: "type", visible: true },
//     { label: "Start", key: "start", visible: true },
//     { label: "End", key: "end", visible: true },
//     { label: "IP", key: "ip", visible: true },
//     { label: "Protocol", key: "protocol", visible: true },
//     { label: "Port", key: "port", visible: true },
//     { label: "Banner", key: "banner", visible: true },
//   ];
//   const [columnsConfig, setColumnsConfig] = useState(defaultColumns);

//   const toggleColumnVisibility = (key) => {
//     setColumnsConfig((prev) =>
//       prev.map((col) =>
//         col.key === key ? { ...col, visible: !col.visible } : col
//       )
//     );
//   };

//   // Filters: start/end use yyyy-mm-dd strings (for UI); others are text
//   const [filters, setFilters] = useState({
//     type: "",
//     start: "",
//     end: "",
//     ip: "",
//     protocol: "",
//     port: "",
//     banner: "",
//   });

//   // Apply date filter ONLY when a full date is selected
//   const [dateFilters, setDateFilters] = useState({
//     start: null, // Date | null
//     end: null, // Date | null
//   });

//   // Range controls (server-side filtering by start first, fallback to end)
//   const [range, setRange] = useState({ from: "", to: "" }); // yyyy-mm-dd
//   const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });
//   const [rangeVersion, setRangeVersion] = useState(0); // force refresh even if same dates applied

//   /* -------- Flatten API data into table rows -------- */
//   const flattenScanData = (data) => {
//     const result = [];
//     if (!Array.isArray(data)) return [];
//     data.forEach((entry) => {
//       const { type, start, end, result: results } = entry || {};
//       const s = start ?? "-";
//       const e = end ?? "-";

//       if (Array.isArray(results)) {
//         results.forEach((device) => {
//           const { ip, services = [] } = device || {};
//           if (Array.isArray(services) && services.length > 0) {
//             services.forEach((srv) => {
//               result.push({
//                 type: type || "-",
//                 start: s,
//                 end: e,
//                 ip: ip || "-",
//                 protocol: srv?.protocol || "-",
//                 port: srv?.port ?? "-",
//                 banner: srv?.banner || "-",
//               });
//             });
//           } else {
//             result.push({
//               type: type || "-",
//               start: s,
//               end: e,
//               ip: ip || "-",
//               protocol: "-",
//               port: "-",
//               banner: "-",
//             });
//           }
//         });
//       }
//     });
//     return result;
//   };

//   /* -------- Fetch (range-aware) -------- */
//   const fetchReport = async () => {
//     setLoading(true);
//     try {
//       const token = localStorage.getItem("token");
//       let list = [];
//       let usedFromDbFallback = false;

//       if (rangeApplied.from || rangeApplied.to) {
//         const qs = new URLSearchParams();
//         if (rangeApplied.from) qs.set("from", rangeApplied.from);
//         if (rangeApplied.to) qs.set("to", rangeApplied.to);

//         // Try by=start first, then by=end
//         let resp = await axios.get(
//           `/api/scanjobs/range?${qs.toString()}&by=start`,
//           {
//             headers: { "x-auth-token": token },
//           }
//         );
//         list = Array.isArray(resp.data) ? resp.data : [];

//         if (list.length === 0) {
//           try {
//             const resp2 = await axios.get(
//               `/api/scanjobs/range?${qs.toString()}&by=end`,
//               { headers: { "x-auth-token": token } }
//             );
//             list = Array.isArray(resp2.data) ? resp2.data : [];
//           } catch {
//             // ignore; will fallback next
//           }
//         }

//         // Fallback to /fromdb + client-side range if needed
//         if (list.length === 0) {
//           usedFromDbFallback = true;
//           const rAll = await axios.get(`/api/scanjobs/fromdb`, {
//             headers: { "x-auth-token": token },
//           });
//           list = Array.isArray(rAll.data) ? rAll.data : [];
//         }
//       } else {
//         const res = await axios.get("/api/scanjobs/fromdb", {
//           headers: { "x-auth-token": token },
//         });
//         list = Array.isArray(res.data) ? res.data : [];
//       }

//       let flattened = flattenScanData(list);

//       // If we had to fallback, apply range on client using 'start'
//       if (usedFromDbFallback && (rangeApplied.from || rangeApplied.to)) {
//         const fromDate = ymdToLocalDate(rangeApplied.from, false);
//         const toDate = ymdToLocalDate(rangeApplied.to, true);
//         flattened = flattened.filter((row) => {
//           const d = parseToDate(row.start);
//           if (!d) return false;
//           if (fromDate && d < fromDate) return false;
//           if (toDate && d > toDate) return false;
//           return true;
//         });
//       }

//       setReportData(flattened);
//       setTotalPages(Math.ceil(flattened.length / itemsPerPage));
//       setError(null);
//     } catch (err) {
//       console.error("Error fetching ScanJobs:", err);
//       setError("Failed to fetch ScanJobs data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchReport();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [itemsPerPage, rangeApplied.from, rangeApplied.to, rangeVersion]);

//   /* -------- Handlers -------- */
//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//     setCurrentPage(1);
//   };

//   const handleDateFilterChange = (e) => {
//     const { name, value, valueAsDate } = e.target; // name is 'start' or 'end'
//     setFilters((prev) => ({ ...prev, [name]: value }));
//     setDateFilters((prev) => ({
//       ...prev,
//       [name]: valueAsDate instanceof Date ? valueAsDate : null,
//     }));
//     setCurrentPage(1);
//   };

//   const handleItemsPerPageChange = (e) => {
//     setItemsPerPage(Number(e.target.value));
//     setCurrentPage(1);
//   };

//   const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
//   const handleNextPage = () =>
//     setCurrentPage((p) => Math.min(p + 1, totalPages));

//   const applyRange = () => {
//     let { from, to } = range;
//     if (from && to && new Date(from) > new Date(to)) {
//       [from, to] = [to, from];
//       setRange({ from, to });
//     }
//     setRangeApplied({ from: from || "", to: to || "" });
//     setRangeVersion((v) => v + 1); // force refresh even if dates unchanged
//     setCurrentPage(1);
//   };

//   const resetRange = () => {
//     setRange({ from: "", to: "" });
//     setRangeApplied({ from: "", to: "" });
//     setRangeVersion((v) => v + 1);
//     setCurrentPage(1);
//   };

//   /* -------- Client-side filters -------- */
//   const filteredData = useMemo(() => {
//     return reportData.filter((item) => {
//       if (!textIncludes(item.type, filters.type)) return false;
//       if (!textIncludes(item.ip, filters.ip)) return false;
//       if (!textIncludes(item.protocol, filters.protocol)) return false;
//       if (!textIncludes(item.port, filters.port)) return false;
//       if (!textIncludes(item.banner, filters.banner)) return false;

//       // Date columns: only apply when a full date is selected
//       if (dateFilters.start) {
//         const d = parseToDate(item.start);
//         const s = ymdToLocalDate(filters.start, false);
//         const e = ymdToLocalDate(filters.start, true);
//         if (!d || d < s || d > e) return false;
//       }
//       if (dateFilters.end) {
//         const d = parseToDate(item.end);
//         const s = ymdToLocalDate(filters.end, false);
//         const e = ymdToLocalDate(filters.end, true);
//         if (!d || d < s || d > e) return false;
//       }
//       return true;
//     });
//   }, [reportData, filters, dateFilters]);

//   /* -------- Pagination slice -------- */
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;
//   const currentData = useMemo(
//     () => filteredData.slice(startIndex, endIndex),
//     [filteredData, startIndex, endIndex]
//   );

//   useEffect(() => {
//     setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
//   }, [filteredData.length, itemsPerPage]);

//   /* -------- Exporters (use filteredData for WYSIWYG) -------- */
//   const exportPDF = async () => {
//     const doc = new jsPDF("landscape");
//     const currentDate = new Date().toLocaleString();

//     let res = await fetch("/api/username", {
//       headers: { "x-auth-token": localStorage.getItem("token") },
//     });
//     res = await res.json();

//     const logo = await getLogoBase64();
//     if (logo) {
//       try {
//         const pageWidth = doc.internal.pageSize.getWidth();
//         const finalWidth = 35;
//         const finalHeight = (logo.height / logo.width) * finalWidth;
//         const x = pageWidth - finalWidth - 10;
//         const y = 12;
//         doc.addImage(logo.base64, "PNG", x, y, finalWidth, finalHeight);
//       } catch (err) {
//         console.error("Failed to add logo to PDF:", err);
//       }
//     }
//     doc.text(`Username: ${res.username}`, 15, 10);
//     doc.text("Report: Scan Jobs Report", 15, 20);
//     doc.text(`Date: ${currentDate}`, 15, 30);

//     const visibleCols = columnsConfig.filter((col) => col.visible);
//     const columns = visibleCols.map((col) => col.label);
//     const rows = filteredData.map((item) =>
//       visibleCols.map((col) => {
//         const val = item[col.key];
//         if (col.key === "start" || col.key === "end") {
//           const d = parseToDate(val);
//           return d ? d.toLocaleString() : "-";
//         }
//         return val ?? "-";
//       })
//     );

//     doc.autoTable({
//       head: [columns],
//       body: rows,
//       startY: 40,
//       theme: "grid",
//       headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
//     });

//     doc.save("scanjobs.pdf");
//   };

//   const exportExcel = async () => {
//     const currentDate = new Date().toLocaleString();

//     let res = await fetch("/api/username", {
//       headers: { "x-auth-token": localStorage.getItem("token") },
//     });
//     res = await res.json();

//     const workbook = XLSX.utils.book_new();
//     const worksheet = XLSX.utils.aoa_to_sheet([]);

//     XLSX.utils.sheet_add_aoa(worksheet, [
//       [`Username: ${res.username}`],
//       ["Report: Scan Jobs Report"],
//       [`Date: ${currentDate}`],
//       [""],
//     ]);

//     const visibleCols = columnsConfig.filter((col) => col.visible);
//     const headers = visibleCols.map((col) => col.label);
//     const rows = filteredData.map((item) =>
//       visibleCols.map((col) => {
//         const val = item[col.key];
//         if (col.key === "start" || col.key === "end") {
//           const d = parseToDate(val);
//           return d ? d.toLocaleString() : "-";
//         }
//         return val ?? "-";
//       })
//     );

//     XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
//     XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Scan Jobs");
//     XLSX.writeFile(
//       workbook,
//       `scanjobs-${res.username}-${new Date().toISOString()}.xlsx`
//     );
//   };

//   if (loading)
//     return (
//       <div className="loader-container">
//         <img src="./assets/img/1487.gif" alt="Loading..." />
//       </div>
//     );

//   if (error) return <p>{error}</p>;

//   return (
//     <div className="content-wrapper">
//       <div className="flex-grow-1 custom-w">
//         <div className="card">
//           <div className="d-flex mb-2 px-4 pt-3 justify-content-between">
//             <div className="table-title">
//               <h5 className="fw-bold py-2">Scan Jobs Report</h5>
//             </div>

//             <div className="d-flex align-items-center gap-2 flex-wrap">
//               {/* Range controls */}
//               <div className="d-flex align-items-center gap-2">
//                 <div className="d-flex flex-column">
//                   <label className="small mb-1">From</label>
//                   <input
//                     type="date"
//                     value={range.from}
//                     onChange={(e) =>
//                       setRange((r) => ({ ...r, from: e.target.value }))
//                     }
//                     className="form-control"
//                     style={{ minWidth: 160 }}
//                   />
//                 </div>
//                 <div className="d-flex flex-column">
//                   <label className="small mb-1">To</label>
//                   <input
//                     type="date"
//                     value={range.to}
//                     onChange={(e) =>
//                       setRange((r) => ({ ...r, to: e.target.value }))
//                     }
//                     className="form-control"
//                     style={{ minWidth: 160 }}
//                   />
//                 </div>
//                 <div className="d-flex align-items-end gap-2">
//                   <button
//                     className="btn btn-outline-primary"
//                     onClick={applyRange}
//                   >
//                     Apply
//                   </button>
//                   <button
//                     className="btn btn-outline-secondary"
//                     onClick={resetRange}
//                     disabled={!rangeApplied.from && !rangeApplied.to}
//                   >
//                     Reset
//                   </button>
//                 </div>
//               </div>

//               {/* Settings + Export + Page size */}
//               <div className="position-relative">
//                 <button
//                   className="btn btn-secondary p-2"
//                   onClick={() => setShowSettingsDropdown((prev) => !prev)}
//                 >
//                   Settings ⚙️
//                 </button>
//                 {showSettingsDropdown && (
//                   <div
//                     className="position-absolute bg-white border p-3 shadow"
//                     style={{ zIndex: 10, top: "45px", left: 0, width: "200px" }}
//                   >
//                     <strong className="d-block mb-2">Select Fields</strong>
//                     {columnsConfig.map((col) => (
//                       <div key={col.key} className="form-check">
//                         <input
//                           className="form-check-input"
//                           type="checkbox"
//                           id={`check-${col.key}`}
//                           checked={col.visible}
//                           onChange={() => toggleColumnVisibility(col.key)}
//                         />
//                         <label
//                           className="form-check-label"
//                           htmlFor={`check-${col.key}`}
//                         >
//                           {col.label}
//                         </label>
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <button
//                 className="btn btn-primary me-2 p-2"
//                 onClick={exportExcel}
//               >
//                 Excel
//               </button>
//               <button className="btn btn-primary me-2 p-2" onClick={exportPDF}>
//                 PDF
//               </button>

//               <div className="d-flex justify-content-end mb-2">
//                 <label className="me-2">Show:</label>
//                 <select
//                   value={itemsPerPage}
//                   onChange={handleItemsPerPageChange}
//                 >
//                   <option value={10}>10</option>
//                   <option value={25}>25</option>
//                   <option value={50}>50</option>
//                 </select>
//               </div>
//             </div>
//           </div>

//           <div className="table-responsive">
//             <table className="table table-bordered table-hover">
//               <thead>
//                 <tr>
//                   {columnsConfig.map(
//                     (col) =>
//                       col.visible && (
//                         <th key={col.key} className="fw-bold fs-custom">
//                           {col.label}
//                         </th>
//                       )
//                   )}
//                 </tr>
//               </thead>
//               <tbody>
//                 {/* Filter row */}
//                 <tr>
//                   {columnsConfig.map(
//                     (col) =>
//                       col.visible && (
//                         <td key={`filter-${col.key}`}>
//                           {["start", "end"].includes(col.key) ? (
//                             <input
//                               type="date"
//                               className="form-control"
//                               name={col.key}
//                               value={filters[col.key]}
//                               onChange={handleDateFilterChange}
//                             />
//                           ) : (
//                             <input
//                               type="text"
//                               className="form-control"
//                               name={col.key}
//                               value={filters[col.key]}
//                               placeholder={`Search ${col.label}`}
//                               onChange={handleFilterChange}
//                             />
//                           )}
//                         </td>
//                       )
//                   )}
//                 </tr>

//                 {currentData.map((row, index) => (
//                   <tr key={index}>
//                     {columnsConfig.map(
//                       (col) =>
//                         col.visible && (
//                           <td key={col.key} className="fs-text-custom">
//                             {["start", "end"].includes(col.key)
//                               ? (() => {
//                                   const d = parseToDate(row[col.key]);
//                                   return d ? d.toLocaleString() : "-";
//                                 })()
//                               : row[col.key] ?? "-"}
//                           </td>
//                         )
//                     )}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           <Pagination
//             currentPage={currentPage}
//             totalPages={totalPages}
//             onPrev={handlePrevPage}
//             onNext={handleNextPage}
//             setCurrentPage={setCurrentPage}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ScanJobsReport;
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Pagination from "./Common/Pagination";
import getLogoBase64 from "../utils/getLogoBase64";

/* -------- Helpers -------- */
const parseToDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};
const ymdToLocalDate = (ymd, endOfDay = false) => {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
};
const textIncludes = (hay, needle) =>
  !needle
    ? true
    : String(hay ?? "")
        .toLowerCase()
        .includes(String(needle).toLowerCase());

/* -------- Component -------- */
const ScanJobsReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Unified modal
  const [showControlModal, setShowControlModal] = useState(false);

  const defaultColumns = [
    { label: "Type", key: "type", visible: true },
    { label: "Start", key: "start", visible: true },
    { label: "End", key: "end", visible: true },
    { label: "IP", key: "ip", visible: true },
    { label: "Protocol", key: "protocol", visible: true },
    { label: "Port", key: "port", visible: true },
    { label: "Banner", key: "banner", visible: true },
  ];
  const [columnsConfig, setColumnsConfig] = useState(defaultColumns);

  const toggleColumnVisibility = (key) => {
    setColumnsConfig((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  // Filters: start/end use yyyy-mm-dd strings (for UI); others are text
  const [filters, setFilters] = useState({
    type: "",
    start: "",
    end: "",
    ip: "",
    protocol: "",
    port: "",
    banner: "",
  });

  // Apply date filter ONLY when a full date is selected
  const [dateFilters, setDateFilters] = useState({
    start: null, // Date | null
    end: null, // Date | null
  });

  // Range controls (server-side filtering by start first, fallback to end)
  const [range, setRange] = useState({ from: "", to: "" }); // yyyy-mm-dd
  const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });
  const [rangeVersion, setRangeVersion] = useState(0); // force refresh even if same dates applied

  /* -------- Flatten API data into table rows -------- */
  const flattenScanData = (data) => {
    const result = [];
    if (!Array.isArray(data)) return [];
    data.forEach((entry) => {
      const { type, start, end, result: results } = entry || {};
      const s = start ?? "-";
      const e = end ?? "-";

      if (Array.isArray(results)) {
        results.forEach((device) => {
          const { ip, services = [] } = device || {};
          if (Array.isArray(services) && services.length > 0) {
            services.forEach((srv) => {
              result.push({
                type: type || "-",
                start: s,
                end: e,
                ip: ip || "-",
                protocol: srv?.protocol || "-",
                port: srv?.port ?? "-",
                banner: srv?.banner || "-",
              });
            });
          } else {
            result.push({
              type: type || "-",
              start: s,
              end: e,
              ip: ip || "-",
              protocol: "-",
              port: "-",
              banner: "-",
            });
          }
        });
      }
    });
    return result;
  };

  /* -------- Fetch (range-aware) -------- */
  const fetchReport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      let list = [];
      let usedFromDbFallback = false;

      if (rangeApplied.from || rangeApplied.to) {
        const qs = new URLSearchParams();
        if (rangeApplied.from) qs.set("from", rangeApplied.from);
        if (rangeApplied.to) qs.set("to", rangeApplied.to);

        // Try by=start first, then by=end
        let resp = await axios.get(
          `/api/scanjobs/range?${qs.toString()}&by=start`,
          {
            headers: { "x-auth-token": token },
          }
        );
        list = Array.isArray(resp.data) ? resp.data : [];

        if (list.length === 0) {
          try {
            const resp2 = await axios.get(
              `/api/scanjobs/range?${qs.toString()}&by=end`,
              { headers: { "x-auth-token": token } }
            );
            list = Array.isArray(resp2.data) ? resp2.data : [];
          } catch {
            // ignore; will fallback next
          }
        }

        // Fallback to /fromdb + client-side range if needed
        if (list.length === 0) {
          usedFromDbFallback = true;
          const rAll = await axios.get(`/api/scanjobs/fromdb`, {
            headers: { "x-auth-token": token },
          });
          list = Array.isArray(rAll.data) ? rAll.data : [];
        }
      } else {
        const res = await axios.get("/api/scanjobs/fromdb", {
          headers: { "x-auth-token": token },
        });
        list = Array.isArray(res.data) ? res.data : [];
      }

      let flattened = flattenScanData(list);

      // If we had to fallback, apply range on client using 'start'
      if (usedFromDbFallback && (rangeApplied.from || rangeApplied.to)) {
        const fromDate = ymdToLocalDate(rangeApplied.from, false);
        const toDate = ymdToLocalDate(rangeApplied.to, true);
        flattened = flattened.filter((row) => {
          const d = parseToDate(row.start);
          if (!d) return false;
          if (fromDate && d < fromDate) return false;
          if (toDate && d > toDate) return false;
          return true;
        });
      }

      setReportData(flattened);
      setTotalPages(Math.ceil(flattened.length / itemsPerPage));
      setError(null);
    } catch (err) {
      console.error("Error fetching ScanJobs:", err);
      setError("Failed to fetch ScanJobs data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerPage, rangeApplied.from, rangeApplied.to, rangeVersion]);

  /* -------- Handlers -------- */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleDateFilterChange = (e) => {
    const { name, value, valueAsDate } = e.target; // name is 'start' or 'end'
    setFilters((prev) => ({ ...prev, [name]: value }));
    setDateFilters((prev) => ({
      ...prev,
      [name]: valueAsDate instanceof Date ? valueAsDate : null,
    }));
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));

  const applyRange = () => {
    let { from, to } = range;
    if (from && to && new Date(from) > new Date(to)) {
      [from, to] = [to, from];
      setRange({ from, to });
    }
    setRangeApplied({ from: from || "", to: to || "" });
    setRangeVersion((v) => v + 1); // force refresh even if dates unchanged
    setCurrentPage(1);
  };

  const resetRange = () => {
    setRange({ from: "", to: "" });
    setRangeApplied({ from: "", to: "" });
    setRangeVersion((v) => v + 1);
    setCurrentPage(1);
  };

  /* -------- Client-side filters -------- */
  const filteredData = useMemo(() => {
    return reportData.filter((item) => {
      if (!textIncludes(item.type, filters.type)) return false;
      if (!textIncludes(item.ip, filters.ip)) return false;
      if (!textIncludes(item.protocol, filters.protocol)) return false;
      if (!textIncludes(item.port, filters.port)) return false;
      if (!textIncludes(item.banner, filters.banner)) return false;

      // Date columns: only apply when a full date is selected
      if (dateFilters.start) {
        const d = parseToDate(item.start);
        const s = ymdToLocalDate(filters.start, false);
        const e = ymdToLocalDate(filters.start, true);
        if (!d || d < s || d > e) return false;
      }
      if (dateFilters.end) {
        const d = parseToDate(item.end);
        const s = ymdToLocalDate(filters.end, false);
        const e = ymdToLocalDate(filters.end, true);
        if (!d || d < s || d > e) return false;
      }
      return true;
    });
  }, [reportData, filters, dateFilters]);

  /* -------- Pagination slice -------- */
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = useMemo(
    () => filteredData.slice(startIndex, endIndex),
    [filteredData, startIndex, endIndex]
  );

  useEffect(() => {
    setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
  }, [filteredData.length, itemsPerPage]);

  /* -------- Exporters (use filteredData for WYSIWYG) -------- */
  const exportPDF = async () => {
    const doc = new jsPDF("landscape");
    const currentDate = new Date().toLocaleString();

    let res = await fetch("/api/username", {
      headers: { "x-auth-token": localStorage.getItem("token") },
    });
    res = await res.json();

    const logo = await getLogoBase64();
    if (logo) {
      try {
        const pageWidth = doc.internal.pageSize.getWidth();
        const finalWidth = 35;
        const finalHeight = (logo.height / logo.width) * finalWidth;
        const x = pageWidth - finalWidth - 10;
        const y = 12;
        doc.addImage(logo.base64, "PNG", x, y, finalWidth, finalHeight);
      } catch (err) {
        console.error("Failed to add logo to PDF:", err);
      }
    }
    doc.text(`Username: ${res.username}`, 15, 10);
    doc.text("Report: Scan Jobs Report", 15, 20);
    doc.text(`Date: ${currentDate}`, 15, 30);

    const visibleCols = columnsConfig.filter((col) => col.visible);
    const columns = visibleCols.map((col) => col.label);
    const rows = filteredData.map((item) =>
      visibleCols.map((col) => {
        const val = item[col.key];
        if (col.key === "start" || col.key === "end") {
          const d = parseToDate(val);
          return d ? d.toLocaleString() : "-";
        }
        return val ?? "-";
      })
    );

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
    });

    doc.save("scanjobs.pdf");
  };

  const exportExcel = async () => {
    const currentDate = new Date().toLocaleString();

    let res = await fetch("/api/username", {
      headers: { "x-auth-token": localStorage.getItem("token") },
    });
    res = await res.json();

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Username: ${res.username}`],
      ["Report: Scan Jobs Report"],
      [`Date: ${currentDate}`],
      [""],
    ]);

    const visibleCols = columnsConfig.filter((col) => col.visible);
    const headers = visibleCols.map((col) => col.label);
    const rows = filteredData.map((item) =>
      visibleCols.map((col) => {
        const val = item[col.key];
        if (col.key === "start" || col.key === "end") {
          const d = parseToDate(val);
          return d ? d.toLocaleString() : "-";
        }
        return val ?? "-";
      })
    );

    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scan Jobs");
    XLSX.writeFile(
      workbook,
      `scanjobs-${res.username}-${new Date().toISOString()}.xlsx`
    );
  };

  if (loading)
    return (
      <div className="loader-container">
        <img src="./assets/img/1487.gif" alt="Loading..." />
      </div>
    );

  if (error) return <p>{error}</p>;

  const visibleColumnCount = columnsConfig.filter((c) => c.visible).length;

  return (
    <div className="content-wrapper">
      <div className="flex-grow-1 custom-w">
        <div className="card">
          <div className="d-flex mb-2 px-4 pt-3 justify-content-between align-items-center">
            <h5 className="fw-bold py-2 m-0">Scan Jobs Report</h5>
            <button
              className="btn btn-secondary"
              onClick={() => setShowControlModal(true)}
            >
              Settings ⚙️
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  {columnsConfig.map(
                    (col) =>
                      col.visible && (
                        <th key={col.key} className="fw-bold fs-custom">
                          {col.label}
                        </th>
                      )
                  )}
                </tr>
              </thead>
              <tbody>
                {/* Filter row */}
                <tr>
                  {columnsConfig.map(
                    (col) =>
                      col.visible && (
                        <td key={`filter-${col.key}`}>
                          {["start", "end"].includes(col.key) ? (
                            <input
                              type="date"
                              className="form-control"
                              name={col.key}
                              value={filters[col.key]}
                              onChange={handleDateFilterChange}
                            />
                          ) : (
                            <input
                              type="text"
                              className="form-control"
                              name={col.key}
                              value={filters[col.key]}
                              placeholder={`Search ${col.label}`}
                              onChange={handleFilterChange}
                            />
                          )}
                        </td>
                      )
                  )}
                </tr>

                {currentData.map((row, index) => (
                  <tr key={index}>
                    {columnsConfig.map(
                      (col) =>
                        col.visible && (
                          <td key={col.key} className="fs-text-custom">
                            {["start", "end"].includes(col.key)
                              ? (() => {
                                  const d = parseToDate(row[col.key]);
                                  return d ? d.toLocaleString() : "-";
                                })()
                              : row[col.key] ?? "-"}
                          </td>
                        )
                    )}
                  </tr>
                ))}

                {currentData.length === 0 && (
                  <tr>
                    <td colSpan={visibleColumnCount} className="text-center">
                      No data found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPrev={handlePrevPage}
            onNext={handleNextPage}
            setCurrentPage={setCurrentPage}
          />
        </div>
      </div>

      {/* ===== Unified Settings Modal ===== */}
      {showControlModal && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{ display: "block" }}
            onClick={() => setShowControlModal(false)}
          />
          <div
            className="modal fade show"
            style={{ display: "block" }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Scan Jobs – Settings</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowControlModal(false)}
                  />
                </div>

                <div className="modal-body">
                  {/* Range */}
                  <div className="mb-4">
                    <h6 className="mb-2">Date Range</h6>
                    <div className="d-flex align-items-end gap-2 flex-wrap">
                      <div className="d-flex flex-column">
                        <label className="small mb-1">From</label>
                        <input
                          type="date"
                          value={range.from}
                          onChange={(e) =>
                            setRange((r) => ({ ...r, from: e.target.value }))
                          }
                          className="form-control"
                          style={{ minWidth: 180 }}
                        />
                      </div>
                      <div className="d-flex flex-column">
                        <label className="small mb-1">To</label>
                        <input
                          type="date"
                          value={range.to}
                          onChange={(e) =>
                            setRange((r) => ({ ...r, to: e.target.value }))
                          }
                          className="form-control"
                          style={{ minWidth: 180 }}
                        />
                      </div>
                      <button
                        className="btn btn-outline-primary"
                        onClick={applyRange}
                      >
                        Apply
                      </button>
                      <button
                        className="btn btn-outline-secondary"
                        onClick={resetRange}
                        disabled={!rangeApplied.from && !rangeApplied.to}
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Columns */}
                  <div className="mb-4">
                    <h6 className="mb-2">Visible Columns</h6>
                    <div className="row">
                      {columnsConfig.map((col) => (
                        <div className="col-6 col-md-4 mb-2" key={col.key}>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`modal-check-${col.key}`}
                              checked={col.visible}
                              onChange={() => toggleColumnVisibility(col.key)}
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`modal-check-${col.key}`}
                            >
                              {col.label}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Export */}
                  <div className="mb-4">
                    <h6 className="mb-2">Export</h6>
                    <div className="d-flex gap-2">
                      <button className="btn btn-primary" onClick={exportExcel}>
                        Export Excel
                      </button>
                      <button className="btn btn-primary" onClick={exportPDF}>
                        Export PDF
                      </button>
                    </div>
                  </div>

                  {/* Page size */}
                  <div>
                    <h6 className="mb-2">Page Size</h6>
                    <div className="d-flex align-items-center gap-2">
                      <label className="mb-0">Show:</label>
                      <select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="form-select"
                        style={{ width: 120 }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowControlModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ScanJobsReport;
