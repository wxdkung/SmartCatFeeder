#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Servo.h>
#include <EEPROM.h>
#include "HX711.h" 

// --- WiFi & MQTT Config ---
const char* ssid = "Sarinee_2.4G";
const char* password = "Cha@2522";
const char* mqtt_server = "192.168.1.162"; 

// --- User Info & Discovery ---
String activeUserId = ""; 
String chipID = String(ESP.getChipId()); 
const char* discoveryTopic = "device/discovery";

WiFiClient espClient;
PubSubClient client(espClient);
Servo myServo;
HX711 scale; // สร้าง Object สำหรับ Load Cell

// --- OLED Config ---
#define SCREEN_WIDTH 128 
#define SCREEN_HEIGHT 64 
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// --- Pin Config ---
const int trigPin = D5;
const int echoPin = D6;
const int servoPin = D4;
const int HX711_DT = D3;  // GPIO0
const int HX711_SCK = D7; // GPIO13

// --- Level & Weight Config ---
int tankEmptyDist = 10; 
int tankFullDist = 2;   
float calibration_factor = 418.1; 

// --- Topics ---
const char* commandTopic_template = "device/command/";
String statusTopic;
String commandTopic;

void updateTopics() {
  statusTopic = "device/status/" + activeUserId + "/weight";
  commandTopic = String(commandTopic_template) + activeUserId;
}

void saveUserId(String id) {
  EEPROM.begin(512);
  // Clear first 50 bytes
  for (int i = 0; i < 50; i++) EEPROM.write(i, 0);
  for (int i = 0; i < id.length(); i++) {
    EEPROM.write(i, id[i]);
  }
  EEPROM.commit();
  EEPROM.end();
}

String loadUserId() {
  EEPROM.begin(512);
  String id = "";
  for (int i = 0; i < 50; i++) {
    char c = char(EEPROM.read(i));
    if (c == 0 || c == 255) break;
    id += c;
  }
  EEPROM.end();
  return id;
}

void setupWifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// Helper to read stable distance from ultrasonic sensor (Averaging 5 samples)
int readDistance() {
  long sum = 0;
  int count = 0;
  for (int i = 0; i < 5; i++) {
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);
    long duration = pulseIn(echoPin, HIGH, 30000); 
    if (duration > 0) {
      sum += (int)(duration * 0.034 / 2);
      count++;
    }
    delay(10);
  }
  if (count == 0) return tankEmptyDist; 
  return (int)(sum / count);
}

