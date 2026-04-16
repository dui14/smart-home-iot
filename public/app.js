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
const aiModeButtons = Array.from(document.querySelectorAll(".ai-mode-btn"));
const aiHint = document.getElementById("ai-hint");
const aiModeBadge = document.getElementById("ai-mode-badge");
const aiProviderSelect = document.getElementById("ai-provider-select");
const aiModelBadge = document.getElementById("ai-model-badge");

const storageKey = "smarthome_ai_history_v1";
const languageKey = "smarthome_voice_lang_v1";
const aiProviderKey = "smarthome_ai_provider_v1";
const roomDevices = new Set(["light", "ac"]);
const deviceActions = {
  light: ["on", "off"],
  ac: ["on", "off"],
  fan: ["on", "off"],
  lock: ["open", "close"]
};
const aiProviderConfig = {
  openrouter: {
    label: "OpenRouter",
    model: "google/gemini-3-flash-preview"
  },
  gemini: {
    label: "Google Gemini",
    model: "gemini-3-flash"
  }
};

const copyMap = {
  "vi-VN": {
    locale: "vi-VN",
    htmlLang: "vi",
    documentTitle: "Điều Khiển Nhà Thông Minh",
    text: {
      headerEyebrow: "Trung tâm điều khiển nhà thông minh",
      headerTitle: "Điều khiển nhà thông minh theo thời gian thực",
      headerSubtitle: "Bảng điều khiển đèn, cửa và cảm biến từ ESP32 với trợ lý AI hội thoại.",
      tabDashboard: "Bảng điều khiển",
      tabAi: "Trợ lý AI",
      metricTitle: "Chỉ số nhiệt độ",
      quickTitle: "Điều khiển nhanh",
      quickLivingOn: "Bật đèn phòng khách",
      quickLivingOff: "Tắt đèn phòng khách",
      quickBedroomOn: "Bật đèn phòng ngủ",
      quickBedroomOff: "Tắt đèn phòng ngủ",
      quickFanOn: "Bật quạt",
      quickFanOff: "Tắt quạt",
      quickLockOpen: "Mở cửa chính",
      quickLockClose: "Đóng cửa chính",
      manualTitle: "Lệnh thủ công",
      manualDeviceLabel: "Thiết bị",
      manualRoomLabel: "Phòng",
      manualActionLabel: "Hành động",
      deviceLight: "Đèn",
      deviceLock: "Khóa cửa",
      deviceAc: "Máy lạnh",
      deviceFan: "Quạt",
      roomLiving: "Phòng khách",
      roomBedroom: "Phòng ngủ",
      actionOn: "Bật",
      actionOff: "Tắt",
      actionOpen: "Mở",
      actionClose: "Đóng",
      manualSendBtn: "Gửi lệnh thủ công",
      statusTitle: "Trạng thái hệ thống",
      refreshBtn: "Làm mới",
      logsTitle: "Nhật ký API",
      historyTitle: "Lịch sử chat",
      newChatBtn: "Mới",
      aiAssistantTitle: "Trợ lý AI",
      aiHint: "Bấm micro để nói hoặc nhập lệnh trực tiếp rồi gửi.",
      providerLabel: "Nhà cung cấp AI",
      providerOpenrouter: "OpenRouter",
      providerGemini: "Google Gemini",
      micReady: "Mic: sẵn sàng",
      sendChatBtn: "Gửi chat",
      aiInputPlaceholder: "Nhập lệnh AI..."
    },
    actionLabels: {
      on: "Bật",
      off: "Tắt",
      open: "Mở",
      close: "Đóng"
    },
    renameAction: "Sửa tên",
    deleteAction: "Xóa",
    renamePrompt: "Nhập tên hội thoại",
    deleteConfirm: "Xóa hội thoại \"{title}\"?",
    chatReady: "Bảng chat AI đã sẵn sàng. Hãy gửi lệnh điều khiển.",
    sensorUpdated: "Cập nhật:",
    sensorWaiting: "Đang chờ dữ liệu ESP32",
    micAriaIdle: "Nút chép chính tả",
    micAriaListening: "Dừng ghi âm",
    micTitleIdle: "Bắt đầu ghi âm",
    micTitleListening: "Dừng ghi âm",
    micUnsupported: "Mic: trình duyệt không hỗ trợ Web Speech API",
    micListening: "Mic: đang nghe",
    micReceived: "Mic: đã nhận",
    micYouSaid: "Mic: bạn vừa nói",
    micNoInput: "Mic: không nhận được nội dung",
    micNoPermission: "Mic lỗi: chưa cấp quyền microphone",
    micNoSpeech: "Mic lỗi: không phát hiện giọng nói",
    micAborted: "Mic: đã dừng ghi âm",
    micStartFailed: "Mic lỗi: không thể bắt ghi âm",
    micUnknownError: "Mic lỗi:",
    placeholder: "Nhập lệnh AI...",
    languageChanged: "Mic: sẵn sàng",
    voiceModeHint: "Bấm micro để nói hoặc nhập lệnh trực tiếp rồi gửi.",
    commandModeHint: "Bấm micro để nói hoặc nhập lệnh trực tiếp rồi gửi.",
    voiceModeBadge: "Mode: Voice Chat (auto-send)",
    commandModeBadge: "Mode: Manual Command",
    sendChat: "Gửi chat",
    sendCommand: "Gửi chat",
    micDisabledManual: "Mic: sẵn sàng",
    aiThinking: "AI đang xử lý...",
    done: "Hoàn tất",
    noCommand: "Chưa có nội dung lệnh",
    aiFailedPrefix: "AI lỗi:",
    unknownError: "Lỗi không xác định",
    conversationNewTitle: "Hội thoại mới",
    logStatusError: "Lỗi trạng thái",
    logManualOk: "Lệnh thủ công thành công",
    logManualFail: "Lệnh thủ công thất bại",
    logAiOk: "AI phản hồi thành công",
    logAiFail: "AI phản hồi thất bại",
    statusFetchFailed: "Không thể tải trạng thái từ API",
    sensorUnavailable: "ESP32 chưa kết nối"
  },
  "en-US": {
    locale: "en-US",
    htmlLang: "en",
    documentTitle: "Smart Home Control",
    text: {
      headerEyebrow: "Smart Home Control Center",
      headerTitle: "Real-time Smart Home Control",
      headerSubtitle: "Control lights, door lock, and ESP32 sensors with a conversational AI assistant.",
      tabDashboard: "Dashboard",
      tabAi: "AI Assistant",
      metricTitle: "Temperature Index",
      quickTitle: "Quick Control",
      quickLivingOn: "Turn on living room light",
      quickLivingOff: "Turn off living room light",
      quickBedroomOn: "Turn on bedroom light",
      quickBedroomOff: "Turn off bedroom light",
      quickFanOn: "Turn on fan",
      quickFanOff: "Turn off fan",
      quickLockOpen: "Open main door",
      quickLockClose: "Close main door",
      manualTitle: "Manual Command",
      manualDeviceLabel: "Device",
      manualRoomLabel: "Room",
      manualActionLabel: "Action",
      deviceLight: "Light",
      deviceLock: "Door Lock",
      deviceAc: "Air Conditioner",
      deviceFan: "Fan",
      roomLiving: "Living Room",
      roomBedroom: "Bedroom",
      actionOn: "On",
      actionOff: "Off",
      actionOpen: "Open",
      actionClose: "Close",
      manualSendBtn: "Send Manual Command",
      statusTitle: "System Status",
      refreshBtn: "Refresh",
      logsTitle: "API Logs",
      historyTitle: "Chat History",
      newChatBtn: "New",
      aiAssistantTitle: "AI Assistant",
      aiHint: "Tap the mic to speak or type your command and send.",
      providerLabel: "AI Provider",
      providerOpenrouter: "OpenRouter",
      providerGemini: "Google Gemini",
      micReady: "Mic: ready",
      sendChatBtn: "Send Chat",
      aiInputPlaceholder: "Type your AI command..."
    },
    actionLabels: {
      on: "On",
      off: "Off",
      open: "Open",
      close: "Close"
    },
    renameAction: "Rename",
    deleteAction: "Delete",
    renamePrompt: "Enter conversation name",
    deleteConfirm: "Delete conversation \"{title}\"?",
    chatReady: "AI chat is ready. Send a command to begin.",
    sensorUpdated: "Updated:",
    sensorWaiting: "Waiting for ESP32 data",
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
    languageChanged: "Mic: ready",
    voiceModeHint: "Tap the mic to speak or type your command and send.",
    commandModeHint: "Tap the mic to speak or type your command and send.",
    voiceModeBadge: "Mode: Voice Chat (auto-send)",
    commandModeBadge: "Mode: Manual Command",
    sendChat: "Send chat",
    sendCommand: "Send chat",
    micDisabledManual: "Mic: ready",
    aiThinking: "AI is thinking...",
    done: "Done",
    noCommand: "No command content yet",
    aiFailedPrefix: "AI failed:",
    unknownError: "Unknown error",
    conversationNewTitle: "New conversation",
    logStatusError: "Status error",
    logManualOk: "Manual command success",
    logManualFail: "Manual command failed",
    logAiOk: "AI response success",
    logAiFail: "AI response failed",
    statusFetchFailed: "Cannot fetch status from API",
    sensorUnavailable: "ESP32 is not connected"
  }
};

