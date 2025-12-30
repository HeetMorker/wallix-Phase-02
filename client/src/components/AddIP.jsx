import React, { useState, useEffect } from "react";
import axios from "axios";

const AddIP = () => {
  const [api, setApi] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [authKey, setAuthKey] = useState("");
  const [bastionName, setBastionName] = useState("");
  const [isBastionLocked, setIsBastionLocked] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [apiData, setApiData] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchApiData();
  }, []);

  const fetchApiData = async () => {
    try {
      const response = await axios.get("/api/ipaddresses");
      setApiData(response.data);
    } catch {
      setError("Error fetching API data");
    }
  };

  const handleBastionChange = (e) => {
    if (!isBastionLocked) setBastionName(e.target.value);
  };

  const handleApiChange = (e) => setApi(e.target.value);

  const handleIpChange = (e) => {
    const value = e.target.value;
    setIpAddress(value);
    const existingEntry = apiData.find((entry) => entry.ipAddress === value);
    if (existingEntry && existingEntry.bastionName) {
      setBastionName(existingEntry.bastionName);
      setIsBastionLocked(true);
    } else {
      setBastionName("");
      setIsBastionLocked(false);
    }
  };

  const handleAuthKeyChange = (e) => setAuthKey(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      if (api === "all") {
        const apiList = [
          "usergroups",
          "applications",
          "accounts",
          "approvals",
          "devicereport",
          "scans",
          "sessions",
          "targetgroups",
          "authentications",
          "authorizations",
          "usergroupRestrictions",
          "targetgroupRestrictions",
          "scanjobs",
        ];
        await Promise.all(
          apiList.map((apiItem) =>
            axios.post("/api/ipaddresses", {
              api: apiItem,
              ipAddress,
              authKey,
              bastionName,
            })
          )
        );
        setMessage("IP address added successfully for all APIs");
      } else {
        const endpoint = isEditing
          ? `/api/ipaddresses/${editId}`
          : "/api/ipaddresses";
        const method = isEditing ? "put" : "post";
        const response = await axios[method](endpoint, {
          api,
          ipAddress,
          authKey,
          bastionName,
        });
        setMessage(response.data.message);
      }

      setApi("");
      setIpAddress("");
      setAuthKey("");
      setIsEditing(false);
      setEditId(null);
      fetchApiData();
      setBastionName("");
      setIsBastionLocked(false);
    } catch {
      setError("Error saving IP address");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/ipaddresses/${id}`);
      setMessage("IP address deleted successfully");
      fetchApiData();
    } catch {
      setError("Error deleting IP address");
    }
  };

  const handleEdit = (item) => {
    setIsEditing(true);
    setEditId(item._id);
    setApi(item.api);
    setIpAddress(item.ipAddress);
    setAuthKey(item.authKey);
    setBastionName(item.bastionName || "");
    setIsBastionLocked(!!item.bastionName);
  };

  return (
    <div className="content-wrapper">
      <div className=" flex-grow-1 custom-w">
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <h5 className="card-header">Add IP Address</h5>
              <div className="card-body">
                {message && (
                  <div className="alert alert-success alert-dismissible">
                    {message}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setMessage("")}
                    ></button>
                  </div>
                )}
                {error && (
                  <div className="alert alert-danger alert-dismissible">
                    {error}
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setError("")}
                    ></button>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-sm-4">
                      <label htmlFor="api">Choose API</label>
                      <select
                        id="api"
                        className="form-select"
                        name="api"
                        value={api}
                        onChange={handleApiChange}
                        required
                      >
                        <option value="" disabled>
                          Please select API
                        </option>
                        <option value="all">All APIs</option>
                        <option value="usergroups">Usergroup API</option>
                        <option value="applications">Applications API</option>
                        <option value="accounts">Accounts API</option>
                        <option value="approvals">Approvals API</option>
                        <option value="devicereport">Device Report API</option>
                        <option value="scans">Scans API</option>
                        <option value="sessions">Sessions API</option>
                        <option value="targetgroups">Target Group API</option>
                        <option value="scanjobs">Scan Jobs API</option>
                        <option value="authentications">
                          Authentications API
                        </option>
                        <option value="usergroupRestrictions">
                          UsergroupRestrictions API
                        </option>
                        <option value="targetgroupRestrictions">
                          TargetgroupRestrictions API
                        </option>
                        <option value="authorizations">
                          Authorizations API
                        </option>
                      </select>
                    </div>
                    <div className="col-sm-4">
                      <label htmlFor="ipAddress">Add IP Address</label>
                      <input
                        type="text"
                        className="form-control"
                        name="ipAddress"
                        placeholder="Ex. 0.0.0.0"
                        value={ipAddress}
                        onChange={handleIpChange}
                        required
                      />
                    </div>
                    <div className="col-sm-4">
                      <label htmlFor="bastionName">Bastion Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="bastionName"
                        placeholder="Enter Bastion Name"
                        value={bastionName}
                        onChange={handleBastionChange}
                        disabled={isBastionLocked}
                        required={!isBastionLocked}
                      />
                    </div>
                    <div className="col-sm-4">
                      <label htmlFor="authKey">API Key</label>
                      <input
                        type="text"
                        className="form-control"
                        name="authKey"
                        placeholder="Enter API Key"
                        value={authKey}
                        onChange={handleAuthKeyChange}
                        required
                      />
                    </div>
                    <div className="mt-4">
                      <button type="submit" className="btn btn-primary me-2">
                        {isEditing ? "Update" : "Add"} IP Address
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div className="card mt-4">
              <h5 className="card-header">API IP Addresses</h5>
              <div className="card-body">
                <table className="table">
                  <thead>
                    <tr>
                      <th>API</th>
                      <th>IP Address</th>
                      <th>Bastion Name</th>
                      <th>API Key</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiData.map((item) => (
                      <tr key={item._id}>
                        <td>{item.api}</td>
                        <td>{item.ipAddress}</td>
                        <td>{item.bastionName || "-"}</td>
                        <td>{item.authKey}</td>
                        <td>
                          <button
                            onClick={() => handleEdit(item)}
                            className="btn btn-sm btn-secondary me-2"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="btn btn-sm btn-outline-danger"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="content-backdrop fade" />
    </div>
  );
};

export default AddIP;
