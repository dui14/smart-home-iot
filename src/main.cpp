/**
 * ESP32 + DHT22 + 16x2 I2C LCD demo.
 * Bổ sung kiểm tra LCD/I2C để dễ debug tình trạng màn hình chỉ sáng nền.
 */

#include <Arduino.h>
#include <Wire.h>

#include <DHTesp.h>
#include <WiFi.h>
#include <WebServer.h>
#include <ESP32Servo.h>
#include <LiquidCrystal_I2C.h>

// ========================
// Pin mapping (ESP32 DevKit V1)
// ========================
static const uint8_t PIN_DHT_DATA = 15;   // DHT22 data pin
static const uint8_t PIN_SERVO_DOOR = 13; // SG90 signal pin
static const uint8_t PIN_I2C_SDA = 21;    // I2C SDA
static const uint8_t PIN_I2C_SCL = 22;    // I2C SCL
static const uint8_t LCD_I2C_ADDR = 0x27; // Địa chỉ phổ biến, thay đổi nếu cần
static const uint8_t PIN_LIGHT_1 = 18;    // Phong khach
static const uint8_t PIN_LIGHT_2 = 19;    // Phong ngu 1
static const uint8_t PIN_LIGHT_3 = 23;    // Phong ngu 2
static const uint8_t PIN_LIGHT_4 = 17;    // Phong bep
static const uint8_t PIN_LDR_DO = 34;
static const uint8_t PIN_FAN_RELAY = 26;
static const uint8_t LIGHT_PINS[4] = {PIN_LIGHT_1, PIN_LIGHT_2, PIN_LIGHT_3, PIN_LIGHT_4};
static const bool LIGHT_ACTIVE_LOW[4] = {true, true, true, true};
static const bool FAN_RELAY_ACTIVE_LOW = true;
static const bool LDR_DARK_ACTIVE_HIGH = true;

// ========================
// Devices
// ========================
DHTesp dht;
Servo doorServo;
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ========================
// Timing / state
// ========================
static uint32_t dhtIntervalMs = 2000;     // Updated after dht.setup()
static const uint32_t DHT_BOOT_GRACE_MS = 2500;
static uint32_t lastDhtMs = 0;
static uint8_t dhtFailCount = 0;

static float lastTempC = NAN;
static float lastHumidity = NAN;
static bool lcdReady = false;
static bool doorOpen = false;
static bool roomLights[4] = {false, false, false, false};
static bool acOn = false;
static bool fanOn = false;
static bool fanWebPriority = false;
static bool ambientDark = false;
static bool ambientReady = false;
static int lastLdrDoRaw = LOW;
static int pendingLdrDoState = -1;
static uint32_t pendingLdrSinceMs = 0;
WebServer httpServer(80);

static const char *WIFI_SSID = WIFI_SSID_VALUE;
static const char *WIFI_PASSWORD = WIFI_PASSWORD_VALUE;
static const uint32_t WIFI_CONNECT_TIMEOUT_MS = 15000;
static const uint32_t WIFI_RETRY_INTERVAL_MS = 10000;
static uint32_t lastWifiRetryMs = 0;

static const uint8_t DOOR_OPEN_ANGLE = 0;
static const uint8_t DOOR_CLOSE_ANGLE = 90;
static const uint8_t AUTO_LIGHT_RELAY3_INDEX = 2;
static const uint32_t LDR_SAMPLE_INTERVAL_MS = 200;
static const uint32_t LDR_SWITCH_HOLD_MS = 600;
static const uint32_t LDR_DEBUG_INTERVAL_MS = 1000;
static const bool LDR_DEBUG_LOG_ENABLED = true;
static uint32_t lastLdrMs = 0;
static uint32_t lastLdrDebugMs = 0;
static const float FAN_TEMP_ON_C = 35.0f;
static const float FAN_TEMP_OFF_C = 35.0f;
static const float FAN_HUMIDITY_ON_PERCENT = 85.0f;
static const float FAN_HUMIDITY_OFF_PERCENT = 85.0f;

