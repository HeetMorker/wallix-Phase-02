import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Breadcrumbs from "../Breadcrumbs";

const Navbar = () => {
  const navigate = useNavigate();
  // const role = useSelector((state) => state.user.role);
  const [role, setRole] = useState("");
  const [username, setUsername] = useState("");
  const menuToggleRef = useRef();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    menuToggleRef.current.addEventListener("click", (e) => {
      e.preventDefault();
      window.Helpers.toggleCollapsed();
    });
  }, []);

  useEffect(() => {
    // const fetchData = async () =>
    fetch("/api/role", {
      headers: {
        "x-auth-token": localStorage.getItem("token"),
      },
    })
      .then((res) => {
        if (!res.ok) {
          // console.err(res.status, res.statusText);
          throw new Error(res.status);
        }
        return res.json();
      })
      .then((data) => {
        // console.log(data);
        setRole(data.role);
      })
      .catch((err) => {
        navigate("/login");
      });
  }, []);

  useEffect(() => {
    // const fetchData = async () =>
    fetch("/api/username", {
      headers: {
        "x-auth-token": localStorage.getItem("token"),
      },
    })
      .then((res) => {
        if (!res.ok) {
          // console.err(res.status, res.statusText);
          throw new Error(res.status);
        }
        return res.json();
      })
      .then((data) => {
        console.log(data);
        setUsername(data.username);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <nav
      className="layout-navbar custom-w navbar navbar-expand-xl navbar-detached align-items-center bg-navbar-theme "
      id="layout-navbar"
    >
      <div
        className="navbar-nav-right d-flex align-items-center"
        id="navbar-collapse"
      >
        <div
          ref={menuToggleRef}
          className="layout-menu-toggle navbar-nav align-items-xl-center me-3 me-xl-0 d-xl-none"
        >
          <a
            className="nav-item nav-link px-0 me-xl-4"
            href="javascript:void(0)"
          >
            <i className="bx bx-menu bx-sm" />
          </a>
        </div>
        <Breadcrumbs />
        <ul className="navbar-nav flex-row align-items-center ms-auto">
          {role === "admin" && (
            <li className="d-none d-md-flex nav-item lh-1 me-3">
              <Link to="register">
                <button className="btn btn-primary ms-2 p-2">
                  Register User
                </button>
              </Link>
              <Link to="users">
                <button className="btn btn-primary ms-2 p-2">Users</button>
              </Link>
              <Link to="Addipaddress">
                <button className="btn btn-primary ms-2 p-2">Add IP</button>
              </Link>
              <Link to="config">
                <button className="btn btn-primary ms-2 p-2">Config</button>
              </Link>
            </li>
          )}
          <li className="nav-item navbar-dropdown dropdown-user dropdown">
            <a
              className="nav-link dropdown-toggle hide-arrow"
              href="javascript:void(0);"
              data-bs-toggle="dropdown"
            >
              <div className="avatar avatar-online">
                <img
                  src="../assets/img/avatars/1.png"
                  alt
                  className="w-px-40 h-auto rounded-circle"
                />
              </div>
            </a>
            <ul className="dropdown-menu dropdown-menu-end">
              <li>
                <a className="dropdown-item" href="#">
                  <div className="d-flex">
                    <div className="d-none flex-shrink-0 me-3">
                      <div className="avatar avatar-online">
                        <img
                          src="../assets/img/avatars/1.png"
                          alt
                          className="w-px-40 h-auto rounded-circle"
                        />
                      </div>
                    </div>
                    <div className="flex-grow-1">
                      <span className="fw-semibold d-block">{username}</span>
                      <small className="text-muted">{role}</small>
                    </div>
                  </div>
                </a>
              </li>
              <li>
                <div className="dropdown-divider" />
              </li>
              {role === "admin" && (
                <>
                  <li className="d-md-none">
                    <Link className="dropdown-item" to="register">
                      Register User
                    </Link>
                  </li>
                  <li className="d-md-none">
                    <Link className="dropdown-item" to="users">
                      Users
                    </Link>
                  </li>
                  <li className="d-md-none">
                    <Link className="dropdown-item" to="Addipaddress">
                      Add IP
                    </Link>
                  </li>
                  <li className="d-md-none">
                    <Link className="dropdown-item" to="config">
                      Config
                    </Link>
                  </li>
                  <li className="d-md-none">
                    <div className="dropdown-divider" />
                  </li>
                </>
              )}
              <li>
                <a className="dropdown-item" onClick={handleLogout}>
                  <i className="bx bx-power-off me-2" />
                  <span className="align-middle">Log Out</span>
                </a>
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
