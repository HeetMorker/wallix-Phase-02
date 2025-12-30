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

// /* ---------- Component ---------- */

// const Approvals = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [totalPages, setTotalPages] = useState(0);
//   const [username, setUsername] = useState("User");
//   const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

//   const defaultColumns = [
//     { label: "Bastion Name", key: "bastionName", visible: true },
//     { label: "User Name", key: "user_name", visible: true },
//     { label: "Target Name", key: "target_name", visible: true },
//     { label: "Creation", key: "creation", visible: true },
//     { label: "Begin", key: "begin", visible: true },
//     { label: "End", key: "end", visible: true },
//     { label: "Duration", key: "duration", visible: true },
//     { label: "Ticket", key: "ticket", visible: true },
//     { label: "User Comment", key: "comment", visible: true },
//     { label: "Quorum", key: "quorum", visible: true },
//     { label: "Approver Name", key: "approver_name", visible: true },
//     { label: "Approver Comment", key: "approver_comment", visible: true },
//     { label: "Email", key: "email", visible: true },
//   ];
//   const [columnsConfig, setColumnsConfig] = useState(defaultColumns);

//   const toggleColumnVisibility = (key) => {
//     setColumnsConfig((prev) =>
//       prev.map((col) =>
//         col.key === key ? { ...col, visible: !col.visible } : col
//       )
//     );
//   };

//   // Text filters + date inputs (string for inputs)
//   const [filters, setFilters] = useState({
//     bastionName: "",
//     user_name: "",
//     target_name: "",
//     creation: "", // yyyy-mm-dd
//     begin: "", // yyyy-mm-dd
//     end: "", // yyyy-mm-dd
//     duration: "",
//     ticket: "",
//     comment: "",
//     quorum: "",
//     approver_name: "",
//     approver_comment: "",
//     email: "",
//   });

//   // Only apply date filters when full date is selected
//   const [dateFilters, setDateFilters] = useState({
//     creation: null,
//     begin: null,
//     end: null,
//   });

//   // Range (server-side by date field). Default to creation.
//   const [range, setRange] = useState({ from: "", to: "" });
//   const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });
//   const [rangeVersion, setRangeVersion] = useState(0);

//   /* ---------- Fetch (range-aware) ---------- */
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const token = localStorage.getItem("token");

//         // get username parallelly
//         const userRes = await fetch("/api/username", {
//           headers: { "x-auth-token": token },
//         }).then((r) => r.json());
//         setUsername(userRes.username || "User");

//         let list = [];
//         let resp;

//         if (rangeApplied.from || rangeApplied.to) {
//           const qs = new URLSearchParams();
//           if (rangeApplied.from) qs.set("from", rangeApplied.from);
//           if (rangeApplied.to) qs.set("to", rangeApplied.to);

//           // Try by=creation, then by=begin, then by=end
//           const tries = ["creation", "begin", "end"];
//           for (let i = 0; i < tries.length; i++) {
//             const by = tries[i];
//             resp = await fetch(
//               `/api/approvals/range?${qs.toString()}&by=${by}`,
//               {
//                 headers: { "x-auth-token": token },
//               }
//             );
//             if (resp.ok) {
//               list = await resp.json();
//               if (Array.isArray(list) && list.length > 0) break;
//             }
//           }

//           // Fallback to fromdb and client-side range (creation)
//           if (!resp || !resp.ok) {
//             const r2 = await fetch(`/api/approvals/fromdb`, {
//               headers: { "x-auth-token": token },
//             });
//             if (!r2.ok) throw new Error(`HTTP error! status: ${r2.status}`);
//             const all = await r2.json();
//             const fromDate = ymdToLocalDate(rangeApplied.from, false);
//             const toDate = ymdToLocalDate(rangeApplied.to, true);
//             list = all.filter((row) => {
//               const d = parseToDate(row.creation);
//               if (!d) return false;
//               if (fromDate && d < fromDate) return false;
//               if (toDate && d > toDate) return false;
//               return true;
//             });
//           }
//         } else {
//           const r = await fetch("/api/approvals/fromdb", {
//             headers: { "x-auth-token": token },
//           });
//           if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
//           list = await r.json();
//         }

//         // Normalize approver fields (as before)
//         const normalized = (list || []).map((item) => ({
//           ...item,
//           approver_name: item.answers?.[0]?.approver_name || "-",
//           approver_comment: item.answers?.[0]?.comment || "-",
//         }));