// ========================
// Helpers
// ========================
static void lcdPrintPadded(uint8_t row, const String &text);
static void readAndDisplayDht();
static void updateLightByAmbient();
static bool probeI2cAddress(uint8_t address);
static void processSerialCommands();
static void setDoorState(bool openDoor);
static void setFanState(bool on);
static void applyAutoFanByClimate();
static void setLightState(uint8_t lightIndex, bool on);
static void printLightHelp();
static void printStatus();
static bool connectWifi();
static void ensureWifiConnected();
static const char *wifiStatusText(wl_status_t status);
static void printWifiScanForTarget();
static void setupHttpServer();
static void handleHttpControlLight();
static void handleHttpControlLock();
static void handleHttpControlAc();
static void handleHttpControlFan();
static void handleHttpSensor();
static void handleHttpNotFound();
static int findRoomIndex(const String &room);
static bool parseOnOffState(const String &value, bool &result);
static uint8_t resolveRelayOutputLevel(bool on, bool activeLow);

// ========================
// Setup / Loop
// ========================
void setup() {
  Serial.begin(115200);
  Serial.println();
  Serial.println(F("[SmartHome] ESP32 + DHT22 + LCD + SG90"));
  Serial.printf("[Build] %s %s\n", __DATE__, __TIME__);

  WiFi.mode(WIFI_STA);
  connectWifi();

  doorServo.setPeriodHertz(50);
  doorServo.attach(PIN_SERVO_DOOR, 500, 2400);
  setDoorState(false);

  for (uint8_t i = 0; i < 4; i++) {
    pinMode(LIGHT_PINS[i], OUTPUT);
    setLightState(i, false);
  }

  pinMode(PIN_FAN_RELAY, OUTPUT);
  setFanState(false);

  pinMode(PIN_LDR_DO, INPUT);

  Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
  Wire.setClock(100000); // tốc độ mặc định cho LCD I2C

  if (probeI2cAddress(LCD_I2C_ADDR)) {
    lcd.init();
    lcd.backlight();
    lcdReady = true;
    lcdPrintPadded(0, "DHT Monitor");
    lcdPrintPadded(1, "Starting...");
    Serial.println(F("[LCD] Khoi tao thanh cong"));
  } else {
    Serial.println(F("[LCD] Khong tim thay thiet bi tai dia chi 0x27"));
    Serial.println(F("[LCD] Hay kiem tra day SDA/SCL, VCC, va bien tro contrast"));
  }

  pinMode(PIN_DHT_DATA, INPUT);
  dht.setup(PIN_DHT_DATA, DHTesp::DHT22);
  dht.resetTimer();
  dhtIntervalMs = static_cast<uint32_t>(dht.getMinimumSamplingPeriod());
  setupHttpServer();
  updateLightByAmbient();

  Serial.printf("[Pins] DHT=%u, LCD SDA=%u, SCL=%u\n",
                PIN_DHT_DATA, PIN_I2C_SDA, PIN_I2C_SCL);
  Serial.printf("[Pins] SERVO=%u\n", PIN_SERVO_DOOR);
  Serial.printf("[Pins] LIGHT1=%u, LIGHT2=%u, LIGHT3=%u, LIGHT4=%u\n",
                PIN_LIGHT_1, PIN_LIGHT_2, PIN_LIGHT_3, PIN_LIGHT_4);
  Serial.printf("[Pins] LDR_DO=%u\n", PIN_LDR_DO);
  Serial.printf("[LDR] Dark active level=%s\n", LDR_DARK_ACTIVE_HIGH ? "HIGH" : "LOW");
  Serial.printf("[Pins] FAN_RELAY=%u\n", PIN_FAN_RELAY);
  Serial.printf("[DHT] Model=%s, minPeriod=%ums\n",
                (dht.getModel() == DHTesp::DHT22) ? "DHT22" : "OTHER",
                static_cast<unsigned>(dhtIntervalMs));
  Serial.println(F("[CMD] OPEN / CLOSE / STATUS"));
  printLightHelp();
  Serial.printf("[AUTO] LDR controls RELAY3 (LIGHT%u) (dark=ON, bright=OFF)\n",
                static_cast<unsigned>(AUTO_LIGHT_RELAY3_INDEX + 1));
  Serial.printf("[AUTO] FAN ON: Temp>%.1fC or Humidity>%.0f%% | OFF: Temp<=%.1fC and Humidity<=%.0f%%\n",
                FAN_TEMP_ON_C,
                FAN_HUMIDITY_ON_PERCENT,
                FAN_TEMP_OFF_C,
                FAN_HUMIDITY_OFF_PERCENT);
}

