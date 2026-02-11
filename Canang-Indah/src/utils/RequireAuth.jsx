import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RequireAuth() {
  const isAuth = localStorage.getItem("isAuth") === "true";
  const location = useLocation();

  // PUBLIC ROUTE LEWAT
  if (
    location.pathname === "/login" ||
    location.pathname === "/register"
  ) {
    return <Outlet />;
  }

  // PROTECTED ROUTE - CHECK AUTH FIRST
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// ===== ROLE-BASED PROTECTION =====
export function RequireRole({ allowedRoles }) {
  const location = useLocation();
  
  // Get user role from localStorage
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;
  const userRole = user?.role;

  // Check if user role is allowed
  if (!userRole || !allowedRoles.includes(userRole)) {
    // Redirect based on role
    if (userRole === 'supervisor') {
      return <Navigate to="/supervisor" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}