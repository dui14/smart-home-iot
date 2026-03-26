# Feature Spec: Smart Lock (Servo Control)

## 1) Description
Smart Lock dieu khien khoa cua bang servo voi 2 trang thai on dinh: `locked` va `unlocked`. Tinh nang ho tro dieu khien tu Dashboard, AI command va dong bo state theo thoi gian thuc tu ESP32.

## 2) Scope
- In scope:
	- Lock/unlock qua API command.
	- Dong bo lock state len dashboard.
	- Safety window tranh dao trang thai lien tuc.
	- Khung loi ro rang khi servo khong di den vi tri muc tieu.
- Out of scope:
	- Xac thuc sinh trac hoc.
	- Cam bien cua mo cua phuc tap.
	- Lich su audit dai han.

## 3) User Scenarios
1. Homeowner bam "Lock" tren dashboard truoc khi roi nha.
2. Homeowner noi "mo cua" qua AI assistant khi co khach.
3. Dashboard hien "dang xu ly" trong luc cho ESP32 ack, sau do cap nhat thanh cong/that bai.
4. Nguoi dung gui lenh lock trong khi cua da lock, he thong tra ve ket qua no-op thay vi loi.

## 4) Input / Output
### Input
- Manual command:
	- `target=device_lock`
	- `room=main_door`
	- `action=lock|unlock`
	- `source=dashboard_manual`
- AI command sau parse:
	- `device=lock`
	- `room=main_door`
	- `action=lock|unlock`

### Output
- Thanh cong:
	- `execution_status=applied|no_op`
	- `resulting_state.lock=locked|unlocked`
	- `trace_id`
- That bai:
	- `code=ERR_DEVICE_UNREACHABLE|ERR_UNSUPPORTED_ACTION|ERR_ACTUATOR_FAILED`
	- `message`
	- `trace_id`

## 5) API Interaction
### Dashboard -> Server
- `POST /api/v1/command` cho manual lock/unlock.
- `GET /api/v1/state` de lay lock state moi nhat.

### AI -> Server
- `POST /api/v1/ai/parse-and-execute` voi natural language command.

### Server -> ESP32
- `POST /command` de thuc thi lock/unlock.
- `GET /state` de verify state sau command.

## 6) Device Behavior
1. ESP32 nhan command lock/unlock.
2. Firmware map action -> servo angle:
	 - `lock` -> goc lock.
	 - `unlock` -> goc unlock.
3. Servo duoc cap xung den khi dat vi tri hoac timeout.
4. Neu timeout, firmware tra `ERR_ACTUATOR_FAILED`.
5. Sau khi xong, state `lock_state` duoc cap nhat va expose qua `/state`.

## 7) Business Rules
- Lock action co cooldown ngan de tranh dao trang thai lien tuc.
- Command trung voi current state tra `no_op`.
- Neu dang co command lock xu ly, command lock moi trong cung cooldown se bi tu choi.
- Moi command phai co `request_id` de idempotency.

## 8) Edge Cases
1. ESP32 offline: Server tra `ERR_DEVICE_UNREACHABLE`, khong doi state cache.
2. Servo ket co hoc: ESP32 tra `ERR_ACTUATOR_FAILED`, dashboard hien huong dan retry.
3. Duplicate command cung `request_id`: tra ket qua cu, khong execute lan 2.
4. AI parse sai room: Server reject voi `ERR_INVALID_PAYLOAD` neu room khong ton tai.
5. Race condition lock/unlock gan nhau: command sau bi queue hoac reject theo cooldown.

## 9) Acceptance Criteria
1. User lock/unlock thanh cong qua dashboard trong <= 2 lan click.
2. AI command lock/unlock hop le duoc parse va execute thanh cong.
3. Dashboard luon hien lock state dong nhat voi ESP32 sau command.
4. Loi duoc tra ve theo code contract, co `trace_id` de doi chieu.
