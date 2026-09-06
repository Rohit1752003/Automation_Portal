import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

// ================= Authentication =================
import LoginPage from "../pages/auth/LoginPage";
import AdminLogin from "../pages/auth/AdminLogin";

// ================= Student =================
import Dashboard from "../pages/student/Dashboard";
import SubmittedDocuments from "../pages/student/SubmittedDocuments";
import RequestedDocuments from "../pages/student/RequestedDocuments";
import StudentDownload from "../pages/student/StudentDownload";
import Profile from "../pages/student/Profile";
import VerifyCertificate from '../pages/student/VerifyCertificate' 

// ================= Forms =================
import InternshipLetter from "../pages/forms/Internship";
import ExamForm from "../pages/forms/ExamForm";
import BonafideForm from "../pages/forms/BonafideForm";
import LeavingCertificate from "../pages/forms/LeavingCertificate";
import AadharSubmission from "../pages/forms/AadharSubmission";
import NOCRequest from "../pages/forms/NOCRequest";
import OtherDocumentRequest from "../pages/forms/OtherDocumentRequest";
import ResubmitRequest from "../pages/forms/ResubmitRequest";

// ================= Admin =================
import AdminDashboard from "../pages/admin/AdminDash";
import AllRequests from "../pages/admin/AllRequest";
import StudentsPage from "../pages/admin/StudentsPage";
import RequestDetails from "../pages/admin/RequestDetails";
import AdminProfile from "../pages/admin/AdminProfile";

export default function AppRoutes() {
  return (
    <Routes>

      {/* ================= Authentication ================= */}

      <Route path="/" element={<LoginPage />} />
      <Route path="/admin-login" element={<AdminLogin />} />



      {/* ================= Student ================= */}

    <Route
  path="/dashboard"
  element={
    <ProtectedRoute allowedRole="student">
      <Dashboard />
    </ProtectedRoute>
  }
/>
      <Route
        path="/submitted-documents"
        element={
           <ProtectedRoute allowedRole="student">
      <SubmittedDocuments  />
    </ProtectedRoute>
        }
      />
      <Route
        path="/requested-documents"
        element={
         <ProtectedRoute allowedRole="student">
      <RequestedDocuments  />
    </ProtectedRoute>
          
        }
      />
      <Route path="/downloads" element={
       <ProtectedRoute allowedRole="student">
      <StudentDownload   />
    </ProtectedRoute>
    
    } />
      <Route path="/profile" element={
           <ProtectedRoute allowedRole="student">
      <Profile   />
    </ProtectedRoute>
    
    } />



      {/* ================= Student Forms ================= */}

      <Route
        path="/internship-letter"
        element={
           <ProtectedRoute allowedRole="student">
      <InternshipLetter   />
    </ProtectedRoute>
        }
      />

      <Route
        path="/exam-form"
        element={
          <ProtectedRoute allowedRole="student">
     <ExamForm />
    </ProtectedRoute>
        }
      />

      <Route
        path="/bonafide"
        element={
        <ProtectedRoute allowedRole="student">
          <BonafideForm />
    </ProtectedRoute>}
      />

      <Route
        path="/leaving-certificate"
        element={
           <ProtectedRoute allowedRole="student">
         <LeavingCertificate />
    </ProtectedRoute>
    }
         />

      <Route
        path="/aadhar-submission"
        element={
           <ProtectedRoute allowedRole="student">
        <AadharSubmission />
    </ProtectedRoute>
        }
      />

      <Route
        path="/noc-request"
        element={
           <ProtectedRoute allowedRole="student">
      <NOCRequest />
    </ProtectedRoute>
        }
      />

      <Route
        path="/other-document"
        element={
           <ProtectedRoute allowedRole="student">
      <OtherDocumentRequest />
    </ProtectedRoute>
        }
      />

      <Route
        path="/resubmit/:id"
        element={
           <ProtectedRoute allowedRole="student">
       <ResubmitRequest />
    </ProtectedRoute>
        }
      />
   <Route
  path="/verify/:verificationId"
  element={<VerifyCertificate />}
/>



      {/* ================= Admin ================= */}

     <Route
  path="/admin"
  element={
    <ProtectedRoute allowedRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>

      <Route
        path="/all-requests"
        element={
           <ProtectedRoute allowedRole="admin">
     <AllRequests />
    </ProtectedRoute>

        }
      />

      <Route
        path="/students"
        element={
           <ProtectedRoute allowedRole="admin">
    <StudentsPage />
    </ProtectedRoute>
        }
      />

      <Route
        path="/request/:id"
        element={
           <ProtectedRoute allowedRole="admin">
     <RequestDetails />
    </ProtectedRoute>
        }
      />

      <Route
        path="/adminprofile"
        element={
           <ProtectedRoute allowedRole="admin">
     <AdminProfile />
    </ProtectedRoute>
        }
      />

    </Routes>
  );
}