void callback(char* topic, byte* payload, unsigned int length) {
  String message = "";
  for (int i = 0; i < length; i++) message += (char)payload[i];
  
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] Content: ");
  Serial.println(message);

  // --- Discovery Handle ---
  if (String(topic) == discoveryTopic) {
    StaticJsonDocument<200> discDoc;
    deserializeJson(discDoc, payload, length);
    const char* targetChip = discDoc["chipId"];
    const char* newUserId = discDoc["userId"];
    
    if (targetChip && String(targetChip) == chipID) {
      Serial.println("🎯 MATCHED! Pairing with New User ID...");
      activeUserId = String(newUserId);
      saveUserId(activeUserId);
      updateTopics();
      client.subscribe(commandTopic.c_str());
      
      display.clearDisplay();
      display.setCursor(0, 10);
      display.println("PAIRED SUCCESS!");
      display.print("User: "); display.println(activeUserId);
      display.display();
      delay(2000);
    }
    return;
  }

  // --- Normal Command Handle ---
  StaticJsonDocument<200> doc;
  deserializeJson(doc, payload, length);
  
  int amount = doc["amount"];
  const char* mode = doc["mode"];
  if (!mode) mode = "manual";
  if (amount <= 0) amount = 10; 
  
  int cycles = amount / 10;
  if (cycles < 1) cycles = 1;

  Serial.print("-> Amount: "); Serial.print(amount);
  Serial.print("g -> Mode: "); Serial.print(mode);
  Serial.print(" -> Cycles: "); Serial.println(cycles);

  for (int i = 1; i <= cycles; i++) {
    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("FEEDING...");
    display.setTextSize(2);
    display.setCursor(0, 16);
    display.print("Cycle "); display.print(i);
    display.print("/"); display.print(cycles);
    display.setTextSize(1);
    display.setCursor(0, 50);
    display.print("Amount: "); display.print(amount); display.print("g");
    display.display();

    myServo.write(180); // ปรับเป็น 180 องศา (สูงสุดที่ Servo ส่วนใหญ่ทำได้)
    delay(800);         // เพิ่ม delay เป็น 800ms เพื่อให้มอเตอร์มีเวลาหมุนไปถึง 180 องศาได้จริง
    myServo.write(0);   // หมุนกลับที่เดิม
    if (i < cycles) delay(1000); 
  }

  // Send Confirmation Log back to server
  String logTopic = "device/status/" + activeUserId + "/log";
  String logPayload = "{\"amount\": " + String(amount) + ", \"mode\": \"" + String(mode) + "\"}";
  client.publish(logTopic.c_str(), logPayload.c_str());
  Serial.print("Log Published: "); Serial.println(logPayload);
  
  display.clearDisplay();
  display.setTextSize(2);
  display.setCursor(0, 20);
  display.println("DONE! 🏁");
  display.display();
  delay(1000);
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "CatFeederClient-" + String(random(0xffff), HEX);
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      client.subscribe(discoveryTopic); // Always listen for discovery
      if (activeUserId != "") {
        client.subscribe(commandTopic.c_str());
        Serial.print("Subscribed to: "); Serial.println(commandTopic);
      }
      Serial.print("Subscribed to: "); Serial.println(discoveryTopic);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n--- SMART CAT FEEDER STARTING ---");
  Serial.print("Device Chip ID: "); Serial.println(chipID);
  
  activeUserId = loadUserId();
  if (activeUserId == "") {
    activeUserId = "12"; // Default for backward compatibility
    Serial.println("No User ID in EEPROM, using default: 12");
  }
  Serial.print("Active User ID: "); Serial.println(activeUserId);
  
  updateTopics();
  
  setupWifi();
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);

  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
    Serial.println(F("SSD1306 allocation failed"));
    for(;;); 
  }
  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  myServo.attach(servoPin);
  myServo.write(0);

  // --- Ultrasonic Configuration ---
  Serial.print("Baseline Tank Empty Distance (Fixed): "); Serial.println(tankEmptyDist);

  // --- HX711 Setup ---
  Serial.println("Initializing the scale...");
  scale.begin(HX711_DT, HX711_SCK);

  // Check if scale is actually ready
  if (scale.wait_ready_timeout(2000)) {
    Serial.println("HX711 Ready!");
    long raw_before = scale.read();
    Serial.print("Raw Read (Before Tare): "); Serial.println(raw_before);
    
    scale.set_scale(calibration_factor);
    scale.tare(); // Reset weight to 0
    
    long offset = scale.get_offset();
    Serial.print("New Offset: "); Serial.println(offset);
    Serial.print("Calibration Factor: "); Serial.println(calibration_factor);
    Serial.print("Get Units (5) AFTER Tare: "); Serial.println(scale.get_units(5), 1);
  } else {
    Serial.println("HX711 NOT FOUND. Check wiring (VCC, GND, DT, SCK).");
  }

  Serial.println("System Initialized.");
}

void publishStatus(int level, float weight) {
  String payload = "{\"weight\": " + String(weight, 1) + ", \"level\": " + String(level) + ", \"chipId\": \"" + chipID + "\"}";
  if (client.publish(statusTopic.c_str(), payload.c_str())) {
    Serial.print("Published to "); Serial.print(statusTopic);
    Serial.print(": "); Serial.println(payload);
  } else {
    Serial.println("MQTT Publish Failed!");
  }
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 2000) {
    lastUpdate = millis();
    
    int distance = readDistance();
    int level = map(distance, tankEmptyDist, tankFullDist, 0, 100);
    level = constrain(level, 0, 100);
    
    Serial.print("Distance: "); Serial.print(distance); Serial.print(" cm -> ");
    Serial.print("Level: "); Serial.print(level); Serial.println("%");

    float gram = 0;
    if (scale.is_ready()) {
      gram = scale.get_units(10); 
      
      // กรองค่าตัวเลขให้นิ่งและไม่ติดลบสำหรับหน้าเว็บ
      if (gram < 0) gram = 0;
      if (gram < 1.5 && gram > -1.5) gram = 0.0; // เพิ่ม threshold กรอง noise
      
      Serial.print("Weight: "); Serial.print(gram, 1); Serial.println(" g");
    } else {
      Serial.println("Scale not ready in loop");
    }

    publishStatus(level, gram);

    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(0,0);
    display.print("Tank: "); display.print(level); display.print("%");
    display.setCursor(0,16);
    display.setTextSize(2);
    display.print(gram, 1); display.print(" g");
    display.setCursor(0,55);
    display.setTextSize(1);
    display.print(client.connected() ? "MQTT: OK" : "MQTT: Offline");
    display.display();
  }
}