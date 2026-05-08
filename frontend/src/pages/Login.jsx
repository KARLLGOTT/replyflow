import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { ReactComponent as Logo } from "../assets/logo.svg";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Login() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const success = await login(formData.email, formData.password);

    setLoading(false);

    if (success) {
      navigate("/dashboard");
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
          {t("auth.login_title")}
        </h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white mb-2 text-sm font-semibold">
              {t("profile.email")}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
              placeholder={t("auth.email_placeholder")}
            />
          </div>

          <div>
            <label className="block text-white mb-2 text-sm font-semibold">
              {t("auth.password") || "Пароль"}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
              placeholder={t("auth.password_placeholder")}
            />
          </div>

          <div className="text-right">
            <Link 
              to="/forgot-password" 
              className="text-pink-300 hover:text-pink-200 text-sm transition"
            >
              {t("auth.forgot_password") || "Забули пароль?"}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? t("common.loading") : t("auth.login_title")}
          </button>
        </form>

        <p className="text-center text-white/80 mt-6">
          {t("auth.no_account")}{" "}
          <Link to="/register" className="text-pink-300 hover:text-pink-200 font-semibold">
            {t("auth.register_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}