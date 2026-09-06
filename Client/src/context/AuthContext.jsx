import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    const storedRole = localStorage.getItem("role");

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setRole(storedRole);
    }

    setLoading(false);
  }, []);

 const login = (
  token,
  userData,
  userRole
) => {
 localStorage.removeItem("token");
localStorage.removeItem("user");
localStorage.removeItem("role");

  localStorage.setItem(
    "token",
    token
  );

  localStorage.setItem(
    "user",
    JSON.stringify(userData)
  );

  localStorage.setItem(
    "role",
    userRole
  );

  setUser(userData);
  setRole(userRole);
};
const logout = () => {
 localStorage.removeItem("token");
localStorage.removeItem("user");
localStorage.removeItem("role");

  setUser(null);
  setRole(null);
};
  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        login,
        logout,
        loading,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () =>
  useContext(AuthContext);