//         setData(normalized);
//         setTotalPages(Math.ceil(normalized.length / itemsPerPage));
//         setError(null);
//       } catch (err) {
//         setError(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//     // rangeVersion ensures refresh even if same dates applied again
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

//   const resetRangeAndDates = () => {
//     setRange({ from: "", to: "" });
//     setRangeApplied({ from: "", to: "" });
//     setFilters((prev) => ({ ...prev, creation: "", begin: "", end: "" }));
//     setDateFilters({ creation: null, begin: null, end: null });
//     setRangeVersion((v) => v + 1);
//     setCurrentPage(1);
//   };

//   /* ---------- Client-side filters ---------- */
//   const filteredData = useMemo(() => {
//     return data.filter((item) => {
//       if (!textIncludes(item.bastionName, filters.bastionName)) return false;
//       if (!textIncludes(item.user_name, filters.user_name)) return false;
//       if (!textIncludes(item.target_name, filters.target_name)) return false;
//       if (!textIncludes(item.duration, filters.duration)) return false;
//       if (!textIncludes(item.ticket, filters.ticket)) return false;
//       if (!textIncludes(item.comment, filters.comment)) return false;
//       if (!textIncludes(item.quorum, filters.quorum)) return false;
//       if (!textIncludes(item.approver_name, filters.approver_name))
//         return false;
//       if (!textIncludes(item.approver_comment, filters.approver_comment))
//         return false;
//       if (!textIncludes(item.email, filters.email)) return false;

//       // Date columns: only apply when full date picked
//       if (dateFilters.creation) {
//         const d = parseToDate(item.creation);
//         const s = ymdToLocalDate(filters.creation, false);
//         const e = ymdToLocalDate(filters.creation, true);
//         if (!d || d < s || d > e) return false;
//       }
//       if (dateFilters.begin) {
//         const d = parseToDate(item.begin);
//         const s = ymdToLocalDate(filters.begin, false);
//         const e = ymdToLocalDate(filters.begin, true);
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
//     doc.text("Report: Approvals Report", 15, 17);
//     doc.text(`Date: ${dateStr}`, 15, 24);

//     const visible = columnsConfig.filter((c) => c.visible);
//     const headers = visible.map((c) => c.label);
//     const rows = filteredData.map((item) =>
//       visible.map((col) => {
//         const val = item[col.key];
//         return ["creation", "begin", "end"].includes(col.key)
//           ? (() => {
//               const d = parseToDate(val);
//               return d ? d.toLocaleString() : "-";
//             })()
//           : val ?? "-";
//       })
//     );

//     doc.autoTable({
//       head: [headers],
//       body: rows,
//       startY: 30,
//       theme: "grid",
//       tableWidth: "wrap",
//       styles: { fontSize: 7.2, overflow: "linebreak", cellPadding: 1.5 },
//       headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF", fontSize: 8 },
//       columnStyles: {
//         0: { cellWidth: 15 }, // Bastion
//         1: { cellWidth: 15 }, // User
//         2: { cellWidth: 40 }, // Target
//         3: { cellWidth: 16 }, // Creation
//         4: { cellWidth: 26 }, // Begin
//         5: { cellWidth: 26 }, // End
//         6: { cellWidth: 11 }, // Duration
//         7: { cellWidth: 16 }, // Ticket
//         8: { cellWidth: 25 }, // User Comment
//         9: { cellWidth: 14 }, // Quorum
//         10: { cellWidth: 28 }, // Approver Name
//         11: { cellWidth: 18 }, // Approver Comment
//         12: { cellWidth: 25 }, // Email
//       },
//       pageBreak: "auto",
//     });

//     doc.save("approvals.pdf");
//   };

//   const exportExcel = () => {
//     const workbook = XLSX.utils.book_new();
//     const worksheet = XLSX.utils.aoa_to_sheet([]);
//     const dateStr = new Date().toLocaleString();

//     XLSX.utils.sheet_add_aoa(worksheet, [
//       [`Username: ${username}`],
//       ["Report: Approvals Report"],
//       [`Date: ${dateStr}`],
//       [""],
//     ]);

//     const visible = columnsConfig.filter((c) => c.visible);
//     const headers = visible.map((c) => c.label);
//     const rows = filteredData.map((item) =>
//       visible.map((col) => {
//         const val = item[col.key];
//         return ["creation", "begin", "end"].includes(col.key)
//           ? (() => {
//               const d = parseToDate(val);
//               return d ? d.toLocaleString() : "-";
//             })()
//           : val ?? "-";
//       })
//     );

