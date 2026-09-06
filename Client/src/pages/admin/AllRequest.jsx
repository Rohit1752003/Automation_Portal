import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaFileAlt,
  FaUsers,
  FaUser,
  FaTrash,
} from "react-icons/fa";
import logo from "../../assets/logo.jpeg";
import "../../styles/Dashboard.css";
import { useAuth } from "../../context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function AllRequests() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // FETCH REQUESTS
  // =========================

  useEffect(() => {
    if (!user) {
      navigate("/admin-login");
      return;
    }

    fetchRequests();
  }, [user, navigate]);

  const fetchRequests = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        logout();
        navigate("/admin-login");
        return;
      }

      const response = await fetch(
        `${API_URL}/requests?page=1&limit=100`,
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
        navigate("/admin-login");
        return;
      }

      // =========================
      // API ERROR
      // =========================

      if (!response.ok) {
        alert(
          data.message ||
            `Server returned error ${response.status}`
        );
        return;
      }

      // =========================
      // EXTRACT REQUEST ARRAY
      // =========================

      let requestArray = [];

      if (Array.isArray(data)) {
        requestArray = data;
      } else if (
        Array.isArray(data.data?.requests)
      ) {
        requestArray = data.data.requests;
      } else if (
        Array.isArray(data.data)
      ) {
        requestArray = data.data;
      } else if (
        Array.isArray(data.requests)
      ) {
        requestArray = data.requests;
      }

      // =========================
      // REMOVE ADMIN-HIDDEN
      // =========================

      const visibleRequests =
        requestArray.filter(
          (request) =>
            request &&
            request.hiddenForAdmin !== true
        );

      setRequests(visibleRequests);

    } catch (error) {
      console.error(
        "Fetch requests failed:",
        error
      );

      alert(
        "Unable to fetch requests from server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // APPROVE
  // =========================

  const handleApprove = async (id) => {
    if (
      !window.confirm(
        "Approve this request?"
      )
    ) {
      return;
    }

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/requests/${id}/approve`,
        {
          method: "PUT",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        logout();
        navigate("/admin-login");
        return;
      }

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to approve request."
        );
        return;
      }

      alert("Request Approved ✅");

      await fetchRequests();

    } catch (error) {
      console.error(
        "Approve error:",
        error
      );

      alert(
        "Unable to connect to server."
      );
    }
  };

  // =========================
  // REJECT
  // =========================

  const handleReject = async (id) => {
    const reason =
      prompt(
        "Enter rejection reason:"
      );

    if (!reason || !reason.trim()) {
      return;
    }

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/requests/${id}/reject`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            reason: reason.trim(),
          }),
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        logout();
        navigate("/admin-login");
        return;
      }

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to reject request."
        );
        return;
      }

      alert("Request Rejected ❌");

      await fetchRequests();

    } catch (error) {
      console.error(
        "Reject error:",
        error
      );

      alert(
        "Unable to connect to server."
      );
    }
  };

  // =========================
  // DELETE
  // =========================

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this request from admin list?"
      )
    ) {
      return;
    }

    try {
      const token =
        localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/requests/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (response.status === 401) {
        logout();
        navigate("/admin-login");
        return;
      }

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to delete request."
        );
        return;
      }

      alert("Request Deleted");

      await fetchRequests();

    } catch (error) {
      console.error(
        "Delete error:",
        error
      );

      alert(
        "Unable to connect to server."
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  // =========================
  // AUTH
  // =========================

  if (!user) {
    return null;
  }

  // =========================
  // UI
  // =========================

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
              navigate("/admin")
            }
            style={{
              cursor: "pointer",
            }}
          >
            <FaHome />
            Dashboard
          </li>

          <li className="active">
            <FaFileAlt />
            All Requests
          </li>

          <li
            onClick={() =>
              navigate("/students")
            }
            style={{
              cursor: "pointer",
            }}
          >
            <FaUsers />
            Students
          </li>

          <li
            onClick={() =>
              navigate("/adminprofile")
            }
            style={{
              cursor: "pointer",
            }}
          >
            <FaUser />
            Profile
          </li>

        </ul>
      </div>

      {/* =========================
          MAIN
      ========================= */}

      <div className="admin-main">

        <div className="admin-content-wrapper">

          {/* HEADER */}

          <div className="admin-header">

            <h1>
              All Requests
            </h1>

            <div>

              <button
                className="back-btn"
                onClick={() =>
                  navigate("/admin")
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
              TABLE
          ========================= */}

          <div
            className="table-wrapper"
            style={{
              display: "block",
              width: "100%",
              minHeight: "300px",
              overflowX: "auto",
              overflowY: "auto",
              visibility: "visible",
              opacity: 1,
            }}
          >

            {loading ? (

              <p
                style={{
                  padding: "20px",
                  color: "#666",
                }}
              >
                Loading requests...
              </p>

            ) : requests.length === 0 ? (

              <p
                style={{
                  padding: "20px",
                  color: "#666",
                }}
              >
                No requests found.
              </p>

            ) : (

              <table
                className="admin-table"
                style={{
                  display: "table",
                  width: "100%",
                  minWidth: "750px",
                  visibility: "visible",
                  opacity: 1,
                  backgroundColor: "#fff",
                  color: "#222",
                }}
              >

                <thead>
                  <tr>

                    <th>
                      Document
                    </th>

                    <th>
                      Student ID
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>

                    <th>
                      Delete
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {requests.map(
                    (req) => (

                      <tr
                        key={req._id}
                        onClick={() =>
                          navigate(
                            `/request/${req._id}`
                          )
                        }
                        style={{
                          cursor:
                            "pointer",
                        }}
                      >

                        {/* DOCUMENT */}

                        <td>
                          {req.type ||
                            "N/A"}
                        </td>

                        {/* STUDENT */}

                        <td>
                          {req.student
                            ?.student_id ||
                            "N/A"}
                        </td>

                        {/* DATE */}

                        <td>
                          {req.createdAt
                            ? new Date(
                                req.createdAt
                              ).toLocaleDateString()
                            : "-"}
                        </td>

                        {/* STATUS */}

                        <td
                          className={
                            req.status ===
                            "Pending"
                              ? "status-pending"
                              : req.status ===
                                "Approved"
                              ? "status-approved"
                              : "status-rejected"
                          }
                        >
                          {req.status ||
                            "Unknown"}
                        </td>

                        {/* ACTION */}

                        <td
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        >

                          {req.status ===
                            "Pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleApprove(
                                    req._id
                                  )
                                }
                                style={{
                                  background:
                                    "green",
                                  color:
                                    "white",
                                  border:
                                    "none",
                                  padding:
                                    "5px 10px",
                                  marginRight:
                                    "5px",
                                  cursor:
                                    "pointer",
                                  borderRadius:
                                    "4px",
                                }}
                              >
                                Approve
                              </button>

                              <button
                                onClick={() =>
                                  handleReject(
                                    req._id
                                  )
                                }
                                style={{
                                  background:
                                    "red",
                                  color:
                                    "white",
                                  border:
                                    "none",
                                  padding:
                                    "5px 10px",
                                  cursor:
                                    "pointer",
                                  borderRadius:
                                    "4px",
                                }}
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {req.status !==
                            "Pending" &&
                            "-"}
                        </td>

                        {/* DELETE */}

                        <td
                          onClick={(e) => {
                            e.stopPropagation();

                            if (
                              req.status ===
                                "Approved" ||
                              req.status ===
                                "Rejected"
                            ) {
                              handleDelete(
                                req._id
                              );
                            }
                          }}
                          style={{
                            textAlign:
                              "center",
                          }}
                        >

                          <FaTrash
                            style={{
                              color:
                                req.status ===
                                  "Approved" ||
                                req.status ===
                                  "Rejected"
                                  ? "red"
                                  : "#ccc",

                              cursor:
                                req.status ===
                                  "Approved" ||
                                req.status ===
                                  "Rejected"
                                  ? "pointer"
                                  : "not-allowed",

                              fontSize:
                                "16px",
                            }}
                          />

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}