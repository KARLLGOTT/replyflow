import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ReactComponent as Logo } from "../assets/logo.svg";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function UserGuide() {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    { id: "getting-started", title: t("guide.getting_started"), icon: "🚀" },
    { id: "dashboard", title: t("guide.dashboard"), icon: "📊" },
    { id: "generation", title: t("guide.generation"), icon: "🤖" },
    { id: "improve", title: t("guide.improve"), icon: "✏️" },
    { id: "subscription", title: t("guide.subscription"), icon: "💳" },
    { id: "profile", title: t("guide.profile"), icon: "👤" },
    { id: "integrations", title: t("guide.integrations"), icon: "🔌" },
    { id: "telegram", title: "🤖 Telegram Bot", icon: "📱" },
    { id: "extension", title: t("guide.extension"), icon: "🖥️" },
    { id: "faq", title: t("guide.faq"), icon: "❓" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white">
      {/* HEADER */}
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
          <Link
            to="/dashboard"
            className="bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-xl font-bold transition"
          >
            Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">{t("guide.title")}</h1>
        <p className="text-center text-white/80 mb-12 max-w-2xl mx-auto">
          {t("guide.subtitle")}
        </p>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Бокове меню */}
          <div className="lg:w-1/4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 sticky top-24">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                    activeSection === section.id
                      ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                      : "hover:bg-white/10 text-white/80"
                  }`}
                >
                  <span className="text-xl">{section.icon}</span>
                  <span>{section.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Контент */}
          <div className="lg:w-3/4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8">
              {activeSection === "getting-started" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">{t("guide.getting_started")}</h2>
                  <div className="space-y-3 text-white/80">
                    <p>{t("guide.step1")}</p>
                    <p>{t("guide.step2")}</p>
                    <p>{t("guide.step3")}</p>
                    <p>{t("guide.step4")}</p>
                    <p>{t("guide.step5")}</p>
                    <p className="text-pink-300 mt-4">{t("guide.tip1")}</p>
                  </div>
                </div>
              )}

              {activeSection === "dashboard" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">{t("guide.dashboard")}</h2>
                  <p className="text-white/80 mb-4">{t("guide.dashboard_desc")}</p>
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-1">{t("guide.left_panel")}</h3>
                      <p className="text-white/70">{t("guide.left_panel_desc")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-1">{t("guide.right_panel")}</h3>
                      <p className="text-white/70">{t("guide.right_panel_desc")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-1">{t("guide.center_area")}</h3>
                      <p className="text-white/70">{t("guide.center_area_desc")}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "generation" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">{t("guide.generation")}</h2>
                  <div className="space-y-3 text-white/80">
                    <p>{t("guide.gen_step1")}</p>
                    <p>{t("guide.gen_step2")}</p>
                    <p>{t("guide.gen_step3")}</p>
                    <p>{t("guide.gen_step4")}</p>
                    <p>{t("guide.gen_step5")}</p>
                    <p className="text-pink-300 mt-4">{t("guide.tip2")}</p>
                  </div>
                </div>
              )}

              {activeSection === "improve" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">{t("guide.improve")}</h2>
                  <div className="space-y-3 text-white/80">
                    <p>{t("guide.imp_step1")}</p>
                    <p>{t("guide.imp_step2")}</p>
                    <p>{t("guide.imp_step3")}</p>
                    <p>{t("guide.imp_step4")}</p>
                  </div>
                </div>
              )}

              {activeSection === "subscription" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">{t("guide.subscription")}</h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-white/80">
                      <thead className="bg-white/10">
                        <tr>
                          <th className="p-3 text-left">{t("guide.plan")}</th>
                          <th className="p-3 text-left">{t("guide.price")}</th>
                          <th className="p-3 text-left">{t("guide.limit")}</th>
                          <th className="p-3 text-left">{t("guide.features")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-t border-white/10">
                          <td className="p-3 font-semibold">Free</td>
                          <td className="p-3">$0</td>
                          <td className="p-3">{t("guide.free_limit")}</td>
                          <td className="p-3">{t("guide.free_features")}</td>
                        </tr>
                        <tr className="border-t border-white/10">
                          <td className="p-3 font-semibold">Starter</td>
                          <td className="p-3">$9/{t("guide.month")}</td>
                          <td className="p-3">{t("guide.starter_limit")}</td>
                          <td className="p-3">{t("guide.starter_features")}</td>
                        </tr>
                        <tr className="border-t border-white/10">
                          <td className="p-3 font-semibold">Professional</td>
                          <td className="p-3">$29/{t("guide.month")}</td>
                          <td className="p-3">{t("guide.professional_limit")}</td>
                          <td className="p-3">{t("guide.professional_features")}</td>
                        </tr>
                        <tr className="border-t border-white/10">
                          <td className="p-3 font-semibold">Business</td>
                          <td className="p-3">$79/{t("guide.month")}</td>
                          <td className="p-3">{t("guide.business_limit")}</td>
                          <td className="p-3">{t("guide.business_features")}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-pink-300 mt-4">{t("guide.tip3")}</p>
                </div>
              )}

              {activeSection === "profile" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">{t("guide.profile")}</h2>
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-1">{t("guide.profile_tab")}</h3>
                      <p className="text-white/70">{t("guide.profile_desc")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-1">{t("guide.security_tab")}</h3>
                      <p className="text-white/70">{t("guide.security_desc")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-1">{t("guide.stats_tab")}</h3>
                      <p className="text-white/70">{t("guide.stats_desc")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-1">{t("guide.integrations_tab")}</h3>
                      <p className="text-white/70">{t("guide.integrations_desc")}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "integrations" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">{t("guide.integrations")}</h2>
                  <div className="space-y-3">
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-1">CRM</h3>
                      <p className="text-white/70">{t("guide.crm_desc")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-1">Webhooks</h3>
                      <p className="text-white/70">{t("guide.webhook_desc")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-1">API Keys</h3>
                      <p className="text-white/70">{t("guide.api_desc")}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "telegram" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">🤖 {t("telegram.title")}</h2>
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-2">📱 {t("telegram.how_to_use")}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-white/80 ml-4">
                        <li>{t("telegram.step1")}</li>
                        <li>{t("telegram.step2")}</li>
                        <li>{t("telegram.step3")}</li>
                        <li>{t("telegram.step4")}</li>
                        <li>{t("telegram.step5")}</li>
                        <li>{t("telegram.step6")}</li>
                      </ol>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-2">{t("telegram.commands_title")}</h3>
                      <ul className="list-disc list-inside space-y-1 text-white/80 ml-4">
                        <li><span className="font-mono bg-white/20 px-2 py-0.5 rounded">/start</span> — {t("telegram.command_start")}</li>
                        <li><span className="font-mono bg-white/20 px-2 py-0.5 rounded">/help</span> — {t("telegram.command_help")}</li>
                        <li><span className="font-mono bg-white/20 px-2 py-0.5 rounded">/setkey API_КЛЮЧ</span> — {t("telegram.command_setkey")}</li>
                        <li><span className="font-mono bg-white/20 px-2 py-0.5 rounded">/myplan</span> — {t("telegram.command_myplan")}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "extension" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">🖥️ {t("guide.extension")}</h2>
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-2">📦 {t("extension.download")}</h3>
                      <a 
                        href="/static/replyflow-extension.zip" 
                        download
                        className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-2 rounded-lg font-bold text-white hover:scale-105 transition"
                      >
                        ⬇️ {t("extension.download")}
                      </a>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-2">📖 {t("extension.install_title")}</h3>
                      <ol className="list-decimal list-inside space-y-2 text-white/80 ml-4">
                        <li>{t("extension.install_step1")}</li>
                        <li>{t("extension.install_step2")}</li>
                        <li>{t("extension.install_step3")}</li>
                        <li>{t("extension.install_step4")}</li>
                        <li>{t("extension.install_step5")}</li>
                        <li>{t("extension.install_step6")}</li>
                      </ol>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-2">🔑 {t("extension.api_key_title")}</h3>
                      <p className="text-white/70 mb-2">{t("extension.api_key_desc")}</p>
                      <ul className="list-disc list-inside space-y-1 text-white/70 ml-4">
                        <li>{t("extension.api_key_step1")}</li>
                        <li>{t("extension.api_key_step2")}</li>
                        <li>{t("extension.api_key_step3")}</li>
                      </ul>
                    </div>

                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-xl font-semibold mb-2">{t("extension.how_to_use_title")}</h3>
                      <ul className="list-disc list-inside space-y-1 text-white/70 ml-4">
                        <li>{t("extension.how_to_use_1")}</li>
                        <li>{t("extension.how_to_use_2")}</li>
                        <li>{t("extension.how_to_use_3")}</li>
                        <li>{t("extension.how_to_use_4")}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "faq" && (
                <div>
                  <h2 className="text-2xl font-bold mb-4">{t("guide.faq")}</h2>
                  <div className="space-y-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-2 text-pink-300">❓ {t("faq.q1")}</h3>
                      <p className="text-white/70">💡 {t("faq.a1")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-2 text-pink-300">❓ {t("faq.q2")}</h3>
                      <p className="text-white/70">💡 {t("faq.a2")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-2 text-pink-300">❓ {t("faq.q3")}</h3>
                      <p className="text-white/70">💡 {t("faq.a3")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-2 text-pink-300">❓ {t("faq.q4")}</h3>
                      <p className="text-white/70">💡 {t("faq.a4")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-2 text-pink-300">❓ {t("faq.q5")}</h3>
                      <p className="text-white/70">💡 {t("faq.a5")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-2 text-pink-300">❓ {t("faq.q6")}</h3>
                      <p className="text-white/70">💡 {t("faq.a6")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-2 text-pink-300">❓ {t("faq.q7")}</h3>
                      <p className="text-white/70">💡 {t("faq.a7")}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <h3 className="text-lg font-semibold mb-2 text-pink-300">❓ {t("faq.q8")}</h3>
                      <p className="text-white/70">💡 {t("faq.a8")}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 text-center py-8 text-white/60">
        <div className="flex justify-center gap-6 mb-4">
          <Link to="/privacy" className="hover:text-pink-300 transition">{t("legal.privacy_link")}</Link>
          <Link to="/terms" className="hover:text-pink-300 transition">{t("legal.terms_link")}</Link>
          <Link to="/guide" className="hover:text-pink-300 transition">{t("footer.guide")}</Link>
		  <Link to="/api-docs" className="hover:text-pink-300 transition">
           API Docs
          </Link>
        </div>
        <p>{t("footer.email")}</p>
        <p className="mt-3">{t("footer.copyright")}</p>
      </footer>
    </div>
  );
}