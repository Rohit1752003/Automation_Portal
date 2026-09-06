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

export default function ExamForm() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    studentId: "",
    email: "",
    phone: "",
    file: null,
  });

  const [submitting, setSubmitting] = useState(false);

  // =========================
  // LOAD USER
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

      if (!file) {
        return;
      }

      // 5 MB check
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5 MB.");
        e.target.value = "";
        return;
      }

      // Allowed types
      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Only PDF, JPG and PNG files are allowed.");
        e.target.value = "";
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
  // SUBMIT
  // =========================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate("/");
      return;
    }

    if (!formData.file) {
      alert("Please upload your exam form.");
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
      const requestData = new FormData();

      requestData.append("type", "Exam Form");

      requestData.append(
        "formData",
        JSON.stringify({
          fullName: formData.fullName,
          phone: formData.phone,
          email: formData.email,
          studentId: formData.studentId,
        })
      );

      // IMPORTANT:
      // Backend route uses upload.single("document")
      requestData.append("document", formData.file);


      const response = await fetch(`${API_URL}/requests`, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${token}`,
        },

        // DO NOT manually set Content-Type
        body: requestData,
      });

      const contentType =
        response.headers.get("content-type") || "";

      let data;

      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        const text = await response.text();

        console.error(
          "Non-JSON server response:",
          text
        );

        throw new Error(
          `Server returned ${response.status}. Check backend console.`
        );
      }

      if (response.status === 401) {
        logout();
        navigate("/");
        return;
      }

      if (!response.ok) {
        console.error(
          "Exam form API error:",
          data
        );

        alert(
          data.message ||
            "Failed to submit exam form."
        );

        return;
      }

      console.log(
        "Exam form created successfully:",
        data
      );

      alert(
        "Exam Form Submitted Successfully ✅"
      );

      navigate("/submitted-documents");

    } catch (error) {
      console.error(
        "Exam form submission error:",
        error
      );

      alert(
        error.message ||
          "Unable to connect to the server."
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

      {/* SIDEBAR */}

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

      {/* MAIN */}

      <div className="main-content">

        <div className="header">

          <div>
            <h1>
              Exam Form Submission
            </h1>

            <p>
              Fill details & upload your exam form
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

        {/* FORM */}

        <div
          style={{
            marginTop: "40px",
            maxWidth: "500px",
          }}
        >

          <form onSubmit={handleSubmit}>

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
                backgroundColor: "#eee",
              }}
            />

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
              Upload Exam Form
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
                : "Submit Exam Form"}
            </button>

          </form>

        </div>

      </div>

    </div>
  );
}