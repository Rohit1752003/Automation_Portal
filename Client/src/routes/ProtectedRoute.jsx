import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({
  children,
  allowedRole,
}) {
  const {
    isAuthenticated,
    role,
    loading,
  } = useAuth();

  if (loading) {
    return <h3>Loading...</h3>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  if (
    allowedRole &&
    role !== allowedRole
  ) {
    return <Navigate to="/" />;
  }

  return children;
}