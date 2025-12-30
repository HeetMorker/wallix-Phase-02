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
// const DeviceReport = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [totalPages, setTotalPages] = useState(0);
//   const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

//   const defaultColumns = [
//     { label: "Bastion Name", key: "bastionName", visible: true },
//     { label: "Device Name", key: "device_name", visible: true },
//     { label: "Host", key: "host", visible: true },
//     { label: "Last Connection", key: "last_connection", visible: true },
//     { label: "Onboard Status", key: "onboard_status", visible: true },
//     { label: "Tags", key: "tags", visible: true },
//     { label: "Local Domains", key: "local_domains", visible: true },
//     { label: "Service Names", key: "service_names", visible: true },
//     { label: "Protocols", key: "protocols", visible: true },
//     { label: "Ports", key: "ports", visible: true },
//     { label: "Connection Policies", key: "connection_policies", visible: true },
//     { label: "Global Domains", key: "global_domains", visible: true },
//   ];
//   const [columnsConfig, setColumnsConfig] = useState(defaultColumns);

//   const toggleColumnVisibility = (key) => {
//     setColumnsConfig((prev) =>
//       prev.map((col) =>
//         col.key === key ? { ...col, visible: !col.visible } : col
//       )
//     );
//   };

//   // Column filters; last_connection uses yyyy-mm-dd string
//   const [filters, setFilters] = useState({
//     bastionName: "",
//     device_name: "",
//     host: "",
//     last_connection: "",
//     onboard_status: "",
//     tags: "",
//     local_domains: "",
//     service_names: "",
//     protocols: "",
//     ports: "",
//     connection_policies: "",
//     global_domains: "",
//   });

//   // Only apply last_connection filter when complete date is selected
//   const [dateFilters, setDateFilters] = useState({
//     last_connection: null, // Date | null
//   });

//   // Range controls (server-side by last_connection)
//   const [range, setRange] = useState({ from: "", to: "" }); // yyyy-mm-dd
//   const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });
//   const [rangeVersion, setRangeVersion] = useState(0); // force refresh

