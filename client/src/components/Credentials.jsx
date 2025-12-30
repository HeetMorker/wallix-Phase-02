import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Pagination from "./Common/Pagination";

const SplunkData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  // State for filters
  const [filters, setFilters] = useState({
    type: "",
    action: "",
    account: "",
    result: "",
    reason: "",
    time: "",
    age: "",
    host: "",
    target_server: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/credentials", {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
        setTotalPages(Math.ceil(result.length / itemsPerPage));
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [itemsPerPage]);

  useEffect(() => {
    setTotalPages(Math.ceil(data.length / itemsPerPage));
  }, [data, itemsPerPage]);

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => Math.max(prevPage - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => Math.min(prevPage + 1, totalPages));
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Apply filtering before pagination
  const filteredData = data.filter((item) => {
    return (
      (!filters.type ||
        item.type.toLowerCase().includes(filters.type.toLowerCase())) &&
      (!filters.action ||
        item.action.toLowerCase().includes(filters.action.toLowerCase())) &&
      (!filters.account ||
        item.account.toLowerCase().includes(filters.account.toLowerCase())) &&
      (!filters.result ||
        item.result.toLowerCase().includes(filters.result.toLowerCase())) &&
      (!filters.reason ||
        item.reason.toLowerCase().includes(filters.reason.toLowerCase())) &&
      (!filters.time ||
        item.date.toLowerCase().includes(filters.time.toLowerCase())) &&
      (!filters.target_server ||
        item.date
          .toLowerCase()
          .includes(filters.target_server.toLowerCase())) &&
      (!filters.age || item.age.toString().includes(filters.age)) &&
      (!filters.host ||
        item.host.toLowerCase().includes(filters.host.toLowerCase()))
    );
  });

  const currentData = filteredData.slice(startIndex, endIndex);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const exportPDF = async () => {
    const doc = new jsPDF("landscape");

    const currentDate = new Date();
    const dateStr = currentDate.toLocaleString();

    let res = await fetch("/api/username", {
      headers: {
        "x-auth-token": localStorage.getItem("token"),
      },
    });
    res = await res.json();

    const logoUrl = "assets/img/Mechsoft-Logo.png";
    doc.addImage(logoUrl, "PNG", 250, 10, 30, 13);
    doc.text(`Username: ${res.username}`, 15, 10);
    doc.text("Report: Credentials", 15, 20);
    doc.text(`Date: ${dateStr}`, 15, 30);

    const keysToExclude = ["_id", "__v", "createdAt", "updatedAt", "ipAddress"];
    const columns = [
      "Type",
      "Action",
      "Account",
      "Result",
      "Reason",
      "Time",
      "Age",
      "Host",
      "Target Server",
    ];
    // const rows = filteredData.map((item) => columns.map((col) => item[col]));
    const rows = data.map((item) => [
      item.type,
      item.action,
      item.account,
      item.result,
      item.reason,
      item.date,
      item.age,
      item.host,
      item.target_server,
      // new Date(item.last_connection).toLocaleString(),
    ]);

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" }, // Theme Color
    });

    doc.save("credentials.pdf");
  };

  // const exportExcel = async () => {
  //   const currentDate = new Date();
  //   const dateStr = currentDate.toLocaleString();

  //   let res = await fetch("/api/username", {
  //     headers: {
  //       "x-auth-token": localStorage.getItem("token"),
  //     },
  //   });
  //   res = await res.json();
  //   const worksheet = XLSX.utils.json_to_sheet(filteredData);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "AOCR");
  //   XLSX.writeFile(workbook, `AOCR-${res.username}-${dateStr}.xlsx`);
  // };

  const exportExcel = async () => {
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleString();

    let res = await fetch("/api/username", {
      headers: {
        "x-auth-token": localStorage.getItem("token"),
      },
    });
    res = await res.json();

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet([]);

    // Add Report Metadata at the Top
    XLSX.utils.sheet_add_aoa(worksheet, [
      [`Username: ${res.username}`],
      ["Report: Credentials"],
      [`Date: ${dateStr}`],
      [""], // Empty row for spacing
    ]);

    // Define Headers
    const headers = [
      "Type",
      "Action",
      "Account",
      "Result",
      "Reason",
      "Time",
      "Age",
      "Host",
      "Target Server",
    ];

    // Convert Data to Row Format
    const rows = data.map((item) => [
      item.type,
      item.action,
      item.account,
      item.result,
      item.reason,
      item.date,
      item.age,
      item.host,
      item.target_server,
    ]);

    // Add Headers and Data to Worksheet
    XLSX.utils.sheet_add_aoa(worksheet, [headers], { origin: "A5" });
    XLSX.utils.sheet_add_aoa(worksheet, rows, { origin: "A6" });

    // Style Headers (Bold & Background Color)
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: 4, c: col });
      if (!worksheet[cellRef]) continue;
      worksheet[cellRef].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "EC6708" } }, // Theme Color
        alignment: { horizontal: "center" },
      };
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, "Credentials");
    XLSX.writeFile(workbook, `credentials-${res.username}-${dateStr}.xlsx`);
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
      <div className=" flex-grow-1 custom-w">
        <div className="card">
          <div className="d-flex mb-2 px-4 pt-3 justify-content-between">
            <div className="table-title">
              <h5 className="fw-bold py-2">Credentials</h5>
            </div>
            <div className="download-buttons d-flex align-items-center">
              <button
                className="btn btn-primary me-2 p-2"
                onClick={exportExcel}
              >
                Excel
              </button>
              <button className="btn btn-primary me-2 p-2" onClick={exportPDF}>
                PDF
              </button>
              <div className="d-flex justify-content-end mb-2">
                <label className="me-2">Show:</label>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table
              id="user-group-table"
              className="table table-bordered table-hover"
            >
              <thead>
                <tr>
                  <th className="fw-bold fs-6">Type</th>
                  <th className="fw-bold fs-6">Action</th>
                  <th className="fw-bold fs-6">Account</th>
                  <th className="fw-bold fs-6">Result</th>
                  <th className="fw-bold fs-6">Reason</th>
                  <th className="fw-bold fs-6">Time</th>
                  <th className="fw-bold fs-6">Age</th>
                  <th className="fw-bold fs-6">Host</th>
                  <th className="fw-bold fs-6">Target Server</th>
                </tr>
              </thead>
              <tbody className="border border-1">
                <tr>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      name="type"
                      placeholder="Search type"
                      value={filters.type}
                      onChange={handleFilterChange}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      name="action"
                      placeholder="Search action"
                      value={filters.action}
                      onChange={handleFilterChange}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      name="account"
                      placeholder="Search account"
                      value={filters.account}
                      onChange={handleFilterChange}
                    />
                  </td>
                  <td>
                    <select
                      className="form-select"
                      name="result"
                      value={filters.result}
                      onChange={handleFilterChange}
                    >
                      <option value="">All</option>
                      <option value="success">Success</option>
                      <option value="failure">Failure</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      name="reason"
                      placeholder="Search reason"
                      value={filters.reason}
                      onChange={handleFilterChange}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      name="time"
                      placeholder="Search time"
                      value={filters.time}
                      onChange={handleFilterChange}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      name="age"
                      placeholder="Search age"
                      value={filters.age}
                      onChange={handleFilterChange}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      name="host"
                      placeholder="Search host"
                      value={filters.host}
                      onChange={handleFilterChange}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      className="form-control"
                      name="target_server"
                      placeholder="Search host"
                      value={filters.target_server}
                      onChange={handleFilterChange}
                    />
                  </td>
                </tr>
                {currentData.map((group, index) => (
                  <tr className="border border-1" key={index}>
                    <td className="border border-1">
                      <p className="m-0">{group.type}</p>
                    </td>
                    <td className="border border-1">
                      <p className="m-0">{group.action}</p>
                    </td>
                    <td className="border border-1">
                      <p className="m-0">{group.account}</p>
                    </td>
                    <td className="border border-1">
                      <p className="m-0">{group.result}</p>
                    </td>
                    <td className="border border-1">
                      <p className="m-0">{group.reason}</p>
                    </td>
                    <td className="border border-1">
                      <p className="m-0">{group.date}</p>
                    </td>
                    <td className="border border-1">
                      <p className="m-0">{group.age}</p>
                    </td>
                    <td className="border border-1">
                      <p className="m-0">{group.host}</p>
                    </td>
                    <td className="border border-1">
                      <p className="m-0">{group.target_server}</p>
                    </td>
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

      <div className="content-backdrop fade" />
    </div>
  );
};

export default SplunkData;
