import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaFileAlt,
  FaDownload,
  FaUser,
  FaTrash,
} from "react-icons/fa";
import logo from "../../assets/logo.jpeg";
import "../../styles/Dashboard.css";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function SubmittedDocuments() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  if (!user) {
    navigate("/");
    return;
  }

  fetchRequests();
}, [user, navigate]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/requests/student`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers.get("content-type");
      let data = {};

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        alert(data.message || `Error fetching requests (${response.status})`);

        if (response.status === 401) {
  logout();
  navigate("/");
}
        return;
      }

     const requestList = Array.isArray(data)
  ? data
  : Array.isArray(data.data)
  ? data.data
  : Array.isArray(data.requests)
  ? data.requests
  : [];

     const submitted = requestList.filter(
  (r) => !r.hiddenForStudent
);

      setRequests(submitted);
    } catch (error) {
      console.error("Fetch requests error:", error);
      alert("Unable to connect to server to fetch requests.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this document from your list?")) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/requests/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers.get("content-type");
      let data = {};

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        alert(data.message || "Failed to delete request");
        return;
      }

      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (error) {
      console.error("Delete request error:", error);
      alert("Unable to delete request at this time.");
    }
  };

  

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <img src={logo} alt="logo" />

        <ul className="sidebar-menu">
          <li
            onClick={() => navigate("/dashboard")}
            style={{ cursor: "pointer" }}
          >
            <FaHome /> Dashboard
          </li>

          <li
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
            }}
          >
            <FaFileAlt /> Submitted Documents
          </li>

          <li
            onClick={() => navigate("/requested-documents")}
            style={{ cursor: "pointer" }}
          >
            <FaFileAlt /> Requested Documents
          </li>

          <li
            onClick={() => navigate("/downloads")}
            style={{ cursor: "pointer" }}
          >
            <FaDownload /> Downloaded Documents
          </li>

          <li
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
          >
            <FaUser /> Profile
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <div>
            <h1>Submitted Documents</h1>
            <p>All your submitted document requests</p>
          </div>

          <div>
            <button
              className="back-btn"
              onClick={() => navigate("/dashboard")}
            >
              Back
            </button>

            <button
              className="logout-btn"
             onClick={() => {
  logout();
  navigate("/");
}}
              style={{ marginLeft: "10px" }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>
              Loading submitted documents...
            </p>
          ) : requests.length === 0 ? (
            <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>
              No documents submitted yet.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Student ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((req) => (
                  <tr
                    key={req._id}
                    onClick={() =>
                      req.status === "Rejected" &&
                      navigate(`/resubmit/${req._id}`)
                    }
                    style={{
                      cursor:
                        req.status === "Rejected" ? "pointer" : "default",
                    }}
                  >
                    <td>{req.type || "N/A"}</td>

                    <td>{req.student?.student_id || req.student_id || "N/A"}</td>

                    <td>
                      {req.createdAt
                        ? new Date(req.createdAt).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td
                      className={
                        req.status === "Pending"
                          ? "status-pending"
                          : req.status === "Approved"
                          ? "status-approved"
                          : "status-rejected"
                      }
                    >
                      {req.status || "Pending"}
                    </td>

                    <td
                      onClick={(e) => {
                        e.stopPropagation();

                        if (req.status === "Approved") {
                          handleDelete(req._id);
                        }
                      }}
                      style={{ textAlign: "center" }}
                    >
                      <FaTrash
                        style={{
                          color:
                            req.status === "Approved" ? "red" : "#ccc",
                          cursor:
                            req.status === "Approved"
                              ? "pointer"
                              : "not-allowed",
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}