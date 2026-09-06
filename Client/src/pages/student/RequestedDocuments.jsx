import React, { useEffect, useState } from "react";
import {
  FaHome,
  FaFileAlt,
  FaDownload,
  FaUser,
  FaTrash,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpeg";
import "../../styles/Dashboard.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function RequestedDocuments() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    fetchRequests();
  }, [user]);

  const fetchRequests = async () => {
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

      const requestList =
        data.data ||
        data.requests ||
        [];

      const requested = requestList.filter(
        (r) =>
          !r.hiddenForStudent &&
          (r.type === "Bonafide" ||
            r.type === "Leaving Certificate")
      );

      setRequests(requested);
    } catch (error) {
      console.error(
        "Fetch requests error:",
        error.message
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove from your list?"))
      return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/requests/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to delete request"
        );
      }

      setRequests((prev) =>
        prev.filter((r) => r._id !== id)
      );
    } catch (error) {
      console.error(
        "Delete request error:",
        error.message
      );
    }
  };

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
            style={{
              backgroundColor:
                "rgba(255,255,255,0.2)",
            }}
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
            onClick={() => navigate("/profile")}
            style={{ cursor: "pointer" }}
          >
            <FaUser /> Profile
          </li>
        </ul>
      </div>

      {/* Main */}
      <div className="main-content">
        <div className="header">
          <h1>Requested Documents</h1>

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
              }}
            >
              Loading requests...
            </p>
          ) : requests.length === 0 ? (
            <p
              style={{
                textAlign: "center",
                padding: "20px",
              }}
            >
              No requested documents found.
            </p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Division</th>
                  <th>Roll No</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((req) => (
                  <tr
                    key={req._id}
                    onClick={() =>
                      req.status === "Rejected" &&
                      navigate(
                        `/resubmit/${req._id}`
                      )
                    }
                    style={{
                      cursor:
                        req.status === "Rejected"
                          ? "pointer"
                          : "default",
                    }}
                  >
                    <td>{req.type}</td>

                    <td>
                      {req.student?.student_id ||
                        "-"}
                    </td>

                    <td>
                      {req.student?.name || "-"}
                    </td>

                    <td>
                      {req.formData?.className ||
                        "-"}
                    </td>

                    <td>
                      {req.formData?.division ||
                        "-"}
                    </td>

                    <td>
                      {req.formData?.rollNo ||
                        "-"}
                    </td>

                    <td
                      className={
                        req.status === "Pending"
                          ? "status-pending"
                          : req.status ===
                            "Approved"
                          ? "status-approved"
                          : "status-rejected"
                      }
                    >
                      {req.status}
                    </td>

                    <td
                      onClick={(e) => {
                        e.stopPropagation();

                        if (
                          req.status ===
                          "Approved"
                        ) {
                          handleDelete(req._id);
                        }
                      }}
                      style={{
                        textAlign: "center",
                      }}
                    >
                      <FaTrash
                        style={{
                          color:
                            req.status ===
                            "Approved"
                              ? "red"
                              : "#ccc",
                          cursor:
                            req.status ===
                            "Approved"
                              ? "pointer"
                              : "not-allowed",
                        }}
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