
// src/components/UserActivity.jsx
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

const UserActivity = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const defaultColumns = [
    { label: "bastion Name", key: "bastionName", visible: true },
    { label: "Username", key: "username", visible: true },
    { label: "Target Account", key: "target_account", visible: true },
    { label: "Target Host", key: "target_host", visible: true },
    { label: "Protocol", key: "target_protocol", visible: true },
    { label: "Start Time", key: "begin", visible: true },
    { label: "End Time", key: "end", visible: true },
    { label: "Target Group", key: "target_group", visible: true },
  ];
  const [columnsConfig, setColumnsConfig] = useState(defaultColumns);

  // unified Settings modal
  const [showModal, setShowModal] = useState(false);

  const toggleColumnVisibility = (key) => {
    setColumnsConfig((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  // Column filters (strings for UI)
  const [filters, setFilters] = useState({
    bastionName: "",
    username: "",
    target_account: "",
    target_host: "",
    target_protocol: "",
    begin: "", // yyyy-mm-dd
    end: "", // yyyy-mm-dd
    target_group: "",
  });

  // Only apply date filter when full date is selected
  const [dateFilters, setDateFilters] = useState({
    begin: null, // Date | null
    end: null, // Date | null
  });

  // Global range (server-side by 'begin' first, then 'end'; fallback client-side)
  const [range, setRange] = useState({ from: "", to: "" }); // yyyy-mm-dd
  const [rangeApplied, setRangeApplied] = useState({ from: "", to: "" });
  const [rangeVersion, setRangeVersion] = useState(0); // force refresh even if dates unchanged

  /* ---------- Fetch (range-aware) ---------- */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        let list = [];
        let usedFromDbFallback = false;

        if (rangeApplied.from || rangeApplied.to) {
          const qs = new URLSearchParams();
          if (rangeApplied.from) qs.set("from", rangeApplied.from);
          if (rangeApplied.to) qs.set("to", rangeApplied.to);

          // Try by=begin first, then by=end
          let response = await fetch(
            `/api/sessions/range?${qs.toString()}&by=begin`,
            { headers: { "x-auth-token": token } }
          );
          if (response.ok) {
            list = await response.json();
          } else {
            list = [];
          }

          if (Array.isArray(list) && list.length === 0) {
            const resp2 = await fetch(
              `/api/sessions/range?${qs.toString()}&by=end`,
              { headers: { "x-auth-token": token } }
            );
            if (resp2.ok) {
              const alt = await resp2.json();
              if (Array.isArray(alt)) list = alt;
            }
          }

          // Fallback to /fromdb + client range (by begin)
          if (!Array.isArray(list) || list.length === 0) {
            usedFromDbFallback = true;
            const rAll = await fetch(`/api/sessions/fromdb`, {
              headers: { "x-auth-token": token },
            });
            if (!rAll.ok) throw new Error(`HTTP error! status: ${rAll.status}`);
            list = await rAll.json();
          }

          if (usedFromDbFallback) {
            const fromDate = ymdToLocalDate(rangeApplied.from, false);
            const toDate = ymdToLocalDate(rangeApplied.to, true);
            list = list.filter((row) => {
              const d = parseToDate(row.begin);
              if (!d) return false;
              if (fromDate && d < fromDate) return false;
              if (toDate && d > toDate) return false;
              return true;
            });
          }
        } else {
          // No range -> all
          const response = await fetch(`/api/sessions/fromdb`, {
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

    fetchData();
    // rangeVersion forces refresh even if same dates are applied
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
    const { name, value, valueAsDate } = e.target; // 'begin' or 'end'
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

  const resetRange = () => {
    setRange({ from: "", to: "" });
    setRangeApplied({ from: "", to: "" });
    setRangeVersion((v) => v + 1);
    setCurrentPage(1);
  };

  /* ---------- Filtering (client-side) ---------- */
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      if (!textIncludes(item.bastionName, filters.bastionName)) return false;
      if (!textIncludes(item.username, filters.username)) return false;
      if (!textIncludes(item.target_account, filters.target_account))
        return false;
      if (!textIncludes(item.target_host, filters.target_host)) return false;
      if (!textIncludes(item.target_protocol, filters.target_protocol))
        return false;
      if (!textIncludes(item.target_group, filters.target_group)) return false;

      // Date columns (apply only when a full date is selected)
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
    doc.text("Report: User Activity", 15, 20);
    doc.text(`Date: ${dateStr}`, 15, 30);

    const visibleCols = columnsConfig.filter((c) => c.visible);
    const headers = visibleCols.map((c) => c.label);
    const rows = filteredData.map((item) =>
      visibleCols.map((col) => {
        const key = col.key;
        if (key === "begin" || key === "end") {
          const d = parseToDate(item[key]);
          return d ? d.toLocaleString() : "-";
        }
        return item[key] ?? "-";
      })
    );

    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" },
    });

    doc.save("user-activity.pdf");
  };

  const exportExcel = async () => {
    const dateStr = new Date().toLocaleString();

    let res = await fetch("/api/username", {
      headers: { "x-auth-token": localStorage.getItem("token") },
    });
    res = await res.json();

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Username: ${res.username}`],
      ["Report: User Activity Report"],
      [`Date: ${dateStr}`],
      [""],
    ]);

    const visibleCols = columnsConfig.filter((c) => c.visible);
    const headers = visibleCols.map((c) => c.label);
    const rows = filteredData.map((item) =>
      visibleCols.map((col) => {
        const key = col.key;
        if (key === "begin" || key === "end") {
          const d = parseToDate(item[key]);
          return d ? d.toLocaleString() : "-";
        }
        return item[key] ?? "-";
      })
    );

    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Activity");
    XLSX.writeFile(workbook, `UserActivity-${res.username}-${dateStr}.xlsx`);
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
            <div className="table-title">
              <h5 className="fw-bold py-2">User Activity Report</h5>
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
                {/* Filter row */}
                <tr>
                  {columnsConfig.map(
                    (col) =>
                      col.visible && (
                        <td key={`filter-${col.key}`}>
                          {["begin", "end"].includes(col.key) ? (
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

                {currentData.map((row, index) => (
                  <tr className="border border-1" key={index}>
                    {columnsConfig.map(
                      (col) =>
                        col.visible && (
                          <td key={col.key} className="fs-text-custom">
                            {["begin", "end"].includes(col.key)
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
                <h5 className="modal-title">User Activity — Settings</h5>
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

export default UserActivity;
