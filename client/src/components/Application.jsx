// import React, { useEffect, useMemo, useState } from "react";
// import { jsPDF } from "jspdf";
// import "jspdf-autotable";
// import * as XLSX from "xlsx";
// import Pagination from "./Common/Pagination";
// import getLogoBase64 from "../utils/getLogoBase64";

// /* ---------- Helpers ---------- */

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

// const Application = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [totalPages, setTotalPages] = useState(0);

//   const defaultColumns = [
//     { label: "Bastion Name", key: "bastionName", visible: true },
//     { label: "Application Name", key: "application_name", visible: true },
//     { label: "Parameters", key: "parameters", visible: true },
//     { label: "Last Connection", key: "last_connection", visible: true },
//     { label: "Connection Policy", key: "connection_policy", visible: true },
//     { label: "Application Path", key: "application_path", visible: true },
//     { label: "Target Cluster", key: "target_cluster_name", visible: true },
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

//   // Text filters + last_connection (string)
//   const [filters, setFilters] = useState({
//     bastionName: "",
//     application_name: "",
//     parameters: "",
//     last_connection: "", // yyyy-mm-dd for input
//     connection_policy: "",
//     application_path: "",
//     target_cluster_name: "",
//   });

//   // Only apply the last_connection filter when the input contains a full date
//   const [dateFilters, setDateFilters] = useState({
//     last_connection: null, // Date | null
//   });

//   // Range (server-side by last_connection)
//   const [range, setRange] = useState({ from: "", to: "" });
//   const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });
//   const [rangeVersion, setRangeVersion] = useState(0); // force refresh even if same dates

//   /* ---------- Fetch (range-aware) ---------- */
//   useEffect(() => {
//     const load = async () => {
//       setLoading(true);
//       try {
//         const token = localStorage.getItem("token");
//         let resp;

//         if (rangeApplied.from || rangeApplied.to) {
//           const qs = new URLSearchParams();
//           if (rangeApplied.from) qs.set("from", rangeApplied.from);
//           if (rangeApplied.to) qs.set("to", rangeApplied.to);

//           resp = await fetch(`/api/applications/range?${qs.toString()}`, {
//             headers: { "x-auth-token": token },
//           });

//           if (!resp.ok) {
//             // fallback to full list
//             resp = await fetch(`/api/applications/fromdb`, {
//               headers: { "x-auth-token": token },
//             });
//           }
//         } else {
//           resp = await fetch(`/api/applications/fromdb`, {
//             headers: { "x-auth-token": token },
//           });
//         }

//         if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);

//         let list = await resp.json();

//         // Client-side fallback for range if we used /fromdb
//         if (
//           (rangeApplied.from || rangeApplied.to) &&
//           resp.url.includes("/fromdb")
//         ) {
//           const fromDate = ymdToLocalDate(rangeApplied.from, false);
//           const toDate = ymdToLocalDate(rangeApplied.to, true);
//           list = list.filter((row) => {
//             const d = parseToDate(row.last_connection);
//             if (!d) return false;
//             if (fromDate && d < fromDate) return false;
//             if (toDate && d > toDate) return false;
//             return true;
//           });
//         }

//         setData(list);
//         setTotalPages(Math.ceil(list.length / itemsPerPage));
//         setError(null);
//       } catch (e) {
//         setError(e);
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//     // rangeVersion ensures reload on Apply with the same dates
//   }, [itemsPerPage, rangeApplied.from, rangeApplied.to, rangeVersion]);

//   /* ---------- Handlers ---------- */
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

//   // Last Connection filter: only apply when full date selected
//   const handleDateFilterChange = (e) => {
//     const { name, value, valueAsDate } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//     setDateFilters((prev) => ({
//       ...prev,
//       [name]: valueAsDate instanceof Date ? valueAsDate : null,
//     }));
//     setCurrentPage(1);
//   };

//   const applyRange = () => {
//     let { from, to } = range;
//     if (from && to && new Date(from) > new Date(to)) {
//       [from, to] = [to, from];
//       setRange({ from, to });
//     }
//     setRangeApplied({ from: from || "", to: to || "" });
//     setRangeVersion((v) => v + 1);
//     setCurrentPage(1);
//   };

