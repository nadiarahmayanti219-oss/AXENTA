/*
 * =====================================================================
 * AXENTA — Automated Experience for Entry and Attendance
 * Firmware NFC Reader untuk NodeMCU ESP8266 (kompatibel ESP32) + MFRC522
 *
 * Fitur (sesuai PRD 7.8):
 *  - Koneksi Wi-Fi + auto-reconnect
 *  - Baca UID kartu MIFARE 13.56 MHz (RC522 via SPI), HEX uppercase
 *  - Anti double-tap 5 detik untuk UID yang sama
 *  - POST /api/tap & POST /api/heartbeat setiap 30 detik (x-device-key)
 *  - Sinkronisasi waktu NTP (pool.ntp.org, GMT+7)
 *  - Offline buffer ke LittleFS (maks 200 tap) & flush otomatis saat online
 *  - Feedback buzzer + LED hijau/merah
 *
 * Library (Arduino IDE Library Manager):
 *  - MFRC522 by GithubCommunity
 *  - ArduinoJson (v7) by Benoit Blanchon
 *
 * Wiring RC522 -> NodeMCU ESP8266:
 *   SDA(SS)=D8(GPIO15)  SCK=D5(GPIO14)  MOSI=D7(GPIO13)
 *   MISO=D6(GPIO12)     RST=D3(GPIO0)   3.3V=3V3   GND=GND
 *   Buzzer=D1(GPIO5)    LED Hijau=D2(GPIO4)   LED Merah=D0(GPIO16)
 * =====================================================================
 */

#include <Arduino.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h>
#include <LittleFS.h>
#include <time.h>

#if defined(ESP8266)
  #include <ESP8266WiFi.h>
  #include <ESP8266HTTPClient.h>
  #include <WiFiClientSecureBearSSL.h>
  #define PIN_SS    15  // D8
  #define PIN_RST   0   // D3
  #define PIN_BUZZ  5   // D1
  #define PIN_GREEN 4   // D2
  #define PIN_RED   16  // D0
#elif defined(ESP32)
  #include <WiFi.h>
  #include <HTTPClient.h>
  #include <WiFiClientSecure.h>
  #define PIN_SS    5
  #define PIN_RST   22
  #define PIN_BUZZ  25
  #define PIN_GREEN 26
  #define PIN_RED   27
#endif

// ---------------- KONFIGURASI ----------------
const char* WIFI_SSID   = "NAMA_WIFI_SEKOLAH";
const char* WIFI_PASS   = "PASSWORD_WIFI";
const char* SERVER_BASE = "https://domain-axenta-anda.vercel.app"; // tanpa trailing slash
const char* READER_CODE = "RDR-HALTE-01";                        // atau RDR-GERBANG-01
const char* DEVICE_KEY  = "demo-halte-key";                      // dari menu Pengaturan > NFC Reader

const unsigned long HEARTBEAT_MS = 30000;
const unsigned long COOLDOWN_MS  = 5000;
const char*         QUEUE_FILE   = "/tap_queue.jsonl";
const int           MAX_QUEUE    = 200;

MFRC522 rfid(PIN_SS, PIN_RST);
String        lastUid       = "";
unsigned long lastTapMs     = 0;
unsigned long lastHeartbeat = 0;

void beep(int count, int onMs, int offMs = 80) {
  for (int i = 0; i < count; i++) {
    digitalWrite(PIN_BUZZ, HIGH);
    delay(onMs);
    digitalWrite(PIN_BUZZ, LOW);
    if (i + 1 < count) delay(offMs);
  }
}

void signalResult(const char* type) {
  digitalWrite(PIN_GREEN, LOW);
  digitalWrite(PIN_RED, LOW);
  if (strcmp(type, "tepat_waktu") == 0 || strcmp(type, "reg") == 0) {
    digitalWrite(PIN_GREEN, HIGH);
    beep(1, 120);
  } else if (strcmp(type, "telat") == 0) {
    digitalWrite(PIN_GREEN, HIGH);
    digitalWrite(PIN_RED, HIGH);
    beep(2, 120);
  } else {
    digitalWrite(PIN_RED, HIGH);
    beep(1, 500);
  }
  delay(400);
  digitalWrite(PIN_GREEN, LOW);
  digitalWrite(PIN_RED, LOW);
}

