import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AppLogo from "./AppLogo";

const Aside = () => {
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeAgo, setTimeAgo] = useState("");
  const [countdown, setCountdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    success: true,
  });
  const [allowedAPIs, setAllowedAPIs] = useState([]);
  const menuToggleRef = useRef();
  const navigate = useNavigate();

  const reportMap = new Map([
    ["sessions", ["user-activity", "User Activity Report"]],
    ["user-group", ["user-group", "User Group Report"]],
    ["applications", ["application", "Application Report"]],
    ["device-report", ["device-report", "Device Report"]],
    ["approvals", ["approvals", "Approval Report"]],
    ["scans", ["scans", "Account & Device Discovery Reports"]],
    ["scanjobs", ["scanjobs", "Scan Jobs Report"]],
    ["user-group-maping", ["user-group-maping", "User Group Maping Report"]],
    ["credentials", ["credentials", "Credentials"]],
    ["authentications", ["authentications", "Authentications"]],
    ["OutOfOfficeReport", ["OutOfOfficeReport", "Out Of Office Report"]],
    [
      "usergroupRestrictions",
      ["usergroupRestrictions", "Usergroup Restrictions"],
    ],
    [
      "targetgroupRestrictions",
      ["targetgroupRestrictions", "Targetgroup Restrictions"],
    ],
  ]);

  const getTimeAgo = (timestamp) => {
    if (!timestamp) return "";
    const now = new Date();
    const diff = Math.floor((now - new Date(timestamp)) / 1000);
    if (diff < 60) return "Updated just now";
    if (diff < 3600) return `Updated ${Math.floor(diff / 60)} minute(s) ago`;
    if (diff < 86400) return `Updated ${Math.floor(diff / 3600)} hour(s) ago`;
    return `Updated ${Math.floor(diff / 86400)} day(s) ago`;
  };

  const calculateCountdown = () => {
    const now = new Date();
    const nextFetch = new Date();
    nextFetch.setHours(0, 0, 0, 0);
    if (now >= nextFetch) nextFetch.setDate(nextFetch.getDate() + 1);

    const diff = nextFetch - now;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    return `${hours}h ${minutes}m ${seconds}s`;
  };

  useEffect(() => {
    const savedTime = localStorage.getItem("lastUpdated");
    if (savedTime) {
      const parsedTime = new Date(savedTime);
      setLastUpdated(parsedTime);
      setTimeAgo(getTimeAgo(parsedTime));
    }
  }, []);

  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const res = await fetch("/api/company-info");
        const data = await res.json();
        setCompanyName(data.companyName || "");
      } catch (error) {
        console.error("Failed to fetch company name");
      }
    };

    fetchCompanyName();
  }, []);

  useEffect(() => {
    menuToggleRef.current?.addEventListener("click", (e) => {
      e.preventDefault();
      window.Helpers?.setCollapsed?.(true);
    });
  }, []);

  useEffect(() => {
    fetch("/api/allowedAPIs", {
      headers: { "x-auth-token": localStorage.getItem("token") },
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data) => setAllowedAPIs(data.allowedAPIs.sort()))
      .catch(() => navigate("/login"));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (lastUpdated) setTimeAgo(getTimeAgo(lastUpdated));
    }, 60000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(calculateCountdown());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const now = new Date();
    const nextFetch = new Date();
    nextFetch.setHours(0, 0, 0, 0);
    if (now >= nextFetch) nextFetch.setDate(nextFetch.getDate() + 1);

    const timeout = nextFetch - now;
    const timer = setTimeout(() => {
      handleFetchLatestData();
    }, timeout);

    return () => clearTimeout(timer);
  }, []);

  const handleFetchLatestData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/fetch-all", { method: "POST" });
      const result = await response.json();

      const success =
        response.ok && (!result.failedIPs || result.failedIPs.length === 0);
      const message = success
        ? "Data fetched and saved successfully!"
        : `Data fetched with some errors: ${result.failedIPs?.join(", ")}`;

      setToast({ show: true, message, success });

      const now = new Date();
      setLastUpdated(now);
      localStorage.setItem("lastUpdated", now);
      setTimeAgo(getTimeAgo(now));

      if (success) window.location.reload();
    } catch (err) {
      setToast({
        show: true,
        message: `Error: ${err.message}`,
        success: false,
      });
    } finally {
      setLoading(false);
    }

    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  return (
    <aside
      id="layout-menu"
      className="layout-menu custom-position menu-vertical menu bg-menu-theme"
    >
      {toast.show && (
        <div
          className={`bs-toast toast toast-placement-ex m-2 fade bottom-0 end-0 show ${
            toast.success ? "bg-success" : "bg-danger"
          }`}
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <div className="toast-header">
            <i className="bx bx-bell me-2"></i>
            <div className="me-auto fw-semibold">
              {toast.success ? "Success" : "Error"}
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setToast({ ...toast, show: false })}
            ></button>
          </div>
          <div className="toast-body">{toast.message}</div>
        </div>
      )}

      <div className="app-brand demo justify-content-center">
        <Link to="/" className="app-brand-link">
          <AppLogo />
        </Link>
        <button
          ref={menuToggleRef}
          className="layout-menu-toggle menu-link text-large ms-auto d-block d-xl-none btn btn-link p-0"
        >
          <i className="bx bx-chevron-left bx-sm align-middle" />
        </button>
      </div>

      <div className="menu-inner-shadow" />

      <ul className="menu-inner py-1 align-items-center">
        <li className="menu-header small text-uppercase">
          <span className="menu-header-text">Reports</span>
        </li>

        {[...reportMap.entries()]
          .filter(([key]) => allowedAPIs.includes(key))
          .sort((a, b) => a[1][1].localeCompare(b[1][1])) // Sort by display name
          .map(([api, [route, name]]) => (
            <li className="menu-item hover-ef" key={api}>
              <Link
                to={`/${route}`}
                className="menu-link px-3 py-2 d-block rounded fs-custom2"
              >
                {name}
              </Link>
            </li>
          ))}

        <li className="text-center mt-3">
          <button className="btn btn-primary" onClick={handleFetchLatestData}>
            {loading ? "Fetching Data..." : "Fetch Latest Data"}
          </button>
          <p className="mt-3 fs-custom2 text-success">
            Auto-fetch in: {countdown}
          </p>
        </li>
      </ul>

      <div className="text-center p-2 small text-muted">
        {companyName && (
          <div style={{ fontSize: "12px" }}>
            Created by{" "}
            <span className="fw-semibold">Mechsoft Technologies LLC</span>
            <br />
            Licensed to <strong>{companyName}</strong>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Aside;
