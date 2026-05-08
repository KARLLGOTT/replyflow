import React, { createContext, useState, useEffect } from "react";
import { authAPI } from "../api/auth";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshUser = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      console.error("Failed to refresh user:", err);
      return null;
    }
  };

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      authAPI
        .getCurrentUser()
        .then(setUser)
        .catch((err) => {
          console.error("Session restore error:", err.message);
          localStorage.removeItem("accessToken");
          authAPI.stopTokenRefreshTimer();
        })
        .finally(() => setLoading(false));
      
      authAPI.startTokenRefreshTimer();
    } else {
      setLoading(false);
    }
    
    return () => authAPI.stopTokenRefreshTimer();
  }, []);

  const register = async (email, username, password, fullName) => {
    try {
      setError(null);
      await authAPI.register(email, username, password, fullName);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      setError(null);
      await authAPI.login(email, password);
      const userData = await authAPI.getCurrentUser();
      setUser(userData);
      authAPI.startTokenRefreshTimer();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, register, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}