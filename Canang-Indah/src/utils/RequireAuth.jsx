import { Navigate, Outlet, useLocation } from "react-router-dom";

// ===== BYPASS AUTH =====
const isBypass = () => {
  return import.meta.env.VITE_BYPASS_AUTH === 'true';
};

export default function RequireAuth() {
  const isAuth = localStorage.getItem("isAuth") === "true";
  const location = useLocation();

  // BYPASS AUTH FOR DEVELOPMENT
  if (isBypass()) {
    if (!localStorage.getItem("isAuth")) {
      const mockUser = {
        id: "dev-001",
        username: "devuser",
        email: "devuser@example.com",
        role: "admin"
      };

      localStorage.setItem("user", JSON.stringify(mockUser));
      localStorage.setItem("isAuth", "true"); // ✅ INI FIX UTAMA

      console.log("🚧 BYPASS AKTIF:", mockUser);
    }

    return <Outlet />;
  }


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

  // BYPASS ROLE CHECK FOR DEVELOPMENT
  if (import.meta.env.VITE_BYPASS_AUTH === 'true') {
    return <Outlet />;
  }
  
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