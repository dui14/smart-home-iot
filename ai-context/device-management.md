# Device Management

## 1) Muc tieu
Dinh nghia cach quan ly danh muc thiet bi, mode hoat dong, quy tac dieu khien va dong bo trang thai trong he thong Smart Home.

## 2) Nhom thiet bi trong MVP
- Smart Lock (Servo)
- Smart Light (Relay/LED theo phong)
- Smart AC (Relay + DHT22)
- Sensor support: LDR va DHT22

## 3) Mo hinh thiet bi logic
Moi thiet bi duoc dinh danh boi:
- device_id: dinh danh duy nhat
- device_type: lock | light | ac | sensor
- room: living_room | bed_room | kitchen | other
- capability: danh sach hanh dong ho tro
- mode: manual | auto
- state: trang thai hien tai
- constraints: gioi han an toan

## 4) Capability theo loai
### Lock
- lock
- unlock
- read_lock_state

### Light
- power_on
- power_off
- set_auto_mode
- set_manual_mode
- set_threshold_ldr

### AC
- power_on
- power_off
- set_auto_mode
- set_manual_mode
- set_target_temperature

## 5) Quan ly mode
- Manual mode: chap hanh command tu dashboard/AI neu hop le.
- Auto mode: uu tien quy tac cam bien va nguong cau hinh.
- Mode switch phai duoc ack ro rang tu ESP32.

## 6) Quy tac an toan van hanh
- Khong lock/unlock lien tuc vuot tan suat gioi han.
- AC relay phai co khoang tre toi thieu giua 2 lan dong/ngat.
- Neu sensor loi, auto mode phai fallback ve safe-state.

## 7) Device state machine tong quat
- offline
- online_idle
- executing_command
- auto_adjusting
- error

Chuyen trang thai phai co ly do va timestamp.

## 8) State synchronization policy
- ESP32 la authority cho state thuc te.
- Server giu state cache nho de phuc vu dashboard.
- Dashboard khong duoc tu luan state neu chua co ack.

## 9) Device onboarding (giai doan mo rong)
- Dang ky device metadata tren server.
- Mapping room va capability.
- Health check dinh ky.
- Bo sung firmware version va uptime de giam sat.

## 10) Bao tri va mo rong
- Them device moi bang cach tao capability profile rieng.
- Them rule engine cho auto mode theo room profile.
- Du tru migration sang MQTT topic theo device_id va room.