void loop() {
  ensureWifiConnected();
  httpServer.handleClient();
  updateLightByAmbient();
  processSerialCommands();
  readAndDisplayDht();
}

// ========================
// Logic
// ========================
static void readAndDisplayDht() {
  const uint32_t now = millis();
  if (now < DHT_BOOT_GRACE_MS) {
    return;  // wait for sensor to stabilize
  }
  if ((now - lastDhtMs) < dhtIntervalMs) {
    return;
  }
  lastDhtMs = now;

  const TempAndHumidity values = dht.getTempAndHumidity();
  const float t = values.temperature;
  const float h = values.humidity;

  if (isnan(h) || isnan(t) || dht.getStatus() != 0) {
    Serial.printf("[DHT] Read failed (%s)\n", dht.getStatusString());
    lcdPrintPadded(0, "Sensor loi");
    lcdPrintPadded(1, "Kiem tra day");

    if (dhtFailCount < 255) {
      dhtFailCount++;
    }
    if (dhtFailCount >= 3) {
      Serial.println(F("[DHT] Re-init after failures"));
      dht.setup(PIN_DHT_DATA, DHTesp::DHT22);
      dht.resetTimer();
      dhtIntervalMs = static_cast<uint32_t>(dht.getMinimumSamplingPeriod());
      dhtFailCount = 0;
    }
    return;
  }

  dhtFailCount = 0;
  lastTempC = t;
  lastHumidity = h;

  if (!fanWebPriority) {
    applyAutoFanByClimate();
  }

  Serial.printf("[DHT] Nhiet do %.1fC | Do am %.0f%%\n", lastTempC, lastHumidity);

  const String line0 = String("Nhiet: ") + String(lastTempC, 1) + "C";
  const String line1 = String("Do am: ") + String(lastHumidity, 0) + "%";
  lcdPrintPadded(0, line0);
  lcdPrintPadded(1, line1);
}

static void updateLightByAmbient() {
  const uint32_t now = millis();
  if (ambientReady && (now - lastLdrMs) < LDR_SAMPLE_INTERVAL_MS) {
    return;
  }
  lastLdrMs = now;

  const int doState = digitalRead(PIN_LDR_DO);
  lastLdrDoRaw = doState;
  const bool dark = LDR_DARK_ACTIVE_HIGH ? (doState == HIGH) : (doState == LOW);

  if (LDR_DEBUG_LOG_ENABLED && (now - lastLdrDebugMs) >= LDR_DEBUG_INTERVAL_MS) {
    lastLdrDebugMs = now;
    Serial.printf("[LDR-DBG] DO=%d | DARK=%s | AUTO_LIGHT=%s\n",
                  doState,
                  dark ? "YES" : "NO",
                  roomLights[AUTO_LIGHT_RELAY3_INDEX] ? "ON" : "OFF");
  }

  if (!ambientReady) {
    ambientDark = dark;
    ambientReady = true;
    setLightState(AUTO_LIGHT_RELAY3_INDEX, ambientDark);
    Serial.printf("[LDR] Init state=%s (DO=%d)\n", ambientDark ? "DARK" : "BRIGHT", doState);
    return;
  }

  if (dark == ambientDark) {
    pendingLdrDoState = -1;
    pendingLdrSinceMs = 0;
    return;
  }

  if (pendingLdrDoState != doState) {
    pendingLdrDoState = doState;
    pendingLdrSinceMs = now;
    return;
  }

  if ((now - pendingLdrSinceMs) < LDR_SWITCH_HOLD_MS) {
    return;
  }

  ambientDark = dark;
  pendingLdrDoState = -1;
  pendingLdrSinceMs = 0;
  setLightState(AUTO_LIGHT_RELAY3_INDEX, ambientDark);
  Serial.printf("[LDR] Ambient=%s (DO=%d) -> AUTO light %s\n",
                ambientDark ? "DARK" : "BRIGHT",
                doState,
                ambientDark ? "ON" : "OFF");
}

static void lcdPrintPadded(uint8_t row, const String &text) {
  if (!lcdReady) {
    return;  // tránh treo nếu LCD không sẵn sàng
  }

  lcd.setCursor(0, row);
  String out = text;
  if (out.length() > 16) {
    out = out.substring(0, 16);
  }
  while (out.length() < 16) {
    out += ' ';
  }
  lcd.print(out);
}

