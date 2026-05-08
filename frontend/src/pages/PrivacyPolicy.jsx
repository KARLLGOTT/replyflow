import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ReactComponent as Logo } from "../assets/logo.svg";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white">
      <header className="relative z-10 flex justify-between items-center px-10 py-6 backdrop-blur-md bg-white/10">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="text-2xl font-bold">{t("common.app_name")}</span>
          <Link
            to="/"
            className="ml-6 bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-xl font-bold transition"
          >
            {t("common.home")}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">{t("legal.privacy_title")}</h1>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.section1_title")}</h2>
            <p className="text-white/80 leading-relaxed">{t("legal.section1_text")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.section2_title")}</h2>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
              {t("legal.section2_items", { returnObjects: true }).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.section3_title")}</h2>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
              {t("legal.section3_items", { returnObjects: true }).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.section4_title")}</h2>
            <p className="text-white/80 leading-relaxed mb-2">{t("legal.section4_text")}</p>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
              {t("legal.section4_items", { returnObjects: true }).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.section5_title")}</h2>
            <p className="text-white/80 leading-relaxed">{t("legal.section5_text")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.section6_title")}</h2>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
              {t("legal.section6_items", { returnObjects: true }).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
            <p className="text-white/80 leading-relaxed mt-2">
              {t("legal.section6_contact") || "Для реалізації ваших прав звертайтеся на email:"} {t("legal.section9_email")}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.section7_title")}</h2>
            <p className="text-white/80 leading-relaxed">{t("legal.section7_text")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.section8_title")}</h2>
            <p className="text-white/80 leading-relaxed">{t("legal.section8_text")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.section9_title")}</h2>
            <ul className="list-none text-white/80 mt-2">
              <li>📧 {t("legal.section9_email")}</li>
              <li>📍 {t("legal.section9_address")}</li>
            </ul>
          </section>

          <div className="text-center text-white/60 text-sm pt-6 border-t border-white/20">
            <p>{t("legal.last_updated")}: {new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <footer className="relative z-10 text-center py-8 text-white/60">
        <p>{t("footer.copyright")}</p>
      </footer>
    </div>
  );
}