const state = {
  conversations: [],
  activeConversationId: null,
  selectedLanguage: "vi-VN",
  aiProvider: "openrouter",
  lastInputType: "text",
  aiMode: "voice-chat",
  autoSendVoice: true,
  aiPending: false,
  assistantName: "Tom",
  lastStatusData: null
};

let recognition = null;
let listening = false;
let speechBuffer = "";
let speechSupported = false;

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

function applyStaticCopy(copy) {
  document.title = copy.documentTitle;
  document.documentElement.lang = copy.htmlLang;
  const textMap = copy.text || {};

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (key && textMap[key]) {
      node.textContent = textMap[key];
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    if (key && textMap[key]) {
      node.placeholder = textMap[key];
    }
  });
}

function applyLanguageUI() {
  const copy = getCopy();
  applyStaticCopy(copy);
  voiceText.placeholder = copy.placeholder;
  languageButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.lang === state.selectedLanguage);
  });
  syncManualControlOptions();
  renderHistory();
  renderChat();
  if (state.lastStatusData) {
    renderTemperature(state.lastStatusData);
  } else {
    sensorTime.textContent = copy.sensorWaiting;
  }
  applyAiModeUI();
  updateAiProviderUI();
}

function applyAiModeUI() {
  const copy = getCopy();
  const isVoiceMode = state.aiMode === "voice-chat";

  aiModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.aiMode === state.aiMode);
  });

  if (aiHint) {
    aiHint.textContent = isVoiceMode ? copy.voiceModeHint : copy.commandModeHint;
  }

  if (aiModeBadge) {
    aiModeBadge.textContent = isVoiceMode ? copy.voiceModeBadge : copy.commandModeBadge;
  }

  aiBtn.textContent = isVoiceMode ? copy.sendChat : copy.sendCommand;

  if (isVoiceMode) {
    micBtn.disabled = !speechSupported;
    if (!listening) {
      micStatus.textContent = speechSupported ? copy.languageChanged : copy.micUnsupported;
    }
  } else {
    if (listening && recognition) {
      recognition.stop();
    }
    micBtn.disabled = true;
    micStatus.textContent = copy.micDisabledManual;
  }

  setMicButtonState(isVoiceMode && listening);
}

