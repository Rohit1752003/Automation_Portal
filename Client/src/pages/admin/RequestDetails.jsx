import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  FaHome,
  FaFileAlt,
  FaUsers,
  FaUser,
  FaExternalLinkAlt,
  FaDownload,
} from "react-icons/fa";

import {
  useParams,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.jpeg";
import "../../styles/AdminDash.css";


// ============================================================
// API
// ============================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  API_URL.replace(/\/api\/?$/, "");


// ============================================================
// REQUEST TYPES
// ============================================================
//
// Bonafide and Leaving Certificate are generated/requested
// using student/form details.
//
// Other requests may contain an uploaded document that must
// be reviewed.
// ============================================================

const DETAIL_ONLY_REQUESTS = [
  "Bonafide",
  "Leaving Certificate",
];


// ============================================================
// RESPONSE NORMALIZER
// ============================================================

const getRequestData = (data) => {
  return (
    data?.data?.request ||
    data?.data ||
    data?.request ||
    data
  );
};


// ============================================================
// DOCUMENT INFORMATION
// ============================================================

const getDocumentInfo = (uploadedFile) => {

  if (!uploadedFile) {
    return null;
  }

  const value =
    String(uploadedFile).trim();

  if (!value) {
    return null;
  }


  // ==========================================================
  // BASE64 PDF
  // ==========================================================

  if (
    value.startsWith(
      "data:application/pdf"
    )
  ) {

    return {
      originalUrl: value,
      previewUrl: value,
      fileName: "document.pdf",
      type: "pdf",
    };
  }


  // ==========================================================
  // BASE64 IMAGE
  // ==========================================================

  if (
    value.startsWith(
      "data:image/"
    )
  ) {

    const match =
      value.match(
        /^data:image\/([^;,]+)/i
      );

    const extension =
      match?.[1]?.toLowerCase() ===
      "jpeg"
        ? "jpg"
        : match?.[1]?.toLowerCase() ||
          "image";

    return {
      originalUrl: value,
      previewUrl: value,
      fileName:
        `document.${extension}`,
      type: "image",
    };
  }


  // ==========================================================
  // CLOUDINARY / REMOTE URL
  // ==========================================================

  if (
    /^https?:\/\//i.test(value)
  ) {

    try {

      const parsed =
        new URL(value);

      const pathname =
        parsed.pathname || "";

      let fileName =
        decodeURIComponent(
          pathname
            .split("/")
            .pop() ||
            "document"
        );


      /*
       * Cloudinary URLs can sometimes
       * look like:
       *
       * https://res.cloudinary.com/...
       *
       * without a visible extension.
       */

      if (
        !fileName.includes(".")
      ) {
        fileName =
          "document";
      }


      return {
        originalUrl: value,
        previewUrl: value,
        fileName,
        type: "remote",
      };

    } catch {

      return {
        originalUrl: value,
        previewUrl: value,
        fileName: "document",
        type: "remote",
      };
    }
  }


  // ==========================================================
  // OLD LOCAL WINDOWS PATH
  // ==========================================================

  const fileName =
    value
      .split(/[\\/]/)
      .pop() ||
    "document";


  const localUrl =
    `${SERVER_URL}/uploads/${encodeURIComponent(
      fileName
    )}`;


  return {
    originalUrl: localUrl,
    previewUrl: localUrl,
    fileName,
    type: "local",
  };
};


// ============================================================
// FILE TYPE GUESS
// ============================================================

const getFileTypeGuess = (
  fileName,
  url
) => {

  const value =
    `${fileName || ""} ${
      url || ""
    }`.toLowerCase();


  // PDF

  if (
    /\.pdf(\?|$)/i.test(
      value
    )
  ) {
    return "pdf";
  }


  // Images

  if (
    /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(
      value
    )
  ) {
    return "image";
  }


  return "unknown";
};


// ============================================================
// DETECT CONTENT TYPE
// ============================================================

const detectFileTypeFromContentType =
  async (url) => {

    try {

      const response =
        await fetch(
          url,
          {
            method: "HEAD",
          }
        );


      const contentType =
        (
          response.headers.get(
            "content-type"
          ) || ""
        ).toLowerCase();


      // PDF

      if (
        contentType.includes(
          "application/pdf"
        )
      ) {
        return "pdf";
      }


      // Image

      if (
        contentType.startsWith(
          "image/"
        )
      ) {
        return "image";
      }

    } catch (error) {

      console.warn(
        "Content-Type detection failed:",
        error.message
      );
    }


    return "other";
  };


// ============================================================
// COMPONENT
// ============================================================

export default function RequestDetails() {

  const {
    id,
  } = useParams();


  const navigate =
    useNavigate();


  const {
    user,
    logout,
  } = useAuth();


  // ==========================================================
  // STATE
  // ==========================================================

  const [
    request,
    setRequest,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // AI STATE
  // ==========================================================

  const [
    aiReview,
    setAiReview,
  ] = useState(null);


  const [
    aiLoading,
    setAiLoading,
  ] = useState(false);


  // ==========================================================
  // DOCUMENT STATE
  // ==========================================================

  const [
    documentType,
    setDocumentType,
  ] = useState("checking");


  const [
    documentPreviewError,
    setDocumentPreviewError,
  ] = useState(false);


  // ==========================================================
  // REQUEST TYPE
  // ==========================================================

  const requestType =
    request?.type || "";


  const isDetailOnlyRequest =
    DETAIL_ONLY_REQUESTS.includes(
      requestType
    );


  // ==========================================================
  // DOCUMENT INFO
  // ==========================================================

  const documentInfo =
    useMemo(
      () =>
        getDocumentInfo(
          request?.uploadedFile
        ),
      [
        request?.uploadedFile,
      ]
    );


  // ==========================================================
  // DETECT DOCUMENT TYPE
  // ==========================================================

  useEffect(() => {

    let cancelled = false;


    // Reset previous preview error

    setDocumentPreviewError(
      false
    );


    // No document

    if (!documentInfo) {

      setDocumentType(
        "none"
      );

      return;
    }


    // ========================================================
    // BASE64 PDF
    // ========================================================

    if (
      documentInfo.type ===
      "pdf"
    ) {

      setDocumentType(
        "pdf"
      );

      return;
    }


    // ========================================================
    // BASE64 IMAGE
    // ========================================================

    if (
      documentInfo.type ===
      "image"
    ) {

      setDocumentType(
        "image"
      );

      return;
    }


    // ========================================================
    // EXTENSION GUESS
    // ========================================================

    const guessed =
      getFileTypeGuess(
        documentInfo.fileName,
        documentInfo.previewUrl
      );


    if (
      guessed !==
      "unknown"
    ) {

      setDocumentType(
        guessed
      );

      return;
    }


    // ========================================================
    // CLOUDINARY URL WITHOUT EXTENSION
    // ========================================================

    setDocumentType(
      "checking"
    );


    detectFileTypeFromContentType(
      documentInfo.previewUrl
    ).then(
      (type) => {

        if (
          !cancelled
        ) {

          setDocumentType(
            type
          );
        }
      }
    );


    return () => {
      cancelled = true;
    };

  }, [
    documentInfo,
  ]);


  // ==========================================================
  // AUTH + FETCH
  // ==========================================================

  useEffect(() => {

    if (!user) {

      navigate(
        "/admin-login"
      );

      return;
    }


    fetchRequest();

    // eslint-disable-next-line
  }, [
    id,
    user,
  ]);


  // ==========================================================
  // FETCH REQUEST
  // ==========================================================

  const fetchRequest =
    async () => {

      setLoading(true);
      setError("");


      try {

        const token =
          localStorage.getItem(
            "token"
          );


        if (!token) {

          logout();

          navigate(
            "/admin-login"
          );

          return;
        }


        const response =
          await fetch(
            `${API_URL}/requests/${id}`,
            {
              method: "GET",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        const contentType =
          response.headers.get(
            "content-type"
          );


        let data = {};


        if (
          contentType &&
          contentType.includes(
            "application/json"
          )
        ) {

          data =
            await response.json();
        }


        // ====================================================
        // UNAUTHORIZED
        // ====================================================

        if (
          response.status ===
          401
        ) {

          logout();

          navigate(
            "/admin-login"
          );

          return;
        }


        // ====================================================
        // ERROR
        // ====================================================

        if (
          !response.ok
        ) {

          throw new Error(
            data.message ||
              `Server returned ${response.status}`
          );
        }


        // ====================================================
        // NORMALIZE
        // ====================================================

        const fetchedRequest =
          getRequestData(
            data
          );


        if (
          !fetchedRequest ||
          !fetchedRequest._id
        ) {

          throw new Error(
            "Request data not found."
          );
        }


        // ====================================================
        // SET REQUEST
        // ====================================================

        setRequest(
          fetchedRequest
        );


        // ====================================================
        // SET AI REVIEW
        // ====================================================

        setAiReview(
          fetchedRequest.aiReview ||
            null
        );

      } catch (err) {

        console.error(
          "Fetch request error:",
          err
        );


        setError(
          err.message ||
            "Unable to load request details."
        );

      } finally {

        setLoading(
          false
        );
      }
    };


  // ==========================================================
  // AI REVIEW
  // ==========================================================

  const handleAIReview =
    async () => {

      if (
        aiLoading ||
        !request
      ) {
        return;
      }


      /*
       * Bonafide and Leaving Certificate:
       *
       * AI checks:
       * - Registered student details
       * - Submitted request/form details
       *
       *
       * Other requests:
       *
       * AI checks:
       * - Registered student details
       * - Uploaded document OCR
       */


      if (
        !isDetailOnlyRequest &&
        !request.uploadedFile
      ) {

        alert(
          "This request does not have an uploaded document to analyze."
        );

        return;
      }


      try {

        const token =
          localStorage.getItem(
            "token"
          );


        if (!token) {

          logout();

          navigate(
            "/admin-login"
          );

          return;
        }


        setAiLoading(
          true
        );


        const response =
          await fetch(
            `${API_URL}/requests/${id}/ai-review`,
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );


        const contentType =
          response.headers.get(
            "content-type"
          );


        let data = {};


        if (
          contentType &&
          contentType.includes(
            "application/json"
          )
        ) {

          data =
            await response.json();
        }


        // ====================================================
        // AUTH
        // ====================================================

        if (
          response.status ===
          401
        ) {

          logout();

          navigate(
            "/admin-login"
          );

          return;
        }


        // ====================================================
        // ERROR
        // ====================================================

        if (
          !response.ok
        ) {

          throw new Error(
            data.message ||
              "Unable to perform AI review."
          );
        }


        // ====================================================
        // NORMALIZE
        // ====================================================

        const reviewedRequest =
          getRequestData(
            data
          );


        if (
          !reviewedRequest
        ) {

          throw new Error(
            "AI review response is invalid."
          );
        }


        // ====================================================
        // UPDATE REQUEST
        // ====================================================

        setRequest(
          reviewedRequest
        );


        // ====================================================
        // UPDATE AI RESULT
        // ====================================================

        setAiReview(
          reviewedRequest.aiReview ||
            null
        );

      } catch (err) {

        console.error(
          "AI Review error:",
          err
        );


        alert(
          err.message ||
            "Unable to perform AI review."
        );

      } finally {

        setAiLoading(
          false
        );
      }
    };


  // ==========================================================
  // APPROVE
  // ==========================================================

  const handleApprove =
    async () => {

      if (
        !window.confirm(
          "Approve this request?"
        )
      ) {
        return;
      }


      try {

        const token =
          localStorage.getItem(
            "token"
          );


        if (!token) {

          logout();

          navigate(
            "/admin-login"
          );

          return;
        }


        const response =
          await fetch(
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


        if (
          response.status ===
          401
        ) {

          logout();

          navigate(
            "/admin-login"
          );

          return;
        }


        if (
          !response.ok
        ) {

          alert(
            data.message ||
              "Failed to approve request."
          );

          return;
        }


        alert(
          "Request Approved ✅"
        );


        navigate(
          "/all-requests"
        );

      } catch (err) {

        console.error(
          "Approve error:",
          err
        );


        alert(
          "Unable to connect to server."
        );
      }
    };


  // ==========================================================
  // REJECT
  // ==========================================================

  const handleReject =
    async () => {

      const reason =
        prompt(
          "Enter rejection reason:"
        );


      if (
        !reason ||
        !reason.trim()
      ) {
        return;
      }


      try {

        const token =
          localStorage.getItem(
            "token"
          );


        if (!token) {

          logout();

          navigate(
            "/admin-login"
          );

          return;
        }


        const response =
          await fetch(
            `${API_URL}/requests/${id}/reject`,
            {
              method: "PUT",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  reason:
                    reason.trim(),
                }),
            }
          );


        const data =
          await response.json();


        if (
          response.status ===
          401
        ) {

          logout();

          navigate(
            "/admin-login"
          );

          return;
        }


        if (
          !response.ok
        ) {

          alert(
            data.message ||
              "Failed to reject request."
          );

          return;
        }


        alert(
          "Request Rejected ❌"
        );


        navigate(
          "/all-requests"
        );

      } catch (err) {

        console.error(
          "Reject error:",
          err
        );


        alert(
          "Unable to connect to server."
        );
      }
    };


  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout =
    () => {

      logout();

      navigate(
        "/admin-login"
      );
    };


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (
      <div
        className="dashboard-container"
      >

        <div
          className="main-content"
          style={{
            padding: "30px",
          }}
        >

          <h3>
            Loading request details...
          </h3>

        </div>

      </div>
    );
  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (
    error ||
    !request
  ) {

    return (
      <div
        className="dashboard-container"
      >

        <div
          className="main-content"
          style={{
            padding: "30px",
          }}
        >

          <h3>
            {error ||
              "Request not found."}
          </h3>


          <button
            className="back-btn"
            onClick={() =>
              navigate(
                "/all-requests"
              )
            }
            style={{
              marginTop: "15px",
            }}
          >
            Back to All Requests
          </button>

        </div>

      </div>
    );
  }


  // ==========================================================
  // RENDER
  // ==========================================================

  return (

    <div
      className="dashboard-container"
    >


      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <div
        className="sidebar"
      >

        <img
          src={logo}
          alt="College Logo"
        />


        <ul
          className="sidebar-menu"
        >

          <li
            onClick={() =>
              navigate(
                "/admin"
              )
            }
            style={{
              cursor:
                "pointer",
            }}
          >

            <FaHome />

            Dashboard

          </li>


          <li
            className="active"
            onClick={() =>
              navigate(
                "/all-requests"
              )
            }
            style={{
              cursor:
                "pointer",
            }}
          >

            <FaFileAlt />

            All Requests

          </li>


          <li
            onClick={() =>
              navigate(
                "/students"
              )
            }
            style={{
              cursor:
                "pointer",
            }}
          >

            <FaUsers />

            Students

          </li>


          <li
            onClick={() =>
              navigate(
                "/adminprofile"
              )
            }
            style={{
              cursor:
                "pointer",
            }}
          >

            <FaUser />

            Profile

          </li>

        </ul>

      </div>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <div
        className="admin-main"
      >

        <div
          className="admin-content-wrapper"
        >


          {/* ==================================================
              HEADER
          ================================================== */}

          <div
            className="admin-header"
          >

            <div>

              <h1>
                Request Details
              </h1>

              <p>
                Review student document request
              </p>

            </div>


            <div>

              <button
                className="back-btn"
                onClick={() =>
                  navigate(
                    "/all-requests"
                  )
                }
              >
                Back
              </button>


              <button
                className="logout-btn"
                onClick={
                  handleLogout
                }
                style={{
                  marginLeft:
                    "10px",
                }}
              >
                Logout
              </button>

            </div>

          </div>


          {/* ==================================================
              DETAILS CARD
          ================================================== */}

          <div
            className="details-card"
          >

            <h2>
              Request Information
            </h2>

            <hr />


            {/* ==================================================
                BASIC REQUEST INFO
            ================================================== */}

            <p>

              <strong>
                Document:
              </strong>{" "}

              {request.type ||
                "N/A"}

            </p>


            <p>

              <strong>
                Student ID:
              </strong>{" "}

              {request.student
                ?.student_id ||
                request.student_id ||
                "N/A"}

            </p>


            <p>

              <strong>
                Name:
              </strong>{" "}

              {request.student
                ?.name ||
                "N/A"}

            </p>


            <p>

              <strong>
                Email:
              </strong>{" "}

              {request.student
                ?.email ||
                "N/A"}

            </p>


            <p>

              <strong>
                Phone:
              </strong>{" "}

              {request.student
                ?.phone ||
                "N/A"}

            </p>


            <p>

              <strong>
                Department:
              </strong>{" "}

              {request.student
                ?.department ||
                "N/A"}

            </p>


            <p>

              <strong>
                Date:
              </strong>{" "}

              {request.createdAt
                ? new Date(
                    request.createdAt
                  ).toLocaleDateString()
                : "N/A"}

            </p>


            {/* ==================================================
                STUDENT / FORM DETAILS
            ================================================== */}

            <h3
              style={{
                marginTop:
                  "25px",
              }}
            >
              Submitted Details
            </h3>

            <hr />


            {request.formData &&
            Object.keys(
              request.formData
            ).length > 0 ? (

              Object.entries(
                request.formData
              ).map(
                ([
                  key,
                  value,
                ]) => {

                  if (
                    value === null ||
                    value ===
                      undefined ||
                    value === ""
                  ) {

                    return null;
                  }


                  return (

                    <p
                      key={key}
                    >

                      <strong>

                        {key
                          .replace(
                            /([A-Z])/g,
                            " $1"
                          )
                          .replace(
                            /^./,
                            (
                              char
                            ) =>
                              char.toUpperCase()
                          )}

                        :

                      </strong>{" "}

                      {String(
                        value
                      )}

                    </p>
                  );
                }
              )

            ) : (

              <p>
                No additional details submitted.
              </p>

            )}


            {/* ==================================================
                SUBMITTED DOCUMENT
            ================================================== */}

            {documentInfo && (

              <div
                style={{
                  marginTop:
                    "30px",
                }}
              >

                <h3>
                  Submitted Document
                </h3>

                <hr />


                <p>

                  <strong>
                    File:
                  </strong>{" "}

                  {documentInfo.fileName}

                </p>


                {/* =================================================
                    DOCUMENT PREVIEW
                ================================================= */}

                <div
                  style={{
                    marginTop:
                      "15px",
                  }}
                >


                  {/* ===============================================
                      CHECKING
                  =============================================== */}

                  {documentType ===
                    "checking" && (

                    <div
                      style={{
                        padding:
                          "25px",
                        textAlign:
                          "center",
                        background:
                          "#f8f9fa",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "8px",
                      }}
                    >

                      Checking document type...

                    </div>
                  )}


                  {/* ===============================================
                      PDF
                  =============================================== */}

                  {documentType ===
                    "pdf" && (

                    <div>

                      {!documentPreviewError ? (

                        <iframe
                          src={
                            documentInfo.previewUrl
                          }
                          title="Submitted PDF"
                          width="100%"
                          height="750px"
                          onError={() =>
                            setDocumentPreviewError(
                              true
                            )
                          }
                          style={{
                            display:
                              "block",
                            width:
                              "100%",
                            minHeight:
                              "750px",
                            border:
                              "1px solid #ccc",
                            borderRadius:
                              "8px",
                            background:
                              "#fff",
                          }}
                        />

                      ) : (

                        <div
                          style={{
                            padding:
                              "25px",
                            textAlign:
                              "center",
                            background:
                              "#f8f9fa",
                            border:
                              "1px solid #ddd",
                            borderRadius:
                              "8px",
                          }}
                        >

                          <p>
                            The PDF could not
                            be embedded in
                            the page.
                          </p>


                          <a
                            href={
                              documentInfo.originalUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open PDF in a new tab
                          </a>

                        </div>
                      )}

                    </div>
                  )}


                  {/* ===============================================
                      IMAGE
                  =============================================== */}

                  {documentType ===
                    "image" && (

                    <div>

                      {!documentPreviewError ? (

                        <img
                          src={
                            documentInfo.previewUrl
                          }
                          alt="Submitted document"
                          onError={() =>
                            setDocumentPreviewError(
                              true
                            )
                          }
                          style={{
                            display:
                              "block",
                            width:
                              "100%",
                            maxWidth:
                              "800px",
                            maxHeight:
                              "800px",
                            objectFit:
                              "contain",
                            border:
                              "1px solid #ccc",
                            borderRadius:
                              "8px",
                            background:
                              "#fff",
                          }}
                        />

                      ) : (

                        <div
                          style={{
                            padding:
                              "20px",
                            border:
                              "1px solid #ddd",
                            borderRadius:
                              "8px",
                          }}
                        >

                          <p>
                            Image preview
                            could not be
                            loaded.
                          </p>


                          <a
                            href={
                              documentInfo.originalUrl
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open Image
                          </a>

                        </div>

                      )}

                    </div>
                  )}


                  {/* ===============================================
                      OTHER
                  =============================================== */}

                  {documentType ===
                    "other" && (

                    <div
                      style={{
                        padding:
                          "20px",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "8px",
                      }}
                    >

                      This file type cannot
                      be previewed here.

                      <br />

                      You can still open or
                      download it below.

                    </div>
                  )}

                </div>


                {/* =================================================
                    DOCUMENT ACTIONS
                ================================================= */}

                <div
                  style={{
                    marginTop:
                      "15px",
                    display:
                      "flex",
                    gap:
                      "10px",
                    flexWrap:
                      "wrap",
                  }}
                >


                  {/* OPEN */}

                  <a
                    href={
                      documentInfo.originalUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration:
                        "none",
                    }}
                  >

                    <button
                      type="button"
                      style={{
                        padding:
                          "10px 18px",
                        background:
                          "#2f66c7",
                        color:
                          "#fff",
                        border:
                          "none",
                        borderRadius:
                          "6px",
                        cursor:
                          "pointer",
                      }}
                    >

                      <FaExternalLinkAlt />

                      {" "}

                      Open Document

                    </button>

                  </a>


                  {/* DOWNLOAD */}

                  <a
                    href={
                      documentInfo.originalUrl
                    }
                    download={
                      documentInfo.fileName
                    }
                    style={{
                      textDecoration:
                        "none",
                    }}
                  >

                    <button
                      type="button"
                      style={{
                        padding:
                          "10px 18px",
                        background:
                          "#198754",
                        color:
                          "#fff",
                        border:
                          "none",
                        borderRadius:
                          "6px",
                        cursor:
                          "pointer",
                      }}
                    >

                      <FaDownload />

                      {" "}

                      Download

                    </button>

                  </a>

                </div>

              </div>
            )}


            {/* ==================================================
                AI REVIEW
            ================================================== */}

            <div
              style={{
                marginTop:
                  "35px",
                padding:
                  "20px",
                border:
                  "1px solid #ddd",
                borderRadius:
                  "10px",
                background:
                  "#f8fafc",
              }}
            >


              {/* =================================================
                  AI HEADER
              ================================================= */}

              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap:
                    "20px",
                  flexWrap:
                    "wrap",
                }}
              >

                <div>

                  <h3
                    style={{
                      margin:
                        0,
                    }}
                  >
                    🤖 AI Review
                  </h3>


                  <p
                    style={{
                      marginTop:
                        "6px",
                      color:
                        "#666",
                      fontSize:
                        "14px",
                    }}
                  >

                    {isDetailOnlyRequest

                      ? `AI will compare the student's registered details with the submitted ${requestType} request details.`

                      : `AI will analyze the uploaded ${requestType} document and compare it with the student's registered details.`}

                  </p>

                </div>


                <button
                  type="button"
                  onClick={
                    handleAIReview
                  }
                  disabled={
                    aiLoading
                  }
                  style={{
                    padding:
                      "10px 18px",
                    border:
                      "none",
                    borderRadius:
                      "6px",
                    background:
                      aiLoading
                        ? "#9ca3af"
                        : "#2f66c7",
                    color:
                      "#fff",
                    cursor:
                      aiLoading
                        ? "not-allowed"
                        : "pointer",
                  }}
                >

                  {aiLoading

                    ? "🤖 Analyzing..."

                    : aiReview

                    ? "🤖 Run Again"

                    : "🤖 Run AI Review"}

                </button>

              </div>


              {/* =================================================
                  REVIEW METHOD
              ================================================= */}

              <div
                style={{
                  marginTop:
                    "15px",
                  padding:
                    "12px",
                  background:
                    "#fff",
                  border:
                    "1px solid #e5e7eb",
                  borderRadius:
                    "6px",
                  fontSize:
                    "14px",
                }}
              >

                <strong>
                  Review method:
                </strong>{" "}


                {isDetailOnlyRequest

                  ? "Student database + submitted form details"

                  : "Student database + uploaded document OCR"}

              </div>


              {/* =================================================
                  NO REVIEW
              ================================================= */}

              {!aiReview &&
                !aiLoading && (

                <div
                  style={{
                    marginTop:
                      "20px",
                    padding:
                      "15px",
                    background:
                      "#fff",
                    border:
                      "1px dashed #ccc",
                    borderRadius:
                      "6px",
                    color:
                      "#666",
                  }}
                >

                  AI review has not
                  been performed yet.

                </div>
              )}


              {/* =================================================
                  LOADING
              ================================================= */}

              {aiLoading && (

                <div
                  style={{
                    marginTop:
                      "20px",
                    padding:
                      "15px",
                    background:
                      "#fff",
                    borderRadius:
                      "6px",
                  }}
                >

                  <strong>
                    🤖 AI is analyzing...
                  </strong>


                  <p>

                    {isDetailOnlyRequest

                      ? "Comparing registered student information with the submitted request."

                      : "Reading the uploaded document and comparing it with student information."}

                  </p>

                </div>
              )}


              {/* =================================================
                  AI RESULT
              ================================================= */}

              {aiReview && (

                <div
                  style={{
                    marginTop:
                      "20px",
                    paddingTop:
                      "20px",
                    borderTop:
                      "1px solid #ddd",
                  }}
                >


                  {/* =============================================
                      CONFIDENCE
                  ============================================= */}

                  <div
                    style={{
                      marginBottom:
                        "20px",
                    }}
                  >

                    <strong>
                      Confidence
                    </strong>


                    <div
                      style={{
                        marginTop:
                          "8px",
                        width:
                          "100%",
                        height:
                          "10px",
                        background:
                          "#e5e7eb",
                        borderRadius:
                          "10px",
                        overflow:
                          "hidden",
                      }}
                    >

                      <div
                        style={{
                          width:
                            `${Math.min(
                              Math.max(
                                Number(
                                  aiReview.confidence
                                ) || 0,
                                0
                              ),
                              100
                            )}%`,

                          height:
                            "100%",

                          background:
                            Number(
                              aiReview.confidence
                            ) >= 70
                              ? "green"
                              : Number(
                                  aiReview.confidence
                                ) >= 40
                              ? "orange"
                              : "red",

                          transition:
                            "width 0.3s ease",
                        }}
                      />

                    </div>


                    <span
                      style={{
                        display:
                          "block",
                        marginTop:
                          "5px",
                        fontWeight:
                          "600",
                      }}
                    >

                      {aiReview.confidence ||
                        0}

                      %

                    </span>

                  </div>


                  {/* =============================================
                      RECOMMENDATION
                  ============================================= */}

                  <p>

                    <strong>
                      Recommendation:
                    </strong>{" "}


                    <span
                      style={{
                        fontWeight:
                          "700",

                        color:
                          aiReview.recommendation ===
                          "APPROVE"

                            ? "green"

                            : aiReview.recommendation ===
                              "REJECT"

                            ? "red"

                            : "orange",
                      }}
                    >

                      {aiReview.recommendation ||
                        "REVIEW"}

                    </span>

                  </p>


                  {/* =============================================
                      REASON
                  ============================================= */}

                  <p>

                    <strong>
                      Reason:
                    </strong>{" "}

                    {aiReview.reason ||
                      "No reason provided."}

                  </p>


                  {/* =============================================
                      MATCH DETAILS
                  ============================================= */}

                  {aiReview.details && (

                    <div
                      style={{
                        marginTop:
                          "15px",
                        padding:
                          "15px",
                        background:
                          "#fff",
                        border:
                          "1px solid #ddd",
                        borderRadius:
                          "6px",
                      }}
                    >

                      <strong>
                        AI Details
                      </strong>


                      <p
                        style={{
                          marginBottom:
                            0,
                          marginTop:
                            "8px",
                        }}
                      >

                        {typeof aiReview.details ===
                        "string"

                          ? aiReview.details

                          : JSON.stringify(
                              aiReview.details,
                              null,
                              2
                            )}

                      </p>

                    </div>
                  )}


                  {/* =============================================
                      REVIEWED AT
                  ============================================= */}

                  {aiReview.reviewedAt && (

                    <p>

                      <strong>
                        Reviewed At:
                      </strong>{" "}

                      {new Date(
                        aiReview.reviewedAt
                      ).toLocaleString()}

                    </p>
                  )}


                  {/* =============================================
                      IMPORTANT
                  ============================================= */}

                  <div
                    style={{
                      marginTop:
                        "15px",
                      padding:
                        "12px",
                      borderRadius:
                        "6px",
                      background:
                        "#fff7ed",
                      border:
                        "1px solid #fed7aa",
                      color:
                        "#9a3412",
                      fontSize:
                        "13px",
                    }}
                  >

                    ⚠️{" "}

                    <strong>
                      Important:
                    </strong>{" "}

                    AI is an assistance
                    system only.

                    The administrator
                    makes the final
                    approval or rejection
                    decision.

                  </div>

                </div>
              )}

            </div>


            {/* ==================================================
                STATUS
            ================================================== */}

            <p
              style={{
                marginTop:
                  "30px",
              }}
            >

              <strong>
                Status:
              </strong>{" "}


              <span
                style={{
                  color:
                    request.status ===
                    "Approved"

                      ? "green"

                      : request.status ===
                        "Rejected"

                      ? "red"

                      : "orange",

                  fontWeight:
                    "600",
                }}
              >

                {request.status ||
                  "Pending"}

              </span>

            </p>


            {/* ==================================================
                REJECTION REASON
            ================================================== */}

            {request.status ===
              "Rejected" &&
              request.rejectionReason && (

                <p>

                  <strong>
                    Rejection Reason:
                  </strong>{" "}

                  {
                    request.rejectionReason
                  }

                </p>
              )}


            {/* ==================================================
                ACTION BUTTONS
            ================================================== */}

            <div
              style={{
                marginTop:
                  "30px",
              }}
            >

              <button
                className="accept-btn"
                onClick={
                  handleApprove
                }
                disabled={
                  request.status !==
                  "Pending"
                }
              >
                Approve
              </button>


              <button
                className="reject-btn"
                onClick={
                  handleReject
                }
                disabled={
                  request.status !==
                  "Pending"
                }
                style={{
                  marginLeft:
                    "15px",
                }}
              >
                Reject
              </button>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}