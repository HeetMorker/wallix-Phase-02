// import React, { useEffect, useMemo, useState } from "react";
// import { jsPDF } from "jspdf";
// import "jspdf-autotable";
// import * as XLSX from "xlsx";
// import Pagination from "./Common/Pagination";
// import getLogoBase64 from "../utils/getLogoBase64";

// /** ---------- Helpers ---------- **/

// function parseToDate(value) {
//   if (!value) return null;
//   const d = new Date(value);
//   return isNaN(d.getTime()) ? null : d;
// }

// // Local start/end of day
// function ymdToLocalDate(ymd, endOfDay = false) {
//   if (!ymd) return null;
//   const [y, m, d] = ymd.split("-").map(Number);
//   if (!y || !m || !d) return null;
//   return endOfDay
//     ? new Date(y, m - 1, d, 23, 59, 59, 999)
//     : new Date(y, m - 1, d, 0, 0, 0, 0);
// }

// function textIncludes(hay, needle) {
//   if (!needle) return true;
//   return String(hay ?? "")
//     .toLowerCase()
//     .includes(String(needle).toLowerCase());
// }

// function dateInRange(dateValue, fromDate, toDate) {
//   const d = parseToDate(dateValue);
//   if (!d) return false;
//   if (fromDate && d < fromDate) return false;
//   if (toDate && d > toDate) return false;
//   return true;
// }

// const Authentications = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // pagination
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [totalPages, setTotalPages] = useState(0);

//   const defaultColumns = [
//     { label: "Bastion Name", key: "bastionName", visible: true },
//     { label: "Username", key: "username", visible: true },
//     { label: "Login Time", key: "login", visible: true },
//     { label: "Logout Time", key: "logout", visible: true },
//     { label: "Result", key: "result", visible: true },
//     { label: "Source IP", key: "source_ip", visible: true },
//   ];
//   const [columnsConfig, setColumnsConfig] = useState(defaultColumns);
//   const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

//   const toggleColumnVisibility = (key) => {
//     setColumnsConfig((prev) =>
//       prev.map((col) =>
//         col.key === key ? { ...col, visible: !col.visible } : col
//       )
//     );
//   };

//   // Text filters + date inputs (string)
//   const [filters, setFilters] = useState({
//     bastionName: "",
//     username: "",
//     login: "", // yyyy-mm-dd (string for the input)
//     logout: "", // yyyy-mm-dd
//     result: "",
//     source_ip: "",
//   });

//   // Actual date filters used for filtering (Date objects or null)
//   const [dateFilters, setDateFilters] = useState({
//     login: null,
//     logout: null,
//   });

//   // Global date range (server-side by login)
//   const [range, setRange] = useState({ from: "", to: "" });
//   const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });

//   // Force refresh even when dates haven't changed
//   const [rangeVersion, setRangeVersion] = useState(0);

//   /** -------- Fetch data (range-aware) -------- */
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const token = localStorage.getItem("token");
//         let response;

//         if (rangeApplied.from || rangeApplied.to) {
//           const params = new URLSearchParams();
//           if (rangeApplied.from) params.set("from", rangeApplied.from);
//           if (rangeApplied.to) params.set("to", rangeApplied.to);
//           params.set("by", "login");

//           response = await fetch(
//             `/api/authentications/range?${params.toString()}`,
//             {
//               headers: { "x-auth-token": token },
//             }
//           );

//           if (!response.ok) {
//             response = await fetch(`/api/authentications/fromdb`, {
//               headers: { "x-auth-token": token },
//             });
//           }
//         } else {
//           response = await fetch(`/api/authentications/fromdb`, {
//             headers: { "x-auth-token": token },
//           });
//         }

//         if (!response.ok)
//           throw new Error(`HTTP error! status: ${response.status}`);

//         const result = await response.json();

//         // Fallback client-side range (only if /fromdb used)
//         let list = result;
//         if (
//           (rangeApplied.from || rangeApplied.to) &&
//           response.url.includes("/fromdb")
//         ) {
//           const fromDate = ymdToLocalDate(rangeApplied.from, false);
//           const toDate = ymdToLocalDate(rangeApplied.to, true);
//           list = result.filter((row) =>
//             dateInRange(row.login, fromDate, toDate)
//           );
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
//     fetchData();
//     // NOTE: rangeVersion forces refresh when Apply is clicked with same dates
//   }, [itemsPerPage, rangeApplied.from, rangeApplied.to, rangeVersion]);

