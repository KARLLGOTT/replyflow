import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../hooks/useAuth";
import Tooltip from "../components/Tooltip";
import LanguageSwitcher from "../components/LanguageSwitcher";

export default function Admin() {
  const { t } = useTranslation();
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendUserId, setExtendUserId] = useState(null);
  const [extendDays, setExtendDays] = useState(30);
  const [allScripts, setAllScripts] = useState([]);
  const [scriptsLoading, setScriptsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("users");
  
  // Аналитика
  const [analytics, setAnalytics] = useState({ items: [], total: 0 });
  const [analyticsStats, setAnalyticsStats] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  
  // Редактирование скриптов
  const [editingScript, setEditingScript] = useState(null);
  const [editScriptData, setEditScriptData] = useState({ name: "", template: "", category: "" });

  useEffect(() => {
    if (!user?.is_admin) {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    const token = localStorage.getItem("accessToken");
    
    try {
      const usersRes = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (usersRes.ok) setUsers(await usersRes.json());
      
      const statsRes = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) setStats(await statsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const [analyticsRes, statsRes] = await Promise.all([
        fetch("/api/admin/analytics?limit=200", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/admin/analytics/stats", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setAnalyticsStats(data);
      }
    } catch (err) {
      console.error("Failed to load analytics:", err);
    }
    setAnalyticsLoading(false);
  };

  const updateUser = async (userId, data) => {
    const token = localStorage.getItem("accessToken");
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    if (res.ok) {
      setMessage("User updated");
      fetchData();
      setEditingUser(null);
      if (user && user.id === userId) {
        await refreshUser();
      }
    } else {
      const error = await res.json();
      setMessage("Error: " + (error.detail || "Unknown error"));
    }
    setTimeout(() => setMessage(""), 3000);
  };

  // ===== ПОДПИСКИ =====
  const extendSubscription = async (userId, days) => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`/api/admin/extend-subscription/${userId}?days=${days}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`Subscription extended by ${days} days to ${new Date(data.new_end_date).toLocaleDateString()}`);
        fetchData();
      } else {
        const error = await res.json();
        setMessage("Error: " + (error.detail || "Failed to extend subscription"));
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setTimeout(() => setMessage(""), 3000);
    setShowExtendModal(false);
  };

  const resetUserLimits = async (userId) => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`/api/admin/reset-user-limits/${userId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMessage("User limits reset successfully");
        fetchData();
      } else {
        const error = await res.json();
        setMessage("Error: " + (error.detail || "Failed to reset limits"));
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const getSubscriptionInfo = async (userId) => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`/api/admin/subscription-info/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedUser(data);
        setShowSubscriptionModal(true);
      } else {
        const error = await res.json();
        setMessage("Error: " + (error.detail || "Failed to get subscription info"));
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setTimeout(() => setMessage(""), 3000);
  };

  const openExtendModal = (userId) => {
    setExtendUserId(userId);
    setExtendDays(30);
    setShowExtendModal(true);
  };

  const activateSubscription = async (userId, plan) => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`/api/admin/activate-subscription/${userId}?plan=${plan}&days=30`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessage(`Subscription activated: ${plan} until ${new Date(data.end_date).toLocaleDateString()}`);
        fetchData();
      } else {
        const error = await res.json();
        setMessage("Error: " + (error.detail || "Failed to activate subscription"));
      }
    } catch (err) {
      setMessage("Error: " + err.message);
    }
    setTimeout(() => setMessage(""), 3000);
  };

  // ===== СКРИПТЫ =====
  const loadAllScripts = async () => {
    setScriptsLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch("/api/admin/scripts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllScripts(data);
      }
    } catch (err) {
      console.error(err);
    }
    setScriptsLoading(false);
  };

  const toggleScript = async (scriptId) => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`/api/admin/scripts/${scriptId}/toggle`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadAllScripts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const deleteScript = async (scriptId) => {
    if (!window.confirm("Удалить этот скрипт?")) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`/api/admin/scripts/${scriptId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadAllScripts();
        setMessage("Script deleted");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateScript = async (scriptId) => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`/api/admin/scripts/${scriptId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editScriptData)
      });
      if (res.ok) {
        loadAllScripts();
        setEditingScript(null);
        setMessage("Script updated");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getPlanColor = (plan) => {
    switch(plan) {
      case 'free': return 'text-green-400';
      case 'starter': return 'text-blue-400';
      case 'professional': return 'text-purple-400';
      case 'business': return 'text-yellow-400';
      default: return 'text-white';
    }
  };

  if (loading) return <div className="text-center py-10 text-white">{t("common.loading")}</div>;
  
  if (!user?.is_admin) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600">
      <header className="flex justify-between items-center px-10 py-6 bg-white/10">
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <div className="flex gap-3">
          <LanguageSwitcher />
          <Tooltip text={t("tooltips.admin_dashboard")}>
            <button 
              onClick={() => navigate("/dashboard")} 
              className="bg-white/20 hover:bg-white/30 hover:scale-105 transition-all duration-300 text-white px-4 py-2 rounded-lg"
            >
              Dashboard
            </button>
          </Tooltip>
          <Tooltip text={t("tooltips.logout")}>
            <button 
              onClick={logout} 
              className="bg-red-500 hover:bg-red-600 hover:scale-105 transition-all duration-300 text-white px-4 py-2 rounded-lg"
            >
              Logout
            </button>
          </Tooltip>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto p-6">
        {message && (
          <div className="bg-green-500/20 border border-green-500 text-green-300 p-3 rounded mb-4 slide-in">
            {message}
          </div>
        )}

        {/* Вкладки */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-2 rounded-xl font-bold transition-all duration-300 ${
              activeTab === "users"
                ? "bg-white text-purple-600 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            👥 Пользователи
          </button>
          <button
            onClick={() => {
              setActiveTab("scripts");
              loadAllScripts();
            }}
            className={`px-6 py-2 rounded-xl font-bold transition-all duration-300 ${
              activeTab === "scripts"
                ? "bg-white text-purple-600 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            📝 Скрипты
          </button>
          <button
            onClick={() => {
              setActiveTab("analytics");
              loadAnalytics();
            }}
            className={`px-6 py-2 rounded-xl font-bold transition-all duration-300 ${
              activeTab === "analytics"
                ? "bg-white text-purple-600 shadow-lg"
                : "bg-white/20 text-white hover:bg-white/30"
            }`}
          >
            📊 Аналитика
          </button>
        </div>

        {/* Модальное окно с информацией о подписке */}
        {showSubscriptionModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 rounded-2xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-4">Subscription Info</h2>
              <div className="space-y-3 text-white">
                <p><strong>User:</strong> {selectedUser.email}</p>
                <p><strong>Plan:</strong> <span className={getPlanColor(selectedUser.subscription_plan)}>{selectedUser.subscription_plan}</span></p>
                <p><strong>Status:</strong> {selectedUser.is_active_subscription ? '✅ Active' : '❌ Expired'}</p>
                <p><strong>Days left:</strong> {selectedUser.days_left !== null ? (selectedUser.days_left > 0 ? selectedUser.days_left : 'Expired') : 'No limit'}</p>
                <p><strong>End date:</strong> {selectedUser.subscription_end_date ? new Date(selectedUser.subscription_end_date).toLocaleDateString() : 'No end date'}</p>
                <p><strong>Auto renew:</strong> {selectedUser.subscription_auto_renew ? 'Yes' : 'No'}</p>
                <p><strong>Generations today:</strong> {selectedUser.generations_today} / {selectedUser.generations_limit || '∞'}</p>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSubscriptionModal(false)}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    openExtendModal(selectedUser.user_id);
                    setShowSubscriptionModal(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-bold hover:scale-105 transition"
                >
                  Extend
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно для выбора количества дней */}
        {showExtendModal && extendUserId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 rounded-2xl p-8 max-w-sm w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-4">Extend Subscription</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-white mb-2">Number of days</label>
                  <input
                    type="number"
                    value={extendDays}
                    onChange={(e) => setExtendDays(parseInt(e.target.value) || 0)}
                    min="1"
                    max="365"
                    className="w-full px-4 py-2 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:border-pink-400"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowExtendModal(false);
                      setExtendUserId(null);
                    }}
                    className="flex-1 bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      extendSubscription(extendUserId, extendDays);
                    }}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-2 rounded-lg font-bold hover:scale-105 transition"
                  >
                    Extend {extendDays} days
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно редактирования скрипта */}
        {editingScript && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 rounded-2xl p-6 max-w-lg w-full mx-4">
              <h3 className="text-xl font-bold text-white mb-4">Редактировать скрипт</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={editScriptData.name}
                  onChange={(e) => setEditScriptData({...editScriptData, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white"
                  placeholder="Название"
                />
                <select
                  value={editScriptData.category}
                  onChange={(e) => setEditScriptData({...editScriptData, category: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white"
                >
                  <option value="greeting">Привітання</option>
                  <option value="objection">Заперечення</option>
                  <option value="price_request">Запит ціни</option>
                  <option value="closing">Завершення</option>
                  <option value="complaint">Скарга</option>
                  <option value="custom">Своє</option>
                </select>
                <textarea
                  value={editScriptData.template}
                  onChange={(e) => setEditScriptData({...editScriptData, template: e.target.value})}
                  className="w-full px-3 py-2 rounded-lg bg-white/20 text-white"
                  rows="4"
                  placeholder="Текст скрипта"
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setEditingScript(null)} className="flex-1 bg-white/20 py-2 rounded-lg">Отмена</button>
                  <button onClick={() => updateScript(editingScript)} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 py-2 rounded-lg font-bold">Сохранить</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Статистика */}
        {stats && activeTab === "users" && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 text-center hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="text-3xl font-bold text-white">{stats.total_users}</div>
              <div className="text-white/80">Total Users</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 text-center hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="text-3xl font-bold text-white">{stats.active_users}</div>
              <div className="text-white/80">Active Users</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 text-center hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="text-3xl font-bold text-white">{stats.total_generations}</div>
              <div className="text-white/80">Total Generations</div>
            </div>
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 text-center hover:scale-105 transition-all duration-300 hover:shadow-2xl">
              <div className="text-3xl font-bold text-white">{stats.expired_subscriptions || 0}</div>
              <div className="text-white/80">Expired Subscriptions</div>
            </div>
          </div>
        )}
        
        {/* Таблица пользователей */}
        {activeTab === "users" && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead className="bg-white/20">
                  <tr>
                    <th className="p-4 text-left">ID</th>
                    <th className="p-4 text-left">Email</th>
                    <th className="p-4 text-left">Username</th>
                    <th className="p-4 text-left">Plan</th>
                    <th className="p-4 text-left">End Date</th>
                    <th className="p-4 text-left">Days Left</th>
                    <th className="p-4 text-left">Active</th>
                    <th className="p-4 text-left">Generations</th>
                    <th className="p-4 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const daysLeft = u.subscription_end_date ? Math.ceil((new Date(u.subscription_end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
                    return (
                      <tr key={u.id} className="border-t border-white/10 hover:bg-white/5 transition-all duration-200">
                        <td className="p-4">{u.id}</td>
                        <td className="p-4">{u.email}</td>
                        <td className="p-4">{u.username}</td>
                        <td className="p-4">
                          {editingUser === u.id ? (
                            <select
                              value={u.subscription_plan}
                              onChange={(e) => updateUser(u.id, { subscription_plan: e.target.value })}
                              className="bg-black/50 text-white rounded px-2 py-1 focus:ring-2 focus:ring-pink-400"
                            >
                              <option value="free">Free</option>
                              <option value="starter">Starter</option>
                              <option value="professional">Professional</option>
                              <option value="business">Business</option>
                            </select>
                          ) : (
                            <span className={`capitalize ${getPlanColor(u.subscription_plan)}`}>{u.subscription_plan}</span>
                          )}
                        </td>
                        <td className="p-4">
                          {u.subscription_end_date ? new Date(u.subscription_end_date).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-4">
                          {daysLeft !== null ? (daysLeft > 0 ? `${daysLeft} days` : 'Expired') : '-'}
                        </td>
                        <td className="p-4">
                          <Tooltip text={u.is_active ? t("tooltips.active_user") : t("tooltips.blocked_user")}>
                            <span className="cursor-help">{u.is_active ? "✅" : "❌"}</span>
                          </Tooltip>
                        </td>
                        <td className="p-4">{u.total_generations || 0} / {u.generations_today || 0} today</td>
                        <td className="p-4">
                          <div className="flex gap-2 flex-wrap">
                            <Tooltip text="View Subscription">
                              <button onClick={() => getSubscriptionInfo(u.id)} className="text-blue-400 hover:text-blue-300 hover:scale-110 transition">
                                📅 Info
                              </button>
                            </Tooltip>
                            <Tooltip text="Reset Daily Limits">
                              <button onClick={() => resetUserLimits(u.id)} className="text-orange-400 hover:text-orange-300 hover:scale-110 transition">
                                🔄 Reset
                              </button>
                            </Tooltip>
                            <Tooltip text="Extend Subscription">
                              <button onClick={() => openExtendModal(u.id)} className="text-green-400 hover:text-green-300 hover:scale-110 transition">
                                📅 Extend
                              </button>
                            </Tooltip>
                            <Tooltip text="Activate Subscription (30 days)">
                              <button onClick={() => activateSubscription(u.id, 'starter')} className="text-green-400 hover:text-green-300 hover:scale-110 transition">
                                🎯 Activate
                              </button>
                            </Tooltip>
                            {editingUser === u.id ? (
                              <Tooltip text="Save">
                                <button onClick={() => setEditingUser(null)} className="text-green-400 hover:text-green-300">💾</button>
                              </Tooltip>
                            ) : (
                              <Tooltip text="Edit Plan">
                                <button onClick={() => setEditingUser(u.id)} className="text-blue-400 hover:text-blue-300">✏️</button>
                              </Tooltip>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Таблица скриптов */}
        {activeTab === "scripts" && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">📝 Все скрипты продаж</h2>
            {scriptsLoading ? (
              <div className="text-white text-center py-8">Загрузка...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead className="bg-white/20">
                    <tr>
                      <th className="p-3 text-left">ID</th>
                      <th className="p-3 text-left">Пользователь</th>
                      <th className="p-3 text-left">Название</th>
                      <th className="p-3 text-left">Категория</th>
                      <th className="p-3 text-left">Шаблон</th>
                      <th className="p-3 text-left">Активен</th>
                      <th className="p-3 text-left">Стандартный</th>
                      <th className="p-3 text-left">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allScripts.map((script) => (
                      <tr key={script.id} className="border-t border-white/10 hover:bg-white/5">
                        <td className="p-3">{script.id}</td>
                        <td className="p-3">{script.user_email || script.user_id}</td>
                        <td className="p-3">{script.name}</td>
                        <td className="p-3">{script.category}</td>
                        <td className="p-3 max-w-md truncate" title={script.template}>
                          {script.template}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => toggleScript(script.id)}
                            className={`px-2 py-1 rounded text-sm ${script.is_active ? "bg-green-500/50 text-green-300" : "bg-red-500/50 text-red-300"}`}
                          >
                            {script.is_active ? "✅ Активен" : "❌ Отключен"}
                          </button>
                        </td>
                        <td className="p-3">{script.is_default ? "⭐ Да" : "📝 Нет"}</td>
                        <td className="p-3">
                          {!script.is_default && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingScript(script.id);
                                  setEditScriptData({
                                    name: script.name,
                                    template: script.template,
                                    category: script.category
                                  });
                                }}
                                className="text-blue-400 hover:text-blue-300 mr-2"
                                title="Редактировать"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => deleteScript(script.id)}
                                className="text-red-400 hover:text-red-300"
                                title="Удалить"
                              >
                                🗑️
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Аналитика */}
        {activeTab === "analytics" && (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">📊 Аналитика</h2>
            
            {analyticsLoading && <div className="text-white text-center py-8">Загрузка...</div>}
            
            {!analyticsLoading && analyticsStats && (
              <>
                {/* Карточки со статистикой */}
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-white">{analyticsStats.total_requests}</div>
                    <div className="text-white/70 text-sm">Всего запросов</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-white">{analyticsStats.avg_response_time_ms || 0} ms</div>
                    <div className="text-white/70 text-sm">Среднее время ответа</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-white">{analyticsStats.avg_tokens || 0}</div>
                    <div className="text-white/70 text-sm">Среднее токенов</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-white">{analyticsStats.unique_users || 0}</div>
                    <div className="text-white/70 text-sm">Уникальных пользователей</div>
                  </div>
                </div>
                
                {/* График по часам */}
                {analyticsStats.last_24h && analyticsStats.last_24h.length > 0 && (
                  <div className="bg-white/10 rounded-xl p-4 mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">📈 Последние 24 часа</h3>
                    <div className="flex items-end gap-1 h-32 overflow-x-auto">
                      {analyticsStats.last_24h.slice(0, 24).map((hour, idx) => {
                        const maxCount = Math.max(...analyticsStats.last_24h.map(h => h.count), 1);
                        const height = (hour.count / maxCount) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center min-w-[40px]">
                            <div 
                              className="w-full bg-gradient-to-t from-pink-500 to-purple-500 rounded-t"
                              style={{ height: `${Math.max(height, 4)}%`, minHeight: "4px" }}
                            ></div>
                            <span className="text-white/50 text-xs mt-1 transform -rotate-45 origin-left">
                              {hour.hour?.slice(11, 16)}
                            </span>
                            <span className="text-white/50 text-[10px]">{hour.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Распределение по тарифам */}
                {analyticsStats.by_plan && analyticsStats.by_plan.length > 0 && (
                  <div className="bg-white/10 rounded-xl p-4 mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">📊 По тарифам</h3>
                    <div className="space-y-2">
                      {analyticsStats.by_plan.map((plan) => (
                        <div key={plan.plan} className="flex items-center gap-2">
                          <span className="text-white/80 w-24">{plan.plan || "unknown"}</span>
                          <div className="flex-1 bg-white/20 rounded-full h-6 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full flex items-center justify-end pr-2 text-xs text-white font-bold"
                              style={{ width: `${Math.min((plan.count / analyticsStats.total_requests) * 100, 100)}%` }}
                            >
                              {plan.count}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
            
            {/* Таблица последних генераций */}
            <div className="bg-white/10 rounded-xl p-4">
              <h3 className="text-xl font-bold text-white mb-4">📋 Последние генерации</h3>
              {analyticsLoading ? (
                <div className="text-white text-center py-4">Загрузка...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-white/80 text-sm">
                    <thead className="bg-white/10">
                      <tr>
                        <th className="p-2 text-left">Пользователь</th>
                        <th className="p-2 text-left">Тариф</th>
                        <th className="p-2 text-left">Модель</th>
                        <th className="p-2 text-left">Время (ms)</th>
                        <th className="p-2 text-left">Вопрос</th>
                        <th className="p-2 text-left">Ответ</th>
                        <th className="p-2 text-left">Дата</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.items?.slice(0, 50).map((item) => (
                        <tr key={item.id} className="border-t border-white/10">
                          <td className="p-2">{item.user_email}</td>
                          <td className="p-2">{item.subscription_plan}</td>
                          <td className="p-2">{item.model_used}</td>
                          <td className="p-2">{item.response_time_ms}</td>
                          <td className="p-2 max-w-xs truncate" title={item.question}>{item.question?.slice(0, 50)}</td>
                          <td className="p-2 max-w-xs truncate" title={item.answer}>{item.answer?.slice(0, 50)}</td>
                          <td className="p-2">{new Date(item.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}