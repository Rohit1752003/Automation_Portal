import React from "react";
import { FaHome, FaFileAlt, FaDownload, FaUser } from "react-icons/fa";
import logo from "../../assets/logo.jpeg";
import "../../styles/Dashboard.css";
import { useNavigate } from "react-router-dom";   // ✅ ADD THIS
import { useAuth } from "../../context/AuthContext";


export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user } = useAuth();
  return (
    <div className="dashboard-container">
      {/* Sidebar */}
       <div className="sidebar">
             <img src={logo} alt="logo" />
     
             <ul className="sidebar-menu">
     
               <li onClick={() => navigate("/dashboard")} style={{cursor:"pointer"}}>
                 <FaHome /> Dashboard
               </li>
     
               <li onClick={() => navigate("/submitted-documents")} style={{cursor:"pointer"}}>
                 <FaFileAlt /> Submitted Document
               </li>
     
               <li onClick={() => navigate("/requested-documents")} style={{cursor:"pointer"}}>
                 <FaFileAlt /> Requested Documents
               </li>
     
              <li onClick={() => navigate("/downloads")}><FaDownload /> Downloaded Documents</li>

  
               <li onClick={() => navigate("/profile")} style={{ cursor: "pointer" }}><FaUser /> Profile</li>

     
             </ul>
           </div>
     
      {/* Main Content */}
      <div className="main-content">
        <div className="header">
          <div>
          <h1>
  Welcome, {user?.name || "Student"}
</h1>
            <p>College Documents Automation Portal</p>
          </div>
          <button 
  className="logout-btn"
onClick={() => {
  logout();
  navigate("/");
}}
>
  Logout
</button>
        </div>

        <h2 className="available-title">Available Documents</h2>

        <div className="documents-grid">
         <div
  className="doc-card"
  onClick={() => navigate("/bonafide")}
  style={{ cursor: "pointer" }}
>
  Bonafide
</div>
          <div
            className="doc-card"
            onClick={() => navigate("/exam-form")}
            style={{ cursor: "pointer" }}>
            Exam Form
          </div>

          <div className="doc-card" onClick={() => navigate("/leaving-certificate")}>Leaving Certificate</div>
         <div 
            className="doc-card"
            onClick={() => navigate("/internship-letter")}
            style={{ cursor: "pointer" }}>
            Internship Letter
          </div>
          <div
    className="doc-card"
  onClick={() => navigate("/aadhar-submission")}
  style={{ cursor: "pointer" }}
>
  Aadhar Card Submission
</div>

         
          <div
  className="doc-card"
  onClick={() => navigate("/noc-request")}
  style={{ cursor: "pointer" }}
>
  NOC
</div>

        </div>

        <button 
  className="apply-btn"
  onClick={() => navigate("/other-document")}
>
  Submit another Document
</button>
      </div>
    </div>
  );
}
