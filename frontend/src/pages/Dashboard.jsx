import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import LanguageSwitcher from "../components/LanguageSwitcher";
import Tooltip from "../components/Tooltip";
import "../App.css";
import { authAPI } from "../api/auth";

const API = process.env.REACT_APP_API || " ";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [option, setOption] = useState("all");
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [customText, setCustomText] = useState("");
  const [improvedText, setImprovedText] = useState("");
  const [improveLoading, setImproveLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [clientState, setClientState] = useState(null);
  
  // Стриминг
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamMode, setStreamMode] = useState(false);
  
  // Скрипты
  const [selectedScript, setSelectedScript] = useState("auto");
  const [availableScripts, setAvailableScripts] = useState([]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [history, isStreaming]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Функция загрузки скриптов (вынесена наружу)
  const loadScriptsList = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const language = localStorage.getItem("language") || "uk";
      const res = await fetch(`https://replyflow-bot.onrender.com/api/scripts/?language=${language}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableScripts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Загрузка при монтировании
  useEffect(() => {
  window.addEventListener("beforeunload", () => {
    localStorage.removeItem("replyflow_session_id");
  });
}, []);

useEffect(() => {
  loadScriptsList();
}, []);

  // Обновление при смене языка
  useEffect(() => {
    const handleLanguageChange = () => {
      loadScriptsList();
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, []);

  const optionLabels = {
    all: t("dashboard.option_all"),
    soft: t("dashboard.option_soft"),
    sell: t("dashboard.option_sell"),
    short: t("dashboard.option_short"),
  };

  const getClientStateText = (state) => {
    const states = {
      doubt: { uk: "Сумнів", en: "Doubt" },
      interest: { uk: "Інтерес", en: "Interest" },
      objection: { uk: "Заперечення", en: "Objection" },
      price_request: { uk: "Запит ціни", en: "Price Request" },
      ready_to_buy: { uk: "Готовий купити", en: "Ready to Buy" }
    };
    const lang = localStorage.getItem("language") === "en" ? "en" : "uk";
    return states[state]?.[lang] || state;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // ===== ОБЫЧНАЯ ГЕНЕРАЦИЯ =====
  const handleSubmitNormal = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setErrorMessage("");
    setClientState(null);
    let currentSessionId = sessionId;
if (!currentSessionId) {
  currentSessionId = localStorage.getItem("replyflow_session_id");
  if (!currentSessionId) {
    currentSessionId = "web_" + Date.now() + "_" + Math.random().toString(36).substr(2, 8);
    localStorage.setItem("replyflow_session_id", currentSessionId);
  }
  setSessionId(currentSessionId);
}

    try {
      const res = await authAPI.fetchWithAuth(`${API}/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
       body: JSON.stringify({ 
         text, 
         objection: note, 
         session_id: sessionId || localStorage.getItem("replyflow_session_id") || Date.now().toString(),
         selected_script: selectedScript !== "auto" ? selectedScript : null
        }),
      });

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      if (data.session_id) {
        setSessionId(data.session_id);
      }
      
      if (data.client_state) {
        if (typeof data.client_state === 'object') {
          setClientState(data.client_state.message || data.client_state.strategy || 'interest');
        } else {
          setClientState(data.client_state);
        }
      }

      let responses = [];
      switch (option) {
        case "all":
          responses = [data.best_response, ...data.other_responses.slice(0, 2)];
          break;
        case "soft":
          responses = [data.best_response];
          break;
        case "sell":
          responses = [data.other_responses[0]];
          break;
        case "short":
          responses = [data.other_responses[1]];
          break;
      }

      responses = responses.filter(Boolean);

      setHistory((prev) => [...prev, { text, responses }]);
      setText("");
      setNote("");
    } catch (e) {
      console.error(e);
      setImprovedText(t("errors.generation_failed"));
    }

    setLoading(false);
  };

  // ===== СТРИМИНГОВАЯ ГЕНЕРАЦИЯ =====
  const handleSubmitStream = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setIsStreaming(true);
    setStreamingText("");
    setErrorMessage("");
    setClientState(null);
    let currentSessionId = sessionId;