//   /* ---------- Fetch (range-aware) ---------- */
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       try {
//         const token = localStorage.getItem("token");
//         let resp;

//         if (rangeApplied.from || rangeApplied.to) {
//           const qs = new URLSearchParams();
//           if (rangeApplied.from) qs.set("from", rangeApplied.from);
//           if (rangeApplied.to) qs.set("to", rangeApplied.to);

//           resp = await fetch(`/api/devicereport/range?${qs.toString()}`, {
//             headers: { "x-auth-token": token },
//           });

//           if (!resp.ok) {
//             // fallback to all + client-side filter
//             resp = await fetch(`/api/devicereport/fromdb`, {
//               headers: { "x-auth-token": token },
//             });
//           }
//         } else {
//           resp = await fetch(`/api/devicereport/fromdb`, {
//             headers: { "x-auth-token": token },
//           });
//         }

//         if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
//         let list = await resp.json();

//         // client-side fallback if we had to use /fromdb for range
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

//         // Flatten arrays for display (unchanged behavior)
//         const processed = (list || []).map((d) => ({
//           ...d,
//           tags: (d.tags || []).join(", "),
//           local_domains: (d.local_domains || []).join(", "),
//           service_names: (d.services || [])
//             .map((s) => s.service_name)
//             .join(", "),
//           protocols: (d.services || []).map((s) => s.protocol).join(", "),
//           ports: (d.services || []).map((s) => s.port).join(", "),
//           connection_policies: (d.services || [])
//             .map((s) => s.connection_policy)
//             .join(", "),
//           global_domains: (d.services || [])
//             .map((s) => (s.global_domains || []).join("; ") || "-")
//             .join(" | "),
//         }));

//         setData(processed);
//         setTotalPages(Math.ceil(processed.length / itemsPerPage));
//         setError(null);
//       } catch (err) {
//         setError(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//     // rangeVersion ensures refresh even if same dates re-applied
//   }, [itemsPerPage, rangeApplied.from, rangeApplied.to, rangeVersion]);

//   /* ---------- Handlers ---------- */
//   const handleItemsPerPageChange = (e) => {
//     setItemsPerPage(Number(e.target.value));
//     setCurrentPage(1);
//   };

//   const handleTextFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//     setCurrentPage(1);
//   };

//   const handleDateFilterChange = (e) => {
//     const { name, value, valueAsDate } = e.target; // name = 'last_connection'
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
//     setFilters((prev) => ({ ...prev, last_connection: "" }));
//     setDateFilters({ last_connection: null });
//     setRangeVersion((v) => v + 1);
//     setCurrentPage(1);
//   };

//   /* ---------- Client-side filters ---------- */
//   const filteredData = useMemo(() => {
//     return data.filter((item) => {
//       if (!textIncludes(item.bastionName, filters.bastionName)) return false;
//       if (!textIncludes(item.device_name, filters.device_name)) return false;
//       if (!textIncludes(item.host, filters.host)) return false;
//       if (!textIncludes(item.onboard_status, filters.onboard_status))
//         return false;
//       if (!textIncludes(item.tags, filters.tags)) return false;
//       if (!textIncludes(item.local_domains, filters.local_domains))
//         return false;
//       if (!textIncludes(item.service_names, filters.service_names))
//         return false;
//       if (!textIncludes(item.protocols, filters.protocols)) return false;
//       if (!textIncludes(item.ports, filters.ports)) return false;
//       if (!textIncludes(item.connection_policies, filters.connection_policies))
//         return false;
//       if (!textIncludes(item.global_domains, filters.global_domains))
//         return false;

//       // Date column: only apply when full date selected
//       if (dateFilters.last_connection) {
//         const d = parseToDate(item.last_connection);
//         const s = ymdToLocalDate(filters.last_connection, false);
//         const e = ymdToLocalDate(filters.last_connection, true);
//         if (!d || d < s || d > e) return false;
//       }

//       return true;
//     });
//   }, [data, filters, dateFilters]);

//   // pagination
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;
//   const currentData = useMemo(
//     () => filteredData.slice(startIndex, endIndex),
//     [filteredData, startIndex, endIndex]
//   );

//   useEffect(() => {
//     setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
//   }, [filteredData.length, itemsPerPage]);

//   /* ---------- Exporters (WYSIWYG) ---------- */
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
//     doc.text("Report: Device Report", 15, 20);
//     doc.text(`Date: ${dateStr}`, 15, 30);

//     const visibleCols = columnsConfig.filter((col) => col.visible);
//     const headers = visibleCols.map((c) => c.label);
//     const rows = filteredData.map((item) =>
//       visibleCols.map((c) =>
//         c.key === "last_connection"
//           ? (() => {
//               const d = parseToDate(item[c.key]);
//               return d ? d.toLocaleString() : "-";
//             })()
//           : item[c.key] ?? "-"
//       )
//     );

//     const columnStyles = {};
//     visibleCols.forEach((col, idx) => {
//       columnStyles[idx] =
//         col.key === "device_name"
//           ? { cellWidth: 35 }
//           : col.key === "host"
//           ? { cellWidth: 20 }
//           : col.key === "last_connection"
//           ? { cellWidth: 40 }
//           : { cellWidth: 20 };
//     });

//     doc.autoTable({
//       head: [headers],
//       body: rows,
//       startY: 40,
//       theme: "grid",
//       headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
//       styles: { fontSize: 8 },
//       columnStyles,
//     });

//     doc.save("deviceReport.pdf");
//   };

//   const exportExcel = async () => {
//     const workbook = XLSX.utils.book_new();
//     const worksheet = XLSX.utils.aoa_to_sheet([]);

//     let res = await fetch("/api/username", {
//       headers: { "x-auth-token": localStorage.getItem("token") },
//     });
//     const { username } = await res.json();
//     const dateStr = new Date().toLocaleString();

//     XLSX.utils.sheet_add_aoa(worksheet, [
//       [`Username: ${username}`],
//       ["Report: Device Report"],
//       [`Date: ${dateStr}`],
//       [""],
//     ]);

//     const visibleCols = columnsConfig.filter((col) => col.visible);
//     const headers = visibleCols.map((c) => c.label);
//     const rows = filteredData.map((item) =>
//       visibleCols.map((c) =>
//         c.key === "last_connection"
//           ? (() => {
//               const d = parseToDate(item[c.key]);
//               return d ? d.toLocaleString() : "-";
//             })()
//           : item[c.key] ?? "-"
//       )
//     );

//     XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
//     XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
//     XLSX.utils.book_append_sheet(workbook, worksheet, "DeviceReport");
//     XLSX.writeFile(workbook, `devicereport-${username}-${dateStr}.xlsx`);
//   };

//   if (loading)
//     return (
//       <div className="loader-container">
//         <img src="./assets/img/1487.gif" alt="Loading..." />
//       </div>
//     );
//   if (error) return <p>{error.message}</p>;

//   return (
//     <div className="content-wrapper">
//       <div className="flex-grow-1 custom-w">
//         <div className="card">
//           <div className="d-flex mb-2 px-4 pt-3 justify-content-between">
//             <h5 className="fw-bold py-2">Device Report</h5>

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

//               {/* Settings / Exports / Page size */}
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
//                     style={{ zIndex: 10, top: "45px", left: 0, width: "250px" }}
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

//               <button className="btn btn-primary me-2" onClick={exportExcel}>
//                 Excel
//               </button>
//               <button className="btn btn-primary me-2" onClick={exportPDF}>
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
//                   {columnsConfig
//                     .filter((c) => c.visible)
//                     .map((col) => (
//                       <th className="fw-bold fs-custom" key={col.key}>
//                         {col.label}
//                       </th>
//                     ))}
//                 </tr>
//               </thead>
//               <tbody>
//                 {/* Filter Row */}
//                 <tr>
//                   {columnsConfig
//                     .filter((c) => c.visible)
//                     .map((col) => (
//                       <td key={`filter-${col.key}`}>
//                         {col.key === "last_connection" ? (
//                           <input
//                             type="date"
//                             className="form-control"
//                             name={col.key}
//                             value={filters[col.key]}
//                             onChange={handleDateFilterChange}
//                           />
//                         ) : (
//                           <input
//                             type="text"
//                             className="form-control"
//                             name={col.key}
//                             value={filters[col.key]}
//                             placeholder={`Search ${col.label}`}
//                             onChange={handleTextFilterChange}
//                           />
//                         )}
//                       </td>
//                     ))}
//                 </tr>

//                 {/* Data Rows */}
//                 {currentData.map((item, index) => (
//                   <tr key={index}>
//                     {columnsConfig
//                       .filter((c) => c.visible)
//                       .map((col) => (
//                         <td key={col.key} className="fs-text-custom">
//                           {col.key === "last_connection"
//                             ? (() => {
//                                 const d = parseToDate(item[col.key]);
//                                 return d ? d.toLocaleString() : "-";
//                               })()
//                             : item[col.key] ?? "-"}
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
//             onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
//             onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
//             setCurrentPage={setCurrentPage}
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DeviceReport;
// src/components/DeviceReport.jsx
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
const DeviceReport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const defaultColumns = [
    { label: "Bastion Name", key: "bastionName", visible: true },
    { label: "Device Name", key: "device_name", visible: true },
    { label: "Host", key: "host", visible: true },
    { label: "Last Connection", key: "last_connection", visible: true },
    { label: "Onboard Status", key: "onboard_status", visible: true },
    { label: "Tags", key: "tags", visible: true },
    { label: "Local Domains", key: "local_domains", visible: true },
    { label: "Service Names", key: "service_names", visible: true },
    { label: "Protocols", key: "protocols", visible: true },
    { label: "Ports", key: "ports", visible: true },
    { label: "Connection Policies", key: "connection_policies", visible: true },
    { label: "Global Domains", key: "global_domains", visible: true },
  ];
  const [columnsConfig, setColumnsConfig] = useState(defaultColumns);

  // NEW: single Settings modal
  const [showModal, setShowModal] = useState(false);

  const toggleColumnVisibility = (key) => {
    setColumnsConfig((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  // Column filters; last_connection uses yyyy-mm-dd string
  const [filters, setFilters] = useState({
    bastionName: "",
    device_name: "",
    host: "",
    last_connection: "",
    onboard_status: "",
    tags: "",
    local_domains: "",
    service_names: "",
    protocols: "",
    ports: "",
    connection_policies: "",
    global_domains: "",
  });

  // Only apply last_connection filter when complete date is selected
  const [dateFilters, setDateFilters] = useState({
    last_connection: null, // Date | null
  });

  // Range controls (server-side by last_connection)
  const [range, setRange] = useState({ from: "", to: "" }); // yyyy-mm-dd
  const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });
  const [rangeVersion, setRangeVersion] = useState(0); // force refresh

  /* ---------- Fetch (range-aware) ---------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        let resp;

        if (rangeApplied.from || rangeApplied.to) {
          const qs = new URLSearchParams();
          if (rangeApplied.from) qs.set("from", rangeApplied.from);
          if (rangeApplied.to) qs.set("to", rangeApplied.to);

          resp = await fetch(`/api/devicereport/range?${qs.toString()}`, {
            headers: { "x-auth-token": token },
          });

          if (!resp.ok) {
            // fallback to all + client-side filter
            resp = await fetch(`/api/devicereport/fromdb`, {
              headers: { "x-auth-token": token },
            });
          }
        } else {
          resp = await fetch(`/api/devicereport/fromdb`, {
            headers: { "x-auth-token": token },
          });
        }

        if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
        let list = await resp.json();

        // client-side fallback if we had to use /fromdb for range
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

        // Flatten arrays for display (unchanged behavior)
        const processed = (list || []).map((d) => ({
          ...d,
          tags: (d.tags || []).join(", "),
          local_domains: (d.local_domains || []).join(", "),
          service_names: (d.services || [])
            .map((s) => s.service_name)
            .join(", "),
          protocols: (d.services || []).map((s) => s.protocol).join(", "),
          ports: (d.services || []).map((s) => s.port).join(", "),
          connection_policies: (d.services || [])
            .map((s) => s.connection_policy)
            .join(", "),
          global_domains: (d.services || [])
            .map((s) => (s.global_domains || []).join("; ") || "-")
            .join(" | "),
        }));

        setData(processed);
        setTotalPages(Math.ceil(processed.length / itemsPerPage));
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // rangeVersion ensures refresh even if same dates re-applied
  }, [itemsPerPage, rangeApplied.from, rangeApplied.to, rangeVersion]);

  /* ---------- Handlers ---------- */
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleTextFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleDateFilterChange = (e) => {
    const { name, value, valueAsDate } = e.target; // name = 'last_connection'
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
    setFilters((prev) => ({ ...prev, last_connection: "" }));
    setDateFilters({ last_connection: null });
    setRangeVersion((v) => v + 1);
    setCurrentPage(1);
  };

  /* ---------- Client-side filters ---------- */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!textIncludes(item.bastionName, filters.bastionName)) return false;
      if (!textIncludes(item.device_name, filters.device_name)) return false;
      if (!textIncludes(item.host, filters.host)) return false;
      if (!textIncludes(item.onboard_status, filters.onboard_status))
        return false;
      if (!textIncludes(item.tags, filters.tags)) return false;
      if (!textIncludes(item.local_domains, filters.local_domains))
        return false;
      if (!textIncludes(item.service_names, filters.service_names))
        return false;
      if (!textIncludes(item.protocols, filters.protocols)) return false;
      if (!textIncludes(item.ports, filters.ports)) return false;
      if (!textIncludes(item.connection_policies, filters.connection_policies))
        return false;
      if (!textIncludes(item.global_domains, filters.global_domains))
        return false;

      // Date column: only apply when full date selected
      if (dateFilters.last_connection) {
        const d = parseToDate(item.last_connection);
        const s = ymdToLocalDate(filters.last_connection, false);
        const e = ymdToLocalDate(filters.last_connection, true);
        if (!d || d < s || d > e) return false;
      }

      return true;
    });
  }, [data, filters, dateFilters]);

  // pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = useMemo(
    () => filteredData.slice(startIndex, endIndex),
    [filteredData, startIndex, endIndex]
  );

  useEffect(() => {
    setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
  }, [filteredData.length, itemsPerPage]);

  /* ---------- Exporters (WYSIWYG) ---------- */
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
    doc.text("Report: Device Report", 15, 20);
    doc.text(`Date: ${dateStr}`, 15, 30);

    const visibleCols = columnsConfig.filter((col) => col.visible);
    const headers = visibleCols.map((c) => c.label);
    const rows = filteredData.map((item) =>
      visibleCols.map((c) =>
        c.key === "last_connection"
          ? (() => {
              const d = parseToDate(item[c.key]);
              return d ? d.toLocaleString() : "-";
            })()
          : item[c.key] ?? "-"
      )
    );

    const columnStyles = {};
    visibleCols.forEach((col, idx) => {
      columnStyles[idx] =
        col.key === "device_name"
          ? { cellWidth: 35 }
          : col.key === "host"
          ? { cellWidth: 20 }
          : col.key === "last_connection"
          ? { cellWidth: 40 }
          : { cellWidth: 20 };
    });

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
      styles: { fontSize: 8 },
      columnStyles,
    });

    doc.save("deviceReport.pdf");
  };

  const exportExcel = async () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    let res = await fetch("/api/username", {
      headers: { "x-auth-token": localStorage.getItem("token") },
    });
    const { username } = await res.json();
    const dateStr = new Date().toLocaleString();

    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Username: ${username}`],
      ["Report: Device Report"],
      [`Date: ${dateStr}`],
      [""],
    ]);

    const visibleCols = columnsConfig.filter((col) => col.visible);
    const headers = visibleCols.map((c) => c.label);
    const rows = filteredData.map((item) =>
      visibleCols.map((c) =>
        c.key === "last_connection"
          ? (() => {
              const d = parseToDate(item[c.key]);
              return d ? d.toLocaleString() : "-";
            })()
          : item[c.key] ?? "-"
      )
    );

    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
    XLSX.utils.book_append_sheet(workbook, worksheet, "DeviceReport");
    XLSX.writeFile(workbook, `devicereport-${username}-${dateStr}.xlsx`);
  };

  if (loading)
    return (
      <div className="loader-container">
        <img src="./assets/img/1487.gif" alt="Loading..." />
      </div>
    );
  if (error) return <p>{error.message}</p>;

  return (
    <div className="content-wrapper">
      <div className="flex-grow-1 custom-w">
        <div className="card">
          <div className="d-flex mb-2 px-4 pt-3 justify-content-between">
            <h5 className="fw-bold py-2">Device Report</h5>

            {/* One button opens the consolidated Settings modal */}
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
                  {columnsConfig
                    .filter((c) => c.visible)
                    .map((col) => (
                      <th className="fw-bold fs-custom" key={col.key}>
                        {col.label}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {/* Filter Row */}
                <tr>
                  {columnsConfig
                    .filter((c) => c.visible)
                    .map((col) => (
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
                            value={filters[col.key]}
                            placeholder={`Search ${col.label}`}
                            onChange={handleTextFilterChange}
                          />
                        )}
                      </td>
                    ))}
                </tr>

                {/* Data Rows */}
                {currentData.map((item, index) => (
                  <tr key={index}>
                    {columnsConfig
                      .filter((c) => c.visible)
                      .map((col) => (
                        <td key={col.key} className="fs-text-custom">
                          {col.key === "last_connection"
                            ? (() => {
                                const d = parseToDate(item[col.key]);
                                return d ? d.toLocaleString() : "-";
                              })()
                            : item[col.key] ?? "-"}
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
            onPrev={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            onNext={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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
                <h5 className="modal-title">Device Report – Settings</h5>
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

export default DeviceReport;
