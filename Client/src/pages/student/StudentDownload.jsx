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

export default function StudentDownload() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    fetchDownloads();
  }, [user]);

  const fetchDownloads = async () => {
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
          data.message || "Failed to fetch documents"
        );
      }

      const requests =
        data.data ||
        data.requests ||
        [];

      const approvedDocs = requests.filter(
        (request) =>
          request.status === "Approved" &&
          request.generatedPdf
      );

      setDocuments(approvedDocs);
    } catch (error) {
      console.error(
        "Download fetch error:",
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (pdfUrl, fileName) => {
    const link = document.createElement("a");

    link.href = pdfUrl;
    link.download = fileName;
    link.target = "_blank";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            style={{
              backgroundColor:
                "rgba(255,255,255,0.2)",
            }}
          >
            <FaDownload /> Downloaded Documents
          </li>

          <li
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
          >
            <FaUser /> Profile
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <h1>Downloaded Documents</h1>

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
              onClick={() => {
                logout();
                navigate("/");
              }}
              style={{ marginLeft: "10px" }}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <p
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#666",
              }}
            >
              Loading documents...
            </p>
          ) : documents.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                padding: "20px",
                color: "#666",
              }}
            >
              No approved documents yet.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Approved Date</th>
                  <th>Download</th>
                </tr>
              </thead>

              <tbody>
                {documents.map((doc) => (
                  <tr key={doc._id}>
                    <td>{doc.type}</td>

                    <td>
                      {doc.approvedDate
                        ? new Date(
                            doc.approvedDate
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>
                      <FaDownload
                        style={{
                          cursor: "pointer",
                          color: "#1e64c8",
                        }}
                        onClick={() =>
                          handleDownload(
                            doc.generatedPdf,
                            `${doc.type}_${
                              user?.student_id ||
                              "document"
                            }.pdf`
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}