const statusBox = document.getElementById("status-box");
const logBox = document.getElementById("log-box");
const deviceInput = document.getElementById("device");
const roomInput = document.getElementById("room");
const actionInput = document.getElementById("action");
const voiceText = document.getElementById("voice-text");
const micBtn = document.getElementById("mic-btn");
const micStatus = document.getElementById("mic-status");
const manualBtn = document.getElementById("manual-btn");
const aiBtn = document.getElementById("ai-btn");
const refreshBtn = document.getElementById("refresh-btn");
const temperatureValue = document.getElementById("temperature-value");
const humidityValue = document.getElementById("humidity-value");
const sensorTime = document.getElementById("sensor-time");
const tabButtons = Array.from(document.querySelectorAll(".tab-btn"));
const tabPanels = {
  dashboard: document.getElementById("tab-dashboard"),
  ai: document.getElementById("tab-ai")
};
const quickButtons = Array.from(document.querySelectorAll(".quick-btn"));
const historyList = document.getElementById("history-list");
const chatLog = document.getElementById("chat-log");
const newChatBtn = document.getElementById("new-chat-btn");
const languageSwitch = document.getElementById("language-switch");
const languageButtons = Array.from(document.querySelectorAll(".lang-btn"));

const storageKey = "smarthome_ai_history_v1";
const languageKey = "smarthome_voice_lang_v1";

const copyMap = {
  "vi-VN": {
    micAriaIdle: "Nút chép chính tả",
    micAriaListening: "Dung ghi am",
    micTitleIdle: "Bat dau ghi am",
    micTitleListening: "Dung ghi am",
    micUnsupported: "Mic: trinh duyet khong ho tro Web Speech API",
    micListening: "Mic: dang nghe",
    micReceived: "Mic: da nhan",
    micYouSaid: "Mic: ban vua noi",
    micNoInput: "Mic: khong nhan duoc noi dung",
    micNoPermission: "Mic loi: chua cap quyen microphone",
    micNoSpeech: "Mic loi: khong phat hien giong noi",
    micAborted: "Mic: da dung ghi am",
    micStartFailed: "Mic loi: khong the bat ghi am",
    micUnknownError: "Mic loi:",
    placeholder: "Nhap lenh AI...",
    languageChanged: "Ngon ngu mic: Tieng Viet"
  },
  "en-US": {
    micAriaIdle: "Dictation button",
    micAriaListening: "Stop recording",
    micTitleIdle: "Start recording",
    micTitleListening: "Stop recording",
    micUnsupported: "Mic: browser does not support Web Speech API",
    micListening: "Mic: listening",
    micReceived: "Mic: captured",
    micYouSaid: "Mic: you said",
    micNoInput: "Mic: no speech captured",
    micNoPermission: "Mic error: microphone permission is not granted",
    micNoSpeech: "Mic error: no speech detected",
    micAborted: "Mic: recording stopped",
    micStartFailed: "Mic error: cannot start recording",
    micUnknownError: "Mic error:",
    placeholder: "Type your AI command...",
    languageChanged: "Mic language: English"
  }
};

const state = {
  conversations: [],
  activeConversationId: null,
  selectedLanguage: "vi-VN"
};

let recognition = null;
let listening = false;
let speechBuffer = "";

function setMicButtonState(isListening) {
  micBtn.classList.toggle("is-listening", isListening);
  micBtn.dataset.state = isListening ? "listening" : "idle";
  const copy = getCopy();
  micBtn.setAttribute("aria-label", isListening ? copy.micAriaListening : copy.micAriaIdle);
  micBtn.title = isListening ? copy.micTitleListening : copy.micTitleIdle;
}

function getCopy() {
  return copyMap[state.selectedLanguage] || copyMap["vi-VN"];
}

function applyLanguageUI() {
  const copy = getCopy();
  voiceText.placeholder = copy.placeholder;
  languageButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === state.selectedLanguage);
  });
  if (!listening) {
    micStatus.textContent = copy.languageChanged;
  }
  setMicButtonState(listening);
}

function setLanguage(language) {
  const normalized = language === "en-US" ? "en-US" : "vi-VN";
  state.selectedLanguage = normalized;
  localStorage.setItem(languageKey, normalized);
  if (recognition) {
    recognition.lang = normalized;
  }
  if (listening && recognition) {
    recognition.stop();
  }
  applyLanguageUI();
}

