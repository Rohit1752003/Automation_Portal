import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } =
    useAuth();

  return (
    <div className="bg-white shadow px-6 py-4 flex justify-between">
      <h2 className="font-bold">
        Document Verification Portal
      </h2>

      <div className="flex gap-4 items-center">
        <span>
          {user?.name}
        </span>

        <button
          onClick={logout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}