//   /** -------- Handlers -------- */
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

//   // For the table's date columns, use valueAsDate (only valid when full date selected)
//   const handleDateFilterChange = (e) => {
//     const { name, value, valueAsDate } = e.target; // value is 'yyyy-mm-dd' or ''
//     setFilters((prev) => ({ ...prev, [name]: value })); // control the input
//     setDateFilters((prev) => ({
//       ...prev,
//       [name]: valueAsDate instanceof Date ? valueAsDate : null,
//     }));
//     setCurrentPage(1);
//   };

//   // Apply range (refresh even if values unchanged)
//   const applyRange = () => {
//     let { from, to } = range;
//     // auto-swap if needed
//     if (from && to && new Date(from) > new Date(to)) {
//       [from, to] = [to, from];
//       setRange({ from, to });
//     }
//     setRangeApplied({ from: from || "", to: to || "" });
//     setRangeVersion((v) => v + 1); // force refresh
//     setCurrentPage(1);
//   };

//   // Reset range + clear all date inputs (range and column date filters) and refresh
//   const resetRangeAndDates = () => {
//     setRange({ from: "", to: "" });
//     setRangeApplied({ from: "", to: "" });

//     // clear column date inputs + their Date objects
//     setFilters((prev) => ({ ...prev, login: "", logout: "" }));
//     setDateFilters({ login: null, logout: null });

//     setRangeVersion((v) => v + 1); // force refresh
//     setCurrentPage(1);
//   };

//   /** ---- Filtering logic (client-side) ---- */
//   const filteredData = useMemo(() => {
//     return data.filter((item) => {
//       // Text fields
//       if (!textIncludes(item.bastionName, filters.bastionName)) return false;
//       if (!textIncludes(item.username, filters.username)) return false;
//       if (!textIncludes(item.result ? "true" : "false", filters.result))
//         return false;
//       if (!textIncludes(item.source_ip, filters.source_ip)) return false;

//       // Date fields – apply ONLY when we have a valid Date object
//       if (dateFilters.login) {
//         const d = parseToDate(item.login);
//         const start = ymdToLocalDate(filters.login, false);
//         const end = ymdToLocalDate(filters.login, true);
//         if (!d || d < start || d > end) return false;
//       }
//       if (dateFilters.logout) {
//         const d = parseToDate(item.logout);
//         const start = ymdToLocalDate(filters.logout, false);
//         const end = ymdToLocalDate(filters.logout, true);
//         if (!d || d < start || d > end) return false;
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

//   /** ---------- Exporters ---------- */
//   const exportPDF = async () => {
//     const doc = new jsPDF("landscape");
//     const currentDate = new Date();
//     const dateStr = currentDate.toLocaleString();
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
//     doc.text("Report: Authentications Report", 15, 20);
//     doc.text(`Date: ${dateStr}`, 15, 30);

//     const visibleCols = columnsConfig.filter((c) => c.visible);
//     const columns = visibleCols.map((col) => col.label);
//     const rows = filteredData.map((item) =>
//       visibleCols.map((col) => {
//         if (["login", "logout"].includes(col.key)) {
//           const d = parseToDate(item[col.key]);
//           return d ? d.toLocaleString() : "-";
//         }
//         if (col.key === "result") return item.result ? "True" : "False";
//         return item[col.key] ?? "-";
//       })
//     );

//     doc.autoTable({
//       head: [columns],
//       body: rows,
//       startY: 40,
//       theme: "grid",
//       headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
//     });

//     doc.save("authentications.pdf");
//   };

//   const exportExcel = async () => {
//     const currentDate = new Date();
//     const dateStr = currentDate.toLocaleString();

//     let res = await fetch("/api/username", {
//       headers: { "x-auth-token": localStorage.getItem("token") },
//     });
//     res = await res.json();

//     const workbook = XLSX.utils.book_new();
//     const worksheet = XLSX.utils.aoa_to_sheet([]);

