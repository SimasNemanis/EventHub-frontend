import React from 'react';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function PublicRoute({ children }) {
  const token = localStorage.getItem('token');

  // If user is logged in and tries to access login/register, redirect to dashboard
  if (token && (window.location.pathname === '/login' || window.location.pathname === '/register')) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
