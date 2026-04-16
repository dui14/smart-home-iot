const DEVICE_CATALOG = {
  light: {
    actions: ["on", "off"],
    rooms: ["living", "bedroom", "living_room", "bed_room"]
  },
  lock: {
    actions: ["open", "close", "lock", "unlock"],
    rooms: ["main_door"]
  },
  ac: {
    actions: ["on", "off"],
    rooms: ["living", "bedroom", "living_room", "bed_room"]
  },
  fan: {
    actions: ["on", "off"],
    rooms: []
  }
};

const DEVICES_WITHOUT_ROOM = new Set(["lock", "fan"]);

const ROOM_ALIAS = {
  living_room: "living",
  living: "living",
  bedroom: "bedroom",
  bed_room: "bedroom",
  main_door: "main_door"
};

function normalizeRoom(room) {
  if (!room) {
    return "";
  }
  const key = String(room).trim().toLowerCase();
  return ROOM_ALIAS[key] || key;
}

function normalizeAction(device, action) {
  const raw = String(action || "").trim().toLowerCase();
  if (device === "lock") {
    if (raw === "lock") {
      return "close";
    }
    if (raw === "unlock") {
      return "open";
    }
  }
  return raw;
}

function validateCommand({ device, room, action }) {
  const normalizedDevice = String(device || "").trim().toLowerCase();
  const normalizedRoom = normalizeRoom(room);
  const normalizedAction = normalizeAction(normalizedDevice, action);
  const spec = DEVICE_CATALOG[normalizedDevice];

  if (!spec) {
    return { ok: false, code: "ERR_DEVICE_NOT_FOUND", message: "Device is not supported" };
  }

  if (!spec.actions.includes(normalizedAction)) {
    return { ok: false, code: "ERR_UNSUPPORTED_ACTION", message: "Action is not supported for this device" };
  }

  if (!DEVICES_WITHOUT_ROOM.has(normalizedDevice) && !spec.rooms.includes(normalizedRoom)) {
    return { ok: false, code: "ERR_INVALID_PAYLOAD", message: "Room is not supported" };
  }

  const resolvedRoom = normalizedDevice === "lock"
    ? "main_door"
    : (DEVICES_WITHOUT_ROOM.has(normalizedDevice) ? "" : normalizedRoom);

  return {
    ok: true,
    value: {
      device: normalizedDevice,
      room: resolvedRoom,
      action: normalizedAction
    }
  };
}

module.exports = { DEVICE_CATALOG, validateCommand, normalizeRoom };