# Data Flow

## 1) Nguyen tac data flow
- Moi tuong tac duoc quan ly theo command-response.
- Trang thai thiet bi duoc dong bo theo chu ky ngan.
- Lenh AI phai qua bo validate truoc khi toi ESP32.

## 2) Luong A: Dieu khien thu cong
1. Nguoi dung thao tac tren dashboard.
2. Dashboard gui request den server voi action va target device.
3. Server xac thuc payload, ap dung business rule.
4. Server goi endpoint ESP32.
5. ESP32 thuc thi tren hardware, tra ve ket qua.
6. Server cap nhat state hien tai va tra ket qua cho dashboard.
7. Dashboard hien thi trang thai moi.

## 3) Luong B: Dieu khien bang AI
1. Nguoi dung nhap cau lenh ngon ngu tu nhien.
2. Dashboard gui text command den server.
3. Server tao AI context va goi OpenRouter.
4. LLM tra ve command co cau truc JSON.
5. Server validate schema, check safety, resolve conflict mode.
6. Server chuyen command hop le toi ESP32.
7. ESP32 thuc thi, phan hoi trang thai.
8. Server gui ket qua tong hop ve dashboard.

## 4) Luong C: Auto mode theo cam bien
1. ESP32 doc LDR/DHT22 theo chu ky.
2. ESP32 tinh toan nguong auto mode.
3. ESP32 ra quyet dinh dieu khien relay/actuator.
4. ESP32 gui state moi ve server (pull/push tuy trien khai).
5. Server cap nhat state va dashboard nhan du lieu moi.

## 5) Luong D: Dong bo trang thai dashboard
- Dashboard goi endpoint state summary theo chu ky ngan.
- Server tong hop tu cache state va ket qua moi nhat tu ESP32.
- Neu phat hien sai lech, server uu tien dong bo lai tu ESP32.

## 6) Data contract toi thieu cho command
- request_id: id giao dich command.
- source: dashboard_manual | ai_assistant | auto_rule.
- target: lock | light | ac.
- room: vi tri thiet bi neu co.
- action: lock/unlock/on/off/set_mode/set_target.
- mode: manual | auto.
- params: tap tham so bo sung.
- timestamp: thoi diem gui lenh.

## 7) Data contract toi thieu cho device state
- device_id.
- device_type.
- room.
- power_state.
- mode.
- sensor_snapshot.
- last_command_id.
- updated_at.
- health_status.

## 8) Xu ly conflict data
- Neu manual command toi khi dang auto mode: uu tien theo policy feature.
- Neu AI command xung dot voi safety rule: tu choi command.
- Neu state dashboard cu: server tra ve state moi nhat kem version.

## 9) Yeu cau theo doi va quan sat
- Log command lifecycle: received -> validated -> sent -> ack -> applied.
- Log AI lifecycle: prompt -> parse -> validation -> execution.
- Ghi nhan latency tung hop: dashboard-server, server-LLM, server-ESP32.
