# Smart Home IoT

Smart Home IoT is a smart home automation project built with Node.js, ESP32, PostgreSQL, and a web dashboard. The system supports real-time device control, sensor monitoring, automation workflows, and AI-powered natural language commands.

<img width="1280" height="720" alt="Smart Home Architecture" src="https://github.com/user-attachments/assets/f68ed4fd-7c4a-45ac-b170-4bf21d74aa34" />

## Features

* Control lights, fans, air conditioners, and door locks.
* Real-time synchronization between Web Dashboard, Server, and ESP32.
* Monitor environmental data from sensors (DHT22, LDR, etc.).
* Store chat history and command logs in PostgreSQL (Supabase recommended).
* AI-powered command processing using natural language.
* Support both Manual and Auto operation modes.

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/dui14/smart-home-iot.git
cd smart-home-iot
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Follow the instructions in: [SETUP.md](SETUP.md)

### 4. Start the Server

```bash
npm start
```

The API server runs by default at:

```text
http://localhost:3000
```

---

## ESP32 Setup

### Configure Wi-Fi Credentials

Update the Wi-Fi settings in `platformio.ini` before uploading firmware:

```ini
build_flags =
    -DWIFI_SSID_VALUE=\"YOUR_WIFI_SSID\"
    -DWIFI_PASSWORD_VALUE=\"YOUR_WIFI_PASSWORD\"
```

Example:

```ini
build_flags =
    -DWIFI_SSID_VALUE=\"MyHomeWiFi\"
    -DWIFI_PASSWORD_VALUE=\"12345678\"
```

---

## Circuit Configuration (Wokwi)

The hardware layout can be customized by editing:

```text
diagram.json
```

This file defines the virtual circuit used by Wokwi, including:

* ESP32 board configuration
* Sensors (DHT22, LDR, etc.)
* LEDs, relays, and actuators
* Pin connections and wiring

<img width="527" height="410" alt="image" src="https://github.com/user-attachments/assets/7abe9770-b666-4102-8367-5ef48998bb6f" />

> After modifying `diagram.json`, reload the Wokwi project to apply the changes.

---

## Firmware Upload

### PlatformIO (Recommended)

1. Install the PlatformIO IDE extension.
2. Open the firmware project folder.
3. Connect the ESP32 board via USB.
4. Build and upload the firmware:

```bash
pio run --target upload
```

Or use the **Build** and **Upload** buttons from the PlatformIO toolbar.

### Serial Monitor

```bash
pio device monitor
```

---

### Arduino IDE

If you prefer Arduino IDE, follow the official installation guide: [Arduino Documents](https://docs.arduino.cc/software/ide-v2/tutorials/getting-started/ide-v2-downloading-and-installing)

After installation:

1. Open the ESP32 firmware project.
2. Install ESP32 board support.
3. Select the correct board and COM port.
4. Upload the firmware.

---

## Dashboard

<img width="971" height="559" alt="Dashboard" src="https://github.com/user-attachments/assets/a36f0172-d49a-424c-b11e-70ecfb4e1af4" />

---

## Workflows

* [AI Command Workflow](./workflow/ai-command-flow.md#flow-diagram)
* [System Overview](./workflow/system-overview.md#system-overview)
* [Mode Switching Flow](./workflow/system-overview.md#mode-switch-diagram)

---

## Project Structure

```text
.
├── src/                 # Node.js API source
├── workflow/            # System workflow documentation
├── diagram.json         # Wokwi circuit configuration
├── platformio.ini       # PlatformIO configuration
└── SETUP.md             # Environment setup guide
```

## Tech Stack

* Node.js
* PostgreSQL / Supabase
* Redis
* ESP32
* PlatformIO
* Wokwi
* LLM API (OpenAI / Gemini)
