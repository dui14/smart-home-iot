# AI-IoT Command and Control Logic

## 1) AI Command Pipeline

### 1.1 Natural language input
- Nguoi dung nhap cau lenh tren dashboard.
- Payload gui len server:
  - `request_id`
  - `user_text`
  - `source=ai_assistant`
  - `client_time`

### 1.2 Send to LLM API
- Server tao system prompt gom:
  - Danh sach device hop le: `lock`, `light`, `ac`
  - Danh sach room hop le
  - Danh sach action hop le theo tung device
  - Rang buoc output JSON only
- Server goi LLM API (OpenRouter) voi timeout va retry gioi han.

### 1.3 JSON response format
- LLM bat buoc tra ve dung schema:

```json
{
  "device": "string",
  "room": "string",
  "action": "string"
}
```

### 1.4 Validation logic
1. Validate JSON parse:
   - Khong parse duoc -> `ERR_AI_PARSE_FAILED`
2. Validate schema:
   - Thieu key -> `ERR_INVALID_PAYLOAD`
3. Validate field value:
   - `device` nam trong `lock|light|ac`
   - `room` nam trong danh sach room config
   - `action` nam trong capability cua `device`
4. Validate business state:
   - Auto/manual conflict
   - Cooldown policy
   - Safety constraints
5. Neu tat ca hop le -> tao command envelope noi bo de execute.

## 2) Command Schema

Schema toi thieu cho parsed command:

```json
{
  "device": "string",
  "room": "string",
  "action": "string"
}
```

### 2.1 Allowed values (MVP)
- `device`:
  - `lock`
  - `light`
  - `ac`
- `room`:
  - `main_door` cho lock
  - `living_room`, `bed_room`, `kitchen` cho light/ac
- `action`:
  - Lock: `lock`, `unlock`
  - Light: `on`, `off`
  - AC: `on`, `off`, `set_mode_auto`, `set_mode_manual`

## 3) Mapping Logic (JSON -> API call -> ESP32)

### 3.1 Mapping table
- Parsed `lock` command:
  - Server API route: `POST /api/v1/command`
  - ESP32 route: `POST /command`
  - Payload map:
    - `target=device_lock`
    - `room=main_door`
    - `action=lock|unlock`

- Parsed `light` command:
  - Server API route: `POST /api/v1/command`
  - ESP32 route: `POST /command`
  - Payload map:
    - `target=light`
    - `room=<parsed room>`
    - `action=on|off`

- Parsed `ac` command:
  - Server API route:
    - `POST /api/v1/command` cho `on|off`
    - `POST /api/v1/mode` cho `set_mode_auto|set_mode_manual`
  - ESP32 route:
    - `POST /command` hoac `POST /mode`

### 3.2 Error handling if invalid command
- Invalid JSON -> tra ngay `ERR_AI_PARSE_FAILED`, khong goi device API.
- Invalid schema -> `ERR_INVALID_PAYLOAD`.
- Device khong ton tai -> `ERR_DEVICE_NOT_FOUND`.
- Action khong hop le voi device -> `ERR_UNSUPPORTED_ACTION`.
- Room khong hop le -> `ERR_INVALID_PAYLOAD`.

## 4) IoT Control Logic

### 4.1 Light control per room
- Moi room co state rieng:
  - `power=on|off`
  - `mode=manual|auto`
  - `ldr_value`
- O manual mode:
  - execute truc tiep on/off.
- O auto mode:
  - LDR < threshold_low -> on.
  - LDR > threshold_high -> off.
  - Dung hysteresis de tranh nhap nhay.

### 4.2 Servo lock states
- Trang thai lock:
  - `locked`
  - `unlocked`
- Mapping action:
  - `lock` -> servo angle lock.
  - `unlock` -> servo angle unlock.
- Co cooldown ngan tranh dao trang thai lien tuc.

### 4.3 AC auto/manual mode switching
- Manual mode:
  - on/off relay truc tiep theo command.
- Auto mode:
  - doc DHT22 theo chu ky.
  - temp > target + band -> relay ON.
  - temp < target - band -> relay OFF.
- Bao ve relay:
  - enforce minimum cycle interval.

## 5) Fail Cases and Recovery

### 5.1 ESP32 offline
- Dau hieu:
  - `GET /health` that bai hoac timeout.
- Xu ly:
  - tra `ERR_DEVICE_UNREACHABLE`.
  - khong cap nhat state thanh cong.
  - dashboard hien health do va cho phep retry.

### 5.2 Invalid JSON from AI
- Dau hieu:
  - response khong parse duoc JSON.
- Xu ly:
  - tra `ERR_AI_PARSE_FAILED`.
  - optional retry parse 1 lan voi prompt stricter.
  - neu van fail, de xuat user command mau.

### 5.3 Device not found
- Dau hieu:
  - `device` ngoai tap ho tro hoac room khong ton tai.
- Xu ly:
  - tra `ERR_DEVICE_NOT_FOUND` hoac `ERR_INVALID_PAYLOAD`.
  - khong gui lenh den ESP32.
  - tra danh sach device/room hop le cho dashboard.

## 6) End-to-end Sequence
1. User gui natural language command.
2. Server goi LLM va nhan parsed JSON.
3. Server validate schema + business rules.
4. Server map JSON sang API command noi bo.
5. Server goi ESP32 endpoint.
6. ESP32 thuc thi va tra ack.
7. Server cap nhat state cache + tra ket qua cho dashboard.

## 7) Observability
- Bat buoc co `trace_id` cho moi request.
- Log theo cac moc:
  - received
  - parsed
  - validated
  - dispatched
  - acknowledged
  - completed
- Theo doi metric:
  - ai_parse_success_rate
  - command_validation_fail_rate
  - esp32_command_latency
  - device_unreachable_rate
