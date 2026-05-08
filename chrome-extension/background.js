// background.js - service worker
const API_URL = "http://127.0.0.1:8000";

// При установке расширения
chrome.runtime.onInstalled.addListener(() => {
  console.log("ReplyFlow AI Extension installed");
  
  // Очищаем старые меню
  chrome.contextMenus.removeAll(() => {
    // Создаем контекстное меню
    chrome.contextMenus.create({
      id: "generateReply",
      title: "🤖 Generate reply with ReplyFlow AI",
      contexts: ["selection"]
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Error creating menu:", chrome.runtime.lastError);
      } else {
        console.log("Context menu created successfully");
      }
    });
  });
});

// Обработка контекстного меню
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log("Context menu clicked:", info.menuItemId);
  
  if (info.menuItemId === "generateReply" && info.selectionText) {
    // Отправляем сообщение в content script
    chrome.tabs.sendMessage(tab.id, {
      action: "generateFromSelection",
      text: info.selectionText
    }).catch(err => {
      console.error("Failed to send message:", err);
      // Показываем бейдж с ошибкой
      chrome.action.setBadgeText({text: "!"});
      chrome.action.setBadgeBackgroundColor({color: "#FF0000"});
      setTimeout(() => chrome.action.setBadgeText({text: ""}), 3000);
    });
  }
});

// Обработка сообщений от popup и content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request.action);
  
  // Генерация ответа через API
  if (request.action === "generate") {
    fetch(`${API_URL}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${request.apiKey}`
      },
      body: JSON.stringify({
        text: request.question,
        session_id: request.sessionId || "extension_" + Date.now()
      })
    })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => sendResponse({ success: true, data: data }))
    .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Keep channel open for async response
  }
  
  // Проверка API ключа
  if (request.action === "checkApiKey") {
    fetch(`${API_URL}/api/users/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${request.apiKey}`
      }
    })
    .then(res => {
      sendResponse({ valid: res.status === 200 });
    })
    .catch(() => sendResponse({ valid: false }));
    
    return true;
  }
  
  // Получение выделенного текста (для горячих клавиш)
  if (request.action === "getSelectedTextResponse") {
    // Это ответ от content script с выделенным текстом
    if (request.text && request.text.length > 5) {
      // Отправляем в content script команду показать попап
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "showPopupForText",
        text: request.text
      }).catch(err => console.error("Failed to show popup:", err));
    }
  }
  
  return true;
});

// Обновляем бейдж при сохранении API ключа
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.replyflow_api_key) {
    if (changes.replyflow_api_key.newValue) {
      chrome.action.setBadgeText({text: "✓"});
      chrome.action.setBadgeBackgroundColor({color: "#00AA00"});
      setTimeout(() => chrome.action.setBadgeText({text: ""}), 3000);
    }
  }
});