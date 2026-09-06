import { Link } from "react-router-dom";

export default function Sidebar({
  role,
}) {
  return (
    <div className="w-64 min-h-screen bg-gray-900 text-white p-5">

      {role === "student" && (
        <>
          <Link
            to="/student/dashboard"
            className="block mb-4"
          >
            Dashboard
          </Link>

          <Link
            to="/student/create-request"
            className="block mb-4"
          >
            Create Request
          </Link>

          <Link
            to="/student/requests"
            className="block mb-4"
          >
            My Requests
          </Link>

          <Link
            to="/student/profile"
            className="block"
          >
            Profile
          </Link>
        </>
      )}

      {role === "admin" && (
        <>
          <Link
            to="/admin/dashboard"
            className="block mb-4"
          >
            Dashboard
          </Link>

          <Link
            to="/admin/requests"
            className="block mb-4"
          >
            Requests
          </Link>

          <Link
            to="/admin/students"
            className="block mb-4"
          >
            Students
          </Link>

          <Link
            to="/admin/profile"
            className="block"
          >
            Profile
          </Link>
        </>
      )}
    </div>
  );
}