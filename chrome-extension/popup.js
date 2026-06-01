// popup.js
const API_URL = "https://replyflow-bot.onrender.com";

let apiKey = "";

// Load saved API key
chrome.storage.local.get(["replyflow_api_key"], (result) => {
  if (result.replyflow_api_key) {
    apiKey = result.replyflow_api_key;
    document.getElementById("apiStatus").textContent = "✅ API Key configured";
    document.getElementById("apiStatus").className = "api-status success";
    document.getElementById("apiKey").value = "••••••••";
  } else {
    document.getElementById("apiStatus").textContent = "⚠️ Please enter your API key";
    document.getElementById("apiStatus").className = "api-status error";
  }
});

// Save API key
document.getElementById("saveKey").addEventListener("click", () => {
  const key = document.getElementById("apiKey").value;
  if (key && key.length > 10) {
    chrome.storage.local.set({ replyflow_api_key: key }, () => {
      apiKey = key;
      document.getElementById("apiStatus").textContent = "✅ API Key saved!";
      document.getElementById("apiStatus").className = "api-status success";
      document.getElementById("apiKey").value = "••••••••";
    });
  } else {
    alert("Please enter a valid API key");
  }
});

// Generate response
document.getElementById("generateBtn").addEventListener("click", async () => {
  const question = document.getElementById("question").value.trim();
  if (!question) {
    alert("Please enter a question");
    return;
  }
  
  if (!apiKey) {
    alert("Please configure your API key first");
    return;
  }
  
  const responsesDiv = document.getElementById("responses");
  responsesDiv.innerHTML = '<div class="status">Generating...</div>';
  
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
    
    if (response.status === 401) {
      responsesDiv.innerHTML = '<div class="status error">❌ Invalid API key. Please re-save it.</div>';
      chrome.storage.local.remove("replyflow_api_key");
      return;
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    const best = data.best_response || "";
    const others = data.other_responses || [];
    const allResponses = [best, ...others].filter(r => r);
    
    if (allResponses.length === 0) {
      responsesDiv.innerHTML = '<div class="status">❌ No response generated</div>';
      return;
    }
    
    let html = "";
    allResponses.forEach((resp, idx) => {
      const optionNames = ["💬 Soft", "💰 Selling", "⚡ Short"];
      html += `
        <div class="response-card">
          <strong>${optionNames[idx] || `Option ${idx+1}`}</strong>
          <button class="copy-btn" data-text="${escapeHtml(resp)}">Copy</button>
          <p style="margin-top: 8px; font-size: 13px;">${escapeHtml(resp)}</p>
        </div>
      `;
    });
    
    responsesDiv.innerHTML = html;
    
    // Add copy handlers
    document.querySelectorAll(".copy-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-text");
        navigator.clipboard.writeText(text);
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = "Copy"; }, 1500);
      });
    });
    
  } catch (error) {
    responsesDiv.innerHTML = `<div class="status error">❌ Error: ${error.message}</div>`;
  }
});

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
