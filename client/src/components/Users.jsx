import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Table } from "react-bootstrap";

const Users = () => {
  const [apiData, setApiData] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/users/all", {
        headers: {
          "x-auth-token": token,
        },
      });
      setApiData(response.data);
    } catch (err) {
      setError("Error fetching API data");
      console.error("Error fetching users:", err);
    }
  };

  const handleEdit = (user) => {
    navigate(`/users/${user._id}/edit`, { state: { user } });
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/users/${id}`, {
        headers: {
          "x-auth-token": token,
        },
      });
      setApiData(apiData.filter((user) => user._id !== id));
      alert("User deleted successfully");
    } catch (err) {
      console.error("Error deleting user:", err);
      setError("Error deleting user");
    }
  };

  return (
    <div className="content-wrapper">
      <div className=" flex-grow-1 custom-w">
        <div className="row">
          <div className="col-md-12">
            <div className="card">
              <h5 className="card-header">Users</h5>
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="card-body p-0">
                <Table striped bordered hover responsive>
                  <thead className="table-light">
                    <tr>
                      <th>Username</th>
                      <th>DN</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Auth Method</th>
                      <th>Allowed APIs</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiData.map((item) => (
                      <tr key={item._id} className="b-0">
                        <td className="table-fs">{item.username}</td>
                        <td className="table-fs">{item.dn}</td>
                        <td className="table-fs">{item.role}</td>
                        <td className="table-fs">{item.status}</td>
                        <td className="table-fs">{item.authMethod}</td>
                        <td className="table-fs">
                          {item.allowedAPIs.join(", ")}
                        </td>
                        <td className="d-flex flex-column justify-content-center">
                          <button
                            onClick={() => handleEdit(item)}
                            className="btn btn-sm btn-secondary mb-2"
                          >
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="btn btn-sm btn-outline-danger"
                          >
                            <i className="fas fa-trash-alt"></i> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="content-backdrop fade" />
    </div>
  );
};

export default Users;
