// src/components/UserGroupMapping.js

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
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

const UserGroupMaping = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // unified Settings modal
  const [showModal, setShowModal] = useState(false);

  const defaultColumns = [
    { label: "Bastion Name", key: "bastionName", visible: true },
    { label: "User Group", key: "user_group", visible: true },
    { label: "Target Group", key: "target_group", visible: true },
    { label: "Device", key: "devices", visible: true },
    { label: "Host", key: "host", visible: true },
    { label: "Protocol", key: "protocol", visible: true },
    { label: "Users", key: "users", visible: true },
    { label: "External Group", key: "external_group", visible: true },
  ];
  const [columnsConfig, setColumnsConfig] = useState(defaultColumns);

  const toggleColumnVisibility = (key) => {
    setColumnsConfig((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  // text filters
  const [filters, setFilters] = useState({
    user_group: "",
    target_group: "",
    devices: "",
    host: "",
    protocol: "",
    users: "",
    external_group: "",
    bastionName: "",
  });

  // range (by createdAt/updatedAt on server; client fallback if needed)
  const [range, setRange] = useState({ from: "", to: "" }); // yyyy-mm-dd
  const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });
  const [rangeVersion, setRangeVersion] = useState(0); // force refresh on Apply

  /* ---------- Fetch (range-aware) ---------- */
  useEffect(() => {
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

          // server-side range by createdAt/updatedAt
          try {
            const resp = await axios.get(`/api/report/range?${qs.toString()}`, {
              headers: { "x-auth-token": token },
            });
            list = Array.isArray(resp.data) ? resp.data : [];
          } catch {
            usedFromDbFallback = true;
            const resp2 = await axios.get(`/api/report/fromdb`, {
              headers: { "x-auth-token": token },
            });
            list = Array.isArray(resp2.data) ? resp2.data : [];
          }

          // Client-side fallback range if we had to use /fromdb
          if (usedFromDbFallback) {
            const fromDate = ymdToLocalDate(rangeApplied.from, false);
            const toDate = ymdToLocalDate(rangeApplied.to, true);
            list = list.filter((row) => {
              const created = parseToDate(row.createdAt);
              const updated = parseToDate(row.updatedAt);
              // If either timestamp is in range, keep it
              const inCreated =
                created &&
                (!fromDate || created >= fromDate) &&
                (!toDate || created <= toDate);
              const inUpdated =
                updated &&
                (!fromDate || updated >= fromDate) &&
                (!toDate || updated <= toDate);
              return inCreated || inUpdated;
            });
          }
        } else {
          // No range => fetch all
          const resp = await axios.get(`/api/report/fromdb`, {
            headers: { "x-auth-token": token },
          });
          list = Array.isArray(resp.data) ? resp.data : [];
        }

        setReportData(list);
        setTotalPages(Math.ceil(list.length / itemsPerPage));
        setError(null);
      } catch (error) {
        console.error("Error fetching report:", error);
        setError("Failed to fetch report data");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [itemsPerPage, rangeApplied.from, rangeApplied.to, rangeVersion]);

  /* ---------- Handlers ---------- */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
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
    setRangeVersion((v) => v + 1);
    setCurrentPage(1);
  };

  const resetRange = () => {
    setRange({ from: "", to: "" });
    setRangeApplied({ from: "", to: "" });
    setRangeVersion((v) => v + 1);
    setCurrentPage(1);
  };

  /* ---------- Filtering (client-side for text fields) ---------- */
  const filteredData = useMemo(() => {
    return reportData.filter((item) =>
      Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const itemVal = item[key];
        if (typeof itemVal === "string") {
          return itemVal.toLowerCase().includes(value.toLowerCase());
        } else if (typeof itemVal === "number") {
          return itemVal.toString().includes(value);
        }
        return false;
      })
    );
  }, [reportData, filters]);

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

  /* ---------- Exporters (use filteredData for WYSIWYG) ---------- */
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
    doc.text("Report: User Group Mapping", 15, 20);
    doc.text(`Date: ${dateStr}`, 15, 30);

    const visibleCols = columnsConfig.filter((col) => col.visible);
    const headers = visibleCols.map((c) => c.label);
    const rows = filteredData.map((item) =>
      visibleCols.map((c) => item[c.key] ?? "-")
    );

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
    });

    doc.save("user-group-mapping.pdf");
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
      ["Report: User Group Mapping"],
      [`Date: ${dateStr}`],
      [""],
    ]);

    const headers = columnsConfig.filter((c) => c.visible).map((c) => c.label);
    const rows = filteredData.map((item) =>
      columnsConfig.filter((c) => c.visible).map((c) => item[c.key] ?? "-")
    );

    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Group Mapping");
    XLSX.writeFile(workbook, `UserGroupMapping-${username}-${dateStr}.xlsx`);
  };

  if (loading)
    return (
      <div className="loader-container">
        <img src="./assets/img/1487.gif" alt="Loading..." />
      </div>
    );
  if (error) return <p>{error}</p>;

  return (
    <div className="content-wrapper">
      <div className="flex-grow-1 custom-w">
        <div className="card">
          <div className="d-flex mb-2 px-4 pt-3 justify-content-between">
            <div className="table-title">
              <h5 className="fw-bold py-2">UserGroup Mapping Report</h5>
            </div>

            {/* Single Settings Button -> Modal */}
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
              <tbody className="border border-1">
                {/* Filter Row */}
                <tr>
                  {columnsConfig
                    .filter((c) => c.visible)
                    .map((col) => (
                      <td key={`filter-${col.key}`}>
                        <input
                          type="text"
                          className="form-control"
                          name={col.key}
                          placeholder={`Search ${col.label}`}
                          onChange={handleFilterChange}
                        />
                      </td>
                    ))}
                </tr>

                {/* Data Rows */}
                {currentData.map((group, index) => (
                  <tr className="border border-1" key={index}>
                    {columnsConfig
                      .filter((c) => c.visible)
                      .map((col) => (
                        <td key={col.key} className="fs-text-custom">
                          {group[col.key] ?? "-"}
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

      {/* -------- Settings Modal (Date Range, Visible Columns, Export, Page Size) -------- */}
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
                <h5 className="modal-title">User Group Mapping — Settings</h5>
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
                  <small className="text-muted d-block mb-2">
                    Filters server-side by <em>createdAt/updatedAt</em> when
                    available; otherwise falls back to client-side filtering.
                  </small>
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

export default UserGroupMaping;
