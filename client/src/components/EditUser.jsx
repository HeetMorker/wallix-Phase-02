// src/components/EditUser.jsx
import React, { useState, useEffect } from "react";
import { useLoaderData, useNavigate } from "react-router-dom";
import axios from "axios";

export const loader = async ({ params }) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`/api/users/${params.userId}`, {
      headers: {
        "x-auth-token": token,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

const EditUser = () => {
  const user = useLoaderData();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [allApis, setAllApis] = useState([]); // Central API list

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

  useEffect(() => {
    const fetchApis = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/reportApis", {
          headers: { "x-auth-token": token },
        });

        // Updated to handle format: { apis: [...] }
        if (Array.isArray(res.data.apis)) {
          setAllApis(res.data.apis);
        } else {
          console.warn("Unexpected reportApis response format", res.data);
          setAllApis([]);
        }
      } catch (err) {
        console.error("Error fetching API list:", err);
      }
    };
    fetchApis();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        dn: user.dn || "",
        role: user.role || "user",
        status: user.status || "active",
        allowedAPIs: user.allowedAPIs || [],
        authMethod: user.authMethod || "local",
        email: user.email || "",
        password: "", // Don't prefill password
      });
      setLoading(false);
    } else {
      setLoading(false);
      console.error("User data is not available");
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      let updated = { ...prev, [name]: value };
      if (name === "authMethod") {
        updated.password = value === "ldap" ? "" : updated.password;
        updated.dn = value === "local" ? "" : updated.dn;
      }
      if (name === "role") {
        updated.allowedAPIs = value === "admin" ? allApis : [];
      }
      return updated;
    });
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    setFormData((prev) => {
      const updatedAPIs = checked
        ? [...prev.allowedAPIs, value]
        : prev.allowedAPIs.filter((api) => api !== value);
      return { ...prev, allowedAPIs: updatedAPIs };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.put(`/api/users/${user._id}`, formData, {
        headers: { "x-auth-token": token },
      });
      navigate("/users");
    } catch (err) {
      console.error("Error updating user:", err);
      setError("Failed to update user.");
    }
  };

  if (loading)
    return (
      <div className="loader-container ">
        <img src="./assets/img/1487.gif" alt="Loading..." />
      </div>
    );
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="content-wrapper">
      <div className="flex-grow-1 custom-w">
        <div className="card">
          <form className="card-body" onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-6 mb-2">
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
              <div className="col-6 mb-2">
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
              <div className="col-6 mb-2">
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
              <div className="col-6 mb-2">
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
              <div className="col-6 mb-2">
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
                <div className="col-6 mb-2">
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
                <div className="col-6 mb-2">
                  <label>Password:</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    onChange={handleChange}
                  />
                </div>
              )}
            </div>

            {formData.role !== "admin" && (
              <div className="my-3">
                <label>APIs Allowed:</label>
                <div className="row g-2">
                  {allApis.map((api) => (
                    <div key={api} className="col-3">
                      <input
                        type="checkbox"
                        value={api}
                        checked={formData.allowedAPIs.includes(api)}
                        onChange={handleCheckboxChange}
                      />{" "}
                      {api}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn btn-primary mt-3">
              Save
            </button>
            <button
              type="button"
              onClick={() => navigate("/users")}
              className="btn btn-secondary mt-3 ms-2"
            >
              Cancel
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUser;