function loadLanguagePreference() {
  const saved = localStorage.getItem(languageKey);
  state.selectedLanguage = saved === "en-US" ? "en-US" : "vi-VN";
}

function uid(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

function formatTime(value) {
  return new Date(value).toLocaleString("vi-VN");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pushLog(label, payload) {
  const line = `[${new Date().toLocaleTimeString()}] ${label}\n${JSON.stringify(payload, null, 2)}\n`;
  logBox.textContent = `${line}\n${logBox.textContent}`;
}

function saveConversations() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      conversations: state.conversations,
      activeConversationId: state.activeConversationId
    })
  );
}

function loadConversations() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    createConversation();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.conversations = Array.isArray(parsed.conversations) ? parsed.conversations : [];
    state.activeConversationId = parsed.activeConversationId || null;
    if (!state.conversations.length) {
      createConversation();
      return;
    }
    if (!state.activeConversationId || !findConversation(state.activeConversationId)) {
      state.activeConversationId = state.conversations[0].id;
    }
  } catch (_error) {
    state.conversations = [];
    state.activeConversationId = null;
    createConversation();
  }
}

function findConversation(id) {
  return state.conversations.find((item) => item.id === id);
}

function createConversation() {
  const now = new Date().toISOString();
  const conversation = {
    id: uid("chat"),
    title: "Hoi thoai moi",
    isTitleManual: false,
    createdAt: now,
    updatedAt: now,
    items: []
  };
  state.conversations.unshift(conversation);
  state.activeConversationId = conversation.id;
  saveConversations();
  renderHistory();
  renderChat();
}

function setActiveConversation(id) {
  if (!findConversation(id)) {
    return;
  }
  state.activeConversationId = id;
  saveConversations();
  renderHistory();
  renderChat();
}

function getActiveConversation() {
  return findConversation(state.activeConversationId);
}

function updateConversationTitle(conversation) {
  if (conversation.isTitleManual) {
    return;
  }
  const firstUser = conversation.items.find((item) => item.role === "user");
  if (firstUser) {
    conversation.title = firstUser.text.slice(0, 42);
  }
}

function renameConversation(id) {
  const conversation = findConversation(id);
  if (!conversation) {
    return;
  }

  const nextTitle = window.prompt("Nhap ten hoi thoai", conversation.title);
  if (nextTitle === null) {
    return;
  }

  const normalized = nextTitle.trim();
  if (!normalized) {
    return;
  }

  conversation.title = normalized.slice(0, 64);
  conversation.isTitleManual = true;
  conversation.updatedAt = new Date().toISOString();
  saveConversations();
  renderHistory();
}

function deleteConversation(id) {
  if (state.conversations.length <= 1) {
    return;
  }

  const conversation = findConversation(id);
  if (!conversation) {
    return;
  }

  const confirmed = window.confirm(`Xoa hoi thoai \"${conversation.title}\"?`);
  if (!confirmed) {
    return;
  }

  state.conversations = state.conversations.filter((item) => item.id !== id);

  if (!state.conversations.length) {
    createConversation();
    return;
  }

  if (state.activeConversationId === id) {
    state.activeConversationId = state.conversations[0].id;
  }

  saveConversations();
  renderHistory();
  renderChat();
}

function appendChatLine(role, text) {
  const conversation = getActiveConversation();
  if (!conversation) {
    return;
  }
  conversation.items.push({
    id: uid("line"),
    role,
    text,
    at: new Date().toISOString()
  });
  conversation.updatedAt = new Date().toISOString();
  updateConversationTitle(conversation);
  saveConversations();
  renderHistory();
  renderChat();
}

function renderHistory() {
  historyList.innerHTML = "";
  state.conversations.forEach((conversation) => {
    const item = document.createElement("li");
    item.className = `history-item${conversation.id === state.activeConversationId ? " is-active" : ""}`;
    item.dataset.id = conversation.id;
    const safeTitle = escapeHtml(conversation.title);
    item.innerHTML = `
      <div class="history-item-head">
        <p class="history-item-title">${safeTitle}</p>
        <div class="history-item-actions">
          <button class="history-action" type="button" data-action="rename">Sua ten</button>
          <button class="history-action danger" type="button" data-action="delete">Xoa</button>
        </div>
      </div>
      <p class="history-item-time">${formatTime(conversation.updatedAt)}</p>
    `;
    item.addEventListener("click", () => {
      setActiveConversation(conversation.id);
    });
    const renameBtn = item.querySelector('[data-action="rename"]');
    const deleteBtn = item.querySelector('[data-action="delete"]');
    if (renameBtn) {
      renameBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        renameConversation(conversation.id);
      });
    }
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        deleteConversation(conversation.id);
      });
    }
    historyList.appendChild(item);
  });
}

