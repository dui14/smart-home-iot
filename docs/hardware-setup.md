# Hardware Setup

## 1) Muc tieu
Huong dan lap dat bo phan cung cho he thong Smart Home MVP voi ESP32, servo, relay, LDR va DHT22.

## 2) Danh sach phan cung
- ESP32 board
- Servo motor cho khoa cua
- Relay module cho den va AC
- LDR sensor cho anh sang
- DHT22 sensor cho nhiet do/do am
- Nguon cap phu hop cho tung module
- Day noi, breadboard hoac PCB prototype

## 3) Nguyen tac dau noi an toan
- Tach nguon servo/relay neu can de tranh sut ap ESP32.
- Dung chung GND giua ESP32 va module ngoai vi.
- Su dung dien tro phu hop cho LDR theo mach chia ap.
- Kiem tra dien ap vao relay/servo dung voi thong so.

## 4) Mapping phan cung de xac dinh
- Chan PWM cho servo lock.
- Chan digital output cho relay light.
- Chan digital output cho relay AC.
- Chan analog input cho LDR.
- Chan digital input cho DHT22.

## 5) Quy trinh lap dat
1. Kiem tra tung linh kien doc lap.
2. Dau noi ESP32 voi sensor truoc.
3. Them relay va kiem tra on/off.
4. Gan servo va calibration goc lock/unlock.
5. Chay thu he thong tong hop.

## 6) Kiem thu sau lap dat
- Doc duoc gia tri LDR va DHT22 on dinh.
- Relay bat/tat dung theo command.
- Servo quay dung goc lock/unlock.
- ESP32 duy tri ket noi Wi-Fi on dinh.

## 7) Loi thuong gap
- Servo rung do thieu nguon.
- Relay nhay bat thuong do noise.
- LDR dao dong manh khi anh sang bien thien.
- DHT22 tra ve null do tan suat doc qua cao.

## 8) Khuyen nghi bo tri
- Dat relay xa khoi khu vuc sensor nhay.
- Dat LDR tai vi tri dai dien anh sang phong.
- Co vo bao ve board neu dung lau dai.
