#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Servo.h>

// --- WiFi & MQTT Config ---
const char* ssid = "Sarinee_2.4G";
const char* password = "Cha@2522";
const char* mqtt_server = "192.168.1.162"; 

// --- User Info ---
const char* userId = "12"; // Change to your user ID from DB

WiFiClient espClient;
PubSubClient client(espClient);
Servo myServo;

// --- OLED Config ---
#define SCREEN_WIDTH 128 
#define SCREEN_HEIGHT 64 
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// --- Pin Config ---
const int trigPin = D5;
const int echoPin = D6;
const int servoPin = D4;

// --- HX711 Pin Config ---
const int HX711_DT = D3;  // GPIO0
const int HX711_SCK = D7; // GPIO13

// --- Level & Weight Config ---
int tankEmptyDist = 20; // Default, will be auto-set in setup()
int tankFullDist = 2;   // Distance when tank is 100% full
float calibration_factor = -112.8; // Updated to your tested value
long zero_offset = 0;

// --- Topics ---
const char* commandTopic = "device/command/12"; 
String statusTopic = "device/status/12/weight";   

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

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

// Non-blocking HX711 Read (Manual Bit-bang)
long readHX711() {
  unsigned long timeout = millis();
  while (digitalRead(HX711_DT) == HIGH && (millis() - timeout < 100)) yield();
  if (digitalRead(HX711_DT) == HIGH) return 0;

  long value = 0;
  for (int i = 0; i < 24; i++) {
    digitalWrite(HX711_SCK, HIGH);
    value = value << 1;
    digitalWrite(HX711_SCK, LOW);
    if (digitalRead(HX711_DT) == HIGH) value++;
  }
  digitalWrite(HX711_SCK, HIGH);
  digitalWrite(HX711_SCK, LOW);
  
  if (value & 0x800000) value |= 0xFF000000;
  return value;
}

// Helper to read stable distance from ultrasonic sensor
int readDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);
  long duration = pulseIn(echoPin, HIGH, 30000); // 30ms timeout
  if (duration == 0) return tankEmptyDist; 
  return (int)(duration * 0.034 / 2);
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");

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

    myServo.write(120); 
    delay(200); 
    myServo.write(0);
    
    if (i < cycles) {
      delay(1000); 
    }
  }

  // 📝 Send Confirmation Log back to server
  String logTopic = "device/status/";
  logTopic += userId;
  logTopic += "/log";
  
  String logPayload = "{\"amount\": ";
  logPayload += amount;
  logPayload += ", \"mode\": \"";
  logPayload += mode;
  logPayload += "\"}";
  
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
    String clientId = "CatFeederClient-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("connected");
      client.subscribe(commandTopic);
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

  // --- Ultrasonic Calibration (Tare Tank Level) ---
  Serial.println("Calibrating Tank Sensor...");
  long distSum = 0;
  for(int i=0; i<10; i++) {
    distSum += readDistance();
    delay(50);
  }
  tankEmptyDist = (int)(distSum / 10);
  Serial.print("Baseline Tank Empty Distance: "); Serial.println(tankEmptyDist);

  pinMode(HX711_DT, INPUT);
  pinMode(HX711_SCK, OUTPUT);
  
  Serial.println("Taring Load Cell...");
  delay(1000);
  long sum = 0;
  int validSamples = 0;
  for(int i=0; i<10; i++) {
    long val = readHX711();
    if (val != 0) {
      sum += val;
      validSamples++;
    }
    delay(10);
  }
  if (validSamples > 0) zero_offset = sum / validSamples;
  
  Serial.println("System Initialized.");
}

void publishStatus(int level, float weight) {
  String payload = "{\"weight\": ";
  payload += weight;
  payload += ", \"level\": ";
  payload += level;
  payload += "}";
  
  client.publish(statusTopic.c_str(), payload.c_str());
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  static unsigned long lastUpdate = 0;
  if (millis() - lastUpdate > 2000) {
    lastUpdate = millis();
    
    int distance = readDistance();

    int level = map(distance, tankEmptyDist, tankFullDist, 0, 100);
    if (level < 0) level = 0;
    if (level > 100) level = 100;

    float gram = 0;
    long raw = readHX711();
    if (raw != 0) {
      gram = (float)(raw - zero_offset) / calibration_factor;
      if (gram < 0) gram = 0;
      if (gram < 0.5 && gram > -0.5) gram = 0.0;
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
