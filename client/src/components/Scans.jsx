// import React, { useEffect, useMemo, useState } from "react";
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

// const arrayIncludes = (arr, needle) => {
//   if (!needle) return true;
//   if (!Array.isArray(arr)) return false;
//   const n = String(needle).toLowerCase();
//   return arr.some((el) => String(el).toLowerCase().includes(n));
// };

// const Scans = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [totalPages, setTotalPages] = useState(0);
//   const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

//   const defaultColumns = [
//     { label: "Name", key: "name", visible: true },
//     { label: "Type", key: "type", visible: true },
//     { label: "Active", key: "active", visible: true },
//     { label: "Periodicity", key: "periodicity", visible: true },
//     { label: "Description", key: "description", visible: true },
//     { label: "Emails", key: "emails", visible: true },
//     { label: "DN List", key: "dn_list", visible: true },
//     { label: "Start", key: "start", visible: true },
//     { label: "End", key: "end", visible: true },
//   ];
//   const [columnsConfig, setColumnsConfig] = useState(defaultColumns);

//   // Text inputs for filters
//   const [filters, setFilters] = useState({
//     name: "",
//     type: "",
//     active: "",
//     periodicity: "",
//     description: "",
//     emails: "",
//     dn_list: "",
//     start: "", // yyyy-mm-dd string for UI
//     end: "", // yyyy-mm-dd string for UI
//   });

//   // Only apply date filters when full date is selected (valueAsDate valid)
//   const [dateFilters, setDateFilters] = useState({
//     start: null, // Date | null
//     end: null, // Date | null
//   });

//   // Global range (server-side by start time)
//   const [range, setRange] = useState({ from: "", to: "" }); // yyyy-mm-dd
//   const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });

//   // force refresh even if same dates are applied
//   const [rangeVersion, setRangeVersion] = useState(0);

//   const toggleColumnVisibility = (key) => {
//     setColumnsConfig((prev) =>
//       prev.map((col) =>
//         col.key === key ? { ...col, visible: !col.visible } : col
//       )
//     );
//   };

//   /* -------- Fetch (range-aware) -------- */
//   useEffect(() => {
//     const run = async () => {
//       setLoading(true);
//       try {
//         const token = localStorage.getItem("token");
//         let list = [];
//         let usedFromDbFallback = false;

//         if (rangeApplied.from || rangeApplied.to) {
//           const qs = new URLSearchParams();
//           if (rangeApplied.from) qs.set("from", rangeApplied.from);
//           if (rangeApplied.to) qs.set("to", rangeApplied.to);

//           // 1) Try by=start first
//           let response = await fetch(
//             `/api/scans/range?${qs.toString()}&by=start`,
//             { headers: { "x-auth-token": token } }
//           );

//           if (!response.ok) {
//             // Fallback to /fromdb
//             usedFromDbFallback = true;
//             response = await fetch(`/api/scans/fromdb`, {
//               headers: { "x-auth-token": token },
//             });
//           }

//           if (!response.ok)
//             throw new Error(`HTTP error! status: ${response.status}`);

//           list = await response.json();

//           // If API returned 0 rows (legacy rows lack 'start'), retry by=activity
//           if (!usedFromDbFallback && Array.isArray(list) && list.length === 0) {
//             const resp2 = await fetch(
//               `/api/scans/range?${qs.toString()}&by=activity`,
//               { headers: { "x-auth-token": token } }
//             );
//             if (resp2.ok) {
//               const alt = await resp2.json();
//               if (Array.isArray(alt)) list = alt;
//             }
//           }

//           // If we used /fromdb, apply range on client using 'start' as the key
//           if (usedFromDbFallback) {
//             const fromDate = rangeApplied.from
//               ? new Date(rangeApplied.from + "T00:00:00")
//               : null;
//             const toDate = rangeApplied.to
//               ? new Date(rangeApplied.to + "T23:59:59")
//               : null;
//             list = list.filter((row) => {
//               const d = row.start ? new Date(row.start) : null;
//               if (!d) return false;
//               if (fromDate && d < fromDate) return false;
//               if (toDate && d > toDate) return false;
//               return true;
//             });
//           }
//         } else {
//           // No range -> fetch all
//           const response = await fetch(`/api/scans/fromdb`, {
//             headers: { "x-auth-token": token },
//           });
//           if (!response.ok)
//             throw new Error(`HTTP error! status: ${response.status}`);
//           list = await response.json();
//         }

