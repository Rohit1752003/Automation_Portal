import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaFileAlt,
  FaDownload,
  FaUser,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpeg";
import "../../styles/Dashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function ResubmitRequest() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [request, setRequest] = useState(null);
  const [newFile, setNewFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // =========================
  // AUTH + FETCH REQUEST
  // =========================
  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    fetchRequest();
  }, [user, id]);

  const fetchRequest = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      logout();
      navigate("/");
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/requests/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

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
          data.message ||
            "Unable to fetch request."
        );

        navigate("/submitted-documents");
        return;
      }

      // =========================
      // GET REQUEST DATA
      // =========================
      const requestData =
        data.data ||
        data.request ||
        data;

      if (!requestData) {
        alert("Request data not found.");
        navigate("/submitted-documents");
        return;
      }

      // =========================
      // ONLY REJECTED REQUEST
      // =========================
      if (requestData.status !== "Rejected") {
        alert(
          "Only rejected requests can be resubmitted."
        );

        navigate("/submitted-documents");
        return;
      }

      setRequest(requestData);

    } catch (error) {
      console.error(
        "Fetch request error:",
        error
      );

      alert(
        "Unable to connect to the server."
      );

      navigate("/submitted-documents");

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // FILE CHANGE
  // =========================
  const handleFileChange = (e) => {
  const file = e.target.files?.[0];

  if (!file) {
    setNewFile(null);
    return;
  }

  setNewFile(file);
};

  // =========================
  // RESUBMIT REQUEST
  // =========================
const handleResubmit = async () => {
  if (!newFile) {
    alert("Please upload corrected file.");
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
    const formData = new FormData();

    // IMPORTANT:
    // "document" must match upload.single("document")
    formData.append("document", newFile);

    const response = await fetch(
      `${API_URL}/requests/${id}/resubmit`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data = await response.json();

    // Session expired
    if (response.status === 401) {
      logout();
      navigate("/");
      return;
    }

    // API error
    if (!response.ok) {
      alert(
        data.message ||
          "Unable to resubmit request."
      );
      return;
    }

    // Success
    alert(
      "Request Re-submitted Successfully ✅"
    );

    navigate("/submitted-documents");

  } catch (error) {
    console.error(
      "Resubmit error:",
      error
    );

    alert(
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

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <h3 style={{ padding: "30px" }}>
        Loading request...
      </h3>
    );
  }

  // =========================
  // REQUEST NOT FOUND
  // =========================
  if (!request) {
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
            <h1>Re-upload Document</h1>

            <p>
              Correct the rejected document
              and submit it again.
            </p>
          </div>

          <div>

            <button
              className="back-btn"
              onClick={() =>
                navigate(
                  "/submitted-documents"
                )
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
            REQUEST DETAILS
        ========================= */}
        <div className="details-card">

          <p>
            <strong>
              Document:
            </strong>{" "}
            {request.type}
          </p>

          <p>
            <strong>
              Status:
            </strong>{" "}
            <span
              style={{
                color: "red",
                fontWeight: "600",
              }}
            >
              {request.status}
            </span>
          </p>

          <p
            style={{
              marginTop: "10px",
              color: "red",
            }}
          >
            <strong>
              Rejection Reason:
            </strong>{" "}
            {request.rejectionReason ||
              "Not Provided"}
          </p>

          {/* =========================
              UPLOAD FILE
          ========================= */}
          <div
            style={{
              marginTop: "20px",
            }}
          >

            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
              }}
            >
              Upload Corrected File
            </label>

            <input
              type="file"
              accept=".pdf,.jpeg,.png"
              onChange={handleFileChange}
            />

            {newFile && (
              <p
                style={{
                  marginTop: "8px",
                  color: "#555",
                }}
              >
                Selected file:{" "}
                <strong>
                  {newFile.name}
                </strong>
              </p>
            )}

          </div>

          {/* =========================
              SUBMIT
          ========================= */}
          <button
            onClick={handleResubmit}
            disabled={submitting}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              borderRadius: "6px",
              backgroundColor: "#2f66c7",
              color: "white",
              border: "none",
              cursor: submitting
                ? "not-allowed"
                : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting
              ? "Submitting..."
              : "Re-submit Request"}
          </button>

        </div>
      </div>
    </div>
  );
}