import React, { useEffect, useState } from "react";
import { Tabs, Tab, Container } from "react-bootstrap";
import LDAPConfig from "./LDAPConfig";
import LicenseConfig from "./LicenseConfig";
import AdminReportScheduler from "../AdminReportScheduler";
import SMTPConfigForm from "../SMTPConfigForm";
import LDAPConfigForm from "./LDAPConfigForm";
import LogoUploader from "./LogoUploader";

const ConfigTabs = () => {
  const [formData, setFormData] = useState({ license: "", ldapURL: "" });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/config/ldapURL", {
      method: "GET",
      headers: { "x-auth-token": token },
    })
      .then((res) => res.json())
      .then((res) => {
        if (!res.ok) {
          console.log(res.message);
        }
        setFormData((prev) => ({ ...prev, ldapURL: res.value }));
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLicenseSubmit = (e) => {
    e.preventDefault();
    fetch("/api/license/activate", {
      method: "POST",
      headers: {
        "x-auth-token": localStorage.getItem("token"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ license: formData.license }),
    })
      .then((res) => res.json())
      .then((res) => setMessage(<span>{res.message}</span>));
  };

  const handleLdapUrlSubmit = (e) => {
    e.preventDefault();
    fetch("/api/config", {
      method: "PUT",
      headers: {
        "x-auth-token": localStorage.getItem("token"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ property: "ldapURL", value: formData.ldapURL }),
    })
      .then((res) => res.json())
      .then((res) => setMessage(<span>{res.message}</span>));
  };

  return (
    <div className="content-wrapper">
      <div className=" flex-grow-1 custom-w">
        <div className="row">
          <div className="col-md-12">
            <div className="card mt-4">
              <h5 className="card-header">Configuration</h5>
              <div className="card-body p-0 mt-4">
                <Tabs defaultActiveKey="reports" id="config-tabs">
                  <Tab eventKey="reports" title="Report Scheduling">
                    <AdminReportScheduler />
                  </Tab>
                  {/* <Tab eventKey="ldap" title="LDAP">
                    <LDAPConfig
                      formData={formData}
                      handleChange={handleChange}
                      handleSubmit={handleLdapUrlSubmit}
                    />
                  </Tab> */}
                  <Tab eventKey="license" title="License">
                    <LicenseConfig
                      formData={formData}
                      handleChange={handleChange}
                      handleSubmit={handleLicenseSubmit}
                    />
                  </Tab>
                  <Tab
                    eventKey="reportconfiguration"
                    title="SMTP Configuration"
                  >
                    <SMTPConfigForm />
                  </Tab>
                  <Tab eventKey="ldapform" title="LDAP Configuration">
                    <LDAPConfigForm />
                  </Tab>
                  <Tab eventKey="theme" title="Theme">
                    <LogoUploader />
                  </Tab>
                </Tabs>

                {message && <div style={{ marginTop: "1rem" }}>{message}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigTabs;
