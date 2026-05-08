import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ReactComponent as Logo } from "../assets/logo.svg";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Landing() {
  const { t } = useTranslation();
  const [emailStatus, setEmailStatus] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [demoDisabled, setDemoDisabled] = useState(false);
  const [remaining, setRemaining] = useState(3);
  const [sessionId, setSessionId] = useState(null);
  const [activeFeatureTab, setActiveFeatureTab] = useState("all");
  
  const revealRefs = useRef([]);
  revealRefs.current = [];

  const addToRefs = (el) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
  };

  // Функция для получения переведенных фич
  const getFeaturesForTab = (tab) => {
    switch(tab) {
      case "free":
        return [
          { icon: "🎁", title: t("free_limit.title"), desc: t("free_limit.desc") },
          { icon: "🤖", title: t("free_model.title"), desc: t("free_model.desc") }
        ];
      case "starter":
        return [
          { icon: "📈", title: t("starter_limit.title"), desc: t("starter_limit.desc") },
          { icon: "🧠", title: t("starter_model.title"), desc: t("starter_model.desc") },
          { icon: "✏️", title: t("improve.title"), desc: t("improve.desc") }
        ];
      case "professional":
        return [
          { icon: "⚡", title: t("professional_limit.title"), desc: t("professional_limit.desc") },
          { icon: "🎯", title: t("client_state.title"), desc: t("client_state.desc") },
          { icon: "🔍", title: t("search.title"), desc: t("search.desc") },
          { icon: "🚀", title: t("all_models.title"), desc: t("all_models.desc") },
          { icon: "📝", title: t("scripts.title"), desc: t("scripts.desc") }
        ];
      case "business":
        return [
          { icon: "♾️", title: t("business_limit.title"), desc: t("business_limit.desc") },
          { icon: "🔌", title: t("crm.title"), desc: t("crm.desc") },
          { icon: "🔑", title: t("api.title"), desc: t("api.desc") },
          { icon: "🪝", title: t("webhooks.title"), desc: t("webhooks.desc") },
          { icon: "🎯", title: t("client_state.title"), desc: t("client_state.desc") },
          { icon: "🔍", title: t("search.title"), desc: t("search.desc") }
        ];
      default: // "all"
        return [
          { icon: "🤖", title: t("generation.title"), desc: t("generation.desc") },
          { icon: "📊", title: t("options.title"), desc: t("options.desc") },
          { icon: "🎯", title: t("client_state.title"), desc: t("client_state.desc") },
          { icon: "🔍", title: t("search.title"), desc: t("search.desc") },
          { icon: "✏️", title: t("improve.title"), desc: t("improve.desc") },
          { icon: "💬", title: t("history.title"), desc: t("history.desc") },
          { icon: "🚀", title: t("speed.title"), desc: t("speed.desc") },
          { icon: "🔐", title: t("security.title"), desc: t("security.desc") },
          { icon: "⚡", title: t("streaming.title"), desc: t("streaming.desc") },
          { icon: "📝", title: t("scripts.title"), desc: t("scripts.desc") },
          { icon: "🔌", title: t("integrations.title"), desc: t("integrations.desc") }
        ];
    }
  };

  useEffect(() => {
    const checkDemoRemaining = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/demo-remaining");
        const data = await res.json();
        setRemaining(data.remaining);
        if (data.remaining <= 0) {
          setDemoDisabled(true);
        }
      } catch (err) {
        console.error("Failed to check demo remaining:", err);
      }
    };
    
    checkDemoRemaining();
  }, []);

  useEffect(() => {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
      link.addEventListener("click", function(e){
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if(target) target.scrollIntoView({behavior: "smooth"});
      });
    });

    const reveal = () => {
      revealRefs.current.forEach(el => {
        const top = el.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if(top < windowHeight - 100) {
          el.classList.add("opacity-100","translate-y-0");
        }
      });
    };
    window.addEventListener("scroll", reveal);
    reveal();
    return () => window.removeEventListener("scroll", reveal);
  }, []);

  const generateDemo = async () => {
    if (demoDisabled || !message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/demo-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message, session_id: sessionId }),
      });

      if (res.status === 429) {
        const error = await res.json();
        alert(error.detail);
        setDemoDisabled(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      
      if (data.session_id) {
        setSessionId(data.session_id);
        localStorage.setItem("demo_session_id", data.session_id);
      }
      
      if (data.demo_remaining !== undefined) {
        setRemaining(data.demo_remaining);
        if (data.demo_remaining <= 0) {
          setDemoDisabled(true);
        }
      }

      const allResponses = [data.best_response, ...data.other_responses];
      setResponses(prev => [...prev, { id: Date.now(), answers: allResponses }]);
      setMessage("");
    } catch (err) {
      setResponses(prev => [...prev, { id: Date.now(), answers: ["Помилка генерації демо"] }]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendEmail = async () => {
    const emailMessage = document.querySelector("#contact-message")?.value;
    if (!emailMessage?.trim()) return;
    
    try {
      const token = localStorage.getItem("accessToken");
      const headers = { "Content-Type": "application/json" };
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const res = await fetch("http://127.0.0.1:8000/send-email", {
        method: "POST",
        headers: headers,
        credentials: "include",
        body: JSON.stringify({ message: emailMessage }),
      });
      
      const data = await res.json();
      if (data.status === "success") {
        setEmailStatus(t("contact.success"));
        document.querySelector("#contact-message").value = "";
      } else {
        setEmailStatus("Помилка: " + (data.message || "невідома"));
      }
    } catch (err) {
      setEmailStatus("Помилка: " + (err.message || "невідома"));
    }
    setTimeout(() => setEmailStatus(""), 5000);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white">

      {/* Мерцающие частицы */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-20 animate-float"
            style={{
              width: `${Math.random()*4+1}px`,
              height: `${Math.random()*4+1}px`,
              top: `${Math.random()*100}%`,
              left: `${Math.random()*100}%`,
              animationDuration: `${Math.random()*6+4}s`,
              animationDelay: `${Math.random()*3}s`,
            }}
          />
        ))}
      </div>

      {/* HEADER */}
      <header className="relative z-10 flex justify-between items-center px-10 py-6 backdrop-blur-md bg-white/10">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10"/>
          <span className="text-2xl font-bold">{t("common.app_name")}</span>
          <button
            className="ml-6 bg-pink-500 hover:bg-pink-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all duration-300"
            onClick={() => window.location.href="/dashboard"}
          >
            {t("common.dashboard")}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button className="text-2xl" onClick={() => setSidebarOpen(true)}>☰</button>
        </div>
      </header>

      {/* SIDEBAR */}
      {sidebarOpen && (
        <div className="fixed top-0 right-0 w-72 h-full bg-black/80 backdrop-blur-xl p-6 z-50">
          <button className="mb-6 text-xl" onClick={() => setSidebarOpen(false)}>✕</button>
          <nav className="flex flex-col gap-6 text-lg">
            <a href="#features">{t("features.title") || "Можливості"}</a>
            <a href="#how">{t("how_it_works.title")}</a>
            <a href="#pricing">{t("pricing.title")}</a>
            <a href="#faq">{t("faq.title")}</a>
            <a href="#contact">{t("contact.title")}</a>
          </nav>
        </div>
      )}

      {/* HERO */}
      <section className="relative z-10 text-center pt-20 pb-16 px-6 group">
        <Logo className="w-24 h-24 mx-auto mb-6 animate-pulseSlow" />
        <h1 className="text-6xl font-bold mb-6">
          {"ReplyFlow AI".split("").map((char, i) => (
            <span
              key={i}
              className="inline-block opacity-0 transform translate-y-4 animate-heroText"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              {char}
            </span>
          ))}
        </h1>
        <p className="text-2xl opacity-90 mb-8 transition-colors duration-500 group-hover:text-pink-200">
          {t("landing.hero_title")}
        </p>
		<div className="flex gap-4 justify-center mt-6">
          <a 
            href="https://t.me/replayflow_ai_bot" 
            target="_blank"
            className="bg-[#26A5E4] hover:bg-[#1e8ec4] text-white px-6 py-3 rounded-xl font-bold transition"
          >
           🤖 Telegram Bot
          </a>
        </div>

        {/* Demo форма */}
        <div className="flex flex-col items-center gap-4 mt-8">
          <textarea
            placeholder={t("landing.demo_placeholder")}
            className="w-full max-w-md p-4 rounded-lg text-black"
            rows="4"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            onClick={generateDemo}
            disabled={loading || demoDisabled || !message.trim()}
            className={`bg-white text-black px-8 py-4 rounded-xl text-lg font-bold hover:scale-105 transition-transform duration-300 ${
              loading || demoDisabled ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {loading ? t("landing.generating") : demoDisabled ? t("landing.demo_completed") : t("landing.demo_button")}
          </button>
          
          <p className="text-white/80 text-sm">
            {t("landing.demo_remaining", { remaining })}
          </p>

          {/* Сообщения под кнопкой */}
          <div className="mt-4 w-full max-w-md text-left">
            {responses.map((resp) => (
              <div key={resp.id} className="bg-white/20 p-3 rounded mb-2 text-black text-sm break-words">
                <div className="font-bold mb-1">Demo відповіді:</div>
                {resp.answers.map((ans, i) => (
                  <div key={i} className="mb-1 flex items-center justify-between">
                    <span>{i+1}. {ans}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(ans)} 
                      className="ml-2 px-2 py-1 bg-pink-500 text-white rounded text-xs"
                    >
                      {t("dashboard.copy")}
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES - С ПЕРЕВОДАМИ */}
      <section id="features" className="relative z-10 py-0 max-w-6xl mx-auto px-6">
        <h2 ref={addToRefs} className="opacity-0 translate-y-8 transition-all duration-700 text-4xl font-bold text-center mb-10">
          {t("features.title") || "Всі можливості ReplyFlow AI"}
        </h2>
        <p className="text-center text-white/80 mb-12 max-w-2xl mx-auto">
          {t("features.subtitle") || "Обирай тариф, який підходить твоєму бізнесу, та отримуй доступ до потрібних функцій"}
        </p>

        {/* Табы для выбора тарифа */}
        <div className="flex justify-center gap-3 mb-12 flex-wrap">
          <button
            onClick={() => setActiveFeatureTab("all")}
            className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${
              activeFeatureTab === "all" 
                ? "bg-white text-purple-600" 
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {t("features.all")}
          </button>
          <button
            onClick={() => setActiveFeatureTab("free")}
            className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${
              activeFeatureTab === "free" 
                ? "bg-white text-purple-600" 
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Free
          </button>
          <button
            onClick={() => setActiveFeatureTab("starter")}
            className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${
              activeFeatureTab === "starter" 
                ? "bg-white text-purple-600" 
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Starter
          </button>
          <button
            onClick={() => setActiveFeatureTab("professional")}
            className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${
              activeFeatureTab === "professional" 
                ? "bg-white text-purple-600" 
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Professional
          </button>
          <button
            onClick={() => setActiveFeatureTab("business")}
            className={`px-6 py-2 rounded-full font-bold transition-all duration-300 ${
              activeFeatureTab === "business" 
                ? "bg-white text-purple-600" 
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            Business
          </button>
        </div>

        {/* Сетка функций - теперь с переводами */}
        <div className="grid md:grid-cols-3 gap-6">
          {getFeaturesForTab(activeFeatureTab).map((feature, idx) => (
            <div 
              key={idx} 
              ref={addToRefs} 
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl opacity-0 translate-y-8 transition-all duration-700 hover:scale-105 hover:bg-white/20"
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-white/70">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative z-10 py-20 max-w-6xl mx-auto px-6">
        <h2 ref={addToRefs} className="opacity-0 translate-y-8 transition-all duration-700 text-4xl font-bold text-center mb-14">{t("how_it_works.title")}</h2>
        <div className="grid md:grid-cols-3 gap-10">
          {[
            { step: "1", title: "how_it_works.step1_title", desc: "how_it_works.step1_desc" },
            { step: "2", title: "how_it_works.step2_title", desc: "how_it_works.step2_desc" },
            { step: "3", title: "how_it_works.step3_title", desc: "how_it_works.step3_desc" }
          ].map((item, idx) => (
            <div key={idx} ref={addToRefs} className="bg-white/10 backdrop-blur-lg p-8 rounded-xl text-center opacity-0 translate-y-8 transition-all duration-700">
              <div className="text-5xl mb-4">{item.step}</div>
              <h3 className="text-xl font-bold mb-3">{t(item.title)}</h3>
              <p className="opacity-90">{t(item.desc)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT / WHY */}
      <section id="about" ref={addToRefs} className="relative z-10 max-w-5xl mx-auto px-6 py-20 backdrop-blur-md bg-white/10 rounded-xl opacity-0 translate-y-8 transition-all duration-700">
        <h2 className="text-4xl font-bold mb-10 text-center">{t("about.title")}</h2>
        <p className="text-lg leading-8 opacity-95 mb-6">{t("about.text1")}</p>
        <p className="text-lg leading-8 opacity-95 mb-6">{t("about.text2")}</p>
        <p className="text-lg leading-8 opacity-95">{t("about.text3")}</p>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative z-10 py-24">
        <h2 ref={addToRefs} className="opacity-0 translate-y-8 transition-all duration-700 text-4xl font-bold text-center mb-16">{t("pricing.title")}</h2>
        <div className="grid md:grid-cols-4 gap-10 max-w-7xl mx-auto px-6">
          {[
            { name: "pricing.free", price: "pricing.free_price", features: "pricing.free_features", popular: false },
            { name: "pricing.starter", price: "pricing.starter_price", features: "pricing.starter_features", popular: false },
            { name: "pricing.professional", price: "pricing.professional_price", features: "pricing.professional_features", popular: true },
            { name: "pricing.business", price: "pricing.business_price", features: "pricing.business_features", popular: false }
          ].map((plan, idx) => (
            <div key={idx} ref={addToRefs} className={`bg-white/10 backdrop-blur-lg p-8 rounded-xl hover:scale-105 hover:shadow-2xl transition-transform transition-shadow duration-300 transform-gpu will-change-transform opacity-0 translate-y-8 ${plan.popular ? "ring-2 ring-pink-400" : ""}`}>
              {plan.popular && (
                <div className="absolute -mt-12 ml-24">
                  <span className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                    {t("pricing.popular")}
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold mb-4">{t(plan.name)}</h3>
              <ul className="space-y-2 opacity-90 mb-6 text-sm">
                {t(plan.features, { returnObjects: true }).map((item, i) => (
                  <li key={i}>✓ {item}</li>
                ))}
              </ul>
              <p className="text-3xl font-bold">{t(plan.price)}</p>
              <p className="text-sm opacity-70 mt-2">{idx === 0 ? t("pricing.forever") : t("pricing.per_month")}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 max-w-5xl mx-auto py-24 px-6">
        <h2 ref={addToRefs} className="text-4xl font-bold text-center mb-14 opacity-0 translate-y-8 transition-all duration-700">{t("faq.title")}</h2>
        <div className="space-y-4 text-lg">
          {[
            { q: "faq.q1", a: "faq.a1" },
            { q: "faq.q2", a: "faq.a2" },
            { q: "faq.q3", a: "faq.a3" },
            { q: "faq.q4", a: "faq.a4" },
            { q: "faq.q5", a: "faq.a5" },
            { q: "faq.q6", a: "faq.a6" },
            { q: "faq.q7", a: "faq.a7" },
            { q: "faq.q8", a: "faq.a8" }
          ].map((item, idx) => (
            <div key={idx} ref={addToRefs} className="bg-white/10 backdrop-blur-lg p-6 rounded-xl transition-all duration-300 hover:scale-[1.01] hover:shadow-xl cursor-pointer opacity-0 translate-y-8">
              <h3 className="font-bold mb-2 text-lg">{t(item.q)}</h3>
              <p className="opacity-80">{t(item.a)}</p>
            </div>
          ))}
        </div>
      </section>
	  
	  {/* EXTENSION DOWNLOAD */}
      <section id="extension" className="relative z-10 max-w-4xl mx-auto py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-6">📦 Chrome Extension</h2>
        <p className="text-white/80 mb-6">
          {t("extension.description")}
        </p>
        <a 
          href="/static/replyflow-extension.zip" 
          download
          className="inline-block bg-white text-purple-600 px-8 py-3 rounded-xl font-bold hover:scale-105 transition"
        >
         ⬇️ {t("extension.download")}
        </a>
        <div className="mt-8 text-left bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold mb-3">📖 {t("extension.install_title")}</h3>
          <ol className="list-decimal list-inside space-y-2 text-white/80">
            <li>{t("extension.install_step1")}</li>
            <li>{t("extension.install_step2")}</li>
            <li>{t("extension.install_step3")}</li>
            <li>{t("extension.install_step4")}</li>
            <li>{t("extension.install_step5")}</li>
            <li>{t("extension.install_step6")}</li>
          </ol>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        ref={addToRefs}
        className="relative z-10 max-w-3xl mx-auto py-16 px-6 text-center backdrop-blur-md bg-white/10 rounded-xl opacity-0 translate-y-8 transition-all duration-700"
      >
        <h2 className="text-3xl font-bold mb-6">{t("contact.title")}</h2>
        <textarea
          id="contact-message"
          placeholder={t("contact.placeholder")}
          className="w-full p-4 rounded-lg text-black mb-4"
          rows="4"
        />
        <button
          onClick={sendEmail}
          className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:scale-105 transition mb-2"
        >
          {t("contact.button")}
        </button>
        {emailStatus && <p className="mt-2 text-green-300 font-bold">{emailStatus}</p>}
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 text-center py-10 opacity-80">
        <div className="flex justify-center gap-6 mb-4">
          <Link to="/privacy" className="hover:text-pink-300 transition">
            {t("legal.privacy_link")}
          </Link>
          <Link to="/terms" className="hover:text-pink-300 transition">
            {t("legal.terms_link")}
          </Link>
          <Link to="/guide" className="hover:text-pink-300 transition">
            {t("footer.guide")}
          </Link>
		  <Link to="/api-docs" className="hover:text-pink-300 transition">
           API Docs
          </Link>
        </div>
        <p className="mt-4">{t("footer.email")}</p>
        <p className="mt-3">{t("footer.copyright")}</p>
      </footer>

      {/* Анимации */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes heroText {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-pulseSlow { animation: pulseSlow 3s ease-in-out infinite; }
        .animate-heroText { animation: heroText 0.5s ease-out forwards; }
      `}</style>
    </div>
  );
}