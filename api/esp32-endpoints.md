# ESP32 API Endpoints

Base URL: `http://<esp32-ip>`

## 1) GET /light?room=living&state=on
Muc dich: bat/tat den theo phong.

### Query params
1. `room`: `living` | `bedroom` | `kitchen`
2. `state`: `on` | `off`

### Response 200

```json
{
  "success": true,
  "code": "OK_COMMAND_APPLIED",
  "message": "Light updated",
  "data": {
    "device": "light",
    "room": "living",
    "state": "on"
  },
  "device_time": "2026-03-21T10:31:05Z"
}
```

## 2) GET /lock?state=open
Muc dich: mo/dong cua.

### Query params
1. `state`: `open` | `close`

### Response 200

```json
{
  "success": true,
  "code": "OK_COMMAND_APPLIED",
  "message": "Lock updated",
  "data": {
    "device": "lock",
    "state": "open"
  },
  "device_time": "2026-03-21T10:31:10Z"
}
```

## 3) GET /ac?state=on
Muc dich: bat/tat dieu hoa.

### Query params
1. `state`: `on` | `off`

### Response 200

```json
{
  "success": true,
  "code": "OK_COMMAND_APPLIED",
  "message": "AC updated",
  "data": {
    "device": "ac",
    "state": "on"
  },
  "device_time": "2026-03-21T10:31:12Z"
}
```

## 4) GET /sensor
Muc dich: tra du lieu sensor LDR va DHT22.

### Response 200

```json
{
  "success": true,
  "code": "OK_STATUS_FETCHED",
  "message": "Sensor snapshot",
  "data": {
    "ldr": {
      "living": 318,
      "bedroom": 205
    },
    "dht22": {
      "temperature": 28.3,
      "humidity": 65.9
    }
  },
  "device_time": "2026-03-21T10:31:20Z"
}
```

## 5) Error format

```json
{
  "success": false,
  "code": "ERR_INVALID_PAYLOAD",
  "message": "Invalid state value",
  "errors": [
    {
      "field": "state",
      "reason": "must be on|off"
    }
  ],
  "device_time": "2026-03-21T10:31:20Z"
}
```

Ma loi ESP32:
1. `ERR_INVALID_PAYLOAD`
2. `ERR_UNSUPPORTED_ACTION`
3. `ERR_ACTUATOR_FAILED`
4. `ERR_SENSOR_READ_FAILED`
5. `ERR_BUSY`

## 6) Timeout & retry cho kenh Server -> ESP32
1. ESP32 can phan hoi trong 1500ms
2. Neu timeout, server retry toi da 2 lan
3. Backoff: 200ms lan 1, 500ms lan 2
4. Neu van loi, server tra `ERR_DEVICE_TIMEOUT`

## 7) Luu y an toan
1. `lock` phai co cool-down toi thieu 2 giay giua 2 lenh
2. `ac` han che toggle lien tuc trong 5 giay
3. Neu DHT22 loi doc > 3 lan lien tiep, ESP32 tra `ERR_SENSOR_READ_FAILED`