//         setData(list);
//         setTotalPages(Math.ceil(list.length / itemsPerPage));
//         setError(null);
//       } catch (err) {
//         setError(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     run();
//     // rangeVersion forces refresh even if dates didn't change
//   }, [itemsPerPage, rangeApplied.from, rangeApplied.to, rangeVersion]);

//   /* -------- Handlers -------- */
//   const handleItemsPerPageChange = (e) => {
//     setItemsPerPage(Number(e.target.value));
//     setCurrentPage(1);
//   };

//   const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
//   const handleNextPage = () =>
//     setCurrentPage((p) => Math.min(p + 1, totalPages));

//   const handleTextFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//     setCurrentPage(1);
//   };

//   // Start/End date inputs in the table row
//   const handleDateFilterChange = (e) => {
//     const { name, value, valueAsDate } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value })); // control the input
//     setDateFilters((prev) => ({
//       ...prev,
//       [name]: valueAsDate instanceof Date ? valueAsDate : null,
//     }));
//     setCurrentPage(1);
//   };

//   // Apply range (refresh even if same dates)
//   const applyRange = () => {
//     let { from, to } = range;
//     // auto-swap if user picked reversed dates
//     if (from && to && new Date(from) > new Date(to)) {
//       [from, to] = [to, from];
//       setRange({ from, to });
//     }
//     setRangeApplied({ from: from || "", to: to || "" });
//     setRangeVersion((v) => v + 1);
//     setCurrentPage(1);
//   };

//   // Reset range + clear column date filters and refresh
//   const resetRangeAndDates = () => {
//     setRange({ from: "", to: "" });
//     setRangeApplied({ from: "", to: "" });
//     setFilters((prev) => ({ ...prev, start: "", end: "" }));
//     setDateFilters({ start: null, end: null });
//     setRangeVersion((v) => v + 1);
//     setCurrentPage(1);
//   };

//   /* -------- Client-side column filters -------- */
//   const filteredData = useMemo(() => {
//     return data.filter((item) => {
//       if (!textIncludes(item.name, filters.name)) return false;
//       if (!textIncludes(item.type, filters.type)) return false;
//       if (!textIncludes(item.active, filters.active)) return false;
//       if (!textIncludes(item.periodicity, filters.periodicity)) return false;
//       if (!textIncludes(item.description, filters.description)) return false;
//       if (!arrayIncludes(item.emails, filters.emails)) return false;
//       if (!arrayIncludes(item.dn_list, filters.dn_list)) return false;

//       // Only apply when full date selected (valueAsDate valid)
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
//   }, [data, filters, dateFilters]);

//   // pagination slice
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
//     const dateStr = new Date().toLocaleString();

//     const res = await fetch("/api/username", {
//       headers: { "x-auth-token": localStorage.getItem("token") },
//     });
//     const { username } = await res.json();

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

//     doc.text(`Username: ${username}`, 15, 10);
//     doc.text("Report: Account and Device Discovery Report", 15, 20);
//     doc.text(`Date: ${dateStr}`, 15, 30);

//     const vis = columnsConfig.filter((c) => c.visible);
//     const headers = vis.map((c) => c.label);
//     const rows = filteredData.map((item) =>
//       vis.map((col) => {
//         const val = item[col.key];
//         if (col.key === "start" || col.key === "end") {
//           const d = parseToDate(val);
//           return d ? d.toLocaleString() : "-";
//         }
//         if (Array.isArray(val)) return val.join(", ");
//         return val ?? "-";
//       })
//     );

//     doc.autoTable({
//       head: [headers],
//       body: rows,
//       startY: 40,
//       theme: "grid",
//       headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
//     });

//     doc.save("scans-report.pdf");
//   };

//   const exportExcel = async () => {
//     const dateStr = new Date().toLocaleString();
//     const res = await fetch("/api/username", {
//       headers: { "x-auth-token": localStorage.getItem("token") },
//     });
//     const { username } = await res.json();

//     const workbook = XLSX.utils.book_new();
//     const worksheet = XLSX.utils.aoa_to_sheet([]);

