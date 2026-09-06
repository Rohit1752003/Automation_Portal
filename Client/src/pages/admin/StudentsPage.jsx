import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaFileAlt,
  FaUsers,
  FaUser,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpeg";
import "../../styles/AdminDash.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function StudentsPage() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/admin-login");
      return;
    }

    fetchStudents();
  }, [user, navigate]);

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        logout();
        navigate("/admin-login");
        return;
      }

      const response = await fetch(`${API_URL}/students`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const contentType = response.headers.get("content-type");

      let data = {};

      if (
        contentType &&
        contentType.includes("application/json")
      ) {
        data = await response.json();
      }

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logout();
          navigate("/admin-login");
          return;
        }

        console.error(
          data.message || `Server Error: ${response.status}`
        );

        return;
      }

      /*
        Backend currently returns:

        [
          {
            student_id: "...",
            name: "...",
            phone: "..."
          }
        ]

        But this also supports wrapped responses.
      */
      const studentArray = Array.isArray(data)
        ? data
        : Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.students)
        ? data.students
        : Array.isArray(data.data?.students)
        ? data.data.students
        : [];

      setStudents(studentArray);
    } catch (error) {
      console.error(
        "Error fetching students:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  return (
    <div className="dashboard-container">

      {/* ================= SIDEBAR ================= */}
      <div className="sidebar">

        <img src={logo} alt="logo" />

        <ul className="sidebar-menu">

          <li
            onClick={() => navigate("/admin")}
            style={{ cursor: "pointer" }}
          >
            <FaHome />
            Dashboard
          </li>

          <li
            onClick={() => navigate("/all-requests")}
            style={{ cursor: "pointer" }}
          >
            <FaFileAlt />
            All Requests
          </li>

          <li
            className="active"
            style={{ cursor: "pointer" }}
          >
            <FaUsers />
            Students
          </li>

          <li
            onClick={() => navigate("/adminprofile")}
            style={{ cursor: "pointer" }}
          >
            <FaUser />
            Profile
          </li>

        </ul>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="admin-main">

        <div className="admin-content-wrapper">

          {/* ================= HEADER ================= */}
          <div className="admin-header">

            <div>
              <h1>All Students</h1>
              <p>Registered Students List</p>
            </div>

            <div>

              <button
                className="back-btn"
                onClick={() => navigate("/admin")}
              >
                Back
              </button>

              <button
                className="logout-btn"
                onClick={handleLogout}
                style={{ marginLeft: "10px" }}
              >
                Logout
              </button>

            </div>

          </div>

          {/* ================= STUDENTS TABLE ================= */}
          <div className="table-wrapper">

            {loading ? (

              <p
                style={{
                  padding: "20px",
                  color: "#666",
                }}
              >
                Loading students list...
              </p>

            ) : students.length === 0 ? (

              <p
                style={{
                  padding: "20px",
                  color: "#666",
                }}
              >
                No registered students found.
              </p>

            ) : (

              <table className="admin-table">

                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Phone</th>
                  </tr>
                </thead>

                <tbody>

                  {students.map((student, index) => (

                    <tr
                      key={
                        student._id ||
                        student.student_id ||
                        index
                      }
                    >

                      <td>
                        {student.student_id || "N/A"}
                      </td>

                      <td>
                        {student.name || "N/A"}
                      </td>

                      <td>
                        {student.phone || "N/A"}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

        </div>

      </div>

    </div>
  );
}