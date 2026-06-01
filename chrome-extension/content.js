// content.js - injected into page
console.log("ReplyFlow AI content script loaded");

https://replyflow-bot.onrender.com/generate;

let selectionTimeout = null;
let floatingButton = null;

// Слушаем выделение текста
document.addEventListener("mouseup", () => {
  if (selectionTimeout) clearTimeout(selectionTimeout);
  
  selectionTimeout = setTimeout(() => {
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText && selectedText.length > 5) {
      showFloatingButton(selectedText);
    } else {
      hideFloatingButton();
    }
  }, 100);
});

// Показать плавающую кнопку рядом с выделением
function showFloatingButton(text) {
  hideFloatingButton();
  
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  floatingButton = document.createElement("div");
  floatingButton.id = "replyflow-float-btn";
  floatingButton.innerHTML = "🤖 ReplyFlow AI";
  floatingButton.style.cssText = `
    position: fixed;
    top: ${rect.top - 40}px;
    left: ${rect.left}px;
    background: linear-gradient(135deg, #7c3aed, #ec4899);
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    cursor: pointer;
    z-index: 10000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    transition: transform 0.2s;
  `;
  
  floatingButton.onmouseenter = () => {
    floatingButton.style.transform = "scale(1.05)";
  };
  floatingButton.onmouseleave = () => {
    floatingButton.style.transform = "scale(1)";
  };
  
  floatingButton.onclick = () => {
    hideFloatingButton();
    showFloatingPopup(text);
  };
  
  document.body.appendChild(floatingButton);
}

function hideFloatingButton() {
  if (floatingButton) {
    floatingButton.remove();
    floatingButton = null;
  }
}

// Listen for messages from background script (context menu)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "generateFromSelection") {
    showFloatingPopup(request.text);
  }
  return true;
});

// Create floating popup with responses
function showFloatingPopup(question) {
  // Remove existing popup if any
  const existing = document.getElementById("replyflow-popup");
  if (existing) existing.remove();
  
  const popup = document.createElement("div");
  popup.id = "replyflow-popup";
  popup.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #7c3aed, #ec4899);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 10001;
      max-width: 450px;
      width: 90%;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    ">
      <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
        <strong style="font-size: 16px;">🤖 ReplyFlow AI</strong>
        <button id="close-popup" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">✕</button>
      </div>
      <div style="background: rgba(255,255,255,0.1); border-radius: 8px; padding: 10px; margin-bottom: 12px; font-size: 13px;">
        <strong>Вопрос:</strong><br/>
        ${escapeHtml(question)}
      </div>
      <div id="popup-responses" style="margin-top: 12px;">
        <div style="text-align: center;">Генерация...</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Close button
  document.getElementById("close-popup").addEventListener("click", () => {
    popup.remove();
  });
  
  // Get API key and generate
  chrome.storage.local.get(["replyflow_api_key"], async (result) => {
    const apiKey = result.replyflow_api_key;
    console.log("[DEBUG] API Key from storage:", apiKey ? "Present (length: " + apiKey.length + ")" : "MISSING");
    
    if (!apiKey) {
      document.getElementById("popup-responses").innerHTML = '<div style="color: #ffaaaa;">❌ API ключ не настроен. Нажми на иконку расширения, чтобы добавить ключ.</div>';
      return;
    }
    
    console.log("[DEBUG] Sending request to:", API_URL + "/generate");
    
    try {
      const response = await fetch(`${API_URL}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          text: question,
          session_id: "extension_" + Date.now()
        })
      });
      
      console.log("[DEBUG] Response status:", response.status);
      
      if (response.status === 401) {
        document.getElementById("popup-responses").innerHTML = '<div style="color: #ffaaaa;">❌ Неверный API ключ. Обнови его в настройках расширения.</div>';
        return;
      }
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const data = await response.json();
      console.log("[DEBUG] Response data:", data);
      
      const best = data.best_response || "";
      const others = data.other_responses || [];
      const allResponses = [best, ...others].filter(r => r);
      
      let html = '<div style="margin-top: 8px;"><strong>Варианты ответов:</strong></div>';
      const optionNames = ["💬 Мягкий", "💰 Продающий", "⚡ Короткий"];
      
      allResponses.forEach((resp, idx) => {
        html += `
          <div style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 10px; margin-top: 8px; position: relative;">
            <button class="popup-copy-btn" data-text="${escapeHtml(resp)}" style="position: absolute; top: 5px; right: 5px; background: rgba(255,255,255,0.3); border: none; border-radius: 4px; padding: 2px 8px; color: white; cursor: pointer;">Копировать</button>
            <strong>${optionNames[idx] || `Вариант ${idx+1}`}</strong>
            <p style="font-size: 13px; margin-top: 8px;">${escapeHtml(resp)}</p>
          </div>
        `;
      });
      
      document.getElementById("popup-responses").innerHTML = html;
      
      // Add copy handlers
      document.querySelectorAll(".popup-copy-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const text = btn.getAttribute("data-text");
          navigator.clipboard.writeText(text);
          btn.textContent = "Скопировано!";
          setTimeout(() => { btn.textContent = "Копировать"; }, 1500);
        });
      });
      
    } catch (error) {
      console.error("[DEBUG] Fetch error:", error);
      document.getElementById("popup-responses").innerHTML = `<div style="color: #ffaaaa;">❌ Ошибка: ${error.message}</div>`;
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Обработка команды "получить выделенный текст" (для горячих клавиш)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText && selectedText.length > 5) {
      // Отправляем текст обратно в background
      chrome.runtime.sendMessage({
        action: "getSelectedTextResponse",
        text: selectedText
      });
    }
    return true;
  }
  
  if (request.action === "showPopupForText") {
    showFloatingPopup(request.text);
    return true;
  }
  
  if (request.action === "generateFromSelection") {
    showFloatingPopup(request.text);
    return true;
  }
  
  return true;
});
