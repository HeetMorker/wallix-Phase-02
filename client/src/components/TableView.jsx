import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Aside from "./Common/Aside";
import Navbar from "./Common/Navbar";

const TableView = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/accounts");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
        console.log(result);
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
  const currentData = data.slice(startIndex, endIndex);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({ html: "#user-group-table" });
    doc.save("user-group.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(currentData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Group");
    XLSX.writeFile(workbook, "user-group.xlsx");
  };

  if (loading)
    return (
      <div className="loader-container ">
        <img src="./assets/img/1487.gif" alt="" />
      </div>
    );
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      <div className="layout-wrapper layout-content-navbar">
        <div className="layout-container">
          <Aside />
          <div className="layout-page">
            <Navbar />
            <div className="content-wrapper">
              <div className=" flex-grow-1 custom-w">
                <h4 className="fw-bold py-3 mb-4">
                  <span className="text-muted fw-light">Tables /</span> Basic
                  Tables
                </h4>
                <hr className="my-5" />
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
                      <button
                        className="btn btn-primary me-2 p-2"
                        onClick={exportPDF}
                      >
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
                          {" "}
                          <input
                            type="text"
                            className="form-control w-25"
                            placeholder="Search Status"
                            aria-label="Onboard Status"
                          />
                        </td>
                      </tr>
                      {currentData.map((group, index) => (
                        <tr className="border border-1" key={index}>
                          <td className="border border-1">
                            <p className="m-0">{group.onboard_status}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <nav aria-label="Page navigation example">
                    <ul className="pagination mb-3 justify-content-end mt-3 px-4">
                      <li
                        className={`page-item ${
                          currentPage === 1 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={handlePrevPage}
                          aria-label="Previous"
                          disabled={currentPage === 1}
                        >
                          <span aria-hidden="true">&laquo;</span>
                        </button>
                      </li>
                      {Array.from({ length: totalPages }, (_, index) => (
                        <li
                          key={index}
                          className={`page-item ${
                            index + 1 === currentPage ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(index + 1)}
                          >
                            {index + 1}
                          </button>
                        </li>
                      ))}
                      <li
                        className={`page-item ${
                          currentPage === totalPages ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={handleNextPage}
                          aria-label="Next"
                          disabled={currentPage === totalPages}
                        >
                          <span aria-hidden="true">&raquo;</span>
                        </button>
                      </li>
                    </ul>
                  </nav>

                  {/* <div className="pagination">
                    <button className="arrow" onClick={handlePrevPage} disabled={currentPage === 1}>← <span className="nav-text">PREV</span></button>
                    <div className="pages">
                      {Array.from({ length: totalPages }, (_, index) => (
                        <div
                          key={index}
                          className={`page-number ${index + 1 === currentPage ? 'active' : ''}`}
                          onClick={() => setCurrentPage(index + 1)}
                        >
                          {index + 1}
                        </div>
                      ))}
                    </div>
                    <button className="arrow" onClick={handleNextPage} disabled={currentPage === totalPages}><span className="nav-text">NEXT</span> →</button>
                  </div> */}
                  {/* <h5 className="card-header">Responsive Table</h5>
              <div className="table-responsive text-nowrap">
                <table className="table">
                  <thead>
                    <tr className="text-nowrap">
                      <th>#</th>
                      <th>Table heading</th>
                      <th>Table heading</th>
                      <th>Table heading</th>
                      <th>Table heading</th>
                      <th>Table heading</th>
                      <th>Table heading</th>
                      <th>Table heading</th>
                      <th>Table heading</th>
                      <th>Table heading</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">1</th>
                      <td>Table cell</td>
                      <td>Table cell</td>
                      <td>Table cell</td>
                      <td>Table cell</td>
                      <td>Table cell</td>
                      <td>Table cell</td>
                      <td>Table cell</td>
                      <td>Table cell</td>
                      <td>Table cell</td>
                    </tr>
                    </tbody>
                </table>
              </div> */}
                </div>
              </div>

              <div className="content-backdrop fade" />
            </div>
          </div>
        </div>
        <div className="layout-overlay layout-menu-toggle" />
      </div>
    </div>
  );
};

export default TableView;
