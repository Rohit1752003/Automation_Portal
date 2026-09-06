import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FaCheckCircle,
  FaDownload,
  FaUniversity,
  FaShieldAlt,
} from "react-icons/fa";
import "../../styles/Varify.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function VerifyCertificate() {
  const { verificationId } = useParams();

  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCertificate();
  }, [verificationId]);

  const fetchCertificate = async () => {
    try {
      const response = await fetch(
        `${API_URL}/verify/${verificationId}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Verification failed");
        return;
      }

      setCertificate(
        data.data || data.certificate || data
      );
    } catch (err) {
      console.error(err);
      setError("Unable to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="verify-container">
        <div className="verify-card">
          <h2>Verifying Certificate...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="verify-container">
        <div className="verify-card error-card">
          <h2>❌ Verification Failed</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!certificate?.valid) {
    return (
      <div className="verify-container">
        <div className="verify-card error-card">
          <h2>❌ Invalid Certificate</h2>
          <p>
            This certificate is not valid or has been
            tampered with.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-container">
      <div className="verify-card">

        <div className="college-header">
          <FaUniversity size={30} />
          <div>
            <h1>SKNCOE</h1>
            <p>College Document Verification Portal</p>
          </div>
        </div>

        <div className="verify-status">
          <FaCheckCircle />
          VERIFIED DOCUMENT
        </div>

        <h2>Certificate Verification</h2>

        <div className="detail-row">
          <span>Verification ID</span>
          <strong>{verificationId}</strong>
        </div>

        <div className="detail-row">
          <span>Certificate Number</span>
          <strong>
            {certificate.certificateNumber}
          </strong>
        </div>

        <div className="detail-row">
          <span>Document Type</span>
          <strong>
            {certificate.documentType}
          </strong>
        </div>

        <div className="detail-row">
          <span>Issued To</span>
          <strong>{certificate.issuedTo}</strong>
        </div>

        <div className="detail-row">
          <span>Department</span>
          <strong>{certificate.department}</strong>
        </div>

        <div className="detail-row">
          <span>Issue Date</span>
          <strong>
            {new Date(
              certificate.approvedDate
            ).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </strong>
        </div>

        <div className="detail-row">
          <span>Status</span>
          <strong className="verified-text">
            Verified
          </strong>
        </div>

        <div className="detail-row">
          <span>Verified On</span>
          <strong>
            {new Date().toLocaleString("en-IN")}
          </strong>
        </div>

        {certificate.downloadUrl && (
          <a
            href={certificate.downloadUrl}
            target="_blank"
            rel="noreferrer"
            className="download-btn"
          >
            <FaDownload />
            Download Certificate
          </a>
        )}

        <div className="security-box">
          <FaShieldAlt />
          <span>
            This document has been verified through
            the SKNCOE Digital Verification System.
          </span>
        </div>

        <div className="footer-note">
          © 2026 SKNCOE. All Rights Reserved.
        </div>

      </div>
    </div>
  );
}