//     XLSX.utils.sheet_add_aoa(worksheet, [
//       [`Username: ${res.username}`],
//       ["Report: Authentications Report"],
//       [`Date: ${dateStr}`],
//       [""],
//     ]);

//     const visibleCols = columnsConfig.filter((c) => c.visible);
//     const headers = visibleCols.map((col) => col.label);
//     const rows = filteredData.map((item) =>
//       visibleCols.map((col) => {
//         if (["login", "logout"].includes(col.key)) {
//           const d = parseToDate(item[col.key]);
//           return d ? d.toLocaleString() : "-";
//         }
//         if (col.key === "result") return item.result ? "True" : "False";
//         return item[col.key] ?? "-";
//       })
//     );

//     XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
//     XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Authentications");
//     XLSX.writeFile(workbook, `authentications-${res.username}-${dateStr}.xlsx`);
//   };

//   if (loading)
//     return (
//       <div className="loader-container ">
//         <img src="./assets/img/1487.gif" alt="loading" />
//       </div>
//     );
//   if (error) return <p>Error: {error.message}</p>;

//   return (
//     <div className="content-wrapper">
//       <div className="flex-grow-1 custom-w">
//         <div className="card">
//           <div className="d-flex mb-2 px-4 pt-3 justify-content-between">
//             <h5 className="fw-bold py-2">Authentications Report</h5>

//             <div className="d-flex align-items-center gap-2 flex-wrap">
//               {/* Date Range Bar (server-side by login) */}
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
//                     onClick={resetRangeAndDates}
//                     disabled={
//                       !rangeApplied.from &&
//                       !rangeApplied.to &&
//                       !filters.login &&
//                       !filters.logout
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
//                     (col) => col.visible && <th key={col.key}>{col.label}</th>
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
//                           {["login", "logout"].includes(col.key) ? (
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
//                               value={filters[col.key] ?? ""}
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
//                       {columnsConfig.map((col) =>
//                         col.visible ? (
//                           <td key={col.key} className="fs-text-custom">
//                             {["login", "logout"].includes(col.key)
//                               ? (() => {
//                                   const d = parseToDate(item[col.key]);
//                                   return d ? d.toLocaleString() : "-";
//                                 })()
//                               : col.key === "result"
//                               ? item.result
//                                 ? "True"
//                                 : "False"
//                               : item[col.key] ?? "-"}
//                           </td>
//                         ) : null
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
//     </div>
//   );
// };

// export default Authentications;
// src/components/Authentications.jsx
import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Pagination from "./Common/Pagination";
import getLogoBase64 from "../utils/getLogoBase64";

/** ---------- Helpers ---------- **/

function parseToDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

// Local start/end of day
function ymdToLocalDate(ymd, endOfDay = false) {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0);
}

function textIncludes(hay, needle) {
  if (!needle) return true;
  return String(hay ?? "")
    .toLowerCase()
    .includes(String(needle).toLowerCase());
}

function dateInRange(dateValue, fromDate, toDate) {
  const d = parseToDate(dateValue);
  if (!d) return false;
  if (fromDate && d < fromDate) return false;
  if (toDate && d > toDate) return false;
  return true;
}