function setAiMode(mode) {
  state.aiMode = mode === "manual-command" ? "manual-command" : "voice-chat";
  applyAiModeUI();
}

function normalizeProvider(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "gemini" || raw.includes("google")) {
    return "gemini";
  }
  return "openrouter";
}

function getProviderConfig() {
  return aiProviderConfig[state.aiProvider] || aiProviderConfig.openrouter;
}

function updateAiProviderUI() {
  if (aiProviderSelect) {
    aiProviderSelect.value = state.aiProvider;
  }
  if (aiModelBadge) {
    const provider = getProviderConfig();
    aiModelBadge.textContent = `Provider: ${provider.label} | Model: ${provider.model}`;
  }
}

function setAiProvider(provider) {
  state.aiProvider = normalizeProvider(provider);
  localStorage.setItem(aiProviderKey, state.aiProvider);
  updateAiProviderUI();
}

function loadAiProviderPreference() {
  const saved = localStorage.getItem(aiProviderKey);
  state.aiProvider = normalizeProvider(saved || "openrouter");
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
  return new Date(value).toLocaleString(getCopy().locale || "vi-VN");
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
  const line = `[${new Date().toLocaleTimeString(getCopy().locale || "vi-VN")}] ${label}\n${JSON.stringify(payload, null, 2)}\n`;
  logBox.textContent = `${line}\n${logBox.textContent}`;
}

function getErrorMessage(error, fallbackMessage) {
  if (!error) {
    return fallbackMessage;
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error.body?.message === "string" && error.body.message.trim()) {
    return error.body.message.trim();
  }

  if (typeof error.body?.error === "string" && error.body.error.trim()) {
    return error.body.error.trim();
  }

  return fallbackMessage;
}

function syncManualControlOptions() {
  const device = deviceInput.value;
  const actions = deviceActions[device] || ["on", "off"];
  const currentAction = actionInput.value;
  const copy = getCopy();

  actionInput.innerHTML = "";
  actions.forEach((action) => {
    const option = document.createElement("option");
    option.value = action;
    option.textContent = copy.actionLabels[action] || action;
    actionInput.appendChild(option);
  });

  actionInput.value = actions.includes(currentAction) ? currentAction : actions[0];
  roomInput.disabled = !roomDevices.has(device);
}

