import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    dn: "",
    role: "user",
    status: "active",
    allowedAPIs: [],
    authMethod: "local",
    email: "",
    password: "",
  });
  const [err, setErr] = useState(null);
  const [allApis, setAllApis] = useState([]); // ✅ Centralized API list

  useEffect(() => {
    const fetchAllReportApis = async () => {
      try {
        const res = await fetch("/api/reportApis", {
          headers: { "x-auth-token": localStorage.getItem("token") },
        });

        const data = await res.json();

        if (Array.isArray(data.apis)) {
          setAllApis(data.apis);
          if (formData.role === "admin") {
            setFormData((prev) => ({
              ...prev,
              allowedAPIs: data.apis,
            }));
          }
        } else {
          console.warn("Unexpected response format:", data);
          setAllApis([]);
        }
      } catch (err) {
        console.error("Error fetching report APIs:", err.message);
      }
    };

    fetchAllReportApis();
  }, [formData.role]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };

    if (name === "username") {
      const suspiciousChars = /[<>;&"'/#\\\s]/g;
      if (suspiciousChars.test(value)) {
        updatedForm.username = "";
        setErr("Some special characters are not allowed in the username.");
      }
    }

    if (name === "authMethod") {
      if (value === "ldap") {
        updatedForm.password = "";
      } else {
        updatedForm.dn = "";
      }
    }

    if (name === "role") {
      if (value === "admin") {
        updatedForm.allowedAPIs = allApis;
      } else {
        updatedForm.allowedAPIs = [];
      }
    }

    setFormData(updatedForm);
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const updated = checked
        ? [...prev.allowedAPIs, value]
        : prev.allowedAPIs.filter((api) => api !== value);
      return { ...prev, allowedAPIs: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);

    try {
      const response = await axios.post("/api/auth/register", formData);
      console.log("Registration successful:", response.data);
      navigate("/users");
    } catch (error) {
      console.error("Error during registration:", error);
      setErr(error.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="content-wrapper">
      <div className="flex-grow-1 custom-w">
        <div className="card">
          <div className="card-header fw-semibold fs-5">Register User</div>
          <form className="card-body mt-2" onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-2">
                <label>Username:</label>
                <input
                  type="text"
                  name="username"
                  className="form-control"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-2">
                <label>Role:</label>
                <select
                  name="role"
                  className="form-control"
                  value={formData.role}
                  onChange={handleChange}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="col-md-6 mb-2">
                <label>Status:</label>
                <select
                  name="status"
                  className="form-control"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="col-md-6 mb-2">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-2">
                <label>Authentication Method:</label>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="authMethod"
                    value="local"
                    checked={formData.authMethod === "local"}
                    onChange={handleChange}
                  />
                  <label className="form-check-label">Local</label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="authMethod"
                    value="ldap"
                    checked={formData.authMethod === "ldap"}
                    onChange={handleChange}
                  />
                  <label className="form-check-label">LDAP</label>
                </div>
              </div>

              {formData.authMethod === "ldap" && (
                <div className="col-md-6 mb-2">
                  <label>DN:</label>
                  <input
                    type="text"
                    name="dn"
                    className="form-control"
                    value={formData.dn}
                    onChange={handleChange}
                  />
                </div>
              )}

              {formData.authMethod === "local" && (
                <div className="col-md-6 mb-2">
                  <label>Password:</label>
                  <input
                    type="password"
                    name="password"
                    autoComplete="new-password"
                    className="form-control"
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            {/* Show allowed APIs if not admin */}
            {formData.role !== "admin" && (
              <div className="my-3">
                <label>APIs Allowed:</label>
                <div className="row g-2">
                  {allApis.map((api) => (
                    <div key={api} className="col-3">
                      <input
                        type="checkbox"
                        checked={formData.allowedAPIs.includes(api)}
                        onChange={handleCheckboxChange}
                        value={api}
                      />{" "}
                      {api}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary">
              Register
            </button>

            {err && (
              <div className="alert alert-danger alert-dismissible mt-3">
                {err}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setErr(null)}
                ></button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