//   const resetRangeAndFilters = () => {
//     setRange({ from: "", to: "" });
//     setRangeApplied({ from: "", to: "" });
//     // clear the column date filter
//     setFilters((prev) => ({ ...prev, last_connection: "" }));
//     setDateFilters({ last_connection: null });
//     setRangeVersion((v) => v + 1);
//     setCurrentPage(1);
//   };

//   /* ---------- Client-side filters ---------- */
//   const filteredData = useMemo(() => {
//     return data.filter((row) => {
//       if (!textIncludes(row.bastionName, filters.bastionName)) return false;
//       if (!textIncludes(row.application_name, filters.application_name))
//         return false;
//       if (!textIncludes(row.parameters, filters.parameters)) return false;
//       if (!textIncludes(row.connection_policy, filters.connection_policy))
//         return false;
//       if (!textIncludes(row.application_path, filters.application_path))
//         return false;
//       if (!textIncludes(row.target_cluster_name, filters.target_cluster_name))
//         return false;

//       if (dateFilters.last_connection) {
//         const d = parseToDate(row.last_connection);
//         const s = ymdToLocalDate(filters.last_connection, false);
//         const e = ymdToLocalDate(filters.last_connection, true);
//         if (!d || d < s || d > e) return false;
//       }

//       return true;
//     });
//   }, [data, filters, dateFilters]);

//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;
//   const currentData = useMemo(
//     () => filteredData.slice(startIndex, endIndex),
//     [filteredData, startIndex, endIndex]
//   );

//   useEffect(() => {
//     setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
//   }, [filteredData.length, itemsPerPage]);

//   /* ---------- Exporters ---------- */
//   const exportPDF = async () => {
//     const doc = new jsPDF("landscape");
//     const dateStr = new Date().toLocaleString();

//     let res = await fetch("/api/username", {
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
//     doc.text("Report: Applications Report", 15, 20);
//     doc.text(`Date: ${dateStr}`, 15, 30);

//     const visible = columnsConfig.filter((c) => c.visible);
//     const headers = visible.map((c) => c.label);
//     const rows = filteredData.map((item) =>
//       visible.map((c) => {
//         if (c.key === "last_connection") {
//           const d = parseToDate(item[c.key]);
//           return d ? d.toLocaleString() : "-";
//         }
//         return item[c.key] ?? "-";
//       })
//     );

//     doc.autoTable({
//       head: [headers],
//       body: rows,
//       startY: 40,
//       theme: "grid",
//       headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
//     });

//     doc.save("applications.pdf");
//   };

//   const exportExcel = async () => {
//     const dateStr = new Date().toLocaleString();

//     let res = await fetch("/api/username", {
//       headers: { "x-auth-token": localStorage.getItem("token") },
//     });
//     const { username } = await res.json();

//     const workbook = XLSX.utils.book_new();
//     const worksheet = XLSX.utils.aoa_to_sheet([]);

//     XLSX.utils.sheet_add_aoa(worksheet, [
//       [`Username: ${username}`],
//       ["Report: Applications Report"],
//       [`Date: ${dateStr}`],
//       [""],
//     ]);

//     const visible = columnsConfig.filter((c) => c.visible);
//     const headers = visible.map((c) => c.label);
//     const rows = filteredData.map((item) =>
//       visible.map((c) => {
//         if (c.key === "last_connection") {
//           const d = parseToDate(item[c.key]);
//           return d ? d.toLocaleString() : "-";
//         }
//         return item[c.key] ?? "-";
//       })
//     );

//     XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
//     XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
//     XLSX.writeFile(workbook, `applications-${username}-${dateStr}.xlsx`);
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
//             <div className="table-title">
//               <h5 className="fw-bold py-2">Applications Report</h5>
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
//                     onClick={resetRangeAndFilters}
//                     disabled={
//                       !rangeApplied.from &&
//                       !rangeApplied.to &&
//                       !filters.last_connection
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
//                     (col) =>
//                       col.visible && (
//                         <th className="fw-bold fs-custom" key={col.key}>
//                           {col.label}
//                         </th>
//                       )
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="border border-1">
//                 <tr>
//                   {columnsConfig.map(
//                     (col) =>
//                       col.visible && (
//                         <td key={`filter-${col.key}`}>
//                           {col.key === "last_connection" ? (
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
//                   currentData.map((row, index) => (
//                     <tr className="border border-1" key={index}>
//                       {columnsConfig.map((col) =>
//                         col.visible ? (
//                           <td key={col.key} className="fs-text-custom">
//                             {col.key === "last_connection"
//                               ? (() => {
//                                   const d = parseToDate(row[col.key]);
//                                   return d ? d.toLocaleString() : "-";
//                                 })()
//                               : row[col.key] ?? "-"}
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
//       <div className="content-backdrop fade" />
//     </div>
//   );
// };

