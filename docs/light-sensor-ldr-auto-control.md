# Light Sensor LDR Auto Control

## Feature overview
- Bo sung 1 cam bien anh sang LDR vao mo hinh Wokwi.
- Bo sung them 1 relay + 1 LED tai rieng cho logic den theo anh sang.
- Bo sung them 1 relay + tai quat 5V (mo phong bang buzzer tai Wokwi) cho logic theo nhiet do.
- Dieu kien hoat dong:
  - Troi toi (khong co anh sang): den LDR bat.
  - Troi sang (co anh sang): den LDR tat.
  - Nhiet do > 35 do C: quat bat.
  - Nhiet do <= 33.5 do C: quat tat.

## Wiring impact
- LDR module: `wokwi-photoresistor-sensor`
- Day noi:
  - `ldr:VCC -> esp:3V3`
  - `ldr:GND -> esp:GND.1`
  - `ldr:DO -> esp:D34`

- Relay den theo LDR (relay3):
  - `relay3:IN -> esp:D16`
  - `relay3:COM -> esp:VIN`
  - `relay3:NO -> rLoad3 -> led3:A`
  - `led3:C -> esp:GND.1`

- Relay quat nhiet do (relayFan):
  - `relayFan:IN -> esp:D26`
  - `relayFan:COM -> esp:VIN`
  - `relayFan:NO -> fan5v:+`
  - `fan5v:- -> esp:GND.1`

- Tat ca relay dat transistor `pnp` de dong bo active-low voi firmware.
- Day noi cua DHT22, LCD I2C, servo, relay va LED load cu duoc giu nguyen.

## Firmware impact
- Them pin input cho LDR: `PIN_LDR_DO = 34`.
- Them pin relay quat: `PIN_FAN_RELAY = 26`.
- Auto logic anh sang theo tin hieu digital DO (dark=HIGH, bright=LOW).
- Auto den LDR hien tai dieu khien `LIGHT1` (relay3 tren pin 16).
- Fan auto theo DHT:
  - Bat o `>= 35.0C`
  - Tat o `<= 33.5C`

## API impact
- `GET /sensor` bo sung truong `ldr`:
  - `do`: 0|1
  - `state`: `dark|bright`
- `GET /sensor` bo sung truong `fan`: `on|off`
- Cac endpoint cu (`/light`, `/lock`, `/ac`) giu nguyen.

## Validation summary
- Da cap nhat so do Wokwi voi LDR, relay3+led3, relayFan+fan5v.
- Da cap nhat firmware de xu ly auto bat/tat theo sang/toi va theo nguong nhiet.
- Da kiem tra loi editor cho `src/main.cpp` va `diagram.json`: khong co loi.
- Build CLI chua xac nhan duoc tren may hien tai vi thieu `platformio`/`pio` trong PATH.

## Quick test on Wokwi
1. Mo mo phong va chay firmware.
2. Giam gia tri lux cua LDR xuong thap -> `led3` bat.
3. Tang gia tri lux cua LDR len cao -> `led3` tat.
4. Tang nhiet do DHT len >35 do C -> `fan5v` bat.
5. Giam nhiet do xuong <=33.5 do C -> `fan5v` tat.
6. Goi `GET /sensor` de kiem tra `data.ldr.state` va `data.fan`.

## Note cho phan cung that
1. Neu dung quat 5V that, noi quat vao COM/NO cua relayFan nhu mo hinh.
2. Nguon quat co the tach rieng, nhung bat buoc chung GND voi ESP32.
3. Khong cap dong quat truc tiep tu chan GPIO ESP32.
