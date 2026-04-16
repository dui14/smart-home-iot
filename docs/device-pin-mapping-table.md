# Device Pin Mapping Table

## 1) Bang relay/LED

| Ten thiet bi | Ky hieu trong code | Ky hieu trong diagram | Chan OUT tren ESP32 | Chan IN tren module | Duong tai relay |
| --- | --- | --- | --- | --- | --- |
| Den phong khach | light1 / PIN_LIGHT_1 | relay1 + led1 | GPIO18 | relay1:IN | COM->VIN, NO->rLoad1->led1:A, led1:C->GND |
| Den phong ngu | light2 / PIN_LIGHT_2 | relay2 + led2 | GPIO19 | relay2:IN | COM->VIN, NO->rLoad2->led2:A, led2:C->GND |
| Den tu dong theo LDR | light3 / PIN_LIGHT_3 / auto_light | relay3 + led3 | GPIO23 | relay3:IN | COM->VIN, NO->rLoad3->led3:A, led3:C->GND |

## 2) Bang sensor input

| Ten thiet bi | Ky hieu trong code | Ky hieu trong diagram | Chan IN tren ESP32 | Chan OUT tren module |
| --- | --- | --- | --- | --- |
| Cam bien anh sang | PIN_LDR_DO | ldr | GPIO34 | ldr:DO |
| Cam bien nhiet do/do am | PIN_DHT_DATA | dht | GPIO15 | dht:SDA |

## 3) Bang relay/fan va lock

| Ten thiet bi | Ky hieu trong code | Ky hieu trong diagram | Chan OUT tren ESP32 | Chan IN tren module |
| --- | --- | --- | --- | --- |
| Quat (relay) | PIN_FAN_RELAY | relayFan + fan5v | GPIO26 | relayFan:IN |
| Khoa cua servo | PIN_SERVO_DOOR | servoDoor | GPIO13 | servoDoor:PWM |

## 4) Ghi chu quan trong

1. Firmware dang dung relay active-low: GPIO LOW = relay ON, GPIO HIGH = relay OFF.
2. LDR auto dang dung relay3 (light3):
   - Toi: bat den
   - Sang: tat den
3. Neu relay module sang den nhung LED tai khong sang, kiem tra lai day tai NO/COM va chieu chan A/C cua LED.
4. LCD I2C: SDA=GPIO21, SCL=GPIO22.
