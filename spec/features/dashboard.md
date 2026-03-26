# Feature Spec: Dashboard (Control UI)

## 1) Description
Dashboard la giao dien dieu khien trung tam cho Smart Home IoT, cho phep user xem state real-time va thao tac lock/light/ac bang manual hoac AI command.

## 2) Scope
- In scope:
	- Tong quan trang thai thiet bi.
	- Control panel cho smart-lock, smart-light, smart-ac.
	- AI command console parse va execute.
	- Health indicator server/ESP32/AI.
- Out of scope:
	- Phan quyen user.
	- Push notification mobile.
	- Analytics usage nang cao.

## 3) User Scenarios
1. User mo dashboard, xem nhanh lock state, den cac phong, AC mode.
2. User bat den `living_room` va thay state doi ngay tren giao dien.
3. User doi AC sang auto mode, set target temp, theo doi temp sensor.
4. User nhap lenh AI, xem parsed command va execution result.

## 4) Input / Output
### Input
- Tu nguoi dung:
	- Click lock/unlock.
	- Toggle light room on/off.
	- Switch AC mode manual/auto.
	- Nhap AI text command.

### Output
- UI state:
	- Device cards cap nhat real-time.
	- Badge `processing/success/failed` cho moi command.
	- Thong bao loi co ma loi va message.
	- Health badges: server, esp32, ai.

## 5) API Interaction
### Dashboard -> Server
- `GET /api/v1/health` de cap nhat health indicator.
- `GET /api/v1/state` de cap nhat state tong hop.
- `POST /api/v1/command` cho thao tac manual.
- `POST /api/v1/mode` cho switch mode.
- `POST /api/v1/ai/parse-only` va `POST /api/v1/ai/parse-and-execute`.

### Dashboard polling strategy
1. Poll `health` va `state` theo chu ky ngan.
2. Sau command thanh cong, trigger refresh state ngay.
3. Neu command that bai, giu state cu va hien thong tin loi.

## 6) Device Behavior Impact
- Dashboard khong can giao tiep truc tiep ESP32.
- Moi thao tac UI se kich hoat server orchestration den ESP32.
- UI phan biet ro state tu command manual va state tu auto mode sensor.

## 7) UX Rules
- Disable control cung target trong luc dang processing.
- Neu room dang auto mode, hien canh bao khi user bam on/off truc tiep.
- Luon hien `last_updated_at` de user biet do moi cua state.
- AI result panel hien ca parsed JSON va ket qua execute.

## 8) Edge Cases
1. Server mat ket noi: hien banner offline, disable control tan cong.
2. ESP32 offline: control gui lenh van duoc thu, nhung tra loi loi ro rang.
3. State stale do polling delay: UI danh dau stale va tu dong refresh lai.
4. User bam lien tuc cung nut: client debounce + request_id idempotent.
5. AI parse fail: UI hien parsed section rong kem ly do loi.

## 9) Acceptance Criteria
1. User dieu khien lock/light/ac ma khong can reload trang.
2. State tren UI dong nhat voi state server sau moi command.
3. AI command duoc gui, parse, execute va hien ket qua day du.
4. Loi fail-case duoc hien thi ro theo code contract.
