# ESP32 Setup

## 1) Muc tieu
Huong dan cau hinh firmware ESP32 de expose REST API va dieu khien thiet bi Smart Home.

## 2) Yeu cau moi truong
- IDE ho tro PlatformIO hoac Arduino framework tren ESP32.
- Thu vien ho tro Wi-Fi, HTTP server, DHT22, servo.
- Cac bien cau hinh Wi-Fi va mapping chan GPIO.

## 3) Cau hinh co ban can khai bao
- Wi-Fi SSID/password.
- Device ID cua ESP32 node.
- GPIO mapping cho servo/relay/sensor.
- Nguong mac dinh cho auto mode (LDR, nhiet do).
- Chu ky doc sensor.

## 4) REST endpoint can trien khai
- GET /health
- GET /state
- GET /sensors
- POST /command
- POST /mode

## 5) Rule firmware
- Moi command phai co request_id.
- Validate target/action truoc khi thuc thi.
- Tra ket qua bao gom resulting_state.
- Bao ve relay va servo theo safety policy.

## 6) Kiem thu ESP32 doc lap
1. Ping endpoint /health.
2. Goi /state de xac thuc state tong hop.
3. Gui command lock/light/ac.
4. Chuyen mode auto/manual.
5. Kiem tra response code va do tre.

## 7) Tich hop voi server
- Cau hinh IP/port ESP32 tren backend.
- Dong bo command envelope va response envelope.
- Kiem tra trace id xuyen suot request chain.

## 8) Troubleshooting nhanh
- Khong vao duoc endpoint: kiem tra IP LAN va firewall.
- Sensor null: kiem tra wiring va tan suat doc.
- Command timeout: toi uu Wi-Fi signal va retry policy.
- State sai: buoc reconcile tu /state.

## 9) Chuan bi cho MQTT
- Tach command handler khoi transport handler.
- Giu logic business va state machine doc lap giao thuc.
