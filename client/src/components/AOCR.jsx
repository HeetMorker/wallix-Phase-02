import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Pagination from "./Common/Pagination";

const AOCR = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [filters, setFilters] = useState({
    onboard_status: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/accounts/fromdb", {
          headers: {
            "x-auth-token": localStorage.getItem("token"),
          },
        }); // Now fetches from the database
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();

        // Flatten the nested arrays
        const flattenedData = result.flat();
        console.log(flattenedData);

        setData(flattenedData);
        setTotalPages(Math.ceil(flattenedData.length / itemsPerPage));
      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [itemsPerPage]);

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

  const filteredData = data.filter((item) => {
    return (
      !filters.onboard_status ||
      item.onboard_status
        .toLowerCase()
        .includes(filters.onboard_status.toLowerCase())
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
    const doc = new jsPDF();

    const currentDate = new Date();
    const dateStr = currentDate.toLocaleString();

    let res = await fetch("/api/username", {
      headers: {
        "x-auth-token": localStorage.getItem("token"),
      },
    });
    res = await res.json();
    doc.text(`Username: ${res.username}`, 10, 10);
    doc.text("Report: AOCR", 10, 20);
    doc.text(`Date: ${dateStr}`, 10, 30);

    const keysToExclude = ["_id", "__v", "createdAt", "updatedAt", "ipAddress"];

    const columns = Object.keys(data[0]).filter(
      (key) => !keysToExclude.includes(key)
    );

    const rows = filteredData.map((item) => columns.map((col) => item[col]));

    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 40,
      theme: "grid",
    });

    doc.save("AOCR.pdf");
  };

  const exportExcel = async () => {
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleString();

    let res = await fetch("/api/username", {
      headers: {
        "x-auth-token": localStorage.getItem("token"),
      },
    });
    res = await res.json();
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "AOCR");

    XLSX.writeFile(workbook, `AOCR-${res.username}-${dateStr}.xlsx`);
  };

  useEffect(() => {
    setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
  }, [filters, itemsPerPage]);

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
              <h5 className="fw-bold py-2">
                Account Onboarded Corelated Report
              </h5>
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

          <table
            id="user-group-table"
            className="table table-bordered table-hover"
          >
            <thead>
              <tr>
                <th className="fw-bold fs-6">Onboard Status</th>
              </tr>
            </thead>
            <tbody className="border border-1">
              <tr>
                <td>
                  <input
                    type="text"
                    className="form-control w-25"
                    name="onboard_status"
                    placeholder="Search Onboard Status"
                    onChange={handleFilterChange}
                  />
                </td>
                {/* <td>Fetch Time</td> */}
              </tr>
              {currentData.map((group, index) => (
                <tr className="border border-1" key={index}>
                  <td className="border border-1">
                    <p className="m-0">
                      {group.onboard_status || "No Status Available"}
                    </p>
                  </td>
                  {/* <td>{group.fetchedAt ? new Date(group.fetchedAt).toLocaleString() : 'N/A'}</td> */}
                </tr>
              ))}
            </tbody>
          </table>
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

export default AOCR;