const Authentications = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const defaultColumns = [
    { label: "Bastion Name", key: "bastionName", visible: true },
    { label: "Username", key: "username", visible: true },
    { label: "Login Time", key: "login", visible: true },
    { label: "Logout Time", key: "logout", visible: true },
    { label: "Result", key: "result", visible: true },
    { label: "Source IP", key: "source_ip", visible: true },
  ];
  const [columnsConfig, setColumnsConfig] = useState(defaultColumns);

  // NEW: single modal toggle
  const [showModal, setShowModal] = useState(false);

  const toggleColumnVisibility = (key) => {
    setColumnsConfig((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  // Text filters + date inputs (string)
  const [filters, setFilters] = useState({
    bastionName: "",
    username: "",
    login: "", // yyyy-mm-dd (string for the input)
    logout: "", // yyyy-mm-dd
    result: "",
    source_ip: "",
  });

  // Actual date filters used for filtering (Date objects or null)
  const [dateFilters, setDateFilters] = useState({
    login: null,
    logout: null,
  });

  // Global date range (server-side by login)
  const [range, setRange] = useState({ from: "", to: "" });
  const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });

  // Force refresh even when dates haven't changed
  const [rangeVersion, setRangeVersion] = useState(0);

  /** -------- Fetch data (range-aware) -------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        let response;

        if (rangeApplied.from || rangeApplied.to) {
          const params = new URLSearchParams();
          if (rangeApplied.from) params.set("from", rangeApplied.from);
          if (rangeApplied.to) params.set("to", rangeApplied.to);
          params.set("by", "login");

          response = await fetch(
            `/api/authentications/range?${params.toString()}`,
            {
              headers: { "x-auth-token": token },
            }
          );

          if (!response.ok) {
            response = await fetch(`/api/authentications/fromdb`, {
              headers: { "x-auth-token": token },
            });
          }
        } else {
          response = await fetch(`/api/authentications/fromdb`, {
            headers: { "x-auth-token": token },
          });
        }

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();

        // Fallback client-side range (only if /fromdb used)
        let list = result;
        if (
          (rangeApplied.from || rangeApplied.to) &&
          response.url.includes("/fromdb")
        ) {
          const fromDate = ymdToLocalDate(rangeApplied.from, false);
          const toDate = ymdToLocalDate(rangeApplied.to, true);
          list = result.filter((row) =>
            dateInRange(row.login, fromDate, toDate)
          );
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
    fetchData();
    // NOTE: rangeVersion forces refresh when Apply is clicked with same dates
  }, [itemsPerPage, rangeApplied.from, rangeApplied.to, rangeVersion]);

  /** -------- Handlers -------- */
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

  // For the table's date columns, use valueAsDate (only valid when full date selected)
  const handleDateFilterChange = (e) => {
    const { name, value, valueAsDate } = e.target; // value is 'yyyy-mm-dd' or ''
    setFilters((prev) => ({ ...prev, [name]: value })); // control the input
    setDateFilters((prev) => ({
      ...prev,
      [name]: valueAsDate instanceof Date ? valueAsDate : null,
    }));
    setCurrentPage(1);
  };

  // Apply range (refresh even if values unchanged)
  const applyRange = () => {
    let { from, to } = range;
    // auto-swap if needed
    if (from && to && new Date(from) > new Date(to)) {
      [from, to] = [to, from];
      setRange({ from, to });
    }
    setRangeApplied({ from: from || "", to: to || "" });
    setRangeVersion((v) => v + 1); // force refresh
    setCurrentPage(1);
  };

  // Reset range + clear all date inputs (range and column date filters) and refresh
  const resetRangeAndDates = () => {
    setRange({ from: "", to: "" });
    setRangeApplied({ from: "", to: "" });

    // clear column date inputs + their Date objects
    setFilters((prev) => ({ ...prev, login: "", logout: "" }));
    setDateFilters({ login: null, logout: null });

    setRangeVersion((v) => v + 1); // force refresh
    setCurrentPage(1);
  };

  /** ---- Filtering logic (client-side) ---- */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Text fields
      if (!textIncludes(item.bastionName, filters.bastionName)) return false;
      if (!textIncludes(item.username, filters.username)) return false;
      if (!textIncludes(item.result ? "true" : "false", filters.result))
        return false;
      if (!textIncludes(item.source_ip, filters.source_ip)) return false;

      // Date fields – apply ONLY when we have a valid Date object
      if (dateFilters.login) {
        const d = parseToDate(item.login);
        const start = ymdToLocalDate(filters.login, false);
        const end = ymdToLocalDate(filters.login, true);
        if (!d || d < start || d > end) return false;
      }
      if (dateFilters.logout) {
        const d = parseToDate(item.logout);
        const start = ymdToLocalDate(filters.logout, false);
        const end = ymdToLocalDate(filters.logout, true);
        if (!d || d < start || d > end) return false;
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

  /** ---------- Exporters ---------- */
  const exportPDF = async () => {
    const doc = new jsPDF("landscape");
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleString();
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
    doc.text("Report: Authentications Report", 15, 20);
    doc.text(`Date: ${dateStr}`, 15, 30);

    const visibleCols = columnsConfig.filter((c) => c.visible);
    const columns = visibleCols.map((col) => col.label);
    const rows = filteredData.map((item) =>
      visibleCols.map((col) => {
        if (["login", "logout"].includes(col.key)) {
          const d = parseToDate(item[col.key]);
          return d ? d.toLocaleString() : "-";
        }
        if (col.key === "result") return item.result ? "True" : "False";
        return item[col.key] ?? "-";
      })
    );

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
    });

    doc.save("authentications.pdf");
  };

  const exportExcel = async () => {
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleString();

    let res = await fetch("/api/username", {
      headers: { "x-auth-token": localStorage.getItem("token") },
    });
    res = await res.json();

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Username: ${res.username}`],
      ["Report: Authentications Report"],
      [`Date: ${dateStr}`],
      [""],
    ]);

    const visibleCols = columnsConfig.filter((c) => c.visible);
    const headers = visibleCols.map((col) => col.label);
    const rows = filteredData.map((item) =>
      visibleCols.map((col) => {
        if (["login", "logout"].includes(col.key)) {
          const d = parseToDate(item[col.key]);
          return d ? d.toLocaleString() : "-";
        }
        if (col.key === "result") return item.result ? "True" : "False";
        return item[col.key] ?? "-";
      })
    );

    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Authentications");
    XLSX.writeFile(workbook, `authentications-${res.username}-${dateStr}.xlsx`);
  };

  if (loading)
    return (
      <div className="loader-container ">
        <img src="./assets/img/1487.gif" alt="loading" />
      </div>
    );
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="content-wrapper">
      <div className="flex-grow-1 custom-w">
        <div className="card">
          <div className="d-flex mb-2 px-4 pt-3 justify-content-between">
            <h5 className="fw-bold py-2">Authentications Report</h5>

            {/* Single button to open the consolidated Settings modal */}
            <button
              className="btn btn-secondary p-2"
              onClick={() => setShowModal(true)}
            >
              Settings ⚙️
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead>
                <tr>
                  {columnsConfig.map(
                    (col) => col.visible && <th key={col.key}>{col.label}</th>
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
                          {["login", "logout"].includes(col.key) ? (
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
                              value={filters[col.key] ?? ""}
                              placeholder={`Search ${col.label}`}
                              onChange={handleTextFilterChange}
                            />
                          )}
                        </td>
                      )
                  )}
                </tr>

                {/* Data Rows */}
                {currentData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columnsConfig.filter((c) => c.visible).length}
                      className="text-center"
                    >
                      No data found.
                    </td>
                  </tr>
                ) : (
                  currentData.map((item, index) => (
                    <tr key={index}>
                      {columnsConfig.map((col) =>
                        col.visible ? (
                          <td key={col.key} className="fs-text-custom">
                            {["login", "logout"].includes(col.key)
                              ? (() => {
                                  const d = parseToDate(item[col.key]);
                                  return d ? d.toLocaleString() : "-";
                                })()
                              : col.key === "result"
                              ? item.result
                                ? "True"
                                : "False"
                              : item[col.key] ?? "-"}
                          </td>
                        ) : null
                      )}
                    </tr>
                  ))
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

      {/* ---------- Settings Modal ---------- */}
      {showModal && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.4)" }}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Authentications – Settings</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                />
              </div>

              <div className="modal-body">
                {/* Date Range */}
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
                    <div className="d-flex gap-2">
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
                          !filters.login &&
                          !filters.logout
                        }
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                </div>

                {/* Visible Columns */}
                <div className="mb-4">
                  <h6 className="mb-2">Visible Columns</h6>
                  <div className="row">
                    {columnsConfig.map((col) => (
                      <div className="col-6 col-md-4 mb-2" key={col.key}>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`check-${col.key}`}
                            checked={col.visible}
                            onChange={() => toggleColumnVisibility(col.key)}
                          />
                          <label
                            className="form-check-label"
                            htmlFor={`check-${col.key}`}
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

                {/* Page Size */}
                <div className="mb-2">
                  <h6 className="mb-2">Page Size</h6>
                  <div className="d-flex align-items-center">
                    <label className="me-2">Show:</label>
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
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showModal && <div className="modal-backdrop fade show" />}

      <div className="content-backdrop fade" />
    </div>
  );
};

export default Authentications;
