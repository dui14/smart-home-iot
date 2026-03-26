# Server Setup

## 1) Muc tieu
Huong dan setup Node.js Server (Express) de lam trung tam dieu phoi dashboard, ESP32 va AI provider.

## 2) Yeu cau he thong
- Node.js phien ban LTS.
- Ket noi LAN den ESP32.
- Ket noi internet de goi OpenRouter.

## 3) Bien cau hinh can co
- SERVER_PORT
- ESP32_BASE_URL
- OPENROUTER_API_KEY
- OPENROUTER_MODEL
- REQUEST_TIMEOUT_MS
- RETRY_LIMIT

## 4) Chuc nang server can khoi tao
- Dashboard-facing API endpoints.
- ESP32 client voi timeout/retry.
- AI client de parse command.
- Validation pipeline cho command schema.
- State cache nho cho dashboard.

## 5) Trinh tu khoi dong local
1. Cau hinh bien moi truong.
2. Khoi dong server.
3. Kiem tra /api/v1/health.
4. Kiem tra /api/v1/state.
5. Thu command manual va AI command.

## 6) Checklist tich hop
- Server goi duoc ESP32 /health va /state.
- Dashboard nhan state tong hop dung contract.
- AI parse command dung schema va execute duoc.
- Loi tu ESP32/AI duoc mapping dung ma loi nghiep vu.

## 7) Logging de xuat
- request_id va trace_id tren moi request.
- latency theo tung hop ket noi.
- command lifecycle log.
- AI parse validation log.

## 8) Van hanh MVP
- Khong bat auth.
- Uu tien de trien khai local nhanh.
- Theo doi ket noi LAN va do tre command.

## 9) Huong mo rong
- Them cache layer rieng neu luu luong tang.
- Them persistence cho lich su command va sensor.
- Them auth/role khi trien khai production.
- Chuyen transport sang MQTT khi can realtime cao.
