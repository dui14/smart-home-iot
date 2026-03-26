function parseTextCommandLocally(text, context = {}) {
  const raw = String(text || "").toLowerCase();

  const device = detectDevice(raw);
  const action = detectAction(raw, device);
  const room = detectRoom(raw, context);

  if (!device || !action) {
    return null;
  }

  return {
    device,
    room,
    action
  };
}

function detectDevice(raw) {
  if (containsAny(raw, ["den", "đèn", "light", "lamp"])) {
    return "light";
  }
  if (containsAny(raw, ["cua", "cửa", "khoa", "khóa", "lock", "door"])) {
    return "lock";
  }
  if (containsAny(raw, ["dieu hoa", "điều hòa", "may lanh", "máy lạnh", "ac", "aircon", "air conditioner"])) {
    return "ac";
  }
  return null;
}

function detectAction(raw, device) {
  if (containsAny(raw, ["bat", "bật", "mo", "mở", "on", "open", "unlock"])) {
    if (device === "lock") {
      return "open";
    }
    return "on";
  }

  if (containsAny(raw, ["tat", "tắt", "dong", "đóng", "off", "close", "lock"])) {
    if (device === "lock") {
      return "close";
    }
    return "off";
  }

  return null;
}

function detectRoom(raw, context) {
  if (containsAny(raw, ["phong khach", "phòng khách", "living"])) {
    return "living";
  }
  if (containsAny(raw, ["phong ngu", "phòng ngủ", "bedroom"])) {
    return "bedroom";
  }
  if (containsAny(raw, ["cua chinh", "cửa chính", "main door", "main_door"])) {
    return "main_door";
  }

  return context.preferred_room || "living";
}

function containsAny(raw, words) {
  return words.some((word) => raw.includes(word));
}

module.exports = { parseTextCommandLocally };