function renderChat() {
  const conversation = getActiveConversation();
  chatLog.innerHTML = "";
  if (!conversation || !conversation.items.length) {
    const empty = document.createElement("p");
    empty.className = "chat-line role-system";
    empty.textContent = "AI console san sang. Hay gui lenh dieu khien.";
    chatLog.appendChild(empty);
    return;
  }

  conversation.items.forEach((item) => {
    const line = document.createElement("p");
    line.className = `chat-line role-${item.role}`;
    line.textContent = item.text;
    chatLog.appendChild(line);
  });
  chatLog.scrollTop = chatLog.scrollHeight;
}

function renderTemperature(statusData) {
  const dht = statusData?.sensor?.dht22 || statusData?.sensor || {};
  const temp = dht?.temperature;
  const humidity = dht?.humidity;

  if (typeof temp === "number" && Number.isFinite(temp)) {
    temperatureValue.textContent = String(temp.toFixed(1));
  } else {
    temperatureValue.textContent = "--";
  }

  if (typeof humidity === "number" && Number.isFinite(humidity)) {
    humidityValue.textContent = String(humidity.toFixed(0));
  } else {
    humidityValue.textContent = "--";
  }

  if (statusData?.last_sync_at) {
    sensorTime.textContent = `Cap nhat: ${formatTime(statusData.last_sync_at)}`;
  } else {
    sensorTime.textContent = "Dang cho du lieu ESP32";
  }
}

async function api(path, options) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });
  const body = await response.json();
  if (!response.ok) {
    throw body;
  }
  return body;
}

async function refreshStatus() {
  try {
    const response = await api("/api/v1/status?includeSensor=true", { method: "GET" });
    statusBox.textContent = JSON.stringify(response.data, null, 2);
    renderTemperature(response.data);
  } catch (error) {
    pushLog("Status error", error);
  }
}

async function sendManual(payloadOverride) {
  const payload = payloadOverride || {
    request_id: uid("cmd"),
    source: "web-dashboard",
    mode: "manual",
    device: deviceInput.value,
    room: roomInput.value,
    action: actionInput.value,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await api("/api/v1/control", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    pushLog("Manual command ok", response);
    await refreshStatus();
  } catch (error) {
    pushLog("Manual command fail", error);
  }
}

function buildAssistantLine(command) {
  const isEnglish = state.selectedLanguage === "en-US";
  if (!command) {
    return isEnglish ? "Unable to determine command" : "Khong xac dinh duoc lenh";
  }

  if (command.device === "light" && command.action === "on" && command.room === "living") {
    return isEnglish ? "Living room light is now on" : "Da mo den phong khach";
  }

  if (command.device === "light" && command.action === "off" && command.room === "living") {
    return isEnglish ? "Living room light is now off" : "Da tat den phong khach";
  }

  const actionMap = isEnglish
    ? {
        on: "turned on",
        off: "turned off",
        open: "opened",
        close: "closed"
      }
    : {
        on: "da bat",
        off: "da tat",
        open: "da mo",
        close: "da dong"
      };
  const roomMap = isEnglish
    ? {
        living: "living room",
        bedroom: "bedroom"
      }
    : {
        living: "phong khach",
        bedroom: "phong ngu"
      };
  const deviceMap = isEnglish
    ? {
        light: "light",
        lock: "door",
        ac: "air conditioner"
      }
    : {
        light: "den",
        lock: "cua",
        ac: "may lanh"
      };

  const actionText = actionMap[command.action] || command.action;
  const deviceText = deviceMap[command.device] || command.device;
  const roomText = command.room ? ` ${roomMap[command.room] || command.room}` : "";
  return `${actionText} ${deviceText}${roomText}`.trim();
}

async function sendAi() {
  const text = voiceText.value.trim();
  const isEnglish = state.selectedLanguage === "en-US";
  if (!text) {
    appendChatLine("error", isEnglish ? "No command content yet" : "Chua co noi dung lenh");
    return;
  }

  appendChatLine("user", `USER: ${text}`);
  appendChatLine("system", "AI working");

  const payload = {
    request_id: uid("ai"),
    source: "web-chat",
    transcript: text,
    context: {
      preferred_room: roomInput.value
    },
    timestamp: new Date().toISOString()
  };

  try {
    const response = await api("/api/v1/voice-command", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const command = response?.data?.parsed_commands?.[0] || null;
    appendChatLine("system", "Done");
    appendChatLine("assistant", buildAssistantLine(command));
    pushLog("AI command ok", response);
    speakResult(command);
    await refreshStatus();
  } catch (error) {
    appendChatLine("error", `AI failed: ${error?.message || (isEnglish ? "Unknown error" : "Loi khong xac dinh")}`);
    pushLog("AI command fail", error);
  }
}

function speakResult(command) {
  if (!command || typeof window.speechSynthesis === "undefined") {
    return;
  }

  const text = buildAssistantLine(command);
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = state.selectedLanguage;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function initSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    micStatus.textContent = getCopy().micUnsupported;
    micBtn.disabled = true;
    return;
  }

  setMicButtonState(false);

  recognition = new SpeechRecognition();
  recognition.lang = state.selectedLanguage;
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onstart = () => {
    listening = true;
    speechBuffer = "";
    micStatus.textContent = getCopy().micListening;
    setMicButtonState(true);
  };

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const current = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        speechBuffer = `${speechBuffer} ${current}`.trim();
      } else {
        interim = `${interim} ${current}`.trim();
      }
    }

    const displayText = `${speechBuffer} ${interim}`.trim();
    if (!displayText) {
      return;
    }

    voiceText.value = displayText;
    micStatus.textContent = `${getCopy().micReceived} ${displayText}`;
  };

  recognition.onerror = (event) => {
    const copy = getCopy();
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      micStatus.textContent = copy.micNoPermission;
      return;
    }
    if (event.error === "no-speech") {
      micStatus.textContent = copy.micNoSpeech;
      return;
    }
    if (event.error === "aborted") {
      micStatus.textContent = copy.micAborted;
      return;
    }
    micStatus.textContent = `${copy.micUnknownError} ${event.error}`;
  };

  recognition.onend = () => {
    listening = false;
    setMicButtonState(false);

    const finalText = (speechBuffer || voiceText.value).trim();
    if (finalText) {
      voiceText.value = finalText;
      micStatus.textContent = `${getCopy().micYouSaid} "${finalText}"`;
    } else {
      micStatus.textContent = getCopy().micNoInput;
    }
  };
}

function activateTab(tab) {
  tabButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tab);
  });
  Object.entries(tabPanels).forEach(([key, panel]) => {
    panel.classList.toggle("is-active", key === tab);
  });
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => activateTab(button.dataset.tab));
});

quickButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const payload = {
      request_id: uid("quick"),
      source: "web-dashboard",
      mode: "manual",
      device: button.dataset.device,
      room: button.dataset.room || "living",
      action: button.dataset.action,
      timestamp: new Date().toISOString()
    };
    sendManual(payload);
  });
});

micBtn.addEventListener("click", () => {
  if (!recognition) {
    return;
  }
  if (listening) {
    recognition.stop();
    return;
  }
  recognition.lang = state.selectedLanguage;
  try {
    recognition.start();
  } catch (_error) {
    micStatus.textContent = getCopy().micStartFailed;
  }
});

if (languageSwitch) {
  languageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setLanguage(button.dataset.lang);
    });
  });
}

manualBtn.addEventListener("click", () => sendManual());
aiBtn.addEventListener("click", sendAi);
refreshBtn.addEventListener("click", refreshStatus);
newChatBtn.addEventListener("click", createConversation);

loadLanguagePreference();
loadConversations();
state.conversations.forEach((conversation) => {
  if (typeof conversation.isTitleManual !== "boolean") {
    conversation.isTitleManual = false;
  }
});
renderHistory();
renderChat();
initSpeech();
setMicButtonState(false);
applyLanguageUI();
refreshStatus();
setInterval(refreshStatus, 15000);