import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const UserActivity = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/data");
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
  const currentData = data.slice(startIndex, endIndex);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({ html: "#user-activity-table" });
    doc.save("user-activity.pdf");
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(currentData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "User Activity");
    XLSX.writeFile(workbook, "user-activity.xlsx");
  };

  if (loading)
    return (
      <div className="loader-container ">
        <img src="./assets/img/1487.gif" alt="" />
      </div>
    );
  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      <div className="page-body-wrapper" style={{ backgroundColor: "#f5f7fb" }}>
        <header>
          <div className="page-main-header position-fixed top-0 col-12">
            <div className="main-header row align-items-center m-0 bg-white">
              <div className="main-header-left bg-white d-flex justify-content-between align-items-center b-right">
                <div className="logo-wrapper">
                  <a href="index.html">
                    <h3 className="logo-text">WALLIX Bastion</h3>
                    {/* <img src="../images/logo.png" alt="" className="img-fluid"/> */}
                  </a>
                </div>
                <div className="toggle-icon color-primary">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="feather feather-align-center status_toggle middle"
                    id="sidebar-toggle"
                  >
                    <line x1={18} y1={10} x2={6} y2={10} />
                    <line x1={21} y1={6} x2={3} y2={6} />
                    <line x1={21} y1={14} x2={3} y2={14} />
                    <line x1={18} y1={18} x2={6} y2={18} />
                  </svg>
                </div>
              </div>
              <div className="left-menu-header bg-white col px-5">
                <ul>
                  <li className="d-inline-block">
                    <form action>
                      <div className="search-bg col-12 d-flex align-items-center">
                        <i className="fa-solid fa-magnifying-glass color-primary" />
                        <input
                          type="text"
                          className="lh-base bg-transparent border-0 px-4"
                          placeholder="search here....."
                        />
                      </div>
                    </form>
                  </li>
                </ul>
              </div>
              <div className="nav-right bg-white col">
                <ul className="d-flex nav-menus align-items-center justify-content-end">
                  <li className="onhover-dropdown me-3 py-2 px-2">
                    <div className="notification-box">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="feather feather-bell"
                      >
                        <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>
                      </svg>
                    </div>
                  </li>
                  <li className="onhover-dropdown">
                    <button className="btn color-primary bg-primary fw-semibold">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="feather feather-log-out"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1={21} y1={12} x2={9} y2={12} />
                      </svg>
                      log-out
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </header>
        {/*-------------------------------------- HEADER ----------------------------------------*/}
        {/*-------------------------------------- SIDE BAR ----------------------------------------*/}
        <aside className="main-nav b-right position-fixed text-start d-block">
          <nav>
            <div className="main-navbar">
              <div className="mainnav">
                <ul className="nav-menu custom-scrollbar d-block pb-3">
                  {/*------------- sidebar-title -------------*/}
                  <li className="drpdown ">
                    <a href="javascript:void(0);" className="nav-link active">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width={24}
                        height={24}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="feather feather-home"
                      >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      View Reports
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </aside>
        <div className="page-body d-flex">
          <div className="container-fluid">
            <div className="row">
              <div className="row">
                <div className="col-xl-12 recent-orders">
                  <div className="card1 d-flex">
                    <div className="card1-body">
                      <div className="table-responsive">
                        <div className="d-flex mb-2 justify-content-between">
                          <div className="table-title">
                            <h5 className="fw-bold py-2">
                              User Activity Reports
                            </h5>
                          </div>
                          <div className="download-buttons d-flex align-items-center">
                            <button
                              className="btn btn-primary ms-2 p-2"
                              onClick={exportExcel}
                            >
                              Excel
                            </button>
                            <button
                              className="btn btn-primary ms-2 p-2"
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
                          id="user-activity-table"
                          className="table table-bordered table-hover"
                        >
                          <thead>
                            <tr>
                              <th className="fw-bold fs-6">Username</th>
                              <th className="fw-bold fs-6">Target Account</th>
                              <th className="fw-bold fs-6">Target Host</th>
                              <th className="fw-bold fs-6">Protocol</th>
                              <th className="fw-bold fs-6">Start Time</th>
                              <th className="fw-bold fs-6">End Time</th>
                              <th className="fw-bold fs-6">Target Group</th>
                            </tr>
                            <tr>
                              <th className="fw-bold search-bg">
                                <input
                                  type="text"
                                  className="lh-base bg-transparent search-place"
                                  name="username"
                                  placeholder="Search username"
                                />
                              </th>
                              <th className="fw-bold search-bg">
                                <input
                                  type="text"
                                  className="lh-base bg-transparent search-place"
                                  name="target-account"
                                  placeholder="Search target-account"
                                />
                              </th>
                              <th className="fw-bold search-bg">
                                <input
                                  type="text"
                                  className="lh-base bg-transparent search-place"
                                  name="target-host"
                                  placeholder="Search target-host"
                                />
                              </th>
                              <th className="fw-bold search-bg">
                                <input
                                  type="text"
                                  className="lh-base bg-transparent search-place"
                                  name="protocol"
                                  placeholder="Search protocol"
                                />
                              </th>
                              <th className="fw-bold search-bg">
                                <input
                                  type="text"
                                  className="lh-base bg-transparent search-place"
                                  name="start-time"
                                  placeholder="Search start-time"
                                />
                              </th>
                              <th className="fw-bold search-bg">
                                <input
                                  type="text"
                                  className="lh-base bg-transparent search-place"
                                  name="end-time"
                                  placeholder="Search end-time"
                                />
                              </th>
                              <th className="fw-bold search-bg">
                                <input
                                  type="text"
                                  className="lh-base bg-transparent search-place"
                                  name="target-group"
                                  placeholder="Search target-group"
                                />
                              </th>
                            </tr>
                          </thead>
                          <tbody className="border border-1">
                            {currentData.map((group, index) => (
                              <tr className="border border-1" key={index}>
                                <td className="border border-1">
                                  <p>{group.username}</p>
                                </td>
                                <td className="border border-1">
                                  <p>{group.target_account}</p>
                                </td>
                                <td className="border border-1">
                                  <p>{group.target_host}</p>
                                </td>
                                <td className="border border-1">
                                  <p>{group.target_protocol}</p>
                                </td>
                                <td className="border border-1">
                                  <p>{group.begin}</p>
                                </td>
                                <td className="border border-1">
                                  <p>{group.end}</p>
                                </td>
                                <td className="border border-1">
                                  <p>{group.target_group}</p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div className="pagination">
                          <button
                            className="arrow"
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                          >
                            ← <span className="nav-text">PREV</span>
                          </button>
                          <div className="pages">
                            {Array.from({ length: totalPages }, (_, index) => (
                              <div
                                key={index}
                                className={`page-number ${
                                  index + 1 === currentPage ? "active" : ""
                                }`}
                                onClick={() => setCurrentPage(index + 1)}
                              >
                                {index + 1}
                              </div>
                            ))}
                          </div>
                          <button
                            className="arrow"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                          >
                            <span className="nav-text">NEXT</span> →
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserActivity;
