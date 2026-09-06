import React, { useEffect, useState } from "react";
import { FaHome, FaFileAlt, FaDownload, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpeg";
import "../../styles/Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function BonafideForm() {
  const navigate = useNavigate();

  const { user, logout } = useAuth();

  const [formData, setFormData] = useState({
    className: "",
    division: "",
    rollNo: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const requestResponse = await fetch(
        `${API_URL}/requests`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            studentId: user.student_id,
            type: "Bonafide",
            formData: {
              className: formData.className,
              division: formData.division,
              rollNo: formData.rollNo,
            },
            uploadedFile: "",
          }),
        }
      );

      const requestData =
        await requestResponse.json();

      if (!requestResponse.ok) {
        alert(
          requestData.message ||
            "Unable to create request"
        );
        return;
      }

      alert(
        "Bonafide Request Submitted Successfully ✅"
      );

      navigate("/requested-documents");
    } catch (error) {
      console.error(error);
      alert("Server connection error");
    }
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <img src={logo} alt="logo" />

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

      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <div>
            <h1>
              Bonafide Certificate Request
            </h1>
            <p>Fill details to apply</p>
          </div>

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

        <form
          onSubmit={handleSubmit}
          style={{ maxWidth: "500px" }}
        >
          <input
            value={user?.student_id || ""}
            disabled
          />

          <input
            value={user?.name || ""}
            disabled
          />

          <input
            value={user?.phone || ""}
            disabled
          />

          <input
            type="text"
            name="className"
            placeholder="Class"
            value={formData.className}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="division"
            placeholder="Division"
            value={formData.division}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="rollNo"
            placeholder="Roll No"
            value={formData.rollNo}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            className="apply-btn"
          >
            Request
          </button>
        </form>
      </div>
    </div>
  );
}