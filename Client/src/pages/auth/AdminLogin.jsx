import React, { useState } from "react";
import "../../styles/LoginPage.css";
import { FaKey, FaUser } from "react-icons/fa";
import logo from "../../assets/logo.jpeg";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AdminLogin() {
  const navigate = useNavigate();
    const { login } = useAuth();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/admin-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          admin_id: adminId.trim(),
          password: password.trim(),
        }),
      });

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (response.ok && data.success) {
        const token = data.data?.token;
        const adminInfo = data.data?.admin;

        if (!token) {
          setError("Authentication token missing from response.");
          return;
        }
      
        login(
  token,
  adminInfo,
  "admin"
);

navigate("/admin");
      } else {
        setError(
          data.message || "Invalid credentials. Please try again."
        );
      }
    } catch (err) {
      console.error("Login Error:", err);

      setError(
        "Unable to connect to the server. Please check your network connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <img src={logo} alt="College Logo" className="logo" />

        <ul>
          <li>
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

      {/* Main Section */}
      <div className="main">
        <div className="login-box">
          <h1>Admin Login</h1>

          <form onSubmit={handleSubmit}>
            <div>
              <label>Admin ID</label>
              <input
                type="text"
                placeholder="Enter Admin ID"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div>
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <p
                style={{
                  color: "#e63946",
                  marginTop: "10px",
                  fontSize: "14px",
                }}
              >
                {error}
              </p>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Authenticating..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}