static bool probeI2cAddress(uint8_t address) {
  Wire.beginTransmission(address);
  return (Wire.endTransmission() == 0);
}

static bool connectWifi() {
  Serial.printf("[WiFi] Connecting to SSID: %s\n", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  const uint32_t start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < WIFI_CONNECT_TIMEOUT_MS) {
    delay(300);
    Serial.print('.');
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[WiFi] Connected | IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("[WiFi] RSSI: %d dBm\n", WiFi.RSSI());
    Serial.printf("[WiFi] Use ESP32_BASE_URL=http://%s\n", WiFi.localIP().toString().c_str());
    return true;
  }

  const wl_status_t status = WiFi.status();
  Serial.printf("[WiFi] Connect failed. status=%d (%s)\n",
                static_cast<int>(status),
                wifiStatusText(status));
  printWifiScanForTarget();
  Serial.println(F("[WiFi] Connect timeout. Will retry in loop."));
  return false;
}

static void ensureWifiConnected() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  const uint32_t now = millis();
  if ((now - lastWifiRetryMs) < WIFI_RETRY_INTERVAL_MS) {
    return;
  }

  lastWifiRetryMs = now;
  Serial.println(F("[WiFi] Lost connection. Reconnecting..."));
  connectWifi();
}

static const char *wifiStatusText(wl_status_t status) {
  switch (status) {
  case WL_IDLE_STATUS:
    return "IDLE";
  case WL_NO_SSID_AVAIL:
    return "NO_SSID_AVAIL";
  case WL_SCAN_COMPLETED:
    return "SCAN_COMPLETED";
  case WL_CONNECTED:
    return "CONNECTED";
  case WL_CONNECT_FAILED:
    return "CONNECT_FAILED (wrong password or auth mismatch)";
  case WL_CONNECTION_LOST:
    return "CONNECTION_LOST";
  case WL_DISCONNECTED:
    return "DISCONNECTED";
  default:
    return "UNKNOWN";
  }
}

static void printWifiScanForTarget() {
  const int networkCount = WiFi.scanNetworks();
  if (networkCount <= 0) {
    Serial.println(F("[WiFi] Scan: no network found"));
    return;
  }

  bool foundTarget = false;
  for (int i = 0; i < networkCount; i++) {
    if (WiFi.SSID(i) == WIFI_SSID) {
      foundTarget = true;
      Serial.printf("[WiFi] Target seen: RSSI=%d dBm, channel=%d, encryption=%d\n",
                    WiFi.RSSI(i),
                    WiFi.channel(i),
                    static_cast<int>(WiFi.encryptionType(i)));
    }
  }

  if (!foundTarget) {
    Serial.printf("[WiFi] Scan: target SSID '%s' not found\n", WIFI_SSID);
  }

  WiFi.scanDelete();
}

static void setupHttpServer() {
  httpServer.on("/light", HTTP_GET, handleHttpControlLight);
  httpServer.on("/lock", HTTP_GET, handleHttpControlLock);
  httpServer.on("/ac", HTTP_GET, handleHttpControlAc);
  httpServer.on("/fan", HTTP_GET, handleHttpControlFan);
  httpServer.on("/sensor", HTTP_GET, handleHttpSensor);
  httpServer.onNotFound(handleHttpNotFound);
  httpServer.begin();
  Serial.println(F("[HTTP] Server started on port 80"));
}

static void handleHttpControlLight() {
  if (!httpServer.hasArg("room") || !httpServer.hasArg("state")) {
    httpServer.send(400, "application/json", "{\"ok\":false,\"error\":\"room and state are required\"}");
    return;
  }

  const int roomIndex = findRoomIndex(httpServer.arg("room"));
  if (roomIndex < 0) {
    httpServer.send(400, "application/json", "{\"ok\":false,\"error\":\"unsupported room\"}");
    return;
  }

  bool on = false;
  if (!parseOnOffState(httpServer.arg("state"), on)) {
    httpServer.send(400, "application/json", "{\"ok\":false,\"error\":\"state must be on/off\"}");
    return;
  }

  setLightState(static_cast<uint8_t>(roomIndex), on);
  const uint8_t lightPin = LIGHT_PINS[static_cast<uint8_t>(roomIndex)];
  const int gpioLevel = digitalRead(lightPin);
  httpServer.send(200,
                  "application/json",
                  String("{\"ok\":true,\"device\":\"light\",\"room\":\"") +
                      httpServer.arg("room") + "\",\"state\":\"" + (on ? "on" : "off") +
                      "\",\"gpio\":" + String(lightPin) +
                      ",\"gpio_level\":\"" + (gpioLevel == LOW ? "LOW" : "HIGH") + "\"}");
}

