# Server API Endpoints

Base path: `/api/v1`

## 1) POST /control
Muc dich: nhan lenh thu cong tu Web va forward den ESP32.

### Request body

```json
{
  "request_id": "cmd_20260321_0001",
  "source": "web-dashboard",
  "mode": "manual",
  "device": "light",
  "room": "living",
  "action": "on",
  "params": {
    "override": true
  },
  "timestamp": "2026-03-21T10:30:00Z"
}
```

### Response 200

```json
{
  "success": true,
  "code": "OK_COMMAND_APPLIED",
  "message": "Command executed",
  "trace_id": "trace_001",
  "server_time": "2026-03-21T10:30:01Z",
  "data": {
    "device": "light",
    "room": "living",
    "state": "on",
    "mode": "manual"
  }
}
```

### Response 4xx/5xx
1. `400 ERR_INVALID_PAYLOAD`
2. `409 ERR_MODE_CONFLICT`
3. `502 ERR_DEVICE_UNREACHABLE`
4. `504 ERR_DEVICE_TIMEOUT`

## 2) POST /ai-command
Muc dich: nhan cau lenh ngon ngu tu nhien, parse bang LLM, validate, sau do dieu khien ESP32.

### Request body

```json
{
  "request_id": "ai_20260321_0015",
  "source": "web-chat",
  "text": "Bat den phong khach va mo may lanh",
  "context": {
    "default_room": "living",
    "current_mode": "auto"
  },
  "timestamp": "2026-03-21T10:32:00Z"
}
```

### Response 200

```json
{
  "success": true,
  "code": "OK_AI_COMMAND_EXECUTED",
  "message": "AI command parsed and executed",
  "trace_id": "trace_ai_778",
  "server_time": "2026-03-21T10:32:01Z",
  "data": {
    "parsed_commands": [
      {
        "device": "light",
        "room": "living",
        "action": "on"
      },
      {
        "device": "ac",
        "action": "on"
      }
    ],
    "execution": "partial_success"
  }
}
```

### Response 4xx/5xx
1. `422 ERR_AI_PARSE_FAILED`
2. `409 ERR_MODE_CONFLICT`
3. `502 ERR_DEVICE_UNREACHABLE`
4. `504 ERR_AI_TIMEOUT`

## 3) GET /status
Muc dich: lay snapshot tong hop de render dashboard.

### Query params
1. `room` tuy chon
2. `includeSensor=true|false` mac dinh `true`

### Response 200

```json
{
  "success": true,
  "code": "OK_STATUS_FETCHED",
  "message": "Status fetched",
  "trace_id": "trace_status_901",
  "server_time": "2026-03-21T10:35:00Z",
  "data": {
    "mode": "auto",
    "devices": {
      "light": {
        "living": "on",
        "bedroom": "off"
      },
      "lock": "close",
      "ac": "on"
    },
    "sensor": {
      "ldr": {
        "living": 320,
        "bedroom": 210
      },
      "dht22": {
        "temperature": 28.4,
        "humidity": 66.1
      }
    },
    "last_sync_at": "2026-03-21T10:34:58Z"
  }
}
```

## 4) Validation nhanh
1. `device=light` bat buoc `room`
2. `lock` chi chap nhan `open` | `close`
3. `ac` chi chap nhan `on` | `off`
4. `mode=auto` can `params.override=true` de ep lenh tay

## 5) Timeout va retry ap dung cho server API
1. `/control`: timeout tong 5s, server retry ESP32 toi da 2 lan
2. `/ai-command`: timeout tong 8s, retry LLM 1 lan, retry ESP32 toi da 2 lan
3. `/status`: timeout tong 3s, retry ESP32 1 lan
