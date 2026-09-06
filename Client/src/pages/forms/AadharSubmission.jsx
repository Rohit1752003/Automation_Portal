import React, { useEffect, useState } from "react";
import {
  FaHome,
  FaFileAlt,
  FaDownload,
  FaUser,
  FaArrowLeft,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.jpeg";
import "../../styles/Dashboard.css";
import { useAuth } from "../../context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function AadharSubmission() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    phone: "",
    aadhar: "",
    file: null,
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

    if (name === "file") {
      const file = files?.[0];

      setFormData((prev) => ({
        ...prev,
        file: file || null,
      }));

      return;
    }

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
      navigate("/");
      return;
    }

    if (!formData.file) {
      alert("Please upload your Aadhar document.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const requestData = new FormData();

      // Backend requestSchema expects type + formData
      requestData.append(
        "type",
        "Aadhar Card Submission"
      );

      requestData.append(
        "formData",
        JSON.stringify({
          fullName: formData.fullName,
          studentId: formData.studentId,
          email: formData.email,
          phone: formData.phone,
          aadhar: formData.aadhar,
        })
      );

      // IMPORTANT:
      // Backend uses req.file
      requestData.append(
        "document",
        formData.file
      );

      const response = await fetch(
        `${API_URL}/requests`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: requestData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          navigate("/");
          return;
        }

        alert(
          data.message ||
            "Failed to submit Aadhar request."
        );

        return;
      }

      alert(
        "Aadhar Submitted Successfully ✅"
      );

      navigate("/submitted-documents");
    } catch (error) {
      console.error(
        "Aadhar submission error:",
        error
      );

      alert(
        "Unable to connect to the server."
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

  return (
    <div className="dashboard-container">

      {/* ================= SIDEBAR ================= */}

      <div className="sidebar">
        <img src={logo} alt="College Logo" />

        <ul className="sidebar-menu">

          <li
            onClick={() =>
              navigate("/dashboard")
            }
            style={{ cursor: "pointer" }}
          >
            <FaHome /> Dashboard
          </li>

          <li
            onClick={() =>
              navigate(
                "/submitted-documents"
              )
            }
            style={{ cursor: "pointer" }}
          >
            <FaFileAlt /> Submitted Documents
          </li>

          <li
            onClick={() =>
              navigate(
                "/requested-documents"
              )
            }
            style={{ cursor: "pointer" }}
          >
            <FaFileAlt /> Requested Documents
          </li>

          <li
            onClick={() =>
              navigate("/downloads")
            }
            style={{ cursor: "pointer" }}
          >
            <FaDownload /> Downloaded Documents
          </li>

          <li
            onClick={() =>
              navigate("/profile")
            }
            style={{ cursor: "pointer" }}
          >
            <FaUser /> Profile
          </li>

        </ul>
      </div>

      {/* ================= MAIN CONTENT ================= */}

      <div className="main-content">

        {/* Header */}

        <div className="header">

          <div>
            <h1>
              Aadhar Card Submission
            </h1>

            <p>
              Fill details & upload your
              Aadhar card
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
              className="logout-btn"
            >
              Logout
            </button>

          </div>

        </div>

        {/* ================= FORM ================= */}

        <div
          style={{
            marginTop: "40px",
            maxWidth: "500px",
          }}
        >

          <form onSubmit={handleSubmit}>

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

            {/* Aadhar */}

            <input
              type="text"
              name="aadhar"
              placeholder="Aadhar Number (12 digits)"
              pattern="[0-9]{12}"
              maxLength="12"
              value={formData.aadhar}
              onChange={handleChange}
              required
            />

            {/* File */}

            <label
              style={{
                marginTop: "10px",
                display: "block",
              }}
            >
              Upload Aadhar Card
            </label>

            <input
              type="file"
              name="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleChange}
              required
            />

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
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? "Submitting..."
                : "Submit Aadhar"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}