static void handleHttpControlLock() {
  if (!httpServer.hasArg("state")) {
    httpServer.send(400, "application/json", "{\"ok\":false,\"error\":\"state is required\"}");
    return;
  }

  const String raw = httpServer.arg("state");
  String state = raw;
  state.trim();
  state.toLowerCase();

  if (state == "open" || state == "unlock") {
    setDoorState(true);
    httpServer.send(200, "application/json", "{\"ok\":true,\"device\":\"lock\",\"state\":\"open\"}");
    return;
  }

  if (state == "close" || state == "lock") {
    setDoorState(false);
    httpServer.send(200, "application/json", "{\"ok\":true,\"device\":\"lock\",\"state\":\"close\"}");
    return;
  }

  httpServer.send(400, "application/json", "{\"ok\":false,\"error\":\"state must be open/close\"}");
}

static void handleHttpControlAc() {
  if (!httpServer.hasArg("state")) {
    httpServer.send(400, "application/json", "{\"ok\":false,\"error\":\"state is required\"}");
    return;
  }

  bool on = false;
  if (!parseOnOffState(httpServer.arg("state"), on)) {
    httpServer.send(400, "application/json", "{\"ok\":false,\"error\":\"state must be on/off\"}");
    return;
  }

  acOn = on;
  Serial.printf("[AC] %s\n", acOn ? "ON" : "OFF");
  httpServer.send(200,
                  "application/json",
                  String("{\"ok\":true,\"device\":\"ac\",\"state\":\"") +
                      (acOn ? "on" : "off") + "\"}");
}

static void handleHttpControlFan() {
  if (!httpServer.hasArg("state")) {
    httpServer.send(400, "application/json", "{\"ok\":false,\"error\":\"state is required\"}");
    return;
  }

  bool on = false;
  if (!parseOnOffState(httpServer.arg("state"), on)) {
    httpServer.send(400, "application/json", "{\"ok\":false,\"error\":\"state must be on/off\"}");
    return;
  }

  if (on) {
    fanWebPriority = true;
    setFanState(true);
  } else {
    fanWebPriority = false;
    applyAutoFanByClimate();
  }

  httpServer.send(200,
                  "application/json",
                  String("{\"ok\":true,\"device\":\"fan\",\"state\":\"") +
                      (fanOn ? "on" : "off") +
                      "\",\"mode\":\"" + (fanWebPriority ? "web_priority" : "auto") + "\"}");
}

static void handleHttpSensor() {
  String json = String("{\"ok\":true") +
                ",\"data\":{" +
                "\"dht22\":{" +
                "\"temperature\":" + (isnan(lastTempC) ? String("null") : String(lastTempC, 1)) +
                ",\"humidity\":" + (isnan(lastHumidity) ? String("null") : String(lastHumidity, 0)) +
                "}," +
                "\"ldr\":{" +
                "\"do\":" + String(lastLdrDoRaw) +
                ",\"state\":\"" + (ambientDark ? "dark" : "bright") + "\"" +
                "}," +
                "\"temperature\":" + (isnan(lastTempC) ? String("null") : String(lastTempC, 1)) +
                ",\"humidity\":" + (isnan(lastHumidity) ? String("null") : String(lastHumidity, 0)) +
                ",\"door\":\"" + (doorOpen ? "open" : "close") + "\"" +
                ",\"ac\":\"" + (acOn ? "on" : "off") + "\"" +
                ",\"fan\":\"" + (fanOn ? "on" : "off") + "\"" +
                ",\"fan_mode\":\"" + (fanWebPriority ? "web_priority" : "auto") + "\"" +
                ",\"wifi\":\"" + ((WiFi.status() == WL_CONNECTED) ? "connected" : "disconnected") + "\"" +
                ",\"lights\":{" +
                "\"living\":\"" + (roomLights[0] ? "on" : "off") + "\"," +
                "\"bedroom\":\"" + (roomLights[1] ? "on" : "off") + "\"," +
                "\"kitchen\":\"" + (roomLights[3] ? "on" : "off") + "\"," +
                "\"auto_light\":\"" + (roomLights[2] ? "on" : "off") + "\"," +
                "\"light1\":\"" + (roomLights[0] ? "on" : "off") + "\"," +
                "\"light2\":\"" + (roomLights[1] ? "on" : "off") + "\"," +
                "\"light3\":\"" + (roomLights[2] ? "on" : "off") + "\"," +
                "\"light4\":\"" + (roomLights[3] ? "on" : "off") + "\"" +
                "}," +
                "\"gpio\":{" +
                "\"light1\":" + String(digitalRead(LIGHT_PINS[0])) + "," +
                "\"light2\":" + String(digitalRead(LIGHT_PINS[1])) + "," +
                "\"light3\":" + String(digitalRead(LIGHT_PINS[2])) + "," +
                "\"light4\":" + String(digitalRead(LIGHT_PINS[3])) + "," +
                "\"fan\":" + String(digitalRead(PIN_FAN_RELAY)) +
                "}}}";

  httpServer.send(200, "application/json", json);
}

