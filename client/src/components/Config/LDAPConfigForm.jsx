import React, { useEffect, useState } from "react";
import axios from "axios";

const LDAPConfigForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    server: "",
    port: 389,
    timeout: 3,
    encryption: "none",
    bindMethod: "simple",
    baseDN: "",
    loginAttr: "",
    usernameAttr: "",
    user: "",
    password: "",
    confirmPassword: "",
    usePrimaryDomain: true,
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get("/api/ldap-config");
        if (res.data) {
          setFormData((prev) => ({
            ...prev,
            ...res.data,
            confirmPassword: res.data.password || "",
          }));
        }
      } catch (err) {
        console.error("Error loading config:", err);
        setError("Failed to load configuration.");
      }
    };
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSave = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Password and Confirm Password do not match.");
      setMessage("");
      return;
    }

    try {
      await axios.post("/api/ldap-config", formData);
      setMessage("Configuration saved successfully.");
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Save failed");
      setMessage("");
    }
  };

  const handleTestNetwork = async () => {
    try {
      await axios.post("/api/ldap-config/test-network", formData);
      setMessage("Network test successful.");
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Network test failed");
      setMessage("");
    }
  };

  const handleTestAuth = async () => {
    try {
      await axios.post("/api/ldap-config/test-auth", {
        user: formData.user,
        password: formData.password,
      });
      setMessage("Authentication successful.");
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Authentication failed");
      setMessage("");
    }
  };

  return (
    <div>
      {/* <h2 className="text-xl font-bold mb-4">LDAP Configuration</h2> */}

      {message && <div className="alert alert-success mb-3">{message}</div>}
      {error && <div className="alert alert-danger mb-3">{error}</div>}

      {/* Network Parameters */}
      <fieldset className="p-4 border rounded bg-light shadow-sm mb-4">
        <legend className="text-md font-semibold">Network Parameters</legend>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Name</label>
            <input
              className="form-control"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Server</label>
            <input
              className="form-control"
              name="server"
              value={formData.server}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Port</label>
            <input
              type="number"
              className="form-control"
              name="port"
              value={formData.port}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Timeout (s)</label>
            <input
              type="number"
              className="form-control"
              name="timeout"
              value={formData.timeout}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Encryption</label>
            <select
              className="form-select"
              name="encryption"
              value={formData.encryption}
              onChange={handleChange}
            >
              <option value="none">None</option>
              <option value="starttls">StartTLS</option>
              <option value="ssl">SSL</option>
            </select>
          </div>
          <div className="col-12 mt-2">
            <button
              className="btn btn-outline-primary"
              onClick={handleTestNetwork}
            >
              Test Network Parameters
            </button>
          </div>
        </div>
      </fieldset>

      {/* Authentication */}
      <fieldset className="p-4 border rounded bg-light shadow-sm mb-4">
        <legend className="text-md font-semibold">Authentication</legend>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Bind Method</label>
            <select
              className="form-select"
              name="bindMethod"
              value={formData.bindMethod}
              onChange={handleChange}
            >
              <option value="simple">simple (password)</option>
            </select>
          </div>
          <div className="col-md-6">
            <label className="form-label">User</label>
            <input
              className="form-control"
              name="user"
              autoComplete="off"
              value={formData.user}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              name="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-control"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-6">
            <button
              className="btn btn-outline-secondary"
              onClick={handleTestAuth}
            >
              Test Authentication
            </button>
          </div>
        </div>
      </fieldset>

      {/* User Attributes */}
      <fieldset className="p-4 border rounded bg-light shadow-sm mb-4">
        <legend className="text-md font-semibold">User Attributes</legend>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label">Base DN</label>
            <input
              className="form-control"
              name="baseDN"
              value={formData.baseDN}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Login Attribute</label>
            <input
              className="form-control"
              name="loginAttr"
              value={formData.loginAttr}
              onChange={handleChange}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label">Username Attribute</label>
            <input
              className="form-control"
              name="usernameAttr"
              value={formData.usernameAttr}
              onChange={handleChange}
            />
          </div>
        </div>
      </fieldset>

      {/* Footer */}
      <div className="form-check mb-4">
        <input
          className="form-check-input"
          type="checkbox"
          name="usePrimaryDomain"
          checked={formData.usePrimaryDomain}
          onChange={handleChange}
        />
        <label className="form-check-label">
          Use primary domain name for Two-Factor Authentication (2FA)
        </label>
      </div>

      <div className="d-flex gap-3">
        <button className="btn btn-primary" onClick={handleSave}>
          Apply
        </button>
      </div>
    </div>
  );
};

export default LDAPConfigForm;
