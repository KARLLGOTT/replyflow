import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ReactComponent as Logo } from "../assets/logo.svg";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Паролі не співпадають");
      return;
    }
    
    if (password.length < 8) {
      setError("Пароль повинен бути не менше 8 символів");
      return;
    }
    
    if (!token) {
      setError("Недійсне посилання");
      return;
    }
    
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage("Пароль успішно змінено!");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.detail || "Помилка скидання пароля");
      }
    } catch (err) {
      setError("Щось пішло не так");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl p-8 rounded-xl">
        <div className="flex justify-between items-center mb-6">
          <Logo className="w-12 h-12" />
          <LanguageSwitcher />
        </div>

        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Новий пароль
        </h1>

        {message && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 p-3 rounded mb-4">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2 text-sm font-semibold">
              Новий пароль
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="8"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
              placeholder="••••••••"
            />
            <p className="text-white/60 text-xs mt-1">Мінімум 8 символів</p>
          </div>

          <div>
            <label className="block text-white mb-2 text-sm font-semibold">
              Підтвердіть пароль
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Збереження..." : "Зберегти новий пароль"}
          </button>
        </form>
      </div>
    </div>
  );
}