static void handleHttpNotFound() {
  httpServer.send(404, "application/json", "{\"ok\":false,\"error\":\"not found\"}");
}

static int findRoomIndex(const String &room) {
  String normalized = room;
  normalized.trim();
  normalized.toLowerCase();

  if (normalized == "living" || normalized == "living_room" || normalized == "led1" || normalized == "light1") {
    return 0;
  }
  if (normalized == "bedroom" || normalized == "bed_room" || normalized == "led2" || normalized == "light2") {
    return 1;
  }
  if (normalized == "auto_light" || normalized == "ldr" || normalized == "led3" || normalized == "light3") {
    return 2;
  }
  if (normalized == "kitchen" || normalized == "led4" || normalized == "light4") {
    return 3;
  }
  return -1;
}

static bool parseOnOffState(const String &value, bool &result) {
  String normalized = value;
  normalized.trim();
  normalized.toLowerCase();
  if (normalized == "on") {
    result = true;
    return true;
  }
  if (normalized == "off") {
    result = false;
    return true;
  }
  return false;
}

static void processSerialCommands() {
  if (!Serial.available()) {
    return;
  }

  String cmd = Serial.readStringUntil('\n');
  cmd.trim();
  cmd.toUpperCase();

  if (cmd == "OPEN" || cmd == "OPEN DOOR") {
    setDoorState(true);
    return;
  }
  if (cmd == "CLOSE" || cmd == "CLOSE DOOR") {
    setDoorState(false);
    return;
  }
  if (cmd == "STATUS") {
    printStatus();
    return;
  }

  if (cmd == "LIGHT1 ON" || cmd == "L1 ON") {
    setLightState(0, true);
    return;
  }
  if (cmd == "LIGHT1 OFF" || cmd == "L1 OFF") {
    setLightState(0, false);
    return;
  }

  if (cmd == "LIGHT2 ON" || cmd == "L2 ON") {
    setLightState(1, true);
    return;
  }
  if (cmd == "LIGHT2 OFF" || cmd == "L2 OFF") {
    setLightState(1, false);
    return;
  }

  if (cmd == "LIGHT3 ON" || cmd == "L3 ON") {
    setLightState(2, true);
    return;
  }
  if (cmd == "LIGHT3 OFF" || cmd == "L3 OFF") {
    setLightState(2, false);
    return;
  }

  if (cmd == "LIGHT4 ON" || cmd == "L4 ON") {
    setLightState(3, true);
    return;
  }
  if (cmd == "LIGHT4 OFF" || cmd == "L4 OFF") {
    setLightState(3, false);
    return;
  }

  Serial.println(F("[CMD] Khong hop le. Dung: OPEN, CLOSE, STATUS, LIGHTx ON/OFF"));
  printLightHelp();
}

static void setDoorState(bool openDoor) {
  const uint8_t targetAngle = openDoor ? DOOR_OPEN_ANGLE : DOOR_CLOSE_ANGLE;
  doorServo.write(targetAngle);
  doorOpen = openDoor;
  Serial.printf("[DOOR] %s (%u deg)\n", doorOpen ? "OPEN" : "CLOSE", targetAngle);
}