function buildControlPayload({ requestId, source, mode, device, action, room }) {
  const payload = {
    request_id: requestId,
    source,
    mode,
    device,
    action,
    timestamp: new Date().toISOString()
  };

  if (roomDevices.has(device)) {
    payload.room = room || "living";
  }

  return payload;
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
  const copy = getCopy();
  const conversation = {
    id: uid("chat"),
    title: copy.conversationNewTitle,
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

  const copy = getCopy();
  const nextTitle = window.prompt(copy.renamePrompt, conversation.title);
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

  const copy = getCopy();
  const confirmed = window.confirm(copy.deleteConfirm.replace("{title}", conversation.title));
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
  const copy = getCopy();
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
          <button class="history-action" type="button" data-action="rename">${copy.renameAction}</button>
          <button class="history-action danger" type="button" data-action="delete">${copy.deleteAction}</button>
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
  const copy = getCopy();
  const conversation = getActiveConversation();
  chatLog.innerHTML = "";
  if (!conversation || !conversation.items.length) {
    const empty = document.createElement("p");
    empty.className = "chat-line role-system";
    empty.textContent = copy.chatReady;
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
  const copy = getCopy();
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
    sensorTime.textContent = `${copy.sensorUpdated} ${formatTime(statusData.last_sync_at)}`;
  } else {
    sensorTime.textContent = copy.sensorWaiting;
  }
}

async function api(path, options) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  const rawBody = await response.text();
  let body = null;

  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch (_error) {
      body = {
        message: rawBody
      };
    }
  }

  if (!response.ok) {
    const errorMessage = getErrorMessage(body, `HTTP ${response.status}`);
    const error = new Error(errorMessage);
    error.status = response.status;
    error.body = body;
    throw error;
  }

  return body || {};
}

async function refreshStatus() {
  const copy = getCopy();

  try {
    const response = await api("/api/v1/status?includeSensor=true", { method: "GET" });
    statusBox.textContent = JSON.stringify(response.data, null, 2);
    state.lastStatusData = response.data;
    renderTemperature(response.data);
  } catch (error) {
    state.lastStatusData = null;
    temperatureValue.textContent = "--";
    humidityValue.textContent = "--";
    sensorTime.textContent = copy.sensorUnavailable;

    const message = getErrorMessage(error, copy.statusFetchFailed);
    statusBox.textContent = JSON.stringify(
      {
        success: false,
        message,
        at: new Date().toLocaleString(copy.locale || "vi-VN")
      },
      null,
      2
    );

    pushLog(copy.logStatusError, {
      message,
      status: error?.status || null
    });
  }
}

