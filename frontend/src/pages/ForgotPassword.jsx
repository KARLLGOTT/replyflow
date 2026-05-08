import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ReactComponent as Logo } from "../assets/logo.svg";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setMessage(data.message);
    } catch (err) {
      setError("Something went wrong");
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
          Забули пароль?
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
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
              placeholder="your@email.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-60"
          >
            {loading ? "Відправка..." : "Надіслати посилання"}
          </button>
        </form>

        <p className="text-center text-white/80 mt-6">
          <Link to="/login" className="text-pink-300 hover:text-pink-200">
            Повернутися до входу
          </Link>
        </p>
      </div>
    </div>
  );
}