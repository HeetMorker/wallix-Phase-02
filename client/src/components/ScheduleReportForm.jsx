// ScheduleReportForm.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const availableReports = [
  { key: "sessions", label: "User Activity Report" },
  { key: "usergroups", label: "User Group Report" },
  { key: "report", label: "User Group Mapping Report" },
  { key: "applications", label: "Application Access Report" },
  { key: "approvals", label: "Approval Report" },
  { key: "devicereport", label: "Device Report" },
  // { key: "targetGroups", label: "Target Group Report" },
  { key: "scans", label: "Account & Device Discovery Report" },
  { key: "scanjobs", label: "Scan Jobs Report" },
  { key: "authentications", label: "Authentication Report" },
  { key: "usergrouprestrictions", label: "Usergroup Restrictions Report" },
  { key: "targetgrouprestrictions", label: "Targetgroup Restrictions Report" },
];

const ScheduleReportForm = ({ editingData, onSave }) => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    userId: "",
    selectedApis: [],
    format: "pdf",
  });
  const [toast, setToast] = useState({
    show: false,
    message: "",
    success: true,
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("/api/users/all", {
          headers: { "x-auth-token": token },
        });
        // const onlyUsers = res.data.filter((user) => user.role === "user");
        setUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (editingData) {
      setFormData({
        userId: editingData.userId._id,
        selectedApis: editingData.selectedApis,
        format: editingData.format,
        _id: editingData._id, // keep ID for PUT
      });
    }
  }, [editingData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      if (formData._id) {
        await axios.put(
          `/api/scheduled-reports/${formData._id}`,
          {
            selectedApis: formData.selectedApis,
            format: formData.format,
          },
          {
            headers: { "x-auth-token": token },
          }
        );
        setToast({ show: true, message: "Schedule updated", success: true });
      } else {
        await axios.post("/api/scheduled-reports", formData, {
          headers: { "x-auth-token": token },
        });
        setToast({ show: true, message: "Schedule created", success: true });
      }

      setFormData({ userId: "", selectedApis: [], format: "pdf" });
      onSave?.();
    } catch (err) {
      console.error(err);

      if (err.response && err.response.status === 409) {
        // 🔁 Handle duplicate combo error
        setToast({
          show: true,
          message:
            "This user already has the same reports scheduled in the same format.",
          success: false,
        });
      } else {
        setToast({
          show: true,
          message: "Failed to save schedule",
          success: false,
        });
      }

      setTimeout(
        () => setToast({ show: false, message: "", success: true }),
        3000
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 border rounded bg-light shadow-sm"
    >
      {toast.show && (
        <div
          className={`alert ${
            toast.success ? "alert-success" : "alert-danger"
          }`}
          role="alert"
        >
          {toast.message}
        </div>
      )}

      {/* User Selection */}
      <div className="mb-3">
        <label className="form-label fw-bold">Select User:</label>
        <select
          required
          className="form-select"
          value={formData.userId}
          onChange={(e) => {
            const user = users.find((u) => u._id === e.target.value);
            setFormData({
              ...formData,
              userId: e.target.value,
              userEmail: user?.email || "",
            });
          }}
        >
          <option value="">-- Select User --</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.username} ({user.email})
            </option>
          ))}
        </select>
      </div>

      {/* Reports Selection */}
      <div className="mb-3">
        <label className="form-label fw-bold">Select Reports:</label>
        <div className="form-check">
          {availableReports.map((report) => (
            <div key={report.key} className="form-check mb-1">
              <input
                className="form-check-input"
                type="checkbox"
                value={report.key}
                id={report.key}
                checked={formData.selectedApis.includes(report.key)}
                onChange={(e) => {
                  const updated = e.target.checked
                    ? [...formData.selectedApis, report.key]
                    : formData.selectedApis.filter((r) => r !== report.key);
                  setFormData({ ...formData, selectedApis: updated });
                }}
              />
              <label className="form-check-label" htmlFor={report.key}>
                {report.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Format Radio */}
      <div className="mb-3">
        <label className="form-label fw-bold">Format:</label>
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            id="pdf"
            value="pdf"
            checked={formData.format === "pdf"}
            onChange={(e) =>
              setFormData({ ...formData, format: e.target.value })
            }
          />
          <label className="form-check-label me-3" htmlFor="pdf">
            PDF
          </label>
        </div>
        <div className="form-check">
          <input
            className="form-check-input"
            type="radio"
            id="excel"
            value="excel"
            checked={formData.format === "excel"}
            onChange={(e) =>
              setFormData({ ...formData, format: e.target.value })
            }
          />
          <label className="form-check-label" htmlFor="excel">
            Excel
          </label>
        </div>
      </div>

      {/* Submit / Cancel Buttons */}
      <div className="d-flex gap-3 mt-4">
        <button type="submit" className="btn btn-primary">
          {formData._id ? "Update Schedule" : "Save Schedule"}
        </button>
        {formData._id && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setFormData({ userId: "", selectedApis: [], format: "pdf" });
              onSave?.(); // clears the selected item in AdminReportScheduler
            }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default ScheduleReportForm;
