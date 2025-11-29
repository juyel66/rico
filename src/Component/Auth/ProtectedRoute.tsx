// src/features/Auth/ProtectedRoute.jsx
import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

/**
 * ProtectedRoute
 * - allowedRoles: array of role strings (case-insensitive). If omitted or empty, allow any authenticated user.
 * - If user is not authenticated -> redirects to /login
 * - If allowedRoles provided and user's role not included -> redirects to /login
 */
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const access = useSelector((state) => state?.auth?.access);
  const user = useSelector((state) => state?.auth?.user);

  const isAuthenticated = Boolean(access && user);
  if (!isAuthenticated) {
    // not logged in -> send to login
    return <Navigate to="/login" replace />;
  }

  // if no allowedRoles specified, permit any authenticated user
  if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return <Outlet />;
  }

  // normalize and check role
  const userRole = (user?.role || "").toString().toLowerCase();
  const allowed = allowedRoles
    .map((r) => r.toString().toLowerCase())
    .includes(userRole);

  if (!allowed) {
    // logged-in but not in allowed roles -> send to login (or show 403 page if you prefer)
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
