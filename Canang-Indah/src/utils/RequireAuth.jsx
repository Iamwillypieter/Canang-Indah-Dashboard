import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function RequireAuth() {
  const isAuth = localStorage.getItem("isAuth") === "true";
  const location = useLocation();

  // ✅ BIARKAN PUBLIC ROUTE LEWAT
  if (
    location.pathname === "/login" ||
    location.pathname === "/register"
  ) {
    return <Outlet />;
  }

  // 🔐 PROTECTED ROUTE
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
