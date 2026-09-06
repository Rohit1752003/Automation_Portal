import React, { useEffect, useState } from "react";
import { FaHome, FaFileAlt, FaDownload, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpeg";
import "../../styles/Dashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function Profile() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [submittedCount, setSubmittedCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    fetchProfileStats();
  }, [user]);

  const fetchProfileStats = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/requests/student`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/");
        }

        throw new Error(
          data.message || "Failed to fetch requests"
        );
      }

      const requests =
        data.data ||
        data.requests ||
        [];

      setSubmittedCount(requests.length);

      setApprovedCount(
        requests.filter(
          (r) => r.status === "Approved"
        ).length
      );

      setRejectedCount(
        requests.filter(
          (r) => r.status === "Rejected"
        ).length
      );
    } catch (error) {
      console.error(
        "Profile stats error:",
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

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
            onClick={() =>
              navigate("/submitted-documents")
            }
            style={{ cursor: "pointer" }}
          >
            <FaFileAlt /> Submitted Documents
          </li>

          <li
            onClick={() =>
              navigate("/requested-documents")
            }
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
            style={{
              backgroundColor:
                "rgba(255,255,255,0.2)",
            }}
          >
            <FaUser /> Profile
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {loading ? (
          <h3>Loading Profile...</h3>
        ) : (
          <div className="profile-wrapper">

            {/* Profile Card */}
            <div className="profile-card-modern">
              <div className="profile-avatar-modern">
                {user?.name?.charAt(0)}
              </div>

              <h2>{user?.name}</h2>

              <div className="profile-divider"></div>

              <div className="profile-details-modern">
                <p>
                  <strong>Student ID:</strong>{" "}
                  {user?.student_id}
                </p>

                <p>
                  <strong>Phone:</strong>{" "}
                  {user?.phone || "-"}
                </p>
              </div>

              <div className="profile-stats-modern">
                <div>
                  <h3>{submittedCount}</h3>
                  <span>Submitted</span>
                </div>

                <div>
                  <h3>{approvedCount}</h3>
                  <span>Approved</span>
                </div>

                <div>
                  <h3>{rejectedCount}</h3>
                  <span>Rejected</span>
                </div>
              </div>
            </div>

            {/* Academic Details */}
            <div className="profile-card-modern extra-details-card">
              <div className="details-header">
                <h3>Academic Details</h3>
              </div>

              <div className="profile-divider"></div>

              <div className="profile-details-modern">
                <p>
                  <strong>Class:</strong>{" "}
                  {user?.className || "BE"}
                </p>

                <p>
                  <strong>Division:</strong>{" "}
                  {user?.division || "-"}
                </p>

                <p>
                  <strong>Roll No:</strong>{" "}
                  {user?.roll_no || "-"}
                </p>

                <p>
                  <strong>Email:</strong>{" "}
                  {user?.email}
                </p>

                <p>
                  <strong>Temporary Address:</strong>{" "}
                  {user?.temp_address || "-"}
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}