//     XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
//     XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Approvals");
//     XLSX.writeFile(workbook, `approvals-${username}-${dateStr}.xlsx`);
//   };

//   if (loading)
//     return (
//       <div className="loader-container ">
//         <img src="./assets/img/1487.gif" alt="Loading..." />
//       </div>
//     );

//   if (error) return <p>Error: {error.message}</p>;

//   return (
//     <div className="content-wrapper">
//       <div className=" flex-grow-1 custom-w">
//         <div className="card">
//           <div className="d-flex mb-2 px-4 pt-3 justify-content-between">
//             <div className="table-title">
//               <h5 className="fw-bold py-2">Approvals Report</h5>
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
//                     onClick={resetRangeAndDates}
//                     disabled={
//                       !rangeApplied.from &&
//                       !rangeApplied.to &&
//                       !filters.creation &&
//                       !filters.begin &&
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
//             <table
//               id="user-group-table"
//               className="table table-bordered table-hover"
//             >
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
//                 {/* Filter Row */}
//                 <tr>
//                   {columnsConfig.map(
//                     (col) =>
//                       col.visible && (
//                         <td key={`filter-${col.key}`}>
//                           {["creation", "begin", "end"].includes(col.key) ? (
//                             <input
//                               type="date"
//                               className="form-control"
//                               name={col.key}
//                               value={filters[col.key] || ""}
//                               onChange={handleDateFilterChange}
//                             />
//                           ) : (
//                             <input
//                               type="text"
//                               className="form-control"
//                               name={col.key}
//                               value={filters[col.key] || ""}
//                               placeholder={`Search ${col.label}`}
//                               onChange={handleTextFilterChange}
//                             />
//                           )}
//                         </td>
//                       )
//                   )}
//                 </tr>

//                 {currentData.map((row, i) => (
//                   <tr key={i}>
//                     {columnsConfig
//                       .filter((c) => c.visible)
//                       .map((col) => (
//                         <td key={col.key} className="fs-text-custom">
//                           {["creation", "begin", "end"].includes(col.key)
//                             ? (() => {
//                                 const d = parseToDate(row[col.key]);
//                                 return d ? d.toLocaleString() : "-";
//                               })()
//                             : row[col.key] || "-"}
//                         </td>
//                       ))}
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

//       <div className="content-backdrop fade" />
//     </div>
//   );
// };

// export default Approvals;
// src/components/Approvals.jsx
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

/* ---------- Component ---------- */

