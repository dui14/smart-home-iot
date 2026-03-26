# Feature Spec: Smart Light (Multi-room + LDR Auto)

## 1) Description
Smart Light quan ly den theo nhieu phong, ho tro `manual` va `auto` mode. O auto mode, ESP32 su dung gia tri LDR tung phong de quyet dinh bat/tat den theo nguong cau hinh.

## 2) Scope
- In scope:
	- On/off den theo room.
	- Mode manual/auto theo room.
	- LDR threshold va hysteresis cho auto mode.
	- AI command dieu khien den theo room.
- Out of scope:
	- Dimmer muc sang.
	- Lich bat/tat theo gio.
	- Presence detection bang PIR.

## 3) User Scenarios
1. User bat den `living_room` thu cong khi troi toi.
2. User chuyen `bed_room` sang auto mode de den tu dong theo anh sang.
3. User noi "tat den phong bep" va AI gui lenh den room `kitchen`.
4. User mo dashboard va thay tung room dang mode nao, den dang on/off.

## 4) Input / Output
### Input
- Command envelope:
	- `target=light`
	- `room=living_room|bed_room|kitchen|...`
	- `action=on|off|set_mode`
	- `mode=manual|auto`
	- `params.threshold_low`, `params.threshold_high` (tuy chon)

### Output
- Thanh cong:
	- `execution_status=applied|queued|no_op`
	- `resulting_state.light[room].power=on|off`
	- `resulting_state.light[room].mode=manual|auto`
	- `trace_id`
- That bai:
	- `code=ERR_INVALID_PAYLOAD|ERR_DEVICE_UNREACHABLE|ERR_SENSOR_UNAVAILABLE`
	- `message`
	- `trace_id`

## 5) API Interaction
### Dashboard -> Server
- `GET /api/v1/state` lay tong hop state den theo room.
- `POST /api/v1/command` on/off den theo room.
- `POST /api/v1/mode` doi manual/auto theo room.

### AI -> Server
- `POST /api/v1/ai/parse-and-execute` tu natural language -> command room-specific.

### Server -> ESP32
- `POST /command` cho on/off.
- `POST /mode` cho manual/auto.
- `GET /sensors` de lay LDR theo room.

## 6) Device Behavior
1. ESP32 duy tri bang cau hinh mode theo room.
2. O manual mode:
	 - Nhan on/off va doi relay ngay.
3. O auto mode:
	 - Doc LDR theo chu ky.
	 - So sanh voi nguong:
		 - LDR < `threshold_low` -> bat den.
		 - LDR > `threshold_high` -> tat den.
4. Firmware dung hysteresis de tranh flicker khi LDR giao dong quanh nguong.
5. Moi thay doi state duoc cap nhat vao `/state`.

## 7) Business Rules
- Manual command duoc uu tien khi room dang mode manual.
- Neu room dang auto mode va user gui on/off truc tiep:
	- Option A: reject voi `ERR_MODE_CONFLICT`.
	- Option B: auto chuyen ve manual roi ap dung command.
	- MVP de xuat su dung Option A de ro rang hanh vi.
- Room phai thuoc danh sach room hop le cua he thong.
- Moi room co cooldown ngan de tranh spam command.

## 8) Edge Cases
1. LDR room mat ket noi: room do fallback safe mode va thong bao `ERR_SENSOR_UNAVAILABLE`.
2. Gia tri LDR bat thuong (outlier): firmware bo qua mau va giu state cu.
3. Command toi room khong ton tai: reject `ERR_INVALID_PAYLOAD`.
4. Nhieu lenh dong thoi cung room: xu ly theo queue FIFO theo room.
5. ESP32 offline: command fail, dashboard giu state cu va hien canh bao health.

## 9) Acceptance Criteria
1. User dieu khien on/off theo room thanh cong o manual mode.
2. Auto mode bat/tat dung theo cap nguong hysteresis.
3. AI command room-specific duoc execute dung room.
4. Dashboard hien thi chinh xac power + mode tung room.
