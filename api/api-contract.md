# Smart Home API Contract

## 1) Pham vi
Tai lieu nay dinh nghia hop dong giao tiep cho:
1. Web Dashboard <-> Server API
2. Server <-> ESP32 API
3. Luong dieu khien thu cong, AI command va telemetry sensor

## 2) Quy uoc chung
1. Protocol: HTTP/1.1 (JSON)
2. Content-Type: `application/json; charset=utf-8`
3. API version: `v1`
4. Timestamp format: ISO 8601 (UTC)
5. Correlation ID:
	 - Request header: `X-Request-Id`
	 - Response field: `trace_id`
6. Idempotency cho lenh dieu khien:
	 - Field `request_id` la bat buoc
	 - Cung `request_id` trong 60 giay tra lai ket qua cu

## 3) Request format chuan

```json
{
	"request_id": "cmd_20260321_0001",
	"source": "web-dashboard",
	"mode": "manual",
	"device": "light",
	"room": "living",
	"action": "on",
	"params": {},
	"timestamp": "2026-03-21T10:30:00Z"
}
```

Field bat buoc:
1. `request_id`
2. `source`
3. `mode`: `manual` | `auto`
4. `device`: `light` | `lock` | `ac` | `fan`
5. `action`
6. `timestamp`

Field tuy chon:
1. `room`: bat buoc voi `light` va `ac`
2. `params`: cho mo rong trong tuong lai

## 4) Response format chuan

```json
{
	"success": true,
	"code": "OK_COMMAND_APPLIED",
	"message": "Light living turned on",
	"trace_id": "trace_86f7f5",
	"server_time": "2026-03-21T10:30:01Z",
	"data": {
		"device": "light",
		"room": "living",
		"state": "on"
	}
}
```

Field bat buoc:
1. `success`
2. `code`
3. `message`
4. `trace_id`
5. `server_time`

## 5) Error handling

### 5.1 Error object

```json
{
	"success": false,
	"code": "ERR_INVALID_PAYLOAD",
	"message": "Field room is required for light",
	"trace_id": "trace_497ab2",
	"server_time": "2026-03-21T10:30:01Z",
	"errors": [
		{
			"field": "room",
			"reason": "required"
		}
	]
}
```

### 5.2 Ma loi nghiep vu
1. `OK_COMMAND_APPLIED`
2. `OK_STATUS_FETCHED`
3. `OK_AI_COMMAND_EXECUTED`
4. `OK_AI_ASSISTANT_RESPONDED`
5. `ERR_INVALID_PAYLOAD`
6. `ERR_UNSUPPORTED_DEVICE`
7. `ERR_UNSUPPORTED_ACTION`
8. `ERR_MODE_CONFLICT`
9. `ERR_DEVICE_UNREACHABLE`
10. `ERR_DEVICE_TIMEOUT`
11. `ERR_AI_PARSE_FAILED`
12. `ERR_AI_TIMEOUT`
13. `ERR_INTERNAL`

### 5.3 Map HTTP status
1. `200`: thanh cong
2. `400`: payload khong hop le
3. `409`: xung dot mode auto/manual
4. `422`: AI parse khong ra lenh hop le
5. `502`: ESP32/LLM upstream loi
6. `504`: timeout khi goi ESP32/LLM
7. `500`: loi he thong

## 6) Timeout & retry strategy

### 6.1 Dashboard -> Server
1. Timeout client: 5s
2. Retry: 1 lan voi `GET /status`
3. Khong retry tu dong voi `POST /control`, `POST /ai/parse-and-execute`, `POST /ai-command`, `POST /voice-command` neu khong co `request_id`
4. `POST /ai/assistant` la endpoint hoi thoai thong minh: co the chat-only hoac parse-va-execute tuy intent.

### 6.2 Server -> ESP32
1. Timeout moi request: 1500ms
2. Retry toi da: 2 lan
3. Backoff: 200ms -> 500ms
4. Chi retry cho lenh idempotent:
	 - `light on/off`
	 - `ac on/off`
	 - `fan on/off`
	 - `status/sensor read`
5. Khong retry `lock open/close` neu khong co xac nhan trang thai sau moi lan thu

### 6.3 Server -> LLM (AI)
1. Timeout: 4000ms
2. Retry: 1 lan duy nhat khi timeout hoac 5xx
3. Neu that bai: tra `ERR_AI_TIMEOUT` hoac `ERR_AI_PARSE_FAILED`, khuyen nghi nguoi dung chuyen manual

## 7) Validation rule
1. `light` bat buoc co `room`
2. `lock` khong dung `room`
3. `ac` action hop le: `on`, `off`
4. `fan` action hop le: `on`, `off`
5. `lock` action hop le: `open`, `close`
6. `light` action hop le: `on`, `off`
7. Neu mode `auto`, lenh manual chi duoc phep khi co `override=true`

## 8) Danh muc endpoint chinh
1. Server API:
	 - `POST /control`
	 - `POST /ai/assistant`
	 - `POST /ai/parse-only`
	 - `POST /ai/parse-and-execute`
	 - `POST /ai-command` (legacy)
	 - `POST /voice-command` (legacy)
	 - `GET /status`
2. ESP32 API:
	 - `GET /light?room=living&state=on`
	 - `GET /lock?state=open`
	 - `GET /ac?state=on`
	 - `GET /fan?state=on`
	 - `GET /sensor`