const Approvals = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [username, setUsername] = useState("User");

  // Modal visibility
  const [showModal, setShowModal] = useState(false);

  const defaultColumns = [
    { label: "Bastion Name", key: "bastionName", visible: true },
    { label: "User Name", key: "user_name", visible: true },
    { label: "Target Name", key: "target_name", visible: true },
    { label: "Creation", key: "creation", visible: true },
    { label: "Begin", key: "begin", visible: true },
    { label: "End", key: "end", visible: true },
    { label: "Duration", key: "duration", visible: true },
    { label: "Ticket", key: "ticket", visible: true },
    { label: "User Comment", key: "comment", visible: true },
    { label: "Quorum", key: "quorum", visible: true },
    { label: "Approver Name", key: "approver_name", visible: true },
    { label: "Approver Comment", key: "approver_comment", visible: true },
    { label: "Email", key: "email", visible: true },
  ];
  const [columnsConfig, setColumnsConfig] = useState(defaultColumns);

  const toggleColumnVisibility = (key) => {
    setColumnsConfig((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  // Text filters + date inputs (string for inputs)
  const [filters, setFilters] = useState({
    bastionName: "",
    user_name: "",
    target_name: "",
    creation: "", // yyyy-mm-dd
    begin: "", // yyyy-mm-dd
    end: "", // yyyy-mm-dd
    duration: "",
    ticket: "",
    comment: "",
    quorum: "",
    approver_name: "",
    approver_comment: "",
    email: "",
  });

  // Only apply date filters when full date is selected
  const [dateFilters, setDateFilters] = useState({
    creation: null,
    begin: null,
    end: null,
  });

  // Range (server-side by date field). Default to creation.
  const [range, setRange] = useState({ from: "", to: "" });
  const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });
  const [rangeVersion, setRangeVersion] = useState(0);

  /* ---------- Fetch (range-aware) ---------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");

        // get username parallelly
        const userRes = await fetch("/api/username", {
          headers: { "x-auth-token": token },
        }).then((r) => r.json());
        setUsername(userRes.username || "User");

        let list = [];
        let resp;

        if (rangeApplied.from || rangeApplied.to) {
          const qs = new URLSearchParams();
          if (rangeApplied.from) qs.set("from", rangeApplied.from);
          if (rangeApplied.to) qs.set("to", rangeApplied.to);

          // Try by=creation, then by=begin, then by=end
          const tries = ["creation", "begin", "end"];
          for (let i = 0; i < tries.length; i++) {
            const by = tries[i];
            resp = await fetch(
              `/api/approvals/range?${qs.toString()}&by=${by}`,
              {
                headers: { "x-auth-token": token },
              }
            );
            if (resp.ok) {
              list = await resp.json();
              if (Array.isArray(list) && list.length > 0) break;
            }
          }

          // Fallback to fromdb and client-side range (creation)
          if (!resp || !resp.ok) {
            const r2 = await fetch(`/api/approvals/fromdb`, {
              headers: { "x-auth-token": token },
            });
            if (!r2.ok) throw new Error(`HTTP error! status: ${r2.status}`);
            const all = await r2.json();
            const fromDate = ymdToLocalDate(rangeApplied.from, false);
            const toDate = ymdToLocalDate(rangeApplied.to, true);
            list = all.filter((row) => {
              const d = parseToDate(row.creation);
              if (!d) return false;
              if (fromDate && d < fromDate) return false;
              if (toDate && d > toDate) return false;
              return true;
            });
          }
        } else {
          const r = await fetch("/api/approvals/fromdb", {
            headers: { "x-auth-token": token },
          });
          if (!r.ok) throw new Error(`HTTP error! status: ${r.status}`);
          list = await r.json();
        }

        // Normalize approver fields (as before)
        const normalized = (list || []).map((item) => ({
          ...item,
          approver_name: item.answers?.[0]?.approver_name || "-",
          approver_comment: item.answers?.[0]?.comment || "-",
        }));

        setData(normalized);
        setTotalPages(Math.ceil(normalized.length / itemsPerPage));
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // rangeVersion ensures refresh even if same dates applied again
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

  const resetRangeAndDates = () => {
    setRange({ from: "", to: "" });
    setRangeApplied({ from: "", to: "" });
    setFilters((prev) => ({ ...prev, creation: "", begin: "", end: "" }));
    setDateFilters({ creation: null, begin: null, end: null });
    setRangeVersion((v) => v + 1);
    setCurrentPage(1);
  };

  /* ---------- Client-side filters ---------- */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!textIncludes(item.bastionName, filters.bastionName)) return false;
      if (!textIncludes(item.user_name, filters.user_name)) return false;
      if (!textIncludes(item.target_name, filters.target_name)) return false;
      if (!textIncludes(item.duration, filters.duration)) return false;
      if (!textIncludes(item.ticket, filters.ticket)) return false;
      if (!textIncludes(item.comment, filters.comment)) return false;
      if (!textIncludes(item.quorum, filters.quorum)) return false;
      if (!textIncludes(item.approver_name, filters.approver_name))
        return false;
      if (!textIncludes(item.approver_comment, filters.approver_comment))
        return false;
      if (!textIncludes(item.email, filters.email)) return false;

      // Date columns: only apply when full date picked
      if (dateFilters.creation) {
        const d = parseToDate(item.creation);
        const s = ymdToLocalDate(filters.creation, false);
        const e = ymdToLocalDate(filters.creation, true);
        if (!d || d < s || d > e) return false;
      }
      if (dateFilters.begin) {
        const d = parseToDate(item.begin);
        const s = ymdToLocalDate(filters.begin, false);
        const e = ymdToLocalDate(filters.begin, true);
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

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = useMemo(
    () => filteredData.slice(startIndex, endIndex),
    [filteredData, startIndex, endIndex]
  );

  useEffect(() => {
    setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
  }, [filteredData.length, itemsPerPage]);

  /* ---------- Exporters ---------- */
  const exportPDF = async () => {
    const doc = new jsPDF("landscape");
    const dateStr = new Date().toLocaleString();

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
    doc.text("Report: Approvals Report", 15, 17);
    doc.text(`Date: ${dateStr}`, 15, 24);

    const visible = columnsConfig.filter((c) => c.visible);
    const headers = visible.map((c) => c.label);
    const rows = filteredData.map((item) =>
      visible.map((col) => {
        const val = item[col.key];
        return ["creation", "begin", "end"].includes(col.key)
          ? (() => {
              const d = parseToDate(val);
              return d ? d.toLocaleString() : "-";
            })()
          : val ?? "-";
      })
    );

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 30,
      theme: "grid",
      tableWidth: "wrap",
      styles: { fontSize: 7.2, overflow: "linebreak", cellPadding: 1.5 },
      headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF", fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 15 }, // Bastion
        1: { cellWidth: 15 }, // User
        2: { cellWidth: 40 }, // Target
        3: { cellWidth: 16 }, // Creation
        4: { cellWidth: 26 }, // Begin
        5: { cellWidth: 26 }, // End
        6: { cellWidth: 11 }, // Duration
        7: { cellWidth: 16 }, // Ticket
        8: { cellWidth: 25 }, // User Comment
        9: { cellWidth: 14 }, // Quorum
        10: { cellWidth: 28 }, // Approver Name
        11: { cellWidth: 18 }, // Approver Comment
        12: { cellWidth: 25 }, // Email
      },
      pageBreak: "auto",
    });

    doc.save("approvals.pdf");
  };

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);
    const dateStr = new Date().toLocaleString();

    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Username: ${username}`],
      ["Report: Approvals Report"],
      [`Date: ${dateStr}`],
      [""],
    ]);

    const visible = columnsConfig.filter((c) => c.visible);
    const headers = visible.map((c) => c.label);
    const rows = filteredData.map((item) =>
      visible.map((col) => {
        const val = item[col.key];
        return ["creation", "begin", "end"].includes(col.key)
          ? (() => {
              const d = parseToDate(val);
              return d ? d.toLocaleString() : "-";
            })()
          : val ?? "-";
      })
    );

    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
    XLSX.utils.book_append_sheet(workbook, worksheet, "Approvals");
    XLSX.writeFile(workbook, `approvals-${username}-${dateStr}.xlsx`);
  };

  if (loading)
    return (
      <div className="loader-container ">
        <img src="./assets/img/1487.gif" alt="Loading..." />
      </div>
    );

  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="content-wrapper">
      <div className=" flex-grow-1 custom-w">
        <div className="card">
          <div className="d-flex mb-2 px-4 pt-3 justify-content-between">
            <div className="table-title">
              <h5 className="fw-bold py-2">Approvals Report</h5>
            </div>

            {/* Single button to open the consolidated Settings modal */}
            <button
              className="btn btn-secondary p-2"
              onClick={() => setShowModal(true)}
            >
              Settings ⚙️
            </button>
          </div>

          <div className="table-responsive">
            <table
              id="user-group-table"
              className="table table-bordered table-hover"
            >
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
                {/* Filter Row (kept inline) */}
                <tr>
                  {columnsConfig.map(
                    (col) =>
                      col.visible && (
                        <td key={`filter-${col.key}`}>
                          {["creation", "begin", "end"].includes(col.key) ? (
                            <input
                              type="date"
                              className="form-control"
                              name={col.key}
                              value={filters[col.key] || ""}
                              onChange={handleDateFilterChange}
                            />
                          ) : (
                            <input
                              type="text"
                              className="form-control"
                              name={col.key}
                              value={filters[col.key] || ""}
                              placeholder={`Search ${col.label}`}
                              onChange={handleTextFilterChange}
                            />
                          )}
                        </td>
                      )
                  )}
                </tr>

                {currentData.map((row, i) => (
                  <tr key={i}>
                    {columnsConfig
                      .filter((c) => c.visible)
                      .map((col) => (
                        <td key={col.key} className="fs-text-custom">
                          {["creation", "begin", "end"].includes(col.key)
                            ? (() => {
                                const d = parseToDate(row[col.key]);
                                return d ? d.toLocaleString() : "-";
                              })()
                            : row[col.key] || "-"}
                        </td>
                      ))}
                  </tr>
                ))}
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
                <h5 className="modal-title">Approvals – Settings</h5>
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
                          !filters.creation &&
                          !filters.begin &&
                          !filters.end
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
      {showModal && <div className="modal-backdrop fade show" />}
      <div className="content-backdrop fade" />
    </div>
  );
};

export default Approvals;
