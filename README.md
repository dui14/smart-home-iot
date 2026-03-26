# Smart Home (ESP32 + PlatformIO + Wokwi)

Project mô phỏng Smart Home trên **ESP32 DevKit V1** bằng **PlatformIO (Arduino framework)** và chạy được trên **Wokwi**.

## Tính năng

- Khóa cửa thông minh (SG90 Servo): `OPEN` / `CLOSE` (0° / 90°)
- Đèn 3 phòng điều khiển bằng “giọng nói” (giả lập qua Serial)
  - `LIGHT LIVING ON|OFF`
  - `LIGHT BEDROOM ON|OFF`
  - `LIGHT KITCHEN ON|OFF`
  - Bonus: `TURN ON ALL LIGHTS`, `TURN OFF ALL LIGHTS`
- Cảm biến nhiệt độ/độ ẩm hiển thị LCD 16x2 I2C, cập nhật mỗi 2 giây (không dùng `delay()`)
- LDR (GPIO34) bật/tắt **Auto Light** tự động theo ngưỡng tối/sáng
- Serial debug đầy đủ

## Wiring (theo diagram.json)

- Servo SG90: Signal → GPIO13
- Relay module: IN → GPIO27
- DHT (Wokwi dùng DHT22 để mô phỏng ổn định): DATA → GPIO15
  - Khuyến nghị thêm điện trở kéo lên (pull-up) 4.7k–10k từ DATA → 3.3V (project đã wiring sẵn trong diagram.json)
- LDR: AO → GPIO34 (qua cầu phân áp LDR + điện trở 10k)
- LED:
  - Living → GPIO18
  - Bedroom → GPIO19
  - Kitchen → GPIO23
  - Auto Light → GPIO25
- LCD 16x2 I2C:
  - SDA → GPIO21
  - SCL → GPIO22

> Lưu ý 1: Wokwi có test/support chính thức cho `wokwi-dht22` trên ESP32, còn DHT11 đôi khi bị `TIMEOUT`. Vì vậy project này dùng **DHT22 trong mô phỏng** để đảm bảo chạy ổn định. Khi chạy ngoài đời với DHT11, bạn chỉ cần đổi `dht.setup(..., DHTesp::DHT11)` trong code và thay cảm biến thật tương ứng.
>
> Lưu ý 2: GPIO21/22 là cặp I2C phổ biến trên ESP32. Nếu bạn **bắt buộc** dùng LED Kitchen=21 và AutoLight=22 như một số đề bài ghi, bạn cần đổi chân I2C LCD sang pin khác (và sửa lại `PIN_I2C_SDA/PIN_I2C_SCL` trong `src/main.cpp` + `diagram.json`).

## Serial Commands

Mở Serial Monitor baud **115200** và nhập lệnh (mỗi lệnh 1 dòng):

- Door:
  - `OPEN` / `CLOSE`
  - `OPEN DOOR` / `CLOSE DOOR`
- Lights:
  - `LIGHT LIVING ON`
  - `LIGHT BEDROOM OFF`
  - `LIGHT KITCHEN ON`
  - `TURN ON ALL LIGHTS`
  - `TURN OFF ALL LIGHTS`
- Debug:
  - `STATUS`
  - `DHTPROBE`
  - `HELP`

## Build / Run (PlatformIO)

- Build firmware:
  - `pio run`
- Monitor Serial:
  - `pio device monitor -b 115200`

## Run on Wokwi (VS Code)

1. Cài extension **Wokwi Simulator** trong VS Code
2. Mở project này và đảm bảo có file `diagram.json`
3. Chạy `pio run` để tạo `wokwi/firmware.bin`
4. Bấm **Start Simulation**

Nếu Wokwi extension yêu cầu đường dẫn firmware/elf, bạn có thể thêm file `wokwi.toml` trỏ tới `.pio/build/esp32dev/firmware.bin` và `.pio/build/esp32dev/firmware.elf`.
