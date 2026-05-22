import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  // Временная диагностика
  console.log("PrivateRoute:", { user, loading });

  if (loading) {
    return <div className="text-center py-10">Загрузка...</div>;
  }

  // Если нет пользователя - редирект на логин
  if (!user) {
    console.log("No user, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  return children;
}
