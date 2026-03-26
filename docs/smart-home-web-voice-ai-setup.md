# Smart Home Web Voice AI Setup

## 1. Muc tieu
Tai lieu nay huong dan chay he thong web de dieu khien thiet bi IoT qua:
- Web dashboard tren trinh duyet
- Web Speech API de thu lenh giong noi
- OpenRouter de parse lenh ngon ngu tu nhien
- Backend Express de forward lenh den ESP32

## 2. Cau truc da them trong smart-home
- smart-home/package.json
- smart-home/.env.example
- smart-home/src/
- smart-home/public/
- smart-home/tests/

## 3. Yeu cau moi truong
- Node.js >= 20
- NPM >= 10
- ESP32 da nap firmware HTTP API va co the truy cap trong LAN
- OpenRouter API key hop le
- Trinh duyet Chromium cho Web Speech API (khuyen nghi Chrome)

## 4. Cai dat
Tai thu muc smart-home:

```powershell
npm install
```

Tao file .env tu mau:

```powershell
Copy-Item .env.example .env
```

Cap nhat gia tri trong .env:

```env
PORT=3000
ESP32_BASE_URL=http://<esp32-ip>
ESP32_TIMEOUT_MS=1500
ESP32_RETRIES=2
OPENROUTER_API_KEY=<your_openrouter_api_key>
OPENROUTER_MODEL=deepseek/deepseek-chat-v3-0324:free
OPENROUTER_TIMEOUT_MS=8000
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_SITE_NAME=SmartHomeVoiceControl
```

## 5. Chay he thong
Chay API + static dashboard:

```powershell
npm start
```

Truy cap:
- http://localhost:3000

## 6. Luong su dung
1. Mo dashboard, cap quyen microphone cho trinh duyet.
2. Thu lenh giong noi bang nut Bat dau ghi am.
3. Gui lenh AI de backend goi OpenRouter parse y dinh.
4. Backend validate command va goi endpoint ESP32.
5. Trang thai cap nhat qua API /api/v1/status.

## 7. API chinh
Base path: /api/v1

- GET /health
- POST /control
- POST /ai-command
- GET /status?includeSensor=true|false

Request mau cho /control:

```json
{
  "request_id": "cmd_20260322_0001",
  "source": "web-dashboard",
  "mode": "manual",
  "device": "light",
  "room": "living",
  "action": "on",
  "timestamp": "2026-03-22T10:00:00.000Z"
}
```

Request mau cho /ai-command:

```json
{
  "request_id": "ai_20260322_0002",
  "source": "web-chat",
  "text": "bat den phong khach",
  "context": {
    "preferred_room": "living"
  },
  "timestamp": "2026-03-22T10:00:00.000Z"
}
```

## 8. Luu y debug nhanh
- Neu /control tra ERR_DEVICE_UNREACHABLE:
  - Kiem tra ESP32_BASE_URL
  - Kiem tra ESP32 dang online
  - Kiem tra firewall LAN
- Neu /ai-command tra ERR_AI_MISSING_API_KEY:
  - Kiem tra OPENROUTER_API_KEY trong .env
- Neu trinh duyet khong nghe voice:
  - Dung HTTPS hoac localhost
  - Kiem tra quyen microphone
  - Dung Chrome moi nhat

## 9. Bao mat
- Khong commit file .env
- Khong log API key
- Dat key theo tung moi truong dev/staging/prod

## 10. Lenh test

```powershell
npm test
```

Bo test hien tai xac nhan contract API co ban va validate payload.
