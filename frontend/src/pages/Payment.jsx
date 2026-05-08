import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { ReactComponent as Logo } from "../assets/logo.svg";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Payment() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const plan = searchParams.get("plan") || "starter";
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const plans = {
    starter: { name: "Starter", price: 9, generations: 50 },
    professional: { name: "Professional", price: 29, generations: 150 },
    business: { name: "Business", price: 79, generations: "unlimited" }
  };

  const currentPlan = plans[plan] || plans.starter;

  const bankDetails = {
    bank: "Монобанк",
    card: "4441 1110 0610 0378",
    paypal: "paypal@replyflow.ai"
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white">
      <header className="relative z-10 flex justify-between items-center px-10 py-6 backdrop-blur-md bg-white/10">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="text-2xl font-bold">{t("common.app_name")}</span>
          <Link to="/pricing" className="ml-6 bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-xl font-bold transition">
            {t("payment.back_to_pricing")}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4 text-center">{t("payment.title")}</h1>
        <p className="text-center text-white/80 mb-8">
          {t("payment.subtitle")} <span className="text-pink-300 font-bold">{currentPlan.name}</span> {t("payment.per_month")}
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Реквізити */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">{t("payment.payment_details")}</h2>
            
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-white/60">{t("payment.bank")}</p>
                <p className="text-lg">{bankDetails.bank}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-white/60">{t("payment.card_number")}</p>
                <p className="text-lg font-mono">{bankDetails.card}</p>
                <button 
                  onClick={() => copyToClipboard(bankDetails.card)}
                  className="mt-2 text-sm text-pink-300 hover:text-pink-200"
                >
                  {copied ? t("payment.copied") : t("payment.copy_card")}
                </button>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-white/60">{t("payment.paypal")}</p>
                <p className="text-lg">{bankDetails.paypal}</p>
                <button 
                  onClick={() => copyToClipboard(bankDetails.paypal)}
                  className="mt-2 text-sm text-pink-300 hover:text-pink-200"
                >
                  {copied ? t("payment.copied") : t("payment.copy_paypal")}
                </button>
              </div>
            </div>
          </div>

          {/* Інструкція */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6">
            <h2 className="text-2xl font-bold mb-4">{t("payment.instruction_title")}</h2>
            <div className="space-y-4 text-white/80">
              <div className="flex gap-3">
                <span className="text-pink-300 font-bold">1.</span>
                <p>{t("payment.instruction_step1").replace("{price}", currentPlan.price)}</p>
              </div>
              <div className="flex gap-3">
                <span className="text-pink-300 font-bold">2.</span>
                <p>{t("payment.instruction_step2").replace("{email}", user.email)}</p>
              </div>
              <div className="flex gap-3">
                <span className="text-pink-300 font-bold">3.</span>
                <p>{t("payment.instruction_step3")}</p>
              </div>
              <div className="flex gap-3">
                <span className="text-pink-300 font-bold">4.</span>
                <p>{t("payment.instruction_step4")}</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-500/20 border border-yellow-500 rounded-xl">
              <p className="text-yellow-300 text-sm">
                {t("payment.warning")}
              </p>
            </div>

            <div className="mt-6">
              <p className="text-white/60 text-sm text-center">
                {t("payment.receipt_note").replace("{email}", t("footer.email"))}
              </p>
            </div>
          </div>
        </div>

        {/* Сумма */}
        <div className="mt-8 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-xl rounded-2xl p-4">
            <p className="text-white/60">{t("payment.total")}</p>
            <p className="text-3xl font-bold">{currentPlan.price}$</p>
          </div>
        </div>
      </div>

      <footer className="relative z-10 text-center py-8 text-white/60">
        <p>{t("footer.email")}</p>
        <p className="mt-3">{t("footer.copyright")}</p>
      </footer>
    </div>
  );
}