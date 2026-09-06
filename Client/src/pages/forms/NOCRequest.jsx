import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaFileAlt,
  FaDownload,
  FaUser,
  FaArrowLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpeg";
import "../../styles/Dashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function NOCRequest() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    phone: "",
    purpose: "",
    organization: "",
    file: null,
  });

  const [loading, setLoading] = useState(false);

  // =========================
  // AUTHENTICATED STUDENT
  // =========================

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      fullName: user.name || "",
      studentId: user.student_id || "",
      email: user.email || "",
      phone: user.phone || "",
    }));
  }, [user, navigate]);

  // =========================
  // HANDLE INPUT
  // =========================

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // FILE
    if (name === "file") {
      const file = files?.[0];

      if (!file) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        file,
      }));

      return;
    }

    // NORMAL INPUT
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

    // FILE REQUIRED
    if (!formData.file) {
      alert("Please upload the supporting document.");
      return;
    }

    setLoading(true);

    try {
      // ==========================================
      // CREATE MULTIPART FORM DATA
      // ==========================================

      const submitData = new FormData();

      // Request type
      submitData.append(
        "type",
        "NOC"
      );

      // Form data
      submitData.append(
        "formData",
        JSON.stringify({
          fullName: formData.fullName,
          studentId: formData.studentId,
          email: formData.email,
          phone: formData.phone,
          organization: formData.organization,
          purpose: formData.purpose,
        })
      );

      // Actual file
      submitData.append(
        "document",
        formData.file
      );

      // ==========================================
      // API REQUEST
      // ==========================================

      const response = await fetch(
        `${API_URL}/requests`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          // DO NOT SET Content-Type HERE
          // Browser sets multipart/form-data boundary
          body: submitData,
        }
      );

      const data = await response.json();

      // ==========================================
      // SESSION EXPIRED
      // ==========================================

      if (response.status === 401) {
        logout();
        navigate("/");
        return;
      }

      // ==========================================
      // API ERROR
      // ==========================================

      if (!response.ok) {
        console.error(
          "NOC submission failed:",
          data
        );

        alert(
          data.message ||
            "Unable to submit NOC request."
        );

        return;
      }

      // ==========================================
      // SUCCESS
      // ==========================================

      console.log(
        "NOC request created:",
        data
      );

      alert(
        "NOC Submitted Successfully ✅"
      );

      navigate(
        "/submitted-documents"
      );

    } catch (error) {
      console.error(
        "NOC request error:",
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

            <h1>NOC Form</h1>

            <p>
              Fill details to submit
              No Objection Certificate
            </p>

          </div>

          <div>

            <button
              onClick={() =>
                navigate("/dashboard")
              }
              style={{
                padding: "6px 12px",
                marginRight: "10px",
                borderRadius: "6px",
                backgroundColor: "#555",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              <FaArrowLeft /> Back
            </button>

            <button
              onClick={handleLogout}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                backgroundColor: "#2f66c7",
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Logout
            </button>

          </div>

        </div>

        {/* =========================
            FORM
        ========================= */}

        <div
          style={{
            marginTop: "40px",
            maxWidth: "500px",
          }}
        >

          <form
            onSubmit={handleSubmit}
          >

            {/* Full Name */}

            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />

            {/* Student ID */}

            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              readOnly
              style={{
                backgroundColor: "#eee",
              }}
            />

            {/* Email */}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            {/* Phone */}

            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              pattern="[0-9]{10}"
              maxLength="10"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            {/* Organization */}

            <input
              type="text"
              name="organization"
              placeholder="Organization / Company Name"
              value={formData.organization}
              onChange={handleChange}
              required
            />

            {/* Purpose */}

            <textarea
              name="purpose"
              placeholder="Purpose of NOC"
              value={formData.purpose}
              onChange={handleChange}
              required
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "10px",
                borderRadius: "6px",
                minHeight: "100px",
                resize: "vertical",
              }}
            />

            {/* File */}

            <label
              style={{
                marginTop: "10px",
                display: "block",
              }}
            >
              Upload Supporting Document
              (PDF/JPG/PNG)
            </label>

            <input
              type="file"
              name="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleChange}
              required
            />

            {/* Selected file */}

            {formData.file && (
              <p
                style={{
                  marginTop: "8px",
                  fontSize: "14px",
                  color: "#555",
                }}
              >
                Selected:{" "}
                {formData.file.name}
              </p>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "15px",
                padding: "10px 20px",
                borderRadius: "6px",
                backgroundColor: "#2f66c7",
                color: "white",
                border: "none",
                cursor: loading
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {loading
                ? "Submitting..."
                : "Submit NOC"}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}