//     XLSX.utils.sheet_add_aoa(worksheet, [
//       [`Username: ${username}`],
//       ["Report: Account and Device Discovery Report"],
//       [`Date: ${dateStr}`],
//       [""],
//     ]);

//     const vis = columnsConfig.filter((c) => c.visible);
//     const headers = vis.map((c) => c.label);
//     const rows = filteredData.map((item) =>
//       vis.map((col) => {
//         const val = item[col.key];
//         if (col.key === "start" || col.key === "end") {
//           const d = parseToDate(val);
//           return d ? d.toLocaleString() : "-";
//         }
//         if (Array.isArray(val)) return val.join(", ");
//         return val ?? "-";
//       })
//     );

//     XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
//     XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Scans");
//     XLSX.writeFile(workbook, `scans-${username}-${dateStr}.xlsx`);
//   };

//   if (loading) {
//     return (
//       <div className="loader-container">
//         <img src="./assets/img/1487.gif" alt="Loading..." />
//       </div>
//     );
//   }
//   if (error) return <p>{error.message}</p>;

//   return (
//     <div className="content-wrapper">
//       <div className="flex-grow-1 custom-w">
//         <div className="card">
//           <div className="d-flex mb-2 px-4 pt-3 justify-content-between">
//             <h5 className="fw-bold py-2">
//               Account and Device Discovery Report
//             </h5>

//             <div className="d-flex align-items-center gap-2 flex-wrap">
//               {/* Date Range Bar (server-side by start) */}
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
//                     style={{ minWidth: 50 }}
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
//                     style={{ minWidth: 50 }}
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
//                     onClick={resetRangeAndDates}
//                     disabled={
//                       !rangeApplied.from &&
//                       !rangeApplied.to &&
//                       !filters.start &&
//                       !filters.end
//                     }
//                   >
//                     Reset
//                   </button>
//                 </div>
//               </div>

//               {/* Settings */}
//               <div className="position-relative">
//                 <button
//                   className="btn btn-secondary p-2"
//                   onClick={() => setShowSettingsDropdown((prev) => !prev)}
//                 >
//                   Settings
//                 </button>
//                 {showSettingsDropdown && (
//                   <div
//                     className="position-absolute bg-white border p-3 shadow"
//                     style={{ zIndex: 10, top: "45px", left: 0, width: "220px" }}
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

//               <button className="btn btn-primary  p-2" onClick={exportExcel}>
//                 Excel
//               </button>
//               <button className="btn btn-primary  p-2" onClick={exportPDF}>
//                 PDF
//               </button>

//               <div className="d-flex align-items-center">
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
//                 {/* Filter Row */}
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
//                               onChange={handleTextFilterChange}
//                             />
//                           )}
//                         </td>
//                       )
//                   )}
//                 </tr>

//                 {/* Data Rows */}
//                 {currentData.length === 0 ? (
//                   <tr>
//                     <td
//                       colSpan={columnsConfig.filter((c) => c.visible).length}
//                       className="text-center"
//                     >
//                       No data found.
//                     </td>
//                   </tr>
//                 ) : (
//                   currentData.map((item, index) => (
//                     <tr key={index}>
//                       {columnsConfig.map(
//                         (col) =>
//                           col.visible && (
//                             <td key={col.key} className="fs-text-custom">
//                               {["start", "end"].includes(col.key)
//                                 ? (() => {
//                                     const d = parseToDate(item[col.key]);
//                                     return d ? d.toLocaleString() : "-";
//                                   })()
//                                 : Array.isArray(item[col.key])
//                                 ? item[col.key].join(", ")
//                                 : item[col.key] ?? "-"}
//                             </td>
//                           )
//                       )}
//                     </tr>
//                   ))
//                 )}
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
//       <div className="content-backdrop fade" />
//     </div>
//   );
// };

// export default Scans;
import React, { useEffect, useMemo, useState } from "react";
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

const arrayIncludes = (arr, needle) => {
  if (!needle) return true;
  if (!Array.isArray(arr)) return false;
  const n = String(needle).toLowerCase();
  return arr.some((el) => String(el).toLowerCase().includes(n));
};

