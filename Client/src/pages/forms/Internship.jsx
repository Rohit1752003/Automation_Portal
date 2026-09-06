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

export default function InternshipLetter() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    course: "",
    companyName: "",
    duration: "",
    email: "",
    file: null,
  });

  const [submitting, setSubmitting] = useState(false);

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
    }));
  }, [user, navigate]);

  // =========================
  // HANDLE INPUT CHANGE
  // =========================

  const handleChange = (e) => {
    const { name, value, files } = e.target;

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

    if (!formData.file) {
      alert("Please upload supporting file.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      logout();
      navigate("/");
      return;
    }

    setSubmitting(true);

    try {
      // ==========================================
      // CREATE MULTIPART FORM DATA
      // ==========================================

      const data = new FormData();

      data.append(
        "type",
        "Internship Letter"
      );

      data.append(
        "formData",
        JSON.stringify({
          fullName: formData.fullName,
          studentId: formData.studentId,
          course: formData.course,
          companyName: formData.companyName,
          duration: formData.duration,
          email: formData.email,
        })
      );

      // IMPORTANT:
      // Must match upload.single("document")
      data.append(
        "document",
        formData.file
      );

      // ==========================================
      // DEBUG
      // ==========================================

      console.log(
        "========== INTERNSHIP UPLOAD =========="
      );

      console.log(
        "File:",
        formData.file
      );

      console.log(
        "File name:",
        formData.file.name
      );

      console.log(
        "File type:",
        formData.file.type
      );

      console.log(
        "File size:",
        formData.file.size
      );

      console.log(
        "========================================"
      );

      // ==========================================
      // SEND REQUEST
      // ==========================================

      const response = await fetch(
        `${API_URL}/requests`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          // DO NOT ADD:
          // "Content-Type": "application/json"

          body: data,
        }
      );

      const responseData =
        await response.json();

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
          "Internship request failed:",
          responseData
        );

        alert(
          responseData.message ||
            "Unable to submit internship letter request."
        );

        return;
      }

      // =========================
      // SUCCESS
      // =========================

      console.log(
        "Internship request created:",
        responseData
      );

      alert(
        "Internship Letter Request Submitted Successfully ✅"
      );

      navigate(
        "/submitted-documents"
      );

    } catch (error) {
      console.error(
        "Internship request error:",
        error
      );

      alert(
        "Unable to connect to the server. Please try again."
      );

    } finally {
      setSubmitting(false);
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
              navigate(
                "/submitted-documents"
              )
            }
            style={{
              cursor: "pointer",
            }}
          >
            <FaFileAlt /> Submitted Documents
          </li>

          <li
            onClick={() =>
              navigate(
                "/requested-documents"
              )
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

        <div className="header">

          <div>

            <h1>
              Request Internship Letter
            </h1>

            <p>
              Fill details & upload supporting
              document
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
                backgroundColor:
                  "#2f66c7",
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
            marginTop: "30px",
            maxWidth: "500px",
          }}
        >

          <form
            onSubmit={handleSubmit}
          >

            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              readOnly
              style={{
                backgroundColor:
                  "#f1f1f1",
              }}
            />

            <input
              type="text"
              name="course"
              placeholder="Course"
              value={formData.course}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="companyName"
              placeholder="Company Name"
              value={formData.companyName}
              onChange={handleChange}
              required
            />

            <input
              type="text"
              name="duration"
              placeholder="Internship Duration"
              value={formData.duration}
              onChange={handleChange}
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <label
              style={{
                marginTop: "10px",
                display: "block",
              }}
            >
              Upload Supporting File
            </label>

            <input
              type="file"
              name="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleChange}
              required
            />

            {formData.file && (
              <p
                style={{
                  marginTop: "8px",
                  fontSize: "14px",
                  color: "#555",
                }}
              >
                Selected:{" "}
                <strong>
                  {formData.file.name}
                </strong>
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: "15px",
                padding: "10px 20px",
                borderRadius: "6px",
                backgroundColor:
                  submitting
                    ? "#999"
                    : "#2f66c7",
                color: "white",
                border: "none",
                cursor: submitting
                  ? "not-allowed"
                  : "pointer",
              }}
            >
              {submitting
                ? "Submitting..."
                : "Submit Request"}
            </button>

          </form>

        </div>

      </div>
    </div>
  );
}