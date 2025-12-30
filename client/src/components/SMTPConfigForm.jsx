import React, { useState, useEffect } from "react";
import axios from "axios";

const SMTPConfigForm = () => {
  const [form, setForm] = useState({
    protocol: "SMTP",
    authMethod: "Automatic",
    server: "",
    port: 587,
    postmasterEmail: "",
    senderName: "",
    senderEmail: "",
    username: "",
    password: "",
    confirmPassword: "",
    testRecipients: "",
    scheduledTime: "01:00", // 🆕 default
    scheduledAmPm: "AM", // 🆕 default
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get("/api/smtp-config", {
          headers: { "x-auth-token": localStorage.getItem("token") },
        });
        const data = res.data;

        const [hourStr, minuteStr] = data.scheduledTime?.split(":") || [
          "01",
          "00",
        ];
        const hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = (hour % 12 || 12).toString().padStart(2, "0");

        setForm((prev) => ({
          ...prev,
          ...data,
          confirmPassword: data.password,
          testRecipients: (data.testRecipients || [])[0] || "",
          scheduledTime: `${hour12}:${minuteStr}`,
          scheduledAmPm: ampm,
        }));
      } catch (err) {
        console.warn("No SMTP config found.");
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const portMap = {
      SMTP: 587,
      SMTPS: 465,
      "SMTP + STARTTLS": 587,
    };
    setForm((prev) => ({ ...prev, port: portMap[form.protocol] }));
  }, [form.protocol]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const to24HourFormat = (timeStr, ampm) => {
    if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":")) {
      return "01:00";
    }

    const [hourStr, minuteStr] = timeStr.split(":");
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (isNaN(hour) || isNaN(minute)) return "01:00";

    if (ampm === "PM" && hour < 12) {
      hour += 12;
    } else if (ampm === "AM" && hour === 12) {
      hour = 0;
    }

    hour = Math.max(0, Math.min(hour, 23));
    const min = Math.max(0, Math.min(minute, 59));

    return `${hour.toString().padStart(2, "0")}:${min
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const time24 = to24HourFormat(form.scheduledTime, form.scheduledAmPm);

      const res = await axios.post(
        "/api/smtp-config",
        {
          ...form,
          scheduledTime: time24, // ⏱ Send in 24-hour format
        },
        {
          headers: { "x-auth-token": localStorage.getItem("token") },
        }
      );

      setMessage(res.data.message || "Configuration saved.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save config.");
    } finally {
      setSubmitting(false);
    }
  };

  const sendTestEmail = async () => {
    if (!form.testRecipients) {
      setError("Test recipient email is required.");
      return;
    }

    setSubmitting(true);
    setTestStatus(null);
    setMessage("");
    setError("");

    try {
      const res = await axios.post(
        "/api/smtp-config/test",
        { to: form.testRecipients },
        { headers: { "x-auth-token": localStorage.getItem("token") } }
      );
      setMessage(res.data.message || "Test email sent.");
      setTestStatus("success");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send test email.");
      setTestStatus("fail");
    } finally {
      setSubmitting(false);
    }
  };
  if (loading) return <p>Loading SMTP configuration...</p>;

  return (
    <div className="p-4 border rounded bg-light shadow-sm">
      {/* <h4 className="mb-3">SMTP Configuration</h4> */}

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        <div className="col-md-4 mb-3">
          <label>Protocol</label>
          <select
            name="protocol"
            className="form-control"
            value={form.protocol}
            onChange={handleChange}
          >
            <option value="SMTP">SMTP</option>
            <option value="SMTPS">SMTPS</option>
            <option value="SMTP + STARTTLS">SMTP + STARTTLS</option>
          </select>
        </div>

        <div className="col-md-4 mb-3">
          <label>Authentication Method</label>
          <select
            name="authMethod"
            className="form-control"
            value={form.authMethod}
            onChange={handleChange}
          >
            <option value="Automatic">Automatic</option>
            <option value="PLAIN">PLAIN</option>
            <option value="LOGIN">LOGIN</option>
            <option value="SCRAM-SHA-1">SCRAM-SHA-1</option>
            <option value="CRAM-MD5">CRAM-MD5</option>
            <option value="NTLM">NTLM</option>
          </select>
        </div>

        <div className="col-md-4 mb-3">
          <label>SMTP Server</label>
          <input
            type="text"
            name="server"
            className="form-control"
            value={form.server}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label>Port</label>
          <input
            type="number"
            name="port"
            className="form-control"
            value={form.port}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label>Postmaster Email</label>
          <input
            type="email"
            name="postmasterEmail"
            className="form-control"
            value={form.postmasterEmail}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label>Sender Name</label>
          <input
            type="text"
            name="senderName"
            className="form-control"
            value={form.senderName}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label>Sender Email</label>
          <input
            type="email"
            name="senderEmail"
            className="form-control"
            value={form.senderEmail}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label>Scheduled Time</label>
          <div className="d-flex gap-2 align-items-center">
            <input
              type="time"
              name="scheduledTime"
              className="form-control"
              value={form.scheduledTime}
              onChange={handleChange}
            />
            <select
              name="scheduledAmPm"
              className="form-control"
              style={{ width: "80px" }}
              value={form.scheduledAmPm}
              onChange={handleChange}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>

        <div className="col-md-4 mb-3">
          <label>Username</label>
          <input
            type="text"
            name="username"
            className="form-control"
            value={form.username}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label>Password</label>
          <input
            type="password"
            name="password"
            className="form-control"
            value={form.password}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label>Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            className="form-control"
            value={form.confirmPassword}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-4 mb-3">
          <label>Test Recipient Email</label>
          <input
            type="email"
            name="testRecipients"
            className="form-control"
            value={form.testRecipients}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="d-flex gap-3 mt-3 align-items-center">
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Apply Configuration"}
        </button>

        <button
          className="btn btn-secondary"
          onClick={sendTestEmail}
          disabled={submitting}
        >
          {submitting ? "Sending..." : "Send Test Email"}
        </button>

        {testStatus === "fail" && (
          <button
            className="btn btn-danger"
            onClick={sendTestEmail}
            disabled={submitting}
          >
            Retry Test
          </button>
        )}
      </div>
    </div>
  );
};

export default SMTPConfigForm;