if (!currentSessionId) {
  currentSessionId = localStorage.getItem("replyflow_session_id");
  if (!currentSessionId) {
    currentSessionId = "web_" + Date.now() + "_" + Math.random().toString(36).substr(2, 8);
    localStorage.setItem("replyflow_session_id", currentSessionId);
  }
  setSessionId(currentSessionId);
}

    try {
      const token = localStorage.getItem("accessToken");
      
      const response = await fetch(`${API}/generate-stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          text, 
          objection: note, 
          session_id: currentSessionId,
          selected_script: selectedScript !== "auto" ? selectedScript : null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Server error");
      }
      
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let displayText = "";
      let sessionIdFromHeaders = response.headers.get("X-Session-Id");
      if (sessionIdFromHeaders) setSessionId(sessionIdFromHeaders);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        fullText += chunk;
        
        // Эффект печати по символам
        for (let i = 0; i < chunk.length; i++) {
          displayText += chunk[i];
          setStreamingText(displayText);
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }

      setHistory((prev) => [...prev, { text, responses: [fullText] }]);
      setText("");
      setNote("");
      
    } catch (e) {
      console.error(e);
      setErrorMessage(e.message || t("errors.generation_failed"));
    }

    setLoading(false);
    setIsStreaming(false);
  };

  // ===== ОБЩАЯ ФУНКЦИЯ =====
  const handleSubmit = async () => {
    if (streamMode) {
      await handleSubmitStream();
    } else {
      await handleSubmitNormal();
    }
  };

  const handleNewQuery = () => {
    setText("");
    setNote("");
    setOption("all");
    setHistory([]);
    setCustomText("");
    setImprovedText("");
    setSessionId(null);
    setErrorMessage("");
    setClientState(null);
    setStreamingText("");
    setIsStreaming(false);
    localStorage.removeItem("replyflow_session_id");
  };

  const copyToClipboard = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleImprove = async () => {
    if (!customText.trim()) return;
    setImproveLoading(true);
    setErrorMessage("");

    try {
      const accessToken = localStorage.getItem("accessToken");
      
      const res = await fetch(`${API}/improve-answer`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ text: customText, note }),
      });

      if (res.status === 429) {
        const error = await res.json();
        setErrorMessage(error.detail);
        setImproveLoading(false);
        return;
      }

      if (!res.ok) throw new Error("Server error");

      const data = await res.json();
      setImprovedText(data.improved_text || t("errors.generation_failed"));
    } catch (e) {
      console.error(e);
      setImprovedText(t("errors.generation_failed"));
    }

    setImproveLoading(false);
  };

  return (
    <div className="relative overflow-x-hidden">
      {/* HEADER */}
      {user && (
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 text-white mb-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="font-semibold">{user.full_name || user.username}</p>
              <p className="text-sm opacity-80">{user.email}</p>
            </div>
            <Tooltip text={t("tooltips.profile")}>
              <button
                onClick={() => navigate("/profile")}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-bold transition"
              >
                {t("common.profile")}
              </button>
            </Tooltip>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Tooltip text={t("tooltips.logout")}>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold transition"
              >
                {t("common.logout")}
              </button>
            </Tooltip>
          </div>
        </div>
      )}

      {/* Сообщение об ошибке */}
      {errorMessage && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg">
          {errorMessage}
        </div>
      )}

      <div className="container" style={{ marginLeft: "-5px" }}>
        <div className="top-panel">
          <div className="left-panel">
            <Tooltip text={t("tooltips.back_to_home")}>
              <button className="main-button back-btn" onClick={() => (window.location.href = "/")}>
                {t("common.back_to_home")}
              </button>
            </Tooltip>
            <textarea
              className="input-textarea"
              placeholder={t("dashboard.client_text")}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
            />
            <input
              className="input-text"
              type="text"
              placeholder={t("dashboard.client_note")}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="option-select">
              <label> {t("dashboard.option_label")} </label>
              <select value={option} onChange={(e) => setOption(e.target.value)}>
                {Object.entries(optionLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            {/* Выбор скрипта */}
            <div className="option-select mt-2">
              <label className="text-white">{t("dashboard.script_label")}</label>
              <select 
                value={selectedScript} 
                onChange={(e) => setSelectedScript(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-purple-900/60 text-white border border-white/30 focus:outline-none focus:border-pink-400"
              >
                <option value="auto" className="text-white bg-purple-900">🤖 {t("scripts.auto")}</option>
                {availableScripts.map(script => (
                  <option key={script.id} value={script.id} className="text-white bg-purple-900">
                    {script.is_default ? "⭐ " : "📝 "}{script.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Переключатель режимов */}
            <div className="flex items-center gap-3 mt-2 mb-2">
              <label className="text-white text-sm">{t("dashboard.mode_label")}</label>
              <button
                onClick={() => setStreamMode(false)}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  !streamMode 
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" 
                    : "bg-white/20 text-white/70 hover:bg-white/30"
                }`}
              >
                ⚡ {t("dashboard.normal_mode")}
              </button>
              <button
                onClick={() => setStreamMode(true)}
                className={`px-3 py-1 rounded-lg text-sm font-bold transition ${
                  streamMode 
                    ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white" 
                    : "bg-white/20 text-white/70 hover:bg-white/30"
                }`}
              >
                📝 {t("dashboard.stream_mode")}
              </button>
            </div>
            
            <div className="buttons">
              <Tooltip text={t("tooltips.generate")}>
                <button className="main-button" onClick={handleSubmit} disabled={loading}>
                  {loading ? t("landing.generating") : t("dashboard.generate")}
                </button>
              </Tooltip>
              <Tooltip text={t("tooltips.new_query")}>
                <button className="main-button" onClick={handleNewQuery}>
                  {t("dashboard.new_query")}
                </button>
              </Tooltip>
            </div>
          </div>

          <div className="right-panel">
            <h2> {t("dashboard.your_answer")} </h2>
            <textarea
              className="input-textarea"
              placeholder={t("dashboard.your_answer")}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={3}
            />
            <div className="buttons">
              <Tooltip text={t("tooltips.improve")}>
                <button className="main-button" onClick={handleImprove} disabled={improveLoading}>
                  {improveLoading ? t("landing.generating") : t("dashboard.improve")}
                </button>
              </Tooltip>
              <Tooltip text={t("tooltips.clear")}>
                <button
                  className="main-button clear-btn"
                  onClick={() => { setCustomText(""); setImprovedText(""); }}
                >
                  {t("dashboard.clear")}
                </button>
              </Tooltip>
            </div>

            {!improveLoading && improvedText && (
              <div className="card improved-answer relative">
                <h3> {t("dashboard.improved_answer")} </h3>
                <p className="pr-12">{improvedText}</p>
                <button 
                  className="copy-btn absolute top-3 right-3 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white transition-all duration-200"
                  onClick={() => copyToClipboard(improvedText, "improved")}
                >
                  {copiedIdx === "improved" ? t("dashboard.copied") : t("dashboard.copy")}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Отображение состояния клиента */}
        {clientState && (
          <div className="my-4 p-3 rounded-lg bg-purple-500/20 border border-purple-500 text-purple-300 text-sm">
            🧠 {t("dashboard.client_state") || "Стан клієнта"}: {getClientStateText(clientState)}
          </div>
        )}

        {/* Отображение стриминга */}
        {isStreaming && (
          <div className="chat-message bot mt-4">
            <div className="chat-label">🤖 AI відповідає:</div>
            <div className="chat-bubble bg-white/10">
              {streamingText}
              <span className="inline-block w-2 h-4 ml-1 bg-pink-400 animate-pulse"> </span>
            </div>
          </div>
        )}

        <div className="chat-container">
          {history.map((entry, hIdx) => (
            <div key={hIdx} className="chat-block">
              <div className="chat-message user">
                <div className="chat-label">{t("dashboard.you")}</div>
                <div className="chat-bubble">{entry.text}</div>
              </div>

              <div className="responses">
                {entry.responses?.map((resp, idx) => (
                  <div key={`${hIdx}-${idx}`} className="card">
                    <button className="copy-btn" onClick={() => copyToClipboard(resp, `${hIdx}-${idx}`)}>
                      {copiedIdx === `${hIdx}-${idx}` ? t("dashboard.copied") : t("dashboard.copy")}
                    </button>
                    <h3>
                      {idx === 0 && "💬 " + t("dashboard.option_soft")}
                      {idx === 1 && "💰 " + t("dashboard.option_sell")}
                      {idx === 2 && "⚡ " + t("dashboard.option_short")}
                    </h3>
                    <p>{resp}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div ref={bottomRef}></div>
        </div>
      </div>
    </div>
  );
}