static void setFanState(bool on) {
  fanOn = on;
  const uint8_t driveLevel = resolveRelayOutputLevel(fanOn, FAN_RELAY_ACTIVE_LOW);
  digitalWrite(PIN_FAN_RELAY, driveLevel);
  const int readLevel = digitalRead(PIN_FAN_RELAY);
  Serial.printf("[FAN] %s | GPIO=%u | drive=%s | read=%d\n",
                fanOn ? "ON" : "OFF",
                PIN_FAN_RELAY,
                driveLevel == LOW ? "LOW" : "HIGH",
                readLevel);
}

static void applyAutoFanByClimate() {
  if (isnan(lastTempC) || isnan(lastHumidity)) {
    return;
  }

  const bool shouldFanOn = (lastTempC > FAN_TEMP_ON_C) || (lastHumidity > FAN_HUMIDITY_ON_PERCENT);
  const bool shouldFanOff = (lastTempC <= FAN_TEMP_OFF_C) && (lastHumidity <= FAN_HUMIDITY_OFF_PERCENT);

  if (!fanOn && shouldFanOn) {
    setFanState(true);
  } else if (fanOn && shouldFanOff) {
    setFanState(false);
  }
}

static void setLightState(uint8_t lightIndex, bool on) {
  if (lightIndex >= 4) {
    return;
  }

  roomLights[lightIndex] = on;
  const uint8_t driveLevel = resolveRelayOutputLevel(on, LIGHT_ACTIVE_LOW[lightIndex]);
  digitalWrite(LIGHT_PINS[lightIndex], driveLevel);
  const int readLevel = digitalRead(LIGHT_PINS[lightIndex]);
  Serial.printf("[LIGHT] Room %u = %s | GPIO=%u | drive=%s | read=%d\n",
                static_cast<unsigned>(lightIndex + 1),
                on ? "ON" : "OFF",
                LIGHT_PINS[lightIndex],
                driveLevel == LOW ? "LOW" : "HIGH",
                readLevel);
}

static uint8_t resolveRelayOutputLevel(bool on, bool activeLow) {
  if (activeLow) {
    return on ? LOW : HIGH;
  }
  return on ? HIGH : LOW;
}

static void printLightHelp() {
  Serial.println(F("[CMD] LIGHT1 ON/OFF (L1 ON/OFF)"));
  Serial.println(F("[CMD] LIGHT2 ON/OFF (L2 ON/OFF)"));
  Serial.println(F("[CMD] LIGHT3 ON/OFF (L3 ON/OFF)"));
  Serial.println(F("[CMD] LIGHT4 ON/OFF (L4 ON/OFF)"));
}

static void printStatus() {
  Serial.printf("[STATUS] Door=%s | Temp=%.1fC | Hum=%.0f%%\n",
                doorOpen ? "OPEN" : "CLOSE",
                lastTempC,
                lastHumidity);
  Serial.printf("[STATUS] Ambient=%s | AUTO_LIGHT=%s\n",
                ambientDark ? "DARK" : "BRIGHT",
                roomLights[AUTO_LIGHT_RELAY3_INDEX] ? "ON" : "OFF");
  Serial.printf("[STATUS] LDR_DO=%d | DARK_ACTIVE=%s\n",
                lastLdrDoRaw,
                LDR_DARK_ACTIVE_HIGH ? "HIGH" : "LOW");
  Serial.printf("[STATUS] FAN=%s | MODE=%s | ON if Temp>%.1fC or Hum>%.0f%% | OFF if Temp<=%.1fC and Hum<=%.0f%%\n",
                fanOn ? "ON" : "OFF",
                fanWebPriority ? "WEB_PRIORITY" : "AUTO",
                FAN_TEMP_ON_C,
                FAN_HUMIDITY_ON_PERCENT,
                FAN_TEMP_OFF_C,
                FAN_HUMIDITY_OFF_PERCENT);
  Serial.printf("[STATUS] WiFi=%s | IP=%s\n",
                (WiFi.status() == WL_CONNECTED) ? "CONNECTED" : "DISCONNECTED",
                WiFi.localIP().toString().c_str());
  Serial.printf("[STATUS] L1=%s | L2=%s | L3=%s | L4=%s\n",
                roomLights[0] ? "ON" : "OFF",
                roomLights[1] ? "ON" : "OFF",
                roomLights[2] ? "ON" : "OFF",
                roomLights[3] ? "ON" : "OFF");
}