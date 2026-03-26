# System Overview

## 1) Muc tieu du an
Xay dung he thong Smart Home IoT theo huong AI-native, giup nguoi dung dieu khien thiet bi trong nha theo 2 cach:
- Dieu khien truc tiep tren Web Dashboard
- Dieu khien bang ngon ngu tu nhien qua AI Assistant

He thong uu tien tinh don gian de trien khai local, de hoc tap va de mo rong sau nay.

## 2) Doi tuong su dung
- Nguoi dung gia dinh can giam sat va dieu khien thiet bi tu xa.
- Lap trinh vien hoc tich hop IoT + AI tren kien truc thuc te.

## 3) Pham vi chuc nang cốt loi
- Smart Door Lock: dong/mo khoa cua bang servo, co trang thai khoa hien tai.
- Smart Lighting: dieu khien den da phong, ho tro che do auto dua tren LDR.
- Smart Air Conditioning: dieu khien relay dieu hoa voi DHT22, ho tro auto/manual.
- AI Assistant: chuyen cau lenh ngon ngu tu nhien thanh lenh JSON hop le.
- Web Dashboard: giao dien tong quan, dieu khien, theo doi trang thai thiet bi.

## 4) Nguyen tac thiet ke
- Modular architecture: tach rieng dashboard, server, iot gateway va layer AI.
- API-first: tat ca tuong tac qua HTTP API voi contract ro rang.
- Device-state consistency: trang thai dashboard, server va ESP32 phai dong bo.
- Safety-first: co co che fallback, timeout, retry va phe duyet mode.
- Future-ready: de nang cap sang MQTT ma khong pha vo interface hien tai.

## 5) Cac thanh phan he thong
- Web Dashboard: HTML/CSS/JavaScript, gui yeu cau dieu khien va nhan trang thai.
- Node.js Server (Express): trung tam dieu phoi command, business rule, va tich hop AI.
- ESP32 HTTP API: layer dieu khien phan cung, doc sensor, cap nhat trang thai.
- Hardware devices: servo, relay, LDR, DHT22 va cac ngo vao/ra.
- LLM Provider (OpenRouter): phan tich cau lenh va tra ve command co cau truc.

## 6) Muc tieu phi chuc nang
- Do tre thap cho thao tac dieu khien truc tiep.
- Hoat dong on dinh tren mang LAN.
- Khong yeu cau dang nhap trong giai doan MVP.
- Tai nguyen nhe, co the chay tren may local.

## 7) Gioi han giai doan MVP
- Chua trien khai xac thuc nguoi dung.
- Chua bat buoc luu tru lich su dai han.
- Chua yeu cau giao thuc MQTT (se duoc thiet ke san interface de nang cap).

## 8) Tieu chi thanh cong
- Nguoi dung co the dieu khien 3 nhom thiet bi (khoa, den, dieu hoa) theo manual.
- Auto mode van hanh dung quy tac cam bien (LDR, DHT22).
- AI Assistant tra ve command JSON hop le, server xu ly duoc va gui xuong ESP32.
- Dashboard hien thi trang thai gan thoi gian thuc va nhat quan voi ESP32.

## 9) Cau truc tai lieu repository
- ai-context/: bo mo ta he thong, kien truc, data flow, quan ly thiet bi, AI.
- workflow/: quy trinh phat trien va van hanh theo tung luong.
- api/: hop dong API giua dashboard, server va ESP32.
- spec/features/: dac ta chi tiet tung tinh nang.
- docs/: huong dan setup phan cung, ESP32 va backend local.

## 10) Dinh huong mo rong
- Chuyen transport tu HTTP sang MQTT cho command va telemetry.
- Bo sung cache va data store de luu lich su, thong ke, canh bao.
- Them auth/authorization khi dua vao moi truong production.
- Ho tro them kieu thiet bi (cam bien chuyen dong, camera, smoke sensor).
