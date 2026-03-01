<<<<<<< HEAD
# SmartCatFeeder
เครื่องให้อาหารแมว
=======
# 🐱 Smart Cat Feeder (ESP8266 + MQTT)
------------------------------------=-=-=-=-=-=-=-=-=-=-=-=-=-=-vnwdegkbegaerbeaefgfgSgjb=-=-=-=-=-=-=-=-=-=-==-=---=-=-=--=-=-=--=-
ระบบเครื่องให้อาหารแมวอัจฉริยะ ควบคุมผ่านโปรโตคอล **MQTT** รองรับการชั่งน้ำหนักอาหาร (Load Cell), ตรวจสอบระดับอาหารในถัง (Ultrasonic) และแสดงผลผ่านหน้าจอ OLED พร้อมระบบจดจำผู้ใช้ผ่าน EEPROM

## 🌟 คุณสมบัติเด่น (Features)
* **Weight Monitoring:** ชั่งน้ำหนักอาหารในถาดแบบ Real-time ด้วย Load Cell (HX711)
* **Tank Level Sensor:** วัดระดับปริมาณอาหารคงเหลือในถังเก็บ (0-100%)
* **MQTT Remote Control:** สั่งการให้อาหารผ่าน Dashboard หรือแอปพลิเคชัน
* **Smart Pairing:** ระบบ Discovery จับคู่ Chip ID กับ User ID โดยอัตโนมัติและบันทึกลงหน่วยความจำ (EEPROM)
* **OLED Display:** แสดงผลสถานะเครือข่าย, น้ำหนักอาหาร และปริมาณในถังบนหน้าจอ

---

## 🛠 รายการอุปกรณ์ (Hardware Components)
* **Microcontroller:** ESP8266 (NodeMCU / WeMos D1 Mini)
* **Actuator:** Servo Motor (MG90S หรือรุ่นใกล้เคียง)
* **Sensors:**
    * Load Cell + HX711 Amplifier (Module ชั่งน้ำหนัก)
    * HC-SR04 Ultrasonic Sensor (วัดระยะ)
* **Display:** OLED 0.96" I2C (128x64)

---

## 📌 การต่อสายอุปกรณ์ (Pin Mapping)

| อุปกรณ์ | ขา ESP8266 | ฟังก์ชัน |
| :--- | :--- | :--- |
| **Servo Motor** | `D4` | ควบคุมการเปิด-ปิดช่องอาหาร |
| **Ultrasonic Trig** | `D5` | ส่งสัญญาณคลื่นเสียง |
| **Ultrasonic Echo** | `D6` | รับสัญญาณสะท้อน |
| **HX711 DT** | `D3` | Data Pin ของโหลดเซลล์ |
| **HX711 SCK** | `D7` | Clock Pin ของโหลดเซลล์ |
| **OLED SDA** | `D2` | I2C Data |
| **OLED SCL** | `D1` | I2C Clock |

---

## 🛰 โครงสร้างการเชื่อมต่อ (MQTT Topics)

ตัวเครื่องจะสื่อสารกับ Server ผ่าน Topic ดังนี้:

* **Discovery:** `device/discovery` (ใช้สำหรับลงทะเบียนอุปกรณ์ใหม่)
* **Status:** `device/status/{userId}/weight`
    * *Payload:* `{"weight": 0.0, "level": 100, "chipId": "xxxx"}`
* **Command:** `device/command/{userId}`
    * *Payload:* `{"amount": 20, "mode": "manual"}`
* **Log:** `device/status/{userId}/log` (ส่งยืนยันผลหลังให้อาหารเสร็จ)

---

## 🚀 การติดตั้ง (Installation)

1.  **Library ที่ต้องใช้:** ติดตั้ง Library เหล่านี้ใน Arduino IDE:
    * `ESP8266WiFi`
    * `PubSubClient`
    * `ArduinoJson`
    * `Adafruit_SSD1306` & `Adafruit_GFX`
    * `HX711` (โดย Bogdan Necula)
2.  **ตั้งค่า Wi-Fi & MQTT:** แก้ไข `ssid`, `password` และ `mqtt_server` ในโค้ด
3.  **Calibration:** ปรับค่า `calibration_factor` เพื่อให้ตาชั่งอ่านค่าได้ตรงตามจริง
4.  **Upload:** เลือกบอร์ดเป็น `NodeMCU 1.0 (ESP-12E Module)` และทำการเบิร์นโปรแกรม

---

## 📊 การทำงานของระบบ (System Logic)


1.  **Startup:** โหลด User ID ล่าสุดจาก EEPROM หากไม่มีจะใช้ค่า Default และรอรับการ Pair จากระบบ Discovery
2.  **Feeding Loop:** เมื่อรับคำสั่ง `amount` ระบบจะคำนวณจำนวนรอบการหมุนของ Servo (1 รอบ ≈ 10 กรัม)
3.  **Data Reporting:** ทุกๆ 2 วินาที เครื่องจะส่งน้ำหนักอาหารปัจจุบันและระดับอาหารในถังขึ้นไปยัง MQTT Broker
4.  **Display:** หน้าจอ OLED จะโชว์กราฟิกปริมาณอาหารและสถานะการเชื่อมต่อ MQTT

---

> **ข้อควรระวัง:** > - ควรใช้แหล่งจ่ายไฟแยกสำหรับ Servo หากมีอาการบอร์ด Reset เองเมื่อมอเตอร์ทำงาน 
> - ค่า `tankEmptyDist` และ `tankFullDist` ควรปรับตามความสูงจริงของถังอาหารที่คุณใช้

---
>>>>>>> 6ae255ada5c3df0440f27ed3b7ae9b7ffd8097f9