const Scans = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Unified modal
  const [showControlModal, setShowControlModal] = useState(false);

  const defaultColumns = [
    { label: "Name", key: "name", visible: true },
    { label: "Type", key: "type", visible: true },
    { label: "Active", key: "active", visible: true },
    { label: "Periodicity", key: "periodicity", visible: true },
    { label: "Description", key: "description", visible: true },
    { label: "Emails", key: "emails", visible: true },
    { label: "DN List", key: "dn_list", visible: true },
    { label: "Start", key: "start", visible: true },
    { label: "End", key: "end", visible: true },
  ];
  const [columnsConfig, setColumnsConfig] = useState(defaultColumns);

  // Text inputs for filters
  const [filters, setFilters] = useState({
    name: "",
    type: "",
    active: "",
    periodicity: "",
    description: "",
    emails: "",
    dn_list: "",
    start: "", // yyyy-mm-dd string for UI
    end: "", // yyyy-mm-dd string for UI
  });

  // Only apply date filters when full date is selected (valueAsDate valid)
  const [dateFilters, setDateFilters] = useState({
    start: null, // Date | null
    end: null, // Date | null
  });

  // Global range (server-side by start time)
  const [range, setRange] = useState({ from: "", to: "" }); // yyyy-mm-dd
  const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });

  // force refresh even if same dates are applied
  const [rangeVersion, setRangeVersion] = useState(0);

  const toggleColumnVisibility = (key) => {
    setColumnsConfig((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  /* -------- Fetch (range-aware) -------- */
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        let list = [];
        let usedFromDbFallback = false;

        if (rangeApplied.from || rangeApplied.to) {
          const qs = new URLSearchParams();
          if (rangeApplied.from) qs.set("from", rangeApplied.from);
          if (rangeApplied.to) qs.set("to", rangeApplied.to);

          // 1) Try by=start first
          let response = await fetch(
            `/api/scans/range?${qs.toString()}&by=start`,
            { headers: { "x-auth-token": token } }
          );

          if (!response.ok) {
            // Fallback to /fromdb
            usedFromDbFallback = true;
            response = await fetch(`/api/scans/fromdb`, {
              headers: { "x-auth-token": token },
            });
          }

          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);

          list = await response.json();

          // If API returned 0 rows (legacy rows lack 'start'), retry by=activity
          if (!usedFromDbFallback && Array.isArray(list) && list.length === 0) {
            const resp2 = await fetch(
              `/api/scans/range?${qs.toString()}&by=activity`,
              { headers: { "x-auth-token": token } }
            );
            if (resp2.ok) {
              const alt = await resp2.json();
              if (Array.isArray(alt)) list = alt;
            }
          }

          // If we used /fromdb, apply range on client using 'start' as the key
          if (usedFromDbFallback) {
            const fromDate = rangeApplied.from
              ? new Date(rangeApplied.from + "T00:00:00")
              : null;
            const toDate = rangeApplied.to
              ? new Date(rangeApplied.to + "T23:59:59")
              : null;
            list = list.filter((row) => {
              const d = row.start ? new Date(row.start) : null;
              if (!d) return false;
              if (fromDate && d < fromDate) return false;
              if (toDate && d > toDate) return false;
              return true;
            });
          }
        } else {
          // No range -> fetch all
          const response = await fetch(`/api/scans/fromdb`, {
            headers: { "x-auth-token": token },
          });
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          list = await response.json();
        }

        setData(list);
        setTotalPages(Math.ceil(list.length / itemsPerPage));
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    run();
    // rangeVersion forces refresh even if dates didn't change
  }, [itemsPerPage, rangeApplied.from, rangeApplied.to, rangeVersion]);

  /* -------- Handlers -------- */
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));

  const handleTextFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  // Start/End date inputs in the table row
  const handleDateFilterChange = (e) => {
    const { name, value, valueAsDate } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value })); // control the input
    setDateFilters((prev) => ({
      ...prev,
      [name]: valueAsDate instanceof Date ? valueAsDate : null,
    }));
    setCurrentPage(1);
  };

  // Apply range (refresh even if same dates)
  const applyRange = () => {
    let { from, to } = range;
    // auto-swap if user picked reversed dates
    if (from && to && new Date(from) > new Date(to)) {
      [from, to] = [to, from];
      setRange({ from, to });
    }
    setRangeApplied({ from: from || "", to: to || "" });
    setRangeVersion((v) => v + 1);
    setCurrentPage(1);
  };

  // Reset range + clear column date filters and refresh
  const resetRangeAndDates = () => {
    setRange({ from: "", to: "" });
    setRangeApplied({ from: "", to: "" });
    setFilters((prev) => ({ ...prev, start: "", end: "" }));
    setDateFilters({ start: null, end: null });
    setRangeVersion((v) => v + 1);
    setCurrentPage(1);
  };

  /* -------- Client-side column filters -------- */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!textIncludes(item.name, filters.name)) return false;
      if (!textIncludes(item.type, filters.type)) return false;
      if (!textIncludes(item.active, filters.active)) return false;
      if (!textIncludes(item.periodicity, filters.periodicity)) return false;
      if (!textIncludes(item.description, filters.description)) return false;
      if (!arrayIncludes(item.emails, filters.emails)) return false;
      if (!arrayIncludes(item.dn_list, filters.dn_list)) return false;

      // Only apply when full date selected (valueAsDate valid)
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
  }, [data, filters, dateFilters]);

  // pagination slice
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
    const dateStr = new Date().toLocaleString();

    const res = await fetch("/api/username", {
      headers: { "x-auth-token": localStorage.getItem("token") },
    });
    const { username } = await res.json();

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

    doc.text(`Username: ${username}`, 15, 10);
    doc.text("Report: Account and Device Discovery Report", 15, 20);
    doc.text(`Date: ${dateStr}`, 15, 30);

    const vis = columnsConfig.filter((c) => c.visible);
    const headers = vis.map((c) => c.label);
    const rows = filteredData.map((item) =>
      vis.map((col) => {
        const val = item[col.key];
        if (col.key === "start" || col.key === "end") {
          const d = parseToDate(val);
          return d ? d.toLocaleString() : "-";
        }
        if (Array.isArray(val)) return val.join(", ");
        return val ?? "-";
      })
    );

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
    });

    doc.save("scans-report.pdf");
  };

  const exportExcel = () => {
    if (!data || data.length === 0) {
      alert("No data available for export");
      return;
    }

    // ✅ Define headers properly (previously `theaders` was undefined)
    const headers = [
      "Name",
      "Type",
      "Active",
      "Periodicity",
      "Description",
      "Emails",
      "DN List",
      "Start",
      "End",
    ];

    // ✅ Map rows correctly
    const rows = data.map((row) => [
      row.name || "",
      row.type || "",
      row.active || "",
      row.periodicity || "",
      row.description || "",
      row.emails || "",
      row.dn_list || "",
      row.start ? new Date(row.start).toLocaleString() : "",
      row.end ? new Date(row.end).toLocaleString() : "",
    ]);

    // ✅ Build worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Scans Report");

    // ✅ Export to file
    XLSX.writeFile(workbook, "Scans_Report.xlsx");
  };

  if (loading) {
    return (
      <div className="loader-container">
        <img src="./assets/img/1487.gif" alt="Loading..." />
      </div>
    );
  }
  if (error) return <p>{error.message}</p>;

  const visibleColumnCount = columnsConfig.filter((c) => c.visible).length;

  return (
    <div className="content-wrapper">
      <div className="flex-grow-1 custom-w">
        <div className="card">
          <div className="d-flex mb-2 px-4 pt-3 justify-content-between align-items-center">
            <h5 className="fw-bold py-2 m-0">
              Account and Device Discovery Report
            </h5>
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
                {/* Filter Row */}
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
                              onChange={handleTextFilterChange}
                            />
                          )}
                        </td>
                      )
                  )}
                </tr>

                {/* Data Rows */}
                {currentData.map((item, index) => (
                  <tr key={index}>
                    {columnsConfig.map(
                      (col) =>
                        col.visible && (
                          <td key={col.key} className="fs-text-custom">
                            {["start", "end"].includes(col.key)
                              ? (() => {
                                  const d = parseToDate(item[col.key]);
                                  return d ? d.toLocaleString() : "-";
                                })()
                              : Array.isArray(item[col.key])
                              ? item[col.key].join(", ")
                              : item[col.key] ?? "-"}
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
                  <h5 className="modal-title">Scans – Settings</h5>
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
                        onClick={resetRangeAndDates}
                        disabled={
                          !rangeApplied.from &&
                          !rangeApplied.to &&
                          !filters.start &&
                          !filters.end
                        }
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

      <div className="content-backdrop fade" />
    </div>
  );
};

export default Scans;
