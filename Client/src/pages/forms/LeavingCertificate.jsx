import React, { useEffect, useState } from "react";
import {
  FaHome,
  FaFileAlt,
  FaDownload,
  FaUser,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpeg";
import "../../styles/Dashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function LeavingCertificate() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [formData, setFormData] = useState({
    className: "",
    division: "",
    rollNo: "",
    reason: "",
  });

  const [loading, setLoading] = useState(false);

  // =========================
  // LOAD AUTHENTICATED STUDENT
  // =========================

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      className: user.className || "",
      division: user.division || "",
      rollNo: user.roll_no || "",
    }));
  }, [user, navigate]);

  // =========================
  // HANDLE INPUT
  // =========================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =========================
  // SUBMIT REQUEST
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Session expired. Please login again.");
      navigate("/");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      logout();
      navigate("/");
      return;
    }

    setLoading(true);

    try {
      // =========================
      // JSON REQUEST
      // NO FILE UPLOAD
      // =========================

      const response = await fetch(
        `${API_URL}/requests`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            type: "Leaving Certificate",

            formData: {
              className: formData.className,
              division: formData.division,
              rollNo: formData.rollNo,
              reason: formData.reason,
            },

            uploadedFile: "",
          }),
        }
      );

      const data = await response.json();

      // =========================
      // AUTH ERROR
      // =========================

      if (response.status === 401) {
        logout();
        navigate("/");
        return;
      }

      // =========================
      // API ERROR
      // =========================

      if (!response.ok) {
        console.error(
          "Leaving Certificate API error:",
          data
        );

        alert(
          data.message ||
            "Unable to submit Leaving Certificate request."
        );

        return;
      }

      // =========================
      // SUCCESS
      // =========================

      console.log(
        "Leaving Certificate created:",
        data
      );

      alert(
        "Leaving Certificate Request Submitted Successfully ✅"
      );

      navigate("/requested-documents");

    } catch (error) {
      console.error(
        "Leaving Certificate request error:",
        error
      );

      alert(
        "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="dashboard-container">

      {/* =========================
          SIDEBAR
      ========================= */}

      <div className="sidebar">

        <img
          src={logo}
          alt="College Logo"
        />

        <ul className="sidebar-menu">

          <li
            onClick={() =>
              navigate("/dashboard")
            }
            style={{
              cursor: "pointer",
            }}
          >
            <FaHome /> Dashboard
          </li>

          <li
            onClick={() =>
              navigate("/submitted-documents")
            }
            style={{
              cursor: "pointer",
            }}
          >
            <FaFileAlt /> Submitted Documents
          </li>

          <li
            onClick={() =>
              navigate("/requested-documents")
            }
            style={{
              cursor: "pointer",
            }}
          >
            <FaFileAlt /> Requested Documents
          </li>

          <li
            onClick={() =>
              navigate("/downloads")
            }
            style={{
              cursor: "pointer",
            }}
          >
            <FaDownload /> Downloaded Documents
          </li>

          <li
            onClick={() =>
              navigate("/profile")
            }
            style={{
              cursor: "pointer",
            }}
          >
            <FaUser /> Profile
          </li>

        </ul>
      </div>

      {/* =========================
          MAIN CONTENT
      ========================= */}

      <div className="main-content">

        {/* HEADER */}

        <div className="header">

          <div>
            <h1>
              Leaving Certificate Request
            </h1>

            <p>
              Fill details to apply
            </p>
          </div>

          <div>

            <button
              className="back-btn"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              Back
            </button>

            <button
              className="logout-btn"
              onClick={handleLogout}
              style={{
                marginLeft: "10px",
              }}
            >
              Logout
            </button>

          </div>

        </div>

        {/* =========================
            FORM
        ========================= */}

        <form
          onSubmit={handleSubmit}
          style={{
            maxWidth: "500px",
          }}
        >

          {/* Student ID */}

          <input
            type="text"
            value={
              user.student_id || ""
            }
            disabled
          />

          {/* Student Name */}

          <input
            type="text"
            value={user.name || ""}
            disabled
          />

          {/* Phone */}

          <input
            type="text"
            value={user.phone || ""}
            disabled
          />

          {/* Department */}

          <input
            type="text"
            value={
              user.department ||
              "Computer Engineering"
            }
            disabled
          />

          {/* Class */}

          <input
            type="text"
            name="className"
            placeholder="Class"
            value={formData.className}
            onChange={handleChange}
            required
          />

          {/* Division */}

          <input
            type="text"
            name="division"
            placeholder="Division"
            value={formData.division}
            onChange={handleChange}
            required
          />

          {/* Roll Number */}

          <input
            type="text"
            name="rollNo"
            placeholder="Roll No"
            value={formData.rollNo}
            onChange={handleChange}
            required
          />

          {/* Reason */}

          <textarea
            name="reason"
            placeholder="Reason for Leaving"
            value={formData.reason}
            onChange={handleChange}
            required
            style={{
              padding: "10px",
              borderRadius: "6px",
              width: "100%",
              minHeight: "100px",
              resize: "vertical",
            }}
          />

          {/* Submit */}

          <button
            type="submit"
            className="apply-btn"
            disabled={loading}
          >
            {loading
              ? "Submitting..."
              : "Request"}
          </button>

        </form>

      </div>
    </div>
  );
}