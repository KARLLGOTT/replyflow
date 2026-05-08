import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { ReactComponent as Logo } from "../assets/logo.svg";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Pricing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const plans = [
    {
      name: "pricing.free",
      price: "pricing.free_price",
      period: "pricing.forever",
      features: "pricing.free_features",
      popular: false,
    },
    {
      name: "pricing.starter",
      price: "pricing.starter_price",
      period: "pricing.per_month",
      features: "pricing.starter_features",
      popular: true,
    },
    {
      name: "pricing.professional",
      price: "pricing.professional_price",
      period: "pricing.per_month",
      features: "pricing.professional_features",
      popular: false,
    },
    {
      name: "pricing.business",
      price: "pricing.business_price",
      period: "pricing.per_month",
      features: "pricing.business_features",
      popular: false,
    },
  ];

  const handleSelectPlan = (planName) => {
    if (user) {
      // Если пользователь авторизован → переход на страницу оплаты
      navigate(`/payment?plan=${planName}`);
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600">
      <header className="relative z-10 flex justify-between items-center px-10 py-6 backdrop-blur-md bg-white/10">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="text-2xl font-bold text-white">{t("common.app_name")}</span>
          <button
            onClick={() => navigate("/")}
            className="ml-6 bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-xl font-bold transition-all duration-300"
          >
            {t("common.home")}
          </button>
          {user && (
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-xl font-bold transition-all duration-300"
            >
              {t("common.dashboard")}
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {!user ? (
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/login")}
                className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-xl font-bold transition"
              >
                {t("common.login")}
              </button>
              <button
                onClick={() => navigate("/register")}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-5 py-2 rounded-xl font-bold transition"
              >
                {t("common.register")}
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate("/profile")}
              className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-xl font-bold transition"
            >
              {user.full_name || user.username}
            </button>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            {t("pricing.title")}
          </h1>
          <p className="text-xl text-white/80">
            {t("pricing.subtitle")}
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`relative bg-white/10 backdrop-blur-xl rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                plan.popular
                  ? "ring-2 ring-pink-400 shadow-xl"
                  : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    {t("pricing.popular")}
                  </span>
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-white mb-2">{t(plan.name)}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">{t(plan.price)}</span>
                <span className="text-white/60">{t(plan.period)}</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {t(plan.features, { returnObjects: true }).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-white/80">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleSelectPlan(plan.name.split(".")[1])}
                className={`w-full py-3 rounded-xl font-bold transition-all duration-300 ${
                  plan.popular
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    : "bg-white/20 hover:bg-white/30 text-white"
                }`}
              >
                {t("pricing.select_plan")}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            {t("faq.title")}
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {[
              { q: "faq.q1", a: "faq.a1" },
              { q: "faq.q2", a: "faq.a2" },
              { q: "faq.q3", a: "faq.a3" }
            ].map((item, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-xl rounded-xl p-6 text-left">
                <h3 className="text-xl font-bold text-white mb-2">{t(item.q)}</h3>
                <p className="text-white/70">{t(item.a)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="relative z-10 text-center py-8 text-white/60">
        <p>{t("footer.copyright")}</p>
      </footer>
    </div>
  );
}