import React, { useEffect, useState } from "react";
import { FaHome, FaFileAlt, FaUsers, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpeg";
import "../../styles/Dashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function AdminProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!user || !token) {
      navigate("/admin-login");
      return;
    }

    const fetchAdmin = async () => {
      try {
        const adminId =
          user.admin_id ||
          user.id ||
          user._id;

        const res = await fetch(
          `${API_URL}/admin/${adminId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            `Server Error: ${res.status}`
          );
        }

        const data = await res.json();

        setAdmin(data.data);
      } catch (error) {
        console.error(
          "Error fetching admin profile:",
          error
        );

        // Fallback to authenticated user
        setAdmin(user);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, [user, navigate]);

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <img src={logo} alt="logo" />

        <ul className="sidebar-menu">
          <li
            onClick={() => navigate("/admin")}
            style={{ cursor: "pointer" }}
          >
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
            className="active"
            style={{ cursor: "pointer" }}
          >
            <FaUser /> Profile
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {loading ? (
          <div
            className="profile-wrapper"
            style={{ padding: "20px" }}
          >
            <p style={{ color: "#666" }}>
              Loading profile details...
            </p>
          </div>
        ) : admin ? (
          <div className="profile-wrapper">

            {/* Profile Card */}
            <div className="profile-card-modern">
              <div className="profile-avatar-modern">
                {admin.name
                  ? admin.name
                      .charAt(0)
                      .toUpperCase()
                  : "A"}
              </div>

              <h2>
                {admin.name || "Administrator"}
              </h2>

              <div className="profile-divider"></div>

              <div className="profile-details-modern">
                <p>
                  <strong>Admin ID:</strong>{" "}
                  {admin.admin_id ||
                    admin.id ||
                    "N/A"}
                </p>

                <p>
                  <strong>Contact:</strong>{" "}
                  {admin.contact ||
                    admin.phone ||
                    "N/A"}
                </p>
              </div>
            </div>

            {/* Professional Details */}
            <div className="profile-card-modern extra-details-card">
              <div className="details-header">
                <h3>
                  Professional Details
                </h3>
              </div>

              <div className="profile-divider"></div>

              <div className="profile-details-modern">
                <p>
                  <strong>Email:</strong>{" "}
                  {admin.email || "N/A"}
                </p>

                <p>
                  <strong>Address:</strong>{" "}
                  {admin.address || "N/A"}
                </p>

                <p>
                  <strong>Role:</strong>{" "}
                  {admin.role ||
                    "Document Administrator"}
                </p>
              </div>
            </div>

          </div>
        ) : (
          <div
            className="profile-wrapper"
            style={{ padding: "20px" }}
          >
            <p style={{ color: "#e53e3e" }}>
              Unable to load profile
              information.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}