import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { ReactComponent as Logo } from "../assets/logo.svg";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Register() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    fullName: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!acceptedTerms) {
      alert(t("legal.accept_terms"));
      return;
    }
    
    setLoading(true);

    const success = await register(
      formData.email,
      formData.username,
      formData.password,
      formData.fullName
    );

    setLoading(false);

    if (success) {
      navigate("/login");
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
          {t("auth.register_title")}
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
              {t("profile.username")}
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              minLength="3"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
              placeholder={t("auth.username_placeholder")}
            />
          </div>

          <div>
            <label className="block text-white mb-2 text-sm font-semibold">
              {t("profile.full_name")}
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
              placeholder={t("auth.full_name_placeholder")}
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
              minLength="8"
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
              placeholder={t("auth.password_placeholder")}
            />
            <p className="text-white/60 text-xs mt-1">{t("profile.password_min_length")}</p>
          </div>

          {/* Чекбокс согласия с условиями */}
          <div className="flex items-start gap-2 mt-2">
            <input
              type="checkbox"
              id="terms"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="w-4 h-4 mt-1 rounded border-white/30 bg-white/20 text-pink-500 focus:ring-pink-500"
            />
            <label htmlFor="terms" className="text-white/80 text-sm leading-relaxed">
              {t("legal.accept_terms")}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? t("common.loading") : t("auth.register_title")}
          </button>
        </form>

        <p className="text-center text-white/80 mt-6">
          {t("auth.have_account")}{" "}
          <Link to="/terms" className="text-pink-300 hover:text-pink-200 underline">
            {t("legal.terms_link")}
          </Link>
          {" "}
          <Link to="/privacy" className="text-pink-300 hover:text-pink-200 underline">
            {t("legal.privacy_link")}
          </Link>
        </p>
      </div>
    </div>
  );
}