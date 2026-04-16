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

## 2) POST /ai/assistant
Muc dich: assistant thong minh tu phan loai intent `chat` hoac `device_control`.

### Request body

```json
{
  "request_id": "asst_20260321_0001",
  "source": "voice-web",
  "user_text": "hello who are you",
  "input_type": "voice",
  "context": {
    "assistant_name": "Tom",
    "preferred_room": "living",
    "language": "vi-VN",
    "ai_provider": "gemini",
    "ai_model": "gemini-3-flash"
  },
  "timestamp": "2026-03-21T10:31:00Z"
}
```

### Response 200

```json
{
  "success": true,
  "code": "OK_AI_ASSISTANT_RESPONDED",
  "message": "AI assistant response generated",
  "trace_id": "trace_ai_asst_001",
  "server_time": "2026-03-21T10:31:01Z",
  "data": {
    "input_type": "voice",
    "user_text": "hello who are you",
    "intent": "chat",
    "assistant_text": "Toi la Tom, tro ly smart-home cua ban.",
    "parsed_command": null,
    "parsed_commands": [],
    "execution_status": "chat_only",
    "error_code": null,
    "parser": "llm",
    "resulting_state": {}
  }
}
```

## 3) POST /ai/parse-only
Muc dich: nhan cau lenh ngon ngu tu nhien, parse bang LLM/fallback local parser, tra ket qua parse va validation de dashboard xem truoc.

### Request body

```json
{
  "request_id": "ai_20260321_0015",
  "source": "web-chat",
  "user_text": "Bat den phong khach",
  "input_type": "text",
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
  "code": "OK_AI_COMMAND_PARSED",
  "message": "AI command parsed",
  "trace_id": "trace_ai_parse_778",
  "server_time": "2026-03-21T10:32:01Z",
  "data": {
    "input_type": "text",
    "user_text": "Bat den phong khach",
    "parsed_command": {
      "device": "light",
      "room": "living",
      "action": "on"
    },
    "validation_result": {
      "ok": true
    },
    "confidence": 0.9,
    "parser": "llm",
    "requires_confirmation": false
  }
}
```

### Response 4xx/5xx
1. `422 ERR_AI_PARSE_FAILED`
2. `504 ERR_AI_TIMEOUT`

### Context options
1. `ai_provider`: `openrouter` | `gemini`
2. `ai_model`: model id tuy chon theo provider

## 4) POST /ai/parse-and-execute
Muc dich: parse command va execute ngay den ESP32.

### Request body

```json
{
  "request_id": "ai_20260321_0016",
  "source": "web-chat",
  "user_text": "Bat den phong khach",
  "input_type": "voice",
  "context": {
    "default_room": "living"
  },
  "timestamp": "2026-03-21T10:33:00Z"
}
```

### Response 200

```json
{
  "success": true,
  "code": "OK_AI_COMMAND_EXECUTED",
  "message": "AI command parsed and executed",
  "trace_id": "trace_ai_exec_779",
  "server_time": "2026-03-21T10:33:01Z",
  "data": {
    "input_type": "voice",
    "user_text": "Bat den phong khach",
    "parsed_command": {
      "device": "light",
      "room": "living",
      "action": "on"
    },
    "parsed_commands": [
      {
        "device": "light",
        "room": "living",
        "action": "on"
      }
    ],
    "validation_result": {
      "ok": true
    },
    "confidence": 0.9,
    "parser": "llm",
    "requires_confirmation": false,
    "execution_status": "success",
    "execution": "success",
    "resulting_state": {
      "devices": {
        "light": {
          "living": "on"
        }
      }
    }
  }
}
```

### Response 4xx/5xx
1. `422 ERR_AI_PARSE_FAILED`
2. `409 ERR_MODE_CONFLICT`
3. `502 ERR_DEVICE_UNREACHABLE`
4. `504 ERR_AI_TIMEOUT`

## 5) POST /ai-command (legacy)
Muc dich: endpoint tuong thich nguoc, internally dung chung luong parse-and-execute.

## 6) POST /voice-command (legacy)
Muc dich: endpoint tuong thich nguoc cho payload `transcript`, internally dung chung luong parse-and-execute.

## 7) GET /status
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

## 8) Validation nhanh
1. `device=light` bat buoc `room`
2. `lock` chi chap nhan `open` | `close`
3. `ac` chi chap nhan `on` | `off`
4. `mode=auto` can `params.override=true` de ep lenh tay

## 9) Timeout va retry ap dung cho server API
1. `/control`: timeout tong 5s, server retry ESP32 toi da 2 lan
2. `/ai/assistant`: timeout tong 8s, chat hoac execute tuy intent
3. `/ai/parse-only`: timeout tong 8s, retry LLM 1 lan
4. `/ai/parse-and-execute`: timeout tong 8s, retry LLM 1 lan, retry ESP32 toi da 2 lan
5. `/ai-command` va `/voice-command`: legacy alias cua parse-and-execute
6. `/status`: timeout tong 3s, retry ESP32 1 lan