String isoNow() {
  time_t now = time(nullptr);
  if (now < 1700000000) return "";
  struct tm t;
  gmtime_r(&now, &t);
  char buf[25];
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%SZ", &t);
  return String(buf);
}

int postJson(const String& path, const String& payload, String& responseOut) {
  if (WiFi.status() != WL_CONNECTED) return -1;
  String url = String(SERVER_BASE) + path;
  HTTPClient http;
#if defined(ESP8266)
  std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
  client->setInsecure();
  WiFiClient plain;
  if (url.startsWith("https")) http.begin(*client, url);
  else http.begin(plain, url);
#else
  WiFiClientSecure client;
  client.setInsecure();
  http.begin(client, url);
#endif
  http.setTimeout(5000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_KEY);
  int code = http.POST(payload);
  if (code > 0) responseOut = http.getString();
  http.end();
  return code;
}

void enqueueOffline(const String& uid, const String& ts) {
  int lines = 0;
  if (LittleFS.exists(QUEUE_FILE)) {
    File r = LittleFS.open(QUEUE_FILE, "r");
    while (r && r.available()) if (r.read() == '\n') lines++;
    r.close();
  }
  if (lines >= MAX_QUEUE) return;
  File f = LittleFS.open(QUEUE_FILE, "a");
  if (!f) return;
  JsonDocument doc;
  doc["uid"]    = uid;
  doc["reader"] = READER_CODE;
  if (ts.length()) doc["ts"] = ts;
  serializeJson(doc, f);
  f.print('\n');
  f.close();
}

void flushOfflineQueue() {
  if (WiFi.status() != WL_CONNECTED || !LittleFS.exists(QUEUE_FILE)) return;
  File f = LittleFS.open(QUEUE_FILE, "r");
  if (!f) return;
  String remaining = "";
  while (f.available()) {
    String line = f.readStringUntil('\n');
    line.trim();
    if (!line.length()) continue;
    String resp;
    int code = postJson("/api/tap", line, resp);
    if (code <= 0 || code >= 500) remaining += line + "\n";
  }
  f.close();
  if (remaining.length() == 0) LittleFS.remove(QUEUE_FILE);
  else {
    File w = LittleFS.open(QUEUE_FILE, "w");
    w.print(remaining);
    w.close();
  }
}

void sendTap(const String& uid) {
  String ts = isoNow();
  JsonDocument doc;
  doc["uid"]    = uid;
  doc["reader"] = READER_CODE;
  String body;
  serializeJson(doc, body);

  String resp;
  int code = postJson("/api/tap", body, resp);
  Serial.printf("[TAP] %s -> HTTP %d %s\n", uid.c_str(), code, resp.c_str());

  if (code <= 0 || code >= 500) {
    enqueueOffline(uid, ts);
    signalResult("telat"); // tersimpan di buffer offline
    return;
  }
  JsonDocument res;
  if (deserializeJson(res, resp) || !res["ok"].as<bool>()) {
    signalResult("err");
    return;
  }
  if (res["registration"].as<bool>()) {
    signalResult("reg");
    return;
  }
  const char* status = res["status"] | "tepat_waktu";
  signalResult(status);
}

void sendHeartbeat() {
  JsonDocument doc;
  doc["reader"] = READER_CODE;
  String body, resp;
  serializeJson(doc, body);
  int code = postJson("/api/heartbeat", body, resp);
  Serial.printf("[HB] HTTP %d\n", code);
  if (code == 200) flushOfflineQueue();
}

void ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) return;
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Menghubungkan Wi-Fi");
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 10000) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_BUZZ, OUTPUT);
  pinMode(PIN_GREEN, OUTPUT);
  pinMode(PIN_RED, OUTPUT);
  SPI.begin();
  rfid.PCD_Init();
  LittleFS.begin();
  ensureWifi();
  configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov");
  beep(2, 60);
  Serial.println("AXENTA NFC Reader siap.");
}

void loop() {
  ensureWifi();

  if (millis() - lastHeartbeat >= HEARTBEAT_MS) {
    lastHeartbeat = millis();
    sendHeartbeat();
  }

  if (!rfid.PICC_IsNewCardPresent() || !rfid.PICC_ReadCardSerial()) return;

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  if (uid == lastUid && millis() - lastTapMs < COOLDOWN_MS) return;
  lastUid   = uid;
  lastTapMs = millis();

  sendTap(uid);
}
