# Architecture

## 1) Kien truc tong the
He thong ap dung kien truc huong module voi 4 khoi chinh:
- Presentation Layer: Web Dashboard.
- Application Layer: Node.js Server (Express) xu ly nghiep vu.
- Device Layer: ESP32 firmware va driver phan cung.
- Intelligence Layer: AI parser thong qua OpenRouter.

## 2) Mo hinh ket noi
- Huong dieu khien thu cong: Dashboard -> Server -> ESP32 -> Device.
- Huong AI command: Dashboard/Chat -> Server -> OpenRouter -> Server -> ESP32.
- Huong telemetry: ESP32 -> Server -> Dashboard.

## 3) Layer trach nhiem
### Presentation Layer (Web Dashboard)
- Hien thi trang thai theo phong va theo loai thiet bi.
- Gui command manual, chuyen mode auto/manual.
- Hien thi ket qua xu ly AI command va trang thai ack.

### Application Layer (Node.js Server)
- API gateway cho dashboard.
- Device orchestration: validate command, route den ESP32.
- Mode engine: ap dung quy tac auto/manual va conflict resolution.
- AI orchestration: gui prompt, parse ket qua, validate schema command.
- State aggregation: dong bo trang thai de frontend de theo doi.

### Device Layer (ESP32)
- Expose REST API cho command va state.
- Dieu khien servo/relay, doc LDR/DHT22.
- Thuc thi auto rules tai edge khi can thiet.
- Tra ve trang thai va ket qua xu ly command.

### Intelligence Layer (LLM)
- Chuyen ngon ngu tu nhien thanh command co cau truc.
- Chuan hoa y dinh nguoi dung theo taxonomy hanh dong.
- Co che fallback khi cau lenh mo ho hoac khong an toan.

## 4) Kien truc module backend de xay dung
- api/: dinh nghia endpoint dashboard-facing.
- application/: use case, orchestration, mode engine.
- domain/: entity, value object, business rule.
- infrastructure/: OpenRouter client, ESP32 HTTP client, logging.
- shared/: validation, error model, constants.

## 5) Nguyen tac tuong thich MQTT tuong lai
- DeviceTransport interface truong tuong quan.
- Hien tai implement HttpDeviceTransport.
- Tuong lai them MqttDeviceTransport ma khong doi use case layer.
- Command envelope giu nguyen de dam bao backward compatibility.

## 6) Quy tac nhat quan trang thai
- ESP32 la nguon su that gan phan cung.
- Server luu state cache ngan han de phuc vu dashboard nhanh.
- Moi command phai co transaction id de doi chieu yeu cau va phan hoi.
- Dashboard cap nhat theo event polling chu ky ngan hoac long-polling.

## 7) Xu ly loi va kha nang phuc hoi
- Timeout khi goi ESP32 va OpenRouter.
- Retry co gioi han doi voi thao tac idempotent.
- Fallback mode: khi AI fail, cho phep nguoi dung xac nhan command tay.
- Circuit breaker (future) cho dich vu AI va device endpoint khong on dinh.

## 8) So do trien khai local
- Dashboard static host boi server Express.
- Server va ESP32 tren cung LAN.
- OpenRouter duoc goi qua internet.
- Cac bien cau hinh (IP ESP32, API key AI) dat o environment.

## 9) Quy uoc mo rong
- Moi loai thiet bi moi can:
  - Device capability model
  - API command mapping
  - Feature spec rieng
  - Test case cho manual va auto mode
