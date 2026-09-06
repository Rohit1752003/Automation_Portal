import React, { useState, useMemo, useEffect } from "react";
import { FaHome, FaFileAlt, FaUsers, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.jpeg";
import "../../styles/Dashboard.css";
import { useAuth } from "../../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logout } = useAuth();

  const [filter, setFilter] = useState("ALL");
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");

        // FIXED: Endpoint uses /api prefix and sends Bearer JWT
        const response = await fetch(`${API_URL}/requests`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        // Safe check for non-OK HTTP status or HTML responses (e.g. 404 HTML)
        if (!response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errData = await response.json();
            throw new Error(errData.message || `HTTP Error ${response.status}`);
          } else {
            throw new Error(`Server returned HTTP ${response.status}`);
          }
        }

        const data = await response.json();

        // Extract array from standard sendResponse envelope or raw array fallback
        const requestArray = Array.isArray(data)
  ? data
  : Array.isArray(data.data)
  ? data.data
  : data.data?.requests || [];

        const visibleRequests = requestArray.filter(
          (r) => !r.hiddenForAdmin
        );

        setRequests(visibleRequests);
      } catch (err) {
        console.error("Unable to fetch requests:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Filter logic
  const filteredRequests = useMemo(() => {
    if (filter === "ALL") return requests;
    return requests.filter((req) => req.status === filter);
  }, [filter, requests]);

  // Counts calculation
  const pendingCount = requests.filter(
    (r) => r.status === "Pending"
  ).length;

  const approvedCount = requests.filter(
    (r) => r.status === "Approved"
  ).length;

  const rejectedCount = requests.filter(
    (r) => r.status === "Rejected"
  ).length;

 const handleLogout = () => {
  logout();
  navigate("/");
};

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <img src={logo} alt="logo" />

        <ul className="sidebar-menu">
          <li className="active">
            <FaHome /> Dashboard
          </li>

          <li
            onClick={() => navigate("/all-requests")}
            style={{ cursor: "pointer" }}
          >
            <FaFileAlt /> All Requests
          </li>

          <li
            onClick={() => navigate("/students")}
            style={{ cursor: "pointer" }}
          >
            <FaUsers /> Students
          </li>

          <li
            onClick={() => navigate("/adminprofile")}
            style={{ cursor: "pointer" }}
          >
            <FaUser /> Profile
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="admin-main">
        <div className="admin-content-wrapper">

          {/* Header */}
          <div className="admin-header">
            <div>
              <h1>
  Hello, {user?.name || "Admin"}
</h1>
              <p>College Documents Automation Portal</p>
            </div>

            <button
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              backgroundColor: "#fee2e2",
              color: "#dc2626",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "20px",
              fontSize: "14px"
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Stats Cards */}
          <div className="stats-grid">

            <div
              className={`stat-card pending-card ${filter === "Pending" ? "selected" : ""}`}
              onClick={() => setFilter("Pending")}
            >
              <h3>Pending Requests</h3>
              <h2>{pendingCount}</h2>
            </div>

            <div
              className={`stat-card approved-card ${filter === "Approved" ? "selected" : ""}`}
              onClick={() => setFilter("Approved")}
            >
              <h3>Approved</h3>
              <h2>{approvedCount}</h2>
            </div>

            <div
              className={`stat-card rejected-card ${filter === "Rejected" ? "selected" : ""}`}
              onClick={() => setFilter("Rejected")}
            >
              <h3>Rejected</h3>
              <h2>{rejectedCount}</h2>
            </div>

            <div
              className={`stat-card total-card ${filter === "ALL" ? "selected" : ""}`}
              onClick={() => setFilter("ALL")}
            >
              <h3>Total Requests</h3>
              <h2>{requests.length}</h2>
            </div>

          </div>

          {/* Table Section */}
          <div className="table-wrapper">
            <h2>Recent Requests</h2>

            {loading ? (
              <p style={{ padding: "20px", color: "#666" }}>Loading requests...</p>
            ) : filteredRequests.length === 0 ? (
              <p style={{ padding: "20px", color: "#666" }}>No requests found for this status.</p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Student ID</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRequests.map((req) => (
                    <tr
                      key={req._id}
                      onClick={() => navigate(`/request/${req._id}`)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{req.type}</td>

                      <td>{req.student?.student_id || "N/A"}</td>

                      <td>
                        {new Date(req.createdAt).toLocaleDateString()}
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
                        {req.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}