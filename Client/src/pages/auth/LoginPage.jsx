import React, { useState } from "react";
import "../../styles/LoginPage.css";
import { FaKey, FaUser } from "react-icons/fa";
import logo from "../../assets/logo.jpeg";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function LoginPage() {
  const navigate = useNavigate();

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Adjust '/api/login' or '/api/auth/login' to match your Express router setup
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          student_id: studentId.trim(),
          password: password.trim(),
        }),
      });

      const contentType = response.headers.get("content-type");
      let data = {};

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }


      
  const token = data.data?.token;
const studentInfo = data.data?.student;

if (response.ok && data.success) {
  login(
    token,
    studentInfo,
    "student"
  );

navigate("/dashboard");
} else {
  setError(data.message || "Invalid Student ID or Password.");
}
    } catch (err) {
      console.error("Login error:", err);
      setError("Unable to connect to the server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <img src={logo} alt="College Logo" />

        <ul>
          <li className="active">
            <FaKey />
            <Link
              to="/"
              style={{
                textDecoration: "none",
                color: "inherit",
                marginLeft: "8px",
              }}
            >
              Student Login
            </Link>
          </li>

          <li>
            <FaUser />
            <Link
              to="/admin-login"
              style={{
                textDecoration: "none",
                color: "inherit",
                marginLeft: "8px",
              }}
            >
              Admin Login
            </Link>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className="main">
        <div className="login-box">
          <h1>Student Login</h1>

          <form onSubmit={handleSubmit}>
            <div>
              <label>Student ID</label>
              <input
                type="text"
                placeholder="Enter Student ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {error && (
              <p
                style={{
                  color: "#e53e3e",
                  fontSize: "0.875rem",
                  marginTop: "10px",
                }}
              >
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}