async function sendManual(payloadOverride) {
  const payload = payloadOverride ||
    buildControlPayload({
      requestId: uid("cmd"),
      source: "web-dashboard",
      mode: "manual",
      device: deviceInput.value,
      room: roomInput.value,
      action: actionInput.value
    });

  try {
    const response = await api("/api/v1/control", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    pushLog(getCopy().logManualOk, response);
    await refreshStatus();
  } catch (error) {
    pushLog(getCopy().logManualFail, error);
  }
}

function buildAssistantLine(command) {
  const isEnglish = state.selectedLanguage === "en-US";
  if (!command) {
    return isEnglish ? "Unable to determine command" : "Không xác định được lệnh";
  }

  if (command.device === "light" && command.action === "on" && command.room === "living") {
    return isEnglish ? "Living room light is now on" : "Đã mở đèn phòng khách";
  }

  if (command.device === "light" && command.action === "off" && command.room === "living") {
    return isEnglish ? "Living room light is now off" : "Đã tắt đèn phòng khách";
  }

  const actionMap = isEnglish
    ? {
        on: "turned on",
        off: "turned off",
        open: "opened",
        close: "closed"
      }
    : {
        on: "đã bật",
        off: "đã tắt",
        open: "đã mở",
        close: "đã đóng"
      };
  const roomMap = isEnglish
    ? {
        living: "living room",
        bedroom: "bedroom"
      }
    : {
        living: "phòng khách",
        bedroom: "phòng ngủ"
      };
  const deviceMap = isEnglish
    ? {
        light: "light",
        lock: "door",
        ac: "air conditioner",
        fan: "fan"
      }
    : {
        light: "đèn",
        lock: "cửa",
        ac: "máy lạnh",
        fan: "quạt"
      };

  const actionText = actionMap[command.action] || command.action;
  const deviceText = deviceMap[command.device] || command.device;
  const roomText = command.room ? ` ${roomMap[command.room] || command.room}` : "";
  return `${actionText} ${deviceText}${roomText}`.trim();
}

async function sendAi() {
  if (state.aiPending) {
    return;
  }

  const copy = getCopy();
  const text = voiceText.value.trim();
  const isEnglish = state.selectedLanguage === "en-US";
  const isVoiceMode = state.aiMode === "voice-chat";

  if (!text) {
    appendChatLine("error", copy.noCommand);
    return;
  }

  appendChatLine("user", `USER: ${text}`);
  appendChatLine("system", copy.aiThinking);

  state.aiPending = true;
  aiBtn.disabled = true;

  const payload = {
    request_id: uid("ai"),
    source: state.lastInputType === "voice" ? "voice-web" : "web-chat",
    user_text: text,
    input_type: state.lastInputType,
    context: {
      preferred_room: roomInput.value,
      language: state.selectedLanguage,
      assistant_name: state.assistantName,
      ai_mode: state.aiMode,
      ai_provider: state.aiProvider,
      ai_model: getProviderConfig().model
    },
    timestamp: new Date().toISOString()
  };

  try {
    if (isVoiceMode) {
      const response = await api("/api/v1/ai/assistant", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      const assistantText = response?.data?.assistant_text || (isEnglish
        ? `I am ${state.assistantName}, your smart-home assistant.`
        : `Tôi là ${state.assistantName}, trợ lý smart-home của bạn.`);

      appendChatLine("system", copy.done);
      appendChatLine("assistant", assistantText);
      pushLog(copy.logAiOk, response);
      speakText(assistantText);

      if (response?.data?.intent === "device_control" && response?.data?.execution_status === "success") {
        await refreshStatus();
      }
    } else {
      const response = await api("/api/v1/ai/parse-and-execute", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const command = response?.data?.parsed_commands?.[0] || null;
      const assistantText = buildAssistantLine(command);
      appendChatLine("system", copy.done);
      appendChatLine("assistant", assistantText);
      pushLog(copy.logAiOk, response);
      speakText(assistantText);
      await refreshStatus();
    }

    voiceText.value = "";
    state.lastInputType = "text";
  } catch (error) {
    appendChatLine("error", `${copy.aiFailedPrefix} ${error?.message || copy.unknownError}`);
    pushLog(copy.logAiFail, error);
  } finally {
    state.aiPending = false;
    aiBtn.disabled = false;
    applyAiModeUI();
  }
}

function speakText(text) {
  if (!text || typeof window.speechSynthesis === "undefined") {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = state.selectedLanguage;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function speakResult(command) {
  if (!command) {
    return;
  }
  speakText(buildAssistantLine(command));
}

function initSpeech() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    speechSupported = false;
    applyAiModeUI();
    return;
  }

  speechSupported = true;

  setMicButtonState(false);

  recognition = new SpeechRecognition();
  recognition.lang = state.selectedLanguage;
  recognition.interimResults = true;
  recognition.continuous = true;

  recognition.onstart = () => {
    if (state.aiMode !== "voice-chat") {
      recognition.stop();
      return;
    }
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
    state.lastInputType = "voice";
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
      state.lastInputType = "voice";
      micStatus.textContent = `${getCopy().micYouSaid} "${finalText}"`;
      if (state.aiMode === "voice-chat" && state.autoSendVoice) {
        void sendAi();
      }
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
    const payload = buildControlPayload({
      requestId: uid("quick"),
      source: "web-dashboard",
      mode: "manual",
      device: button.dataset.device,
      room: button.dataset.room,
      action: button.dataset.action
    });
    sendManual(payload);
  });
});

deviceInput.addEventListener("change", syncManualControlOptions);
voiceText.addEventListener("input", () => {
  state.lastInputType = "text";
});

aiModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setAiMode(button.dataset.aiMode);
  });
});

micBtn.addEventListener("click", () => {
  if (state.aiMode !== "voice-chat") {
    return;
  }
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

if (aiProviderSelect) {
  aiProviderSelect.addEventListener("change", () => {
    setAiProvider(aiProviderSelect.value);
  });
}

manualBtn.addEventListener("click", () => sendManual());
aiBtn.addEventListener("click", sendAi);
refreshBtn.addEventListener("click", refreshStatus);
newChatBtn.addEventListener("click", createConversation);

loadLanguagePreference();
loadAiProviderPreference();
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
updateAiProviderUI();
syncManualControlOptions();
refreshStatus();
setInterval(refreshStatus, 15000);
