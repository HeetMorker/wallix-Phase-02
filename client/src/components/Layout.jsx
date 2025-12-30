import React, { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import Aside from "./Common/Aside";
import Navbar from "./Common/Navbar";
// import ReportMailerTrigger from "./automation/ReportMailerTrigger";

const Layout = () => {
  const [allowedAPIs, setAllowedAPIs] = useState([]);
  return (
    <>
      {/* <ReportMailerTrigger /> */}
      <div className="layout-wrapper layout-content-navbar">
        <div className="layout-container">
          <Aside />
          <div className="layout-page">
            <Navbar />
            <Outlet />
          </div>
        </div>

        <div className="layout-overlay layout-menu-toggle" />
      </div>
    </>
  );
};

export default Layout;
