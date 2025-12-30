// import React, { useEffect, useState } from "react";
// import { jsPDF } from "jspdf";
// import "jspdf-autotable";
// import * as XLSX from "xlsx";
// import Pagination from "./Common/Pagination";
// import getLogoBase64 from "../utils/getLogoBase64";

// const UsergroupRestrictions = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [totalPages, setTotalPages] = useState(0);
//   const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

//   const defaultColumns = [
//     { label: "Bastion Name", key: "bastionName", visible: true },
//     { label: "Group Name", key: "group_name", visible: true },
//     { label: "Users", key: "users", visible: true },
//     { label: "Restrictions", key: "restrictions", visible: true },
//     { label: "Subprotocol", key: "subprotocol", visible: true },
//     { label: "Action", key: "action", visible: true },
//   ];
//   const [columnsConfig, setColumnsConfig] = useState(defaultColumns);

//   const toggleColumnVisibility = (key) => {
//     setColumnsConfig((prev) =>
//       prev.map((col) =>
//         col.key === key ? { ...col, visible: !col.visible } : col
//       )
//     );
//   };

//   const [filters, setFilters] = useState({
//     group_name: "",
//     users: "",
//     restrictions: "",
//     subprotocol: "",
//     action: "",
//     bastionName: "",
//   });

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await fetch("/api/usergrouprestrictions/fromdb", {
//           headers: { "x-auth-token": localStorage.getItem("token") },
//         });
//         const result = await response.json();
//         setData(result);
//         setTotalPages(Math.ceil(result.length / itemsPerPage));
//       } catch (err) {
//         setError(err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, [itemsPerPage]);

//   const handleItemsPerPageChange = (e) => {
//     setItemsPerPage(Number(e.target.value));
//     setCurrentPage(1);
//   };

//   const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
//   const handleNextPage = () =>
//     setCurrentPage((p) => Math.min(p + 1, totalPages));

//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;

//   const filteredData = data.filter((item) => {
//     return (
//       (!filters.group_name ||
//         item.group_name
//           .toLowerCase()
//           .includes(filters.group_name.toLowerCase())) &&
//       (!filters.users ||
//         item.users
//           .join(", ")
//           .toLowerCase()
//           .includes(filters.users.toLowerCase())) &&
//       (!filters.restrictions ||
//         item.restrictions
//           .toLowerCase()
//           .includes(filters.restrictions.toLowerCase())) &&
//       (!filters.subprotocol ||
//         item.subprotocol
//           .toLowerCase()
//           .includes(filters.subprotocol.toLowerCase())) &&
//       (!filters.bastionName ||
//         item.bastionName
//           .toLowerCase()
//           .includes(filters.bastionName.toLowerCase())) &&
//       (!filters.action ||
//         item.action.toLowerCase().includes(filters.action.toLowerCase()))
//     );
//   });

//   const currentData = filteredData.slice(startIndex, endIndex);

//   const handleFilterChange = (e) => {
//     const { name, value } = e.target;
//     setFilters((prev) => ({ ...prev, [name]: value }));
//   };

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

//         const finalWidth = 35; // smaller width
//         const finalHeight = (logo.height / logo.width) * finalWidth; // maintain aspect ratio
//         const x = pageWidth - finalWidth - 10;
//         const y = 12; // move higher (was 10)

//         doc.addImage(logo.base64, "PNG", x, y, finalWidth, finalHeight);
//       } catch (err) {
//         console.error("Failed to add logo to PDF:", err);
//       }
//     }
//     doc.text(`Username: ${username}`, 15, 10);
//     doc.text("Report: Usergroup Restrictions Report", 15, 20);
//     doc.text(`Date: ${dateStr}`, 15, 30);

//     const visibleCols = columnsConfig.filter((c) => c.visible);
//     const headers = visibleCols.map((c) => c.label);
//     const rows = filteredData.map((item) =>
//       visibleCols.map((c) =>
//         c.key === "users" ? item[c.key].join(", ") : item[c.key] || "-"
//       )
//     );

//     doc.autoTable({
//       head: [headers],
//       body: rows,
//       startY: 40,
//       theme: "grid",
//       headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
//     });

//     doc.save("usergroup_restrictions.pdf");
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
//       ["Report: Usergroup Restrictions Report"],
//       [`Date: ${dateStr}`],
//       [""],
//     ]);

//     const headers = columnsConfig.filter((c) => c.visible).map((c) => c.label);
//     const rows = filteredData.map((item) =>
//       columnsConfig
//         .filter((c) => c.visible)
//         .map((c) =>
//           c.key === "users" ? item[c.key].join(", ") : item[c.key] || "-"
//         )
//     );

//     XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
//     XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
//     XLSX.utils.book_append_sheet(workbook, worksheet, "UsergroupRestrictions");
//     XLSX.writeFile(
//       workbook,
//       `UsergroupRestrictions-${username}-${dateStr}.xlsx`
//     );
//   };

//   useEffect(() => {
//     setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
//   }, [filteredData.length, itemsPerPage]);

//   if (loading)
//     return (
//       <div className="loader-container">
//         <img src="./assets/img/1487.gif" alt="" />
//       </div>
//     );
//   if (error) return <p>Error: {error.message}</p>;

//   return (
//     <div className="content-wrapper">
//       <div className="flex-grow-1 custom-w">
//         <div className="card">
//           <div className="d-flex mb-2 px-4 pt-3 justify-content-between">
//             <div className="table-title">
//               <h5 className="fw-bold py-2">Usergroup Restrictions Report</h5>
//             </div>
//             <div className="download-buttons d-flex align-items-center">
//               <div className="position-relative me-2">
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
//                           <input
//                             type="text"
//                             className="form-control"
//                             name={col.key}
//                             placeholder={`Search ${col.label}`}
//                             onChange={handleFilterChange}
//                           />
//                         </td>
//                       )
//                   )}
//                 </tr>
//                 {currentData.map((row, index) => (
//                   <tr className="border border-1" key={index}>
//                     {columnsConfig.map(
//                       (col) =>
//                         col.visible && (
//                           <td key={col.key} className="fs-text-custom">
//                             {col.key === "users"
//                               ? row[col.key].join(", ")
//                               : row[col.key]}
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

// export default UsergroupRestrictions;
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

const UsergroupRestrictions = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // unified modal
  const [showModal, setShowModal] = useState(false);

  // columns
  const defaultColumns = [
    { label: "Bastion Name", key: "bastionName", visible: true },
    { label: "Group Name", key: "group_name", visible: true },
    { label: "Users", key: "users", visible: true },
    { label: "Restrictions", key: "restrictions", visible: true },
    { label: "Subprotocol", key: "subprotocol", visible: true },
    { label: "Action", key: "action", visible: true },
  ];
  const [columnsConfig, setColumnsConfig] = useState(defaultColumns);
  const toggleColumnVisibility = (key) => {
    setColumnsConfig((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  // filters
  const [filters, setFilters] = useState({
    group_name: "",
    users: "",
    restrictions: "",
    subprotocol: "",
    action: "",
    bastionName: "",
  });

  // global range (server-side if available, else client-side via createdAt/updatedAt)
  const [range, setRange] = useState({ from: "", to: "" }); // yyyy-mm-dd
  const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });
  const [rangeVersion, setRangeVersion] = useState(0); // force refresh

  /* ---------- Fetch (range-aware) ---------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        let list = [];
        if (rangeApplied.from || rangeApplied.to) {
          const qs = new URLSearchParams();
          if (rangeApplied.from) qs.set("from", rangeApplied.from);
          if (rangeApplied.to) qs.set("to", rangeApplied.to);

          // Try a range endpoint if your API supports it
          let resp = await fetch(
            `/api/usergrouprestrictions/range?${qs.toString()}`,
            { headers: { "x-auth-token": token } }
          );

          if (resp.ok) {
            list = await resp.json();
          } else {
            // fallback to /fromdb + client-side date filter by createdAt/updatedAt
            const all = await fetch(`/api/usergrouprestrictions/fromdb`, {
              headers: { "x-auth-token": token },
            });
            if (!all.ok) throw new Error(`HTTP error! status: ${all.status}`);
            const every = await all.json();

            const fromDate = ymdToLocalDate(rangeApplied.from, false);
            const toDate = ymdToLocalDate(rangeApplied.to, true);

            list = every.filter((row) => {
              // try commonly available timestamps; keep row if either falls in range
              const c = parseToDate(row.createdAt);
              const u = parseToDate(row.updatedAt);
              const inC =
                c && (!fromDate || c >= fromDate) && (!toDate || c <= toDate);
              const inU =
                u && (!fromDate || u >= fromDate) && (!toDate || u <= toDate);
              // if neither timestamp exists, drop on ranged view
              return inC || inU;
            });
          }
        } else {
          const resp = await fetch(`/api/usergrouprestrictions/fromdb`, {
            headers: { "x-auth-token": token },
          });
          if (!resp.ok) throw new Error(`HTTP error! status: ${resp.status}`);
          list = await resp.json();
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
  }, [itemsPerPage, rangeApplied.from, rangeApplied.to, rangeVersion]);

  /* ---------- Handlers ---------- */
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };
  const handlePrevPage = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNextPage = () =>
    setCurrentPage((p) => Math.min(p + 1, totalPages));

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
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
  const resetRange = () => {
    setRange({ from: "", to: "" });
    setRangeApplied({ from: "", to: "" });
    setRangeVersion((v) => v + 1);
    setCurrentPage(1);
  };

  /* ---------- Filtering (client-side text) ---------- */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const hasGroup =
        !filters.group_name ||
        (item.group_name || "")
          .toLowerCase()
          .includes(filters.group_name.toLowerCase());

      const hasUsers =
        !filters.users ||
        (Array.isArray(item.users) &&
          item.users
            .join(", ")
            .toLowerCase()
            .includes(filters.users.toLowerCase()));

      const hasRestrictions =
        !filters.restrictions ||
        (item.restrictions || "")
          .toLowerCase()
          .includes(filters.restrictions.toLowerCase());

      const hasSubprotocol =
        !filters.subprotocol ||
        (item.subprotocol || "")
          .toLowerCase()
          .includes(filters.subprotocol.toLowerCase());

      const hasAction =
        !filters.action ||
        (item.action || "")
          .toLowerCase()
          .includes(filters.action.toLowerCase());

      const hasBastion =
        !filters.bastionName ||
        (item.bastionName || "")
          .toLowerCase()
          .includes(filters.bastionName.toLowerCase());

      return (
        hasGroup &&
        hasUsers &&
        hasRestrictions &&
        hasSubprotocol &&
        hasAction &&
        hasBastion
      );
    });
  }, [data, filters]);

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

  /* ---------- Exporters (use filteredData & visible cols) ---------- */
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
    doc.text("Report: Usergroup Restrictions Report", 15, 20);
    doc.text(`Date: ${dateStr}`, 15, 30);

    const visibleCols = columnsConfig.filter((c) => c.visible);
    const headers = visibleCols.map((c) => c.label);
    const rows = filteredData.map((item) =>
      visibleCols.map((c) =>
        c.key === "users"
          ? (Array.isArray(item[c.key])
              ? item[c.key].join(", ")
              : item[c.key]) || "-"
          : item[c.key] ?? "-"
      )
    );

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
    });

    doc.save("usergroup_restrictions.pdf");
  };

  const exportExcel = async () => {
    const dateStr = new Date().toLocaleString();
    const res = await fetch("/api/username", {
      headers: { "x-auth-token": localStorage.getItem("token") },
    });
    const { username } = await res.json();

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Username: ${username}`],
      ["Report: Usergroup Restrictions Report"],
      [`Date: ${dateStr}`],
      [""],
    ]);

    const visibleCols = columnsConfig.filter((c) => c.visible);
    const headers = visibleCols.map((c) => c.label);
    const rows = filteredData.map((item) =>
      visibleCols.map((c) =>
        c.key === "users"
          ? (Array.isArray(item[c.key])
              ? item[c.key].join(", ")
              : item[c.key]) || "-"
          : item[c.key] ?? "-"
      )
    );

    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
    XLSX.utils.book_append_sheet(workbook, worksheet, "UsergroupRestrictions");
    XLSX.writeFile(
      workbook,
      `UsergroupRestrictions-${username}-${dateStr}.xlsx`
    );
  };

  if (loading)
    return (
      <div className="loader-container">
        <img src="./assets/img/1487.gif" alt="" />
      </div>
    );
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div className="content-wrapper">
      <div className="flex-grow-1 custom-w">
        <div className="card">
          <div className="d-flex mb-2 px-4 pt-3 justify-content-between">
            <div className="table-title">
              <h5 className="fw-bold py-2">Usergroup Restrictions Report</h5>
            </div>

            {/* Single Settings button opens the unified modal */}
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
                {/* Filter Row */}
                <tr>
                  {columnsConfig.map(
                    (col) =>
                      col.visible && (
                        <td key={`filter-${col.key}`}>
                          <input
                            type="text"
                            className="form-control"
                            name={col.key}
                            placeholder={`Search ${col.label}`}
                            onChange={handleFilterChange}
                          />
                        </td>
                      )
                  )}
                </tr>

                {/* Data Rows */}
                {currentData.map((row, index) => (
                  <tr className="border border-1" key={index}>
                    {columnsConfig.map(
                      (col) =>
                        col.visible && (
                          <td key={col.key} className="fs-text-custom">
                            {col.key === "users"
                              ? Array.isArray(row[col.key])
                                ? row[col.key].join(", ")
                                : row[col.key] ?? "-"
                              : row[col.key] ?? "-"}
                          </td>
                        )
                    )}
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

      {/* -------- Unified Settings Modal -------- */}
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
                <h5 className="modal-title">
                  Usergroup Restrictions — Settings
                </h5>
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
                        onClick={resetRange}
                        disabled={!rangeApplied.from && !rangeApplied.to}
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
                <div>
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
    </div>
  );
};

export default UsergroupRestrictions;
