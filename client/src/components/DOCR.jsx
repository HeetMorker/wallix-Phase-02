import React, { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Aside from "./Common/Aside";
import Navbar from "./Common/Navbar";
import Pagination from "./Common/Pagination";
import getLogoBase64 from "../utils/getLogoBase64";

const DOCR = () => {
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
        const response = await fetch("/api/devicereport/fromdb", {
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
      (item.onboard_status != null &&
        item.onboard_status
          .toLowerCase()
          .includes(filters.onboard_status.toLowerCase()))
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
    const logo = await getLogoBase64();
    if (logo) {
      try {
        const pageWidth = doc.internal.pageSize.getWidth();

        const finalWidth = 35; // smaller width
        const finalHeight = (logo.height / logo.width) * finalWidth; // maintain aspect ratio
        const x = pageWidth - finalWidth - 10;
        const y = 12; // move higher (was 10)

        doc.addImage(logo.base64, "PNG", x, y, finalWidth, finalHeight);
      } catch (err) {
        console.error("Failed to add logo to PDF:", err);
      }
    }
    doc.text(`Username: ${res.username}`, 15, 10);
    doc.text(
      "Report: Device Discovery and Onboarded Correlated Report",
      15,
      20
    );
    doc.text(`Date: ${dateStr}`, 15, 30);

    const keysToExclude = ["_id", "__v", "createdAt", "updatedAt", "ipAddress"];

    const columns = [
      // "Device Name",
      // "Host",
      // "Last Connection",
      "Onboard Status",
    ];
    const rows = data.map((item) => [
      item.device_name,
      item.host,
      new Date(item.last_connection).toLocaleString(),
      item.onboard_status,
    ]);
    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 40,
      theme: "grid",
      headStyles: { fillColor: "#EC6708", textColor: "#FFFFFF" }, // Theme Color
    });

    doc.save("DOCR.pdf");
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
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "DOCR");
  //   XLSX.writeFile(workbook, `DOCR-${res.username}-${dateStr}.xlsx`);
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
      ["Report: Device Discovery and Onboarded Correlated Report"],
      [`Date: ${dateStr}`],
      [""], // Empty row for spacing
    ]);

    // Define Headers
    const headers = ["Onboard Status"];

    // Convert Data to Row Format
    const rows = data.map((item) => [item.onboard_status]);

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
    XLSX.utils.book_append_sheet(workbook, worksheet, "DOCR");
    XLSX.writeFile(workbook, `DOCR-${res.username}-${dateStr}.xlsx`);
  };

  useEffect(() => {
    setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
  }, [filters, itemsPerPage]);

  if (loading)
    return (
      <div className="loader-container ">
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
                Device Discovery and Onboarded Correlated Report.{" "}
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
          <div className="table-responsive">
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

export default DOCR;
