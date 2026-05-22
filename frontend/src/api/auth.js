const API_URL = "https://replyflow-bot.onrender.com/api/users";

let isRefreshing = false;
let failedQueue = [];
let refreshInterval = null;

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ===== Универсальный fetch с автообновлением токена =====
async function fetchWithAuth(url, options = {}) {
  let token = localStorage.getItem("accessToken");
  
  const makeRequest = async (accessToken) => {
    const headers = {
      ...options.headers,
      "Authorization": `Bearer ${accessToken}`,
    };
    // Убираем Content-Type если он undefined
    if (!options.headers?.["Content-Type"] && options.body && typeof options.body === 'string') {
      headers["Content-Type"] = "application/json";
    }
    return fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  };
  
  let response = await makeRequest(token);
  
  if (response.status === 401) {
    try {
      const newToken = await authAPI.refreshToken();
      response = await makeRequest(newToken);
    } catch (refreshError) {
      localStorage.removeItem("accessToken");
      authAPI.stopTokenRefreshTimer();
      // Перенаправляем на логин
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please login again.");
    }
  }
  
  return response;
}

export const authAPI = {
  startTokenRefreshTimer: () => {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const res = await fetch(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
            credentials: "include",
          });
          if (res.status === 401) {
            console.log("[AUTH] Token expired, refreshing...");
            await authAPI.refreshToken();
          }
        } catch (e) {
          console.log("[AUTH] Token refresh check failed:", e);
        }
      }
    }, 10 * 60 * 1000); // каждые 10 минут
  },
  
  stopTokenRefreshTimer: () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  },

  register: async (email, username, password, fullName) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) throw new Error("Введите корректный email");

    const res = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password, full_name: fullName }),
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.detail || "Ошибка регистрации");
    }
    return res.json();
  },

  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.detail || "Ошибка входа");
    }

    const data = await res.json();
    localStorage.setItem("accessToken", data.access_token);
    authAPI.startTokenRefreshTimer();
    return data;
  },

  getCurrentUser: async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) throw new Error("Токен не найден");

    const res = await fetchWithAuth(`${API_URL}/me`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      throw new Error(error?.detail || "Не удалось получить пользователя");
    }

    return res.json();
  },

  refreshToken: async () => {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      });
    }

    isRefreshing = true;

    try {
      const res = await fetch(`${API_URL}/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Не удалось обновить токен");

      const data = await res.json();
      localStorage.setItem("accessToken", data.access_token);
      processQueue(null, data.access_token);
      return data.access_token;
    } catch (error) {
      processQueue(error, null);
      throw error;
    } finally {
      isRefreshing = false;
    }
  },

  logout: async () => {
    authAPI.stopTokenRefreshTimer();
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          credentials: "include",
        });
      } catch (err) {
        console.debug("Logout error (ignored):", err);
      }
    }
    localStorage.removeItem("accessToken");
  },
  
  // Экспортируем fetchWithAuth для использования в других API вызовах
  fetchWithAuth,
};

// ===== SCRIPTS API =====
export const scriptsAPI = {
  // Получить все скрипты
  getScripts: async () => {
    return authAPI.fetchWithAuth('/api/scripts/');
  },
  
  // Создать скрипт
  createScript: async (data) => {
    return authAPI.fetchWithAuth('/api/scripts/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },
  
  // Обновить скрипт
  updateScript: async (id, data) => {
    return authAPI.fetchWithAuth(`/api/scripts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  },
  
  // Удалить скрипт
  deleteScript: async (id) => {
    return authAPI.fetchWithAuth(`/api/scripts/${id}`, {
      method: 'DELETE'
    });
  }
};
