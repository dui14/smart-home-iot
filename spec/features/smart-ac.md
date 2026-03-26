# Feature Spec: Smart AC (DHT22 + Relay + Auto/Manual)

## 1) Description
Smart AC dieu khien dieu hoa bang relay, su dung nhiet do DHT22 de van hanh auto mode. He thong ho tro manual control cho user va auto regulation theo target temperature + hysteresis.

## 2) Scope
- In scope:
	- Bat/tat AC bang relay.
	- Chuyen mode `manual` va `auto`.
	- Dat `target_temperature` cho auto mode.
	- Bao ve relay bang min cycle interval.
- Out of scope:
	- Dieu khien fan speed.
	- Dieu khien swing.
	- PID control nang cao.

## 3) User Scenarios
1. User bat AC thu cong tu dashboard khi ve nha.
2. User chuyen sang auto mode va dat muc 26C.
3. User noi "bat dieu hoa phong ngu" va AI parse thanh command hop le.
4. Khi DHT22 loi, he thong tam dung auto va yeu cau user thao tac manual.

## 4) Input / Output
### Input
- Command envelope:
	- `target=ac`
	- `room=bed_room|living_room|...`
	- `action=on|off|set_mode|set_target`
	- `mode=manual|auto`
	- `params.target_temperature`
	- `params.hysteresis_band`

### Output
- Thanh cong:
	- `execution_status=applied|no_op`
	- `resulting_state.ac.power=on|off`
	- `resulting_state.ac.mode=manual|auto`
	- `resulting_state.ac.target_temperature`
	- `trace_id`
- That bai:
	- `code=ERR_MODE_CONFLICT|ERR_SENSOR_UNAVAILABLE|ERR_DEVICE_UNREACHABLE|ERR_POLICY_COOLDOWN`
	- `message`
	- `trace_id`

## 5) API Interaction
### Dashboard -> Server
- `POST /api/v1/command` cho on/off va set_target.
- `POST /api/v1/mode` cho doi manual/auto.
- `GET /api/v1/state` lay power/mode/temp hien tai.

### AI -> Server
- `POST /api/v1/ai/parse-and-execute` cho command AC.

### Server -> ESP32
- `POST /command` dieu khien relay.
- `POST /mode` doi mode AC.
- `GET /sensors` lay DHT22 temp/humidity.

## 6) Device Behavior
1. O manual mode:
	 - Nhan lenh on/off va tac dong relay truc tiep.
2. O auto mode:
	 - Doc nhiet do DHT22 theo chu ky.
	 - So sanh voi target:
		 - Temp > target + band -> relay ON.
		 - Temp < target - band -> relay OFF.
3. Enforce `minimum_relay_cycle_interval` de bao ve relay.
4. Neu den thoi gian cooldown ma nhan lenh doi trang thai, firmware co the reject tam thoi.

## 7) Business Rules
- Manual command chi duoc chap nhan khi mode manual, hoac can chuyen mode truoc.
- `target_temperature` phai trong gioi han cho phep (de xuat 18-30C).
- Neu DHT22 loi thi auto mode bi danh dau degraded.
- He thong luu `last_relay_change_at` de enforce cooldown.

## 8) Edge Cases
1. DHT22 tra `NaN` hoac timeout: tra `ERR_SENSOR_UNAVAILABLE`, giu relay state hien tai.
2. Spam command on/off: reject voi `ERR_POLICY_COOLDOWN` trong cua so bao ve relay.
3. AI yeu cau target ngoai gioi han: reject `ERR_INVALID_PAYLOAD`.
4. ESP32 offline: server fail fast va thong bao dashboard.
5. Lech state cache/server so voi ESP32: uu tien reconcile theo `/state` cua ESP32.

## 9) Acceptance Criteria
1. Manual mode bat/tat relay dung va phan hoi nhanh.
2. Auto mode giu nhiet do quanh target theo hysteresis.
3. Relay khong bi dao on/off qua nhanh nho cooldown.
4. Loi sensor duoc nhan dien va hien thi ro tren dashboard.
