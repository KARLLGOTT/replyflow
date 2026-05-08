import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ReactComponent as Logo } from "../assets/logo.svg";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function TermsOfService() {
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
        <h1 className="text-4xl font-bold mb-8 text-center">{t("legal.terms_title")}</h1>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 space-y-6">
          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.terms_section1_title")}</h2>
            <p className="text-white/80 leading-relaxed">{t("legal.terms_section1_text")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.terms_section2_title")}</h2>
            <p className="text-white/80 leading-relaxed">{t("legal.terms_section2_text")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.terms_section3_title")}</h2>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
              {t("legal.terms_section3_items", { returnObjects: true }).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.terms_section4_title")}</h2>
            <p className="text-white/80 leading-relaxed mb-2">{t("legal.terms_section4_text")}</p>
            <ul className="list-disc list-inside text-white/80 space-y-1 ml-4">
              <li>{t("legal.terms_section4_free")}</li>
              <li>{t("legal.terms_section4_starter")}</li>
              <li>{t("legal.terms_section4_professional")}</li>
              <li>{t("legal.terms_section4_business")}</li>
            </ul>
            <p className="text-white/80 leading-relaxed mt-2">{t("legal.terms_section4_payment")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.terms_section5_title")}</h2>
            
            <h3 className="text-xl font-semibold mt-4 mb-2">{t("legal.terms_section5_provider_title")}</h3>
            <ul className="list-disc list-inside text-white/80 space-y-1 ml-4">
              {t("legal.terms_section5_provider_items", { returnObjects: true }).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <h3 className="text-xl font-semibold mt-4 mb-2">{t("legal.terms_section5_user_title")}</h3>
            <ul className="list-disc list-inside text-white/80 space-y-1 ml-4">
              {t("legal.terms_section5_user_items", { returnObjects: true }).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.terms_section6_title")}</h2>
            <ul className="list-disc list-inside text-white/80 space-y-2 ml-4">
              {t("legal.terms_section6_items", { returnObjects: true }).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.terms_section7_title")}</h2>
            <p className="text-white/80 leading-relaxed">{t("legal.terms_section7_text")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.terms_section8_title")}</h2>
            <p className="text-white/80 leading-relaxed">{t("legal.terms_section8_text")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.terms_section9_title")}</h2>
            <p className="text-white/80 leading-relaxed">{t("legal.terms_section9_text")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.terms_section10_title")}</h2>
            <p className="text-white/80 leading-relaxed">{t("legal.terms_section10_text")}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-3">{t("legal.terms_section11_title")}</h2>
            <p className="text-white/80 leading-relaxed">{t("legal.terms_section11_email")}</p>
          </section>

          <div className="text-center text-white/60 text-sm pt-6 border-t border-white/20">
            <p>{t("legal.last_updated")}: {new Date().toLocaleDateString()}</p>
            <p className="mt-2">{t("legal.terms_accept") || "Використовуючи Сервіс, ви погоджуєтесь з умовами цього Договору"}</p>
          </div>
        </div>
      </div>

      <footer className="relative z-10 text-center py-8 text-white/60">
        <p>{t("footer.copyright")}</p>
      </footer>
    </div>
  );
}