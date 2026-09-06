import React, { useEffect, useState } from "react";
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

export default function OtherDocumentRequest() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    phone: "",
    description: "",
    file: null,
  });

  const [loading, setLoading] = useState(false);

  // =========================
  // AUTH + LOAD STUDENT
  // =========================
  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      name: user.name || "",
      studentId: user.student_id || "",
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
      const file = files?.[0] || null;

      setFormData((prev) => ({
        ...prev,
        file,
      }));

      return;
    }

    // TEXT / TEXTAREA
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

    // Check authentication
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

    // Validate description
    if (!formData.description.trim()) {
      alert("Please enter document details.");
      return;
    }

    // Validate file
    if (!formData.file) {
      alert("Please upload the document.");
      return;
    }

    setLoading(true);

    try {
      // =========================
      // CREATE FORMDATA
      // =========================
      const data = new FormData();

      data.append("type", "Other");

      data.append(
        "formData",
        JSON.stringify({
          name: formData.name,
          studentId: formData.studentId,
          phone: formData.phone,
          description: formData.description,
        })
      );

      // IMPORTANT
      // Backend uses:
      // upload.single("document")
      data.append("document", formData.file);

      // =========================
      // SEND REQUEST
      // =========================
      const response = await fetch(
        `${API_URL}/requests`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: data,
        }
      );

      const contentType =
        response.headers.get("content-type");

      let responseData = {};

      if (
        contentType &&
        contentType.includes("application/json")
      ) {
        responseData = await response.json();
      }

      // =========================
      // SESSION EXPIRED
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
        alert(
          responseData.message ||
            `Unable to submit document. Error ${response.status}`
        );

        return;
      }

      // =========================
      // SUCCESS
      // =========================
      alert(
        "Other Document Submitted Successfully ✅"
      );

      navigate("/submitted-documents");

    } catch (error) {
      console.error(
        "Other document request error:",
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

  // =========================
  // AUTH CHECK
  // =========================
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

      {/* =========================
          MAIN CONTENT
      ========================= */}
      <div className="main-content">

        {/* HEADER */}
        <div className="header">

          <div>
            <h1>
              Submit Other Document
            </h1>

            <p>
              Fill details and upload your
              document
            </p>
          </div>

          <div>

            <button
              className="back-btn"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              <FaArrowLeft /> Back
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
        <div
          style={{
            marginTop: "40px",
            maxWidth: "500px",
          }}
        >

          <form onSubmit={handleSubmit}>

            {/* NAME */}
            <input
              type="text"
              name="name"
              value={formData.name}
              readOnly
              placeholder="Student Name"
              style={{
                backgroundColor: "#eee",
              }}
            />

            {/* STUDENT ID */}
            <input
              type="text"
              name="studentId"
              value={formData.studentId}
              readOnly
              placeholder="Student ID"
              style={{
                backgroundColor: "#eee",
              }}
            />

            {/* PHONE */}
            <input
              type="text"
              name="phone"
              value={formData.phone}
              readOnly
              placeholder="Phone"
              style={{
                backgroundColor: "#eee",
              }}
            />

            {/* DESCRIPTION */}
            <textarea
              name="description"
              placeholder="Enter document details"
              value={formData.description}
              onChange={handleChange}
              required
              rows="4"
              style={{
                marginTop: "10px",
                width: "100%",
                padding: "10px",
                borderRadius: "6px",
                resize: "vertical",
                border: "1px solid #ccc",
              }}
            />

            {/* FILE */}
            <label
              style={{
                marginTop: "15px",
                display: "block",
                marginBottom: "6px",
                fontWeight: "500",
              }}
            >
              Upload Document (PDF/DOC/DOCX)
            </label>

            <input
              type="file"
              name="file"
              accept=".pdf,.jpeg,.png"
              onChange={handleChange}
              required
            />

            {/* SELECTED FILE */}
            {formData.file && (
              <p
                style={{
                  marginTop: "8px",
                  color: "#555",
                }}
              >
                Selected file:{" "}
                <strong>
                  {formData.file.name}
                </strong>
              </p>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "20px",
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
                : "Submit Document"}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
}