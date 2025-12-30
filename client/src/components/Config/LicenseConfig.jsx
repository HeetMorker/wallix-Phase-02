import React, { useEffect, useState } from "react";

const LicenseConfig = ({ formData, handleChange, handleSubmit }) => {
  const [companyName, setCompanyName] = useState("");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [message, setMessage] = useState("");

  // Fetch existing company name on load
  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const res = await fetch("/api/company-info");
        const data = await res.json();
        setCompanyName(data.companyName || "");
        setNewCompanyName(data.companyName || "");
      } catch (err) {
        console.error("Failed to load company name");
      }
    };
    fetchCompanyName();
  }, []);

  const handleCompanySave = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/company-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName: newCompanyName }),
      });
      const data = await res.json();
      setCompanyName(data.companyName);
      setMessage("Company name updated!");
    } catch (err) {
      setMessage("Failed to update company name");
    }
  };

  return (
    <section className="p-4 border rounded bg-light shadow-sm">
      <h4 className="mb-2">License</h4>
      <form onSubmit={handleSubmit}>
        <div className="row mb-3">
          <label htmlFor="license" className="col-sm-2 col-form-label">
            License Key
          </label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              id="license"
              name="license"
              value={formData.license}
              onChange={handleChange}
            />
          </div>
        </div>
        <button className="btn btn-primary">Activate</button>
      </form>

      <hr className="my-4" />

      <h4 className="mb-2">Company Branding</h4>
      <form onSubmit={handleCompanySave}>
        <div className="row mb-3">
          <label htmlFor="companyName" className="col-sm-2 col-form-label">
            Company Name
          </label>
          <div className="col-sm-10">
            <input
              type="text"
              className="form-control"
              id="companyName"
              name="companyName"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              required
            />
          </div>
        </div>
        <button type="submit" className="btn btn-success">
          Save Company Name
        </button>
        {message && (
          <div
            className="success mt-3"
            style={{
              backgroundColor: message.startsWith("✅") ? "#d1e7dd" : "#f8d7da",
              color: message.startsWith("✅") ? "#0f5132" : "#842029",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            {message}
          </div>
        )}
      </form>
    </section>
  );
};

export default LicenseConfig;
