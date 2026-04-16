# Fan Auto + Local Web Control

## Feature overview
- Bo sung logic auto fan tren ESP32.
- Dieu kien bat quat: nhiet do > 35C hoac do am > 85%.
- Dieu kien tat quat: nhiet do <= 35C va do am <= 85%.
- Bo sung endpoint ESP32 de dieu khien quat thu cong tu web local: `GET /fan?state=on|off`.
- Dashboard local co them quick control va manual command cho fan.

## Architecture impact
- Firmware layer:
  - Cap nhat `src/main.cpp` de danh gia ca nhiet do va do am khi auto fan.
  - Them handler HTTP `handleHttpControlFan`.
- Server layer:
  - Cap nhat `src/domain/deviceCatalog.js` de support `fan`.
  - Cap nhat `src/infrastructure/deviceClient.js` map `fan -> /fan`.
  - Cap nhat `src/infrastructure/stateStore.js` de luu state fan va dong bo fan tu sensor payload.
  - Cap nhat `src/domain/localCommandParser.js` de nhan lenh co tu khoa quat/fan.
- Presentation layer:
  - Cap nhat `public/index.html` them nut bat/tat quat va option Fan trong manual form.
  - Cap nhat `public/app.js` de tao payload theo tung device va gioi han action hop le theo device.

## API endpoints
- Server API giu nguyen endpoint control tong quat:
  - `POST /api/v1/control` voi payload `device: fan`, `action: on|off`.
- ESP32 endpoint moi:
  - `GET /fan?state=on`
  - `GET /fan?state=off`

## Validation summary
- Da bo sung `fan` vao command validation.
- `fan` khong can `room`.
- Action hop le cho `fan` la `on|off`.
- UI manual control tu dong doi action options theo device:
  - `lock`: `open|close`
  - `light/ac/fan`: `on|off`