// export default Application;
// src/components/Application.jsx
import React, { useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Pagination from "./Common/Pagination";
import getLogoBase64 from "../utils/getLogoBase64";

/* ---------- Helpers ---------- */
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

const Application = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // Modal open/close
  const [showModal, setShowModal] = useState(false);

  const defaultColumns = [
    { label: "Bastion Name", key: "bastionName", visible: true },
    { label: "Application Name", key: "application_name", visible: true },
    { label: "Parameters", key: "parameters", visible: true },
    { label: "Last Connection", key: "last_connection", visible: true },
    { label: "Connection Policy", key: "connection_policy", visible: true },
    { label: "Application Path", key: "application_path", visible: true },
    { label: "Target Cluster", key: "target_cluster_name", visible: true },
  ];
  const [columnsConfig, setColumnsConfig] = useState(defaultColumns);

  const toggleColumnVisibility = (key) => {
    setColumnsConfig((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  // Text filters + last_connection (string)
  const [filters, setFilters] = useState({
    bastionName: "",
    application_name: "",
    parameters: "",
    last_connection: "", // yyyy-mm-dd for input
    connection_policy: "",
    application_path: "",
    target_cluster_name: "",
  });

  // Only apply the last_connection filter when the input contains a full date
  const [dateFilters, setDateFilters] = useState({
    last_connection: null, // Date | null
  });

  // Range (server-side by last_connection)
  const [range, setRange] = useState({ from: "", to: "" });
  const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });
  const [rangeVersion, setRangeVersion] = useState(0); // force refresh even if same dates

  /* ---------- Fetch (range-aware) ---------- */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        let resp;

        if (rangeApplied.from || rangeApplied.to) {
          const qs = new URLSearchParams();
          if (rangeApplied.from) qs.set("from", rangeApplied.from);
          if (rangeApplied.to) qs.set("to", rangeApplied.to);

          resp = await fetch(`/api/applications/range?${qs.toString()}`, {
            headers: { "x-auth-token": token },
          });

          if (!resp.ok) {
            // fallback to full list
            resp = await fetch(`/api/applications/fromdb`, {
              headers: { "x-auth-token": token },
            });
          }
        } else {
          resp = await fetch(`/api/applications/fromdb`, {
            headers: { "x-auth-token": token },
          });
        }

        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);

        let list = await resp.json();

        // Client-side fallback for range if we used /fromdb
        if (
          (rangeApplied.from || rangeApplied.to) &&
          resp.url.includes("/fromdb")
        ) {
          const fromDate = ymdToLocalDate(rangeApplied.from, false);
          const toDate = ymdToLocalDate(rangeApplied.to, true);
          list = list.filter((row) => {
            const d = parseToDate(row.last_connection);
            if (!d) return false;
            if (fromDate && d < fromDate) return false;
            if (toDate && d > toDate) return false;
            return true;
          });
        }

        setData(list);
        setTotalPages(Math.ceil(list.length / itemsPerPage));
        setError(null);
      } catch (e) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    // rangeVersion ensures reload on Apply with the same dates
  }, [itemsPerPage, rangeApplied.from, rangeApplied.to, rangeVersion]);

  /* ---------- Handlers ---------- */
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

  // Last Connection filter: only apply when full date selected
  const handleDateFilterChange = (e) => {
    const { name, value, valueAsDate } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setDateFilters((prev) => ({
      ...prev,
      [name]: valueAsDate instanceof Date ? valueAsDate : null,
    }));
    setCurrentPage(1);
  };

  const applyRange = () => {
    let { from, to } = range;
    if (from && to && new Date(from) > new Date(to)) {
      [from, to] = [to, from];
      setRange({ from, to });
    }
    setRangeApplied({ from: from || "", to: to || "" });
    setRangeVersion((v) => v + 1);
    setCurrentPage(1);
  };

  const resetRangeAndFilters = () => {
    setRange({ from: "", to: "" });
    setRangeApplied({ from: "", to: "" });
    // clear the column date filter
    setFilters((prev) => ({ ...prev, last_connection: "" }));
    setDateFilters({ last_connection: null });
    setRangeVersion((v) => v + 1);
    setCurrentPage(1);
  };

  /* ---------- Client-side filters ---------- */
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (!textIncludes(row.bastionName, filters.bastionName)) return false;
      if (!textIncludes(row.application_name, filters.application_name))
        return false;
      if (!textIncludes(row.parameters, filters.parameters)) return false;
      if (!textIncludes(row.connection_policy, filters.connection_policy))
        return false;
      if (!textIncludes(row.application_path, filters.application_path))
        return false;
      if (!textIncludes(row.target_cluster_name, filters.target_cluster_name))
        return false;

      if (dateFilters.last_connection) {
        const d = parseToDate(row.last_connection);
        const s = ymdToLocalDate(filters.last_connection, false);
        const e = ymdToLocalDate(filters.last_connection, true);
        if (!d || d < s || d > e) return false;
      }

      return true;
    });
  }, [data, filters, dateFilters]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = useMemo(
    () => filteredData.slice(startIndex, endIndex),
    [filteredData, startIndex, endIndex]
  );

  useEffect(() => {
    setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
  }, [filteredData.length, itemsPerPage]);

  /* ---------- Exporters (use filteredData for WYSIWYG) ---------- */
  const exportPDF = async () => {
    const doc = new jsPDF("landscape");
    const dateStr = new Date().toLocaleString();

    let res = await fetch("/api/username", {
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
    doc.text("Report: Applications Report", 15, 20);
    doc.text(`Date: ${dateStr}`, 15, 30);

    const visible = columnsConfig.filter((c) => c.visible);
    const headers = visible.map((c) => c.label);
    const rows = filteredData.map((item) =>
      visible.map((c) => {
        if (c.key === "last_connection") {
          const d = parseToDate(item[c.key]);
          return d ? d.toLocaleString() : "-";
        }
        return item[c.key] ?? "-";
      })
    );

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
    });

    doc.save("applications.pdf");
  };

  const exportExcel = async () => {
    const dateStr = new Date().toLocaleString();

    let res = await fetch("/api/username", {
      headers: { "x-auth-token": localStorage.getItem("token") },
    });
    const { username } = await res.json();

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Username: ${username}`],
      ["Report: Applications Report"],
      [`Date: ${dateStr}`],
      [""],
    ]);

    const visible = columnsConfig.filter((c) => c.visible);
    const headers = visible.map((c) => c.label);
    const rows = filteredData.map((item) =>
      visible.map((c) => {
        if (c.key === "last_connection") {
          const d = parseToDate(item[c.key]);
          return d ? d.toLocaleString() : "-";
        }
        return item[c.key] ?? "-";
      })
    );

    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Applications");
    XLSX.writeFile(workbook, `applications-${username}-${dateStr}.xlsx`);
  };

  /* ---------- UI ---------- */
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
            <div className="table-title">
              <h5 className="fw-bold py-2">Applications Report</h5>
            </div>

            {/* Single button to open modal with all controls */}
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
                    (col) =>
                      col.visible && (
                        <th className="fw-bold fs-custom" key={col.key}>
                          {col.label}
                        </th>
                      )
                  )}
                </tr>
              </thead>
              <tbody className="border border-1">
                {/* Filter row (kept inline in table) */}
                <tr>
                  {columnsConfig.map(
                    (col) =>
                      col.visible && (
                        <td key={`filter-${col.key}`}>
                          {col.key === "last_connection" ? (
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
                  currentData.map((row, index) => (
                    <tr className="border border-1" key={index}>
                      {columnsConfig.map((col) =>
                        col.visible ? (
                          <td key={col.key} className="fs-text-custom">
                            {col.key === "last_connection"
                              ? (() => {
                                  const d = parseToDate(row[col.key]);
                                  return d ? d.toLocaleString() : "-";
                                })()
                              : row[col.key] ?? "-"}
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
                <h5 className="modal-title">Applications – Settings</h5>
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
                        onClick={resetRangeAndFilters}
                        disabled={
                          !rangeApplied.from &&
                          !rangeApplied.to &&
                          !filters.last_connection
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
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Backdrop for modal (Bootstrap-like) */}
      {showModal && <div className="modal-backdrop fade show"></div>}
    </div>
  );
};

export default Application;
