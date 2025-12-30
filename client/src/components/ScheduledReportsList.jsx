import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  Modal,
  Table,
  Toast,
  ToastContainer,
  Badge,
  Alert,
} from "react-bootstrap";
import {
  Trash,
  Pencil,
  ClockHistory,
  FileEarmarkPdf,
  FileEarmarkExcel,
  FileEarmarkText,
  CheckCircle,
  XCircle,
} from "react-bootstrap-icons";

const ScheduledReportsList = ({ onEdit }) => {
  const [schedules, setSchedules] = useState([]);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    success: true,
  });

  const [logs, setLogs] = useState([]);
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const showToast = (message, success = true) => {
    setToast({ show: true, message, success });
    setTimeout(() => {
      setToast({ show: false, message: "", success: true });
    }, 3000);
  };

  const fetchSchedules = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/scheduled-reports", {
        headers: { "x-auth-token": token },
      });
      setSchedules(res.data);
    } catch (err) {
      console.error("Failed to fetch schedules", err);
      showToast("Failed to load schedules", false);
    }
  };

  const fetchLogs = async (user) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`/api/report-logs/user/${user._id}`, {
        headers: { "x-auth-token": token },
      });
      setLogs(res.data);
      setSelectedUser(user);
      setLogModalOpen(true);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      showToast("Failed to load logs", false);
    }
  };

  const handleDelete = (id) => {
    setDeletingId(id);
    setConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/scheduled-reports/${deletingId}`, {
        headers: { "x-auth-token": token },
      });
      showToast("Schedule deleted successfully");
      fetchSchedules();
    } catch (err) {
      console.error("Failed to delete schedule", err);
      showToast("Failed to delete schedule", false);
    } finally {
      setConfirmOpen(false);
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <div className="">
      <h3 className="mb-3">Existing Schedules</h3>

      {/* Toast Notification */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 9999 }}
      >
        <Toast
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
          bg={toast.success ? "success" : "danger"}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* Table */}
      <Table striped bordered hover responsive>
        <thead className="table-light">
          <tr>
            <th>User</th>
            <th>Email</th>
            <th>Reports</th>
            {/* <th>Schedule</th> */}
            <th>Format</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {schedules.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center">
                No schedules found.
              </td>
            </tr>
          ) : (
            schedules.map((sch) => (
              <tr key={sch._id}>
                <td>{sch.userId?.username}</td>
                <td>{sch.userId?.email}</td>
                <td>
                  <div className="d-flex flex-wrap gap-1">
                    {sch.selectedApis.map((api) => (
                      <Badge key={api} bg="light" text="dark">
                        {api}
                      </Badge>
                    ))}
                  </div>
                </td>
                {/* <td>
                  <Badge bg="info">{sch.frequency || "Custom"}</Badge>
                </td> */}
                <td>
                  <span className="text-uppercase">{sch.format}</span>
                </td>
                <td>
                  <div className="d-flex  gap-2">
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(sch._id)}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => onEdit(sch)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => fetchLogs(sch.userId)}
                    >
                      Logs
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      {/* Delete Confirmation Modal */}
      <Modal show={confirmOpen} onHide={() => setConfirmOpen(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete this schedule?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Logs Modal */}
      <Modal
        show={logModalOpen}
        onHide={() => setLogModalOpen(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Logs for {selectedUser?.username || "User"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {logs.length === 0 ? (
            <Alert variant="info">No logs available.</Alert>
          ) : (
            logs.map((log) => (
              <div key={log._id} className="mb-3 p-2 border rounded">
                <div className="d-flex justify-content-between">
                  <div>
                    {log.status === "sent" ? (
                      <CheckCircle className="text-success me-2" />
                    ) : (
                      <XCircle className="text-danger me-2" />
                    )}
                    <strong>{log.reportName}</strong>
                  </div>
                  <small className="text-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </small>
                </div>
                <div className="mt-2 ps-3">
                  <div className="d-flex align-items-center">
                    {log.format === "pdf" ? (
                      <FileEarmarkPdf className="text-danger me-2" size={14} />
                    ) : log.format === "excel" ? (
                      <FileEarmarkExcel
                        className="text-success me-2"
                        size={14}
                      />
                    ) : (
                      <FileEarmarkText
                        className="text-primary me-2"
                        size={14}
                      />
                    )}
                    <small className="text-uppercase">{log.format}</small>
                  </div>
                  {log.message && (
                    <div className="alert alert-light p-2 mt-2 mb-0">
                      <small>{log.message}</small>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setLogModalOpen(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ScheduledReportsList;
