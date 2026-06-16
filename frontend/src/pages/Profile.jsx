import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import { ReactComponent as Logo } from "../assets/logo.svg";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Profile() {
  const { t } = useTranslation();
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [statsLoading, setStatsLoading] = useState(false);
  // Batch processing state
  const [batchTaskId, setBatchTaskId] = useState(null);
  const [batchStatus, setBatchStatus] = useState(null);
  const [batchProcessing, setBatchProcessing] = useState(false);

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    username: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [stats, setStats] = useState({
    total_generations: 0,
    generations_today: 0,
    remaining_today: 0,
    subscription_plan: "free",
  });

  // ===== INTEGRATIONS STATE =====
  const [integrations, setIntegrations] = useState({
    crm: { connected: false, crm_type: null },
    bitrix24: { connected: false },
    webhooks: { connected: false, webhook_url: null },
    api: { connected: false }
  });
  const [crmType, setCrmType] = useState("hubspot");
  const [crmApiKey, setCrmApiKey] = useState("");
  const [bitrix24Webhook, setBitrix24Webhook] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [integrationsLoading, setIntegrationsLoading] = useState(false);

  // ===== SCRIPTS STATE =====
  const [scripts, setScripts] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [editingScript, setEditingScript] = useState(null);
  const [newScript, setNewScript] = useState({ name: "", category: "custom", template: "" });
  const [showScriptModal, setShowScriptModal] = useState(false);

  // ===== KNOWLEDGE BASE STATE =====
  const [knowledgeItems, setKnowledgeItems] = useState([]);
  const [knowledgeLoading, setKnowledgeLoading] = useState(false);
  const [showKnowledgeModal, setShowKnowledgeModal] = useState(false);
  const [newKnowledge, setNewKnowledge] = useState({ name: "", content: "", file_type: "text" });

  // Функция загрузки скриптов
  const loadScripts = async () => {
    setScriptsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const language = localStorage.getItem("language") || "uk";
      const res = await fetch(`https://replyflow-bot.onrender.com/api/scripts/?language=${language}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setScripts(data);
      }
    } catch (err) {
      console.error("Failed to load scripts:", err);
    }
    setScriptsLoading(false);
  };

  // Функция загрузки базы знаний
  const loadKnowledge = async () => {
    setKnowledgeLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/knowledge/", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKnowledgeItems(data);
      }
    } catch (err) {
      console.error("Failed to load knowledge:", err);
    }
    setKnowledgeLoading(false);
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || "",
        username: user.username || "",
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "stats") {
      loadStats();
    }
    if (activeTab === "integrations" && user?.subscription_plan === "business") {
      loadIntegrationsStatus();
    }
    if (activeTab === "scripts") {
      loadScripts();
    }
    if (activeTab === "knowledge") {
      loadKnowledge();
    }
  }, [activeTab, user]);

  // Обновление скриптов при смене языка
  useEffect(() => {
    const handleLanguageChange = () => {
      if (activeTab === "scripts") {
        loadScripts();
      }
    };
    
    window.addEventListener('languageChanged', handleLanguageChange);
    return () => window.removeEventListener('languageChanged', handleLanguageChange);
  }, [activeTab]);

  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      
      if (res.ok) {
        const userData = await res.json();
        const limits = {
          free: 10,
          starter: 50,
          professional: 150,
          business: Infinity,
        };
        const limit = limits[userData.subscription_plan] || 10;
        
        setStats({
          total_generations: userData.total_generations || 0,
          generations_today: userData.generations_today || 0,
          remaining_today: Math.max(0, limit - (userData.generations_today || 0)),
          subscription_plan: userData.subscription_plan || "free",
        });
      }
    } catch (err) {
      console.error("Failed to load stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadIntegrationsStatus = async () => {
    setIntegrationsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/integrations/status", {
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations);
      }
    } catch (err) {
      console.error("Failed to load integrations:", err);
    } finally {
      setIntegrationsLoading(false);
    }
  };

  const createScript = async () => {
    if (!newScript.name || !newScript.template) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/scripts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newScript)
      });
      if (res.ok) {
        loadScripts();
        setNewScript({ name: "", category: "custom", template: "" });
        setShowScriptModal(false);
      }
    } catch (err) {
      console.error("Failed to create script:", err);
    }
  };

  const updateScript = async (id, data) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`https://replyflow-bot.onrender.com/api/scripts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        loadScripts();
        setEditingScript(null);
      }
    } catch (err) {
      console.error("Failed to update script:", err);
    }
  };

  const deleteScript = async (id) => {
    if (!window.confirm(t("scripts.delete_confirm"))) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`https://replyflow-bot.onrender.com/api/scripts/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadScripts();
      }
    } catch (err) {
      console.error("Failed to delete script:", err);
    }
  };

  // ===== KNOWLEDGE BASE FUNCTIONS =====
  const createKnowledge = async () => {
    if (!newKnowledge.name || !newKnowledge.content || newKnowledge.content.length < 10) {
      alert(t("knowledge.min_length") || "Content must be at least 10 characters");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/knowledge/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newKnowledge)
      });
      if (res.ok) {
        loadKnowledge();
        setNewKnowledge({ name: "", content: "", file_type: "text" });
        setShowKnowledgeModal(false);
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to add knowledge");
      }
    } catch (err) {
      console.error("Failed to create knowledge:", err);
      alert("Error: " + err.message);
    }
  };

  const deleteKnowledge = async (id) => {
    if (!window.confirm(t("knowledge.delete_confirm") || "Delete this knowledge base item?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`https://replyflow-bot.onrender.com/api/knowledge/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadKnowledge();
      }
    } catch (err) {
      console.error("Failed to delete knowledge:", err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileNameSpan = document.getElementById("file-name");
    if (fileNameSpan) {
      fileNameSpan.textContent = file.name;
    }
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/knowledge/upload-file", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        loadKnowledge();
        alert(t("knowledge.file_uploaded") || "File uploaded successfully!");
        if (fileNameSpan) {
          fileNameSpan.textContent = t("knowledge.no_file_chosen") || "No file chosen";
        }
      } else {
        const error = await res.json();
        alert(error.detail || "Upload failed");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
    e.target.value = "";
  };

  // ===== BITRIX24 FUNCTIONS =====
  const connectBitrix24 = async () => {
    if (!bitrix24Webhook) {
      alert("Please enter Bitrix24 webhook URL");
      return;
    }
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/integrations/crm/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ crm_type: "bitrix24", api_key: bitrix24Webhook }),
      });
      if (res.ok) {
        alert("Bitrix24 connected successfully!");
        loadIntegrationsStatus();
        setBitrix24Webhook("");
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to connect Bitrix24");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const disconnectBitrix24 = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/integrations/crm/disconnect", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        alert("Bitrix24 disconnected");
        loadIntegrationsStatus();
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/users/update-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: profileForm.full_name,
          username: profileForm.username,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Помилка оновлення");
      }

      setMessage({ type: "success", text: t("profile.profile_updated") });
      await refreshUser();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ type: "error", text: t("errors.passwords_not_match") });
      setLoading(false);
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setMessage({ type: "error", text: t("errors.password_too_short") });
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/users/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Помилка зміни пароля");
      }

      setMessage({ type: "success", text: t("profile.password_changed") });
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm(t("profile.cancel_confirm"))) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/users/cancel-subscription", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Помилка скасування");
      }
      
      setMessage({ type: "success", text: t("profile.subscription_cancelled") });
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ===== INTEGRATION FUNCTIONS =====
  const connectCRM = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/integrations/crm/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ crm_type: crmType, api_key: crmApiKey }),
        credentials: "include",
      });
      if (res.ok) {
        alert("CRM connected successfully!");
        loadIntegrationsStatus();
        setCrmApiKey("");
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to connect CRM");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const disconnectCRM = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/integrations/crm/disconnect", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        alert("CRM disconnected");
        loadIntegrationsStatus();
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const registerWebhook = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/integrations/webhooks/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url: webhookUrl, events: ["generation.created"] }),
        credentials: "include",
      });
      if (res.ok) {
        alert("Webhook registered!");
        loadIntegrationsStatus();
        setWebhookUrl("");
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to register webhook");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const unregisterWebhook = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/integrations/webhooks/unregister", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        alert("Webhook unregistered");
        loadIntegrationsStatus();
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const generateApiKey = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/integrations/api-keys/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeyValue(data.api_key);
        alert(`API Key generated: ${data.api_key}\nSave this key now. You won't see it again.`);
        loadIntegrationsStatus();
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to generate API key");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const revokeApiKey = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/api/integrations/api-keys/revoke", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
        credentials: "include",
      });
      if (res.ok) {
        alert("API key revoked");
        loadIntegrationsStatus();
        setApiKeyValue("");
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // ===== BATCH PROCESSING =====
  const handleBatchUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setBatchProcessing(true);
    setBatchStatus("Uploading...");
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("https://replyflow-bot.onrender.com/batch/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      
      const data = await res.json();
      setBatchTaskId(data.task_id);
      setBatchStatus(`Processing: 0/${data.total}`);
      
      const interval = setInterval(async () => {
        const statusRes = await fetch(`https://replyflow-bot.onrender.com/batch/status/${data.task_id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const statusData = await statusRes.json();
        setBatchStatus(`Processing: ${statusData.processed}/${statusData.total}`);
        
        if (statusData.status === "completed") {
          clearInterval(interval);
          setBatchStatus("Completed! Click download.");
          setBatchProcessing(false);
        }
      }, 2000);
      
    } catch (err) {
      console.error(err);
      setBatchStatus("Upload failed");
      setBatchProcessing(false);
    }
  };

  const downloadBatchResult = async () => {
    if (!batchTaskId) return;
    const token = localStorage.getItem("accessToken");
    window.location.href = `https://replyflow-bot.onrender.com/batch/download/${batchTaskId}?token=${token}`;
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 flex items-center justify-center">
        <div className="text-white text-xl">{t("common.loading")}</div>
      </div>
    );
  }

  const getPlanName = () => {
    const plans = {
      free: t("pricing.free"),
      starter: t("pricing.starter"),
      professional: t("pricing.professional"),
      business: t("pricing.business"),
    };
    return plans[stats.subscription_plan] || t("pricing.free");
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600">
      <header className="relative z-10 flex justify-between items-center px-10 py-6 backdrop-blur-md bg-white/10">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10" />
          <span className="text-2xl font-bold text-white">{t("common.app_name")}</span>
          <button
            onClick={() => navigate("/dashboard")}
            className="ml-6 bg-white/20 hover:bg-white/30 text-white px-5 py-2 rounded-xl font-bold transition-all duration-300"
          >
            {t("common.dashboard")}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={handleLogout}
            className="bg-red-500/80 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-bold transition-all duration-300"
          >
            {t("common.logout")}
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">
            {t("profile.title")}
          </h1>
          <p className="text-white/80 text-lg">
            {t("profile.subtitle")}
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              activeTab === "profile"
                ? "bg-white text-purple-600 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {t("profile.tab_profile")}
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              activeTab === "security"
                ? "bg-white text-purple-600 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {t("profile.tab_security")}
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              activeTab === "stats"
                ? "bg-white text-purple-600 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {t("profile.tab_stats")}
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              activeTab === "integrations"
                ? "bg-white text-purple-600 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            {t("profile.tab_integrations") || "Integrations"}
          </button>
          <button
            onClick={() => setActiveTab("scripts")}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              activeTab === "scripts"
                ? "bg-white text-purple-600 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            📝 {t("profile.tab_scripts")}
          </button>
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              activeTab === "knowledge"
                ? "bg-white text-purple-600 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            📚 {t("profile.tab_knowledge") || "Knowledge Base"}
          </button>
          <button
            onClick={() => setActiveTab("batch")}
            className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
              activeTab === "batch"
                ? "bg-white text-purple-600 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            📊 Массовая обработка
          </button>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-500/20 border border-green-500 text-green-300"
                : "bg-red-500/20 border border-red-500 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label className="block text-white mb-2 text-sm font-semibold">
                  {t("profile.email")}
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/30 text-white/70 cursor-not-allowed"
                />
                <p className="text-white/50 text-xs mt-1">{t("profile.email_cannot_change")}</p>
              </div>

              <div>
                <label className="block text-white mb-2 text-sm font-semibold">
                  {t("profile.username")}
                </label>
                <input
                  type="text"
                  value={profileForm.username}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, username: e.target.value })
                  }
                  required
                  minLength="3"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
                />
              </div>

              <div>
                <label className="block text-white mb-2 text-sm font-semibold">
                  {t("profile.full_name")}
                </label>
                <input
                  type="text"
                  value={profileForm.full_name}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, full_name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
                  placeholder={t("auth.full_name_placeholder")}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-60"
              >
                {loading ? t("common.loading") : t("profile.save_changes")}
              </button>
            </form>
          </div>
        )}

        {activeTab === "security" && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8">
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label className="block text-white mb-2 text-sm font-semibold">
                  {t("profile.current_password")}
                </label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, current_password: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-white mb-2 text-sm font-semibold">
                  {t("profile.new_password")}
                </label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, new_password: e.target.value })
                  }
                  required
                  minLength="8"
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
                  placeholder="••••••••"
                />
                <p className="text-white/60 text-xs mt-1">{t("profile.password_min_length")}</p>
              </div>

              <div>
                <label className="block text-white mb-2 text-sm font-semibold">
                  {t("profile.confirm_password")}
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirm_password: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:border-pink-400"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-60"
              >
                {loading ? t("common.loading") : t("profile.change_password")}
              </button>
            </form>
          </div>
        )}

        {activeTab === "stats" && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8">
            {statsLoading ? (
              <div className="text-center text-white py-8">{t("common.loading")}</div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    {stats.generations_today}
                  </div>
                  <div className="text-white/80">{t("profile.generations_today")}</div>
                </div>

                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    {stats.remaining_today === Infinity ? "∞" : stats.remaining_today}
                  </div>
                  <div className="text-white/80">{t("profile.remaining_today")}</div>
                </div>

                <div className="bg-white/10 rounded-xl p-6 text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    {stats.total_generations}
                  </div>
                  <div className="text-white/80">{t("profile.total_generations")}</div>
                </div>

                <div className="bg-white/10 rounded-xl p-6 text-center md:col-span-3">
                  <div className="text-2xl font-bold text-white mb-2">
                    {getPlanName()}
                  </div>
                  <div className="text-white/80">{t("profile.current_plan")}</div>
                  <div className="flex gap-4 justify-center mt-4">
                    <button
                      onClick={() => navigate("/pricing")}
                      className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg text-white font-bold hover:scale-105 transition"
                    >
                      {t("profile.manage_subscription")}
                    </button>
                    
                    {stats.subscription_plan !== "free" && (
                      <button
                        onClick={handleCancelSubscription}
                        className="px-6 py-2 bg-red-500/80 hover:bg-red-600 rounded-lg text-white font-bold transition"
                      >
                        {t("profile.cancel_subscription")}
                      </button>
                    )}
                  </div>
                  {stats.subscription_plan !== "free" && (
                    <p className="text-white/60 text-sm mt-3">
                      {t("profile.cancel_confirm")}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "integrations" && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">
              {t("integrations.title") || "Integrations"}
            </h2>
            
            {user?.subscription_plan !== "business" ? (
              <div className="text-center py-8">
                <p className="text-white/80 mb-4">
                  {t("integrations.upgrade_required") || "Integrations are available only on Business plan"}
                </p>
                <button
                  onClick={() => navigate("/pricing")}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 rounded-lg font-bold text-white hover:scale-105 transition"
                >
                  {t("integrations.upgrade_button") || "Upgrade to Business"}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* CRM Integration */}
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">CRM Integration</h3>
                    <span className="text-green-400 text-sm">✓ Demo mode</span>
                  </div>
                  <p className="text-white/70 mb-4">
                    {t("integrations.crm_description") || "Connect your CRM to automatically save AI responses"}
                  </p>
                  
                  {integrations.crm?.connected ? (
                    <div>
                      <p className="text-green-300 mb-2">
                        ✓ Connected to {integrations.crm.crm_type}
                      </p>
                      <button
                        onClick={disconnectCRM}
                        className="bg-red-500/80 hover:bg-red-600 px-4 py-2 rounded-lg text-white text-sm"
                      >
                        {t("integrations.disconnect") || "Disconnect"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <select
                        value={crmType}
                        onChange={(e) => setCrmType(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-purple-900/60 text-white border border-white/30 focus:outline-none focus:border-pink-400"
                      >
                        <option value="hubspot" className="text-white bg-purple-900">HubSpot</option>
                        <option value="amocrm" className="text-white bg-purple-900">amoCRM</option>
                        <option value="pipedrive" className="text-white bg-purple-900">Pipedrive</option>
                      </select>
                      <input
                        type="password"
                        placeholder={t("integrations.crm_api_key_placeholder") || "Enter your CRM API key"}
                        value={crmApiKey}
                        onChange={(e) => setCrmApiKey(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-purple-900/60 text-white placeholder-white/40 border border-white/30 focus:outline-none focus:border-pink-400"
                      />
                      <button
                        onClick={connectCRM}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-2 rounded-lg font-bold text-white hover:scale-105 transition"
                      >
                        {t("integrations.connect") || "Connect"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Bitrix24 Integration */}
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Bitrix24</h3>
                    <span className="text-green-400 text-sm">{t("integrations.bitrix24_free_plan") || "Free plan"}</span>
                  </div>
                  <p className="text-white/70 mb-4">
                    {t("integrations.bitrix24_desc") || "Connect Bitrix24 to automatically save responses"}
                  </p>
                  
                  {integrations.bitrix24?.connected ? (
                    <div>
                      <p className="text-green-300 mb-2">{t("integrations.bitrix24_connected") || "✓ Connected"}</p>
                      <button
                        onClick={disconnectBitrix24}
                        className="bg-red-500/80 hover:bg-red-600 px-4 py-2 rounded-lg text-white text-sm"
                      >
                        {t("integrations.bitrix24_disconnect") || "Disconnect"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder={t("integrations.bitrix24_webhook_placeholder") || "https://your-bitrix24.bitrix24.ua/rest/1/token/"}
                        value={bitrix24Webhook}
                        onChange={(e) => setBitrix24Webhook(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-purple-900/60 text-white placeholder-white/40 border border-white/30 focus:outline-none focus:border-pink-400"
                      />
                      <p className="text-white/50 text-xs">
                        {t("integrations.bitrix24_howto") || "How to get webhook: Bitrix24 → Settings → REST API → Incoming webhook"}
                      </p>
                      <button
                        onClick={connectBitrix24}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-2 rounded-lg font-bold text-white hover:scale-105 transition"
                      >
                        {t("integrations.bitrix24_connect") || "Connect Bitrix24"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Webhooks */}
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Webhooks</h3>
                  <p className="text-white/70 mb-4">
                    {t("integrations.webhook_description") || "Receive automatic notifications about events"}
                  </p>
                  
                  {integrations.webhooks?.connected ? (
                    <div>
                      <p className="text-green-300 mb-2">
                        ✓ Webhook: {integrations.webhooks.webhook_url}
                      </p>
                      <button
                        onClick={unregisterWebhook}
                        className="bg-red-500/80 hover:bg-red-600 px-4 py-2 rounded-lg text-white text-sm"
                      >
                        {t("integrations.disconnect") || "Disconnect"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="url"
                        placeholder="https://your-server.com/webhook"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-purple-900/60 text-white placeholder-white/40 border border-white/30 focus:outline-none focus:border-pink-400"
                      />
                      <button
                        onClick={registerWebhook}
                        className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-2 rounded-lg font-bold text-white hover:scale-105 transition"
                      >
                        {t("integrations.register") || "Register"}
                      </button>
                    </div>
                  )}
                </div>

                {/* API Keys */}
                <div className="bg-white/5 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-white mb-4">API Access</h3>
                  <p className="text-white/70 mb-4">
                    {t("integrations.api_description") || "API access for developers to integrate with your service"}
                  </p>
                  
                  {integrations.api?.connected ? (
                    <div>
                      <p className="text-green-300 mb-2">
                        ✓ API Key generated
                      </p>
                      {apiKeyValue && (
                        <div className="mb-3 p-2 bg-black/40 rounded">
                          <code className="text-green-300 text-sm break-all">{apiKeyValue}</code>
                        </div>
                      )}
                      <div className="flex gap-3">
                        <button
                          onClick={revokeApiKey}
                          className="bg-red-500/80 hover:bg-red-600 px-4 py-2 rounded-lg text-white text-sm"
                        >
                          {t("integrations.revoke") || "Revoke"}
                        </button>
                        {apiKeyValue && (
                          <button
                            onClick={() => navigator.clipboard.writeText(apiKeyValue)}
                            className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white text-sm"
                          >
                            {t("integrations.copy") || "Copy"}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={generateApiKey}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-2 rounded-lg font-bold text-white hover:scale-105 transition"
                    >
                      {t("integrations.generate_api_key") || "Generate API Key"}
                    </button>
                  )}
                </div>

                {integrationsLoading && (
                  <div className="text-center text-white/60 py-4">
                    {t("common.loading")}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "scripts" && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">📝 {t("profile.scripts_title")}</h2>
              {user?.subscription_plan !== "free" && (
                <button
                  onClick={() => setShowScriptModal(true)}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 rounded-lg font-bold text-white"
                >
                  + {t("scripts.add")}
                </button>
              )}
            </div>

            {user?.subscription_plan === "free" && (
              <div className="text-center py-8">
                <p className="text-white/80 mb-4">{t("scripts.upgrade_required")}</p>
                <button
                  onClick={() => navigate("/pricing")}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 rounded-lg font-bold text-white"
                >
                  {t("scripts.upgrade")}
                </button>
              </div>
            )}

            {scriptsLoading && <div className="text-white text-center py-8">{t("common.loading")}</div>}

            {!scriptsLoading && scripts.length === 0 && user?.subscription_plan !== "free" && (
              <div className="text-center py-8 text-white/60">
                <p>{t("scripts.no_scripts")}</p>
                <p className="text-sm mt-2">{t("scripts.add_first")}</p>
              </div>
            )}

            <div className="space-y-4">
              {scripts.map((script) => (
                <div key={script.id} className="bg-white/5 rounded-xl p-4">
                  {editingScript === script.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={script.name}
                        onChange={(e) => setScripts(scripts.map(s => s.id === script.id ? {...s, name: e.target.value} : s))}
                        className="w-full px-3 py-2 rounded-lg bg-white/20 text-white"
                        placeholder={t("scripts.name_placeholder")}
                      />
                      <textarea
                        value={script.template}
                        onChange={(e) => setScripts(scripts.map(s => s.id === script.id ? {...s, template: e.target.value} : s))}
                        className="w-full px-3 py-2 rounded-lg bg-white/20 text-white"
                        rows="3"
                        placeholder={t("scripts.template_placeholder")}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => updateScript(script.id, { name: script.name, template: script.template })} className="bg-green-500 px-4 py-1 rounded text-white">{t("common.save")}</button>
                        <button onClick={() => setEditingScript(null)} className="bg-gray-500 px-4 py-1 rounded text-white">{t("common.cancel")}</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-white">{script.name}</h3>
                          <span className="text-xs text-white/50">{script.category}</span>
                          {script.is_default && <span className="ml-2 text-xs bg-purple-500/50 px-2 py-0.5 rounded">{t("scripts.default")}</span>}
                        </div>
                        {!script.is_default && (
                          <div className="flex gap-2">
                            <button onClick={() => setEditingScript(script.id)} className="text-blue-400 hover:text-blue-300" title={t("common.edit")}>✏️</button>
                            <button onClick={() => deleteScript(script.id)} className="text-red-400 hover:text-red-300" title={t("common.delete")}>🗑️</button>
                          </div>
                        )}
                      </div>
                      <p className="text-white/70 mt-2 whitespace-pre-wrap">{script.template}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Модальное окно добавления скрипта */}
            {showScriptModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 rounded-2xl p-6 max-w-lg w-full mx-4">
                  <h3 className="text-xl font-bold text-white mb-4">{t("scripts.new_script")}</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder={t("scripts.name_placeholder")}
                      value={newScript.name}
                      onChange={(e) => setNewScript({...newScript, name: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg bg-purple-900/60 text-white placeholder-white/40 border border-white/30 focus:outline-none focus:border-pink-400"
                    />
                    <select
                      value={newScript.category}
                      onChange={(e) => setNewScript({...newScript, category: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg bg-purple-900/60 text-white border border-white/30 focus:outline-none focus:border-pink-400"
                    >
                      <option value="greeting" className="text-white bg-purple-900">{t("scripts.greeting")}</option>
                      <option value="objection" className="text-white bg-purple-900">{t("scripts.objection")}</option>
                      <option value="price_request" className="text-white bg-purple-900">{t("scripts.price_request")}</option>
                      <option value="closing" className="text-white bg-purple-900">{t("scripts.closing")}</option>
                      <option value="complaint" className="text-white bg-purple-900">{t("scripts.complaint")}</option>
                      <option value="custom" className="text-white bg-purple-900">{t("scripts.custom")}</option>
                    </select>
                    <textarea
                      placeholder={t("scripts.template_placeholder")}
                      value={newScript.template}
                      onChange={(e) => setNewScript({...newScript, template: e.target.value})}
                      className="w-full px-3 py-2 rounded-lg bg-purple-900/60 text-white placeholder-white/40 border border-white/30 focus:outline-none focus:border-pink-400"
                      rows="5"
                    />
                    <div className="flex gap-3 mt-4">
                      <button onClick={() => setShowScriptModal(false)} className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition">{t("common.cancel")}</button>
                      <button onClick={createScript} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 py-2 rounded-lg font-bold text-white hover:scale-105 transition">{t("common.create")}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "knowledge" && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">📚 {t("profile.tab_knowledge") || "Knowledge Base"}</h2>
              {user?.subscription_plan !== "free" && (
                <button
                  onClick={() => setShowKnowledgeModal(true)}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 rounded-lg font-bold text-white hover:scale-105 transition"
                >
                  + {t("common.add") || "Add"}
                </button>
              )}
            </div>

            {/* Загрузка файлов */}
            {user?.subscription_plan !== "free" && (
              <div className="mb-6 p-4 bg-white/5 rounded-xl">
                <label className="block text-white mb-2 text-sm font-semibold">
                  {t("knowledge.upload_file") || "Or upload a file:"}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".txt,.pdf,.docx,.xlsx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="file-upload"
                    className="inline-block px-4 py-2 bg-pink-500 hover:bg-pink-600 rounded-lg cursor-pointer transition text-white"
                  >
                    {t("knowledge.choose_file") || "Choose file"}
                  </label>
                  <span className="ml-3 text-white/60 text-sm" id="file-name">
                    {t("knowledge.no_file_chosen") || "No file chosen"}
                  </span>
                </div>
                <p className="text-white/40 text-xs mt-2">
                  {t("knowledge.supported_formats") || "Supported: TXT, PDF, DOCX, XLSX"}
                </p>
              </div>
            )}

            {user?.subscription_plan === "free" && (
              <div className="text-center py-8">
                <p className="text-white/80 mb-4">Knowledge base is available on Professional and Business plans</p>
                <button
                  onClick={() => navigate("/pricing")}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 rounded-lg font-bold text-white"
                >
                  {t("scripts.upgrade")}
                </button>
              </div>
            )}

            {knowledgeLoading && <div className="text-white text-center py-8">{t("common.loading")}</div>}

            {!knowledgeLoading && knowledgeItems.length === 0 && user?.subscription_plan !== "free" && (
              <div className="text-center py-8 text-white/60">
                <p>No knowledge base items yet</p>
                <p className="text-sm mt-2">Add price lists, delivery terms, or scripts to help AI answer more accurately</p>
              </div>
            )}

            <div className="space-y-4">
              {knowledgeItems.map((item) => (
                <div key={item.id} className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white">{item.name}</h3>
                      <span className="text-xs text-white/50">
                        {item.file_type} • {new Date(item.created_at).toLocaleDateString()}
                      </span>
                      <p className="text-white/70 mt-2 whitespace-pre-wrap">{item.content}</p>
                    </div>
                    <button
                      onClick={() => deleteKnowledge(item.id)}
                      className="text-red-400 hover:text-red-300 ml-4 p-2"
                      title={t("common.delete") || "Delete"}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Модальное окно добавления в базу знаний */}
            {showKnowledgeModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 rounded-2xl p-6 max-w-lg w-full mx-4">
                  <h3 className="text-xl font-bold text-white mb-4">{t("knowledge.add_title") || "Add to Knowledge Base"}</h3>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder={t("knowledge.name_placeholder") || "Name (e.g., 'Price List')"}
                      value={newKnowledge.name}
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-purple-900/60 text-white placeholder-white/40 border border-white/30 focus:outline-none focus:border-pink-400"
                    />
                    <textarea
                      placeholder={t("knowledge.content_placeholder") || "Content (prices, delivery terms, scripts...)"}
                      value={newKnowledge.content}
                      onChange={(e) => setNewKnowledge({ ...newKnowledge, content: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-purple-900/60 text-white placeholder-white/40 border border-white/30 focus:outline-none focus:border-pink-400"
                      rows="6"
                    />
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => {
                          setShowKnowledgeModal(false);
                          setNewKnowledge({ name: "", content: "", file_type: "text" });
                        }}
                        className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition"
                      >
                        {t("common.cancel") || "Cancel"}
                      </button>
                      <button
                        onClick={createKnowledge}
                        className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 py-2 rounded-lg font-bold text-white hover:scale-105 transition"
                      >
                        {t("common.add") || "Add"}
                      </button>
                    </div>
                    <p className="text-white/40 text-xs text-center">
                      {t("knowledge.min_length") || "Content must be at least 10 characters"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== BATCH PROCESSING TAB ===== */}
        {activeTab === "batch" && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">📊 Массовая обработка Excel/CSV</h2>
            
            {user?.subscription_plan === "free" ? (
              <div className="text-center py-8">
                <p className="text-white/80 mb-4">Функция массовой обработки доступна на тарифах Starter и выше</p>
                <button
                  onClick={() => navigate("/pricing")}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 rounded-lg font-bold text-white hover:scale-105 transition"
                >
                  Upgrade
                </button>
              </div>
            ) : (
              <>
                <p className="text-white/70 mb-4">
                  Загрузите файл Excel или CSV. Первая колонка будет использована как вопросы.
                  AI сгенерирует ответы для каждой строки.
                </p>
                
                <label className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg cursor-pointer inline-block">
                  📂 Выбрать файл
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleBatchUpload}
                    className="hidden"
                    disabled={batchProcessing}
                  />
                </label>
                
                {batchStatus && (
                  <div className="mt-4 text-white">
                    {batchStatus}
                    {batchStatus === "Completed! Click download." && (
                      <button onClick={downloadBatchResult} className="ml-3 bg-green-600 px-4 py-2 rounded">
                        ⬇️ Скачать результат
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>

      <footer className="relative z-10 text-center py-8 text-white/60">
        <div className="flex justify-center gap-6 mb-4">
          <Link to="/privacy" className="hover:text-pink-300 transition">{t("legal.privacy_link")}</Link>
          <Link to="/terms" className="hover:text-pink-300 transition">{t("legal.terms_link")}</Link>
          <Link to="/guide" className="hover:text-pink-300 transition">{t("footer.guide")}</Link>
          <Link to="/api-docs" className="hover:text-pink-300 transition">API Docs</Link>
        </div>
        <p>{t("footer.email")}</p>
        <p className="mt-3">{t("footer.copyright")}</p>
      </footer>
    </div>
  );
}
