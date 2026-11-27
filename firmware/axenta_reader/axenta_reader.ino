#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <hd44780.h>
#include <hd44780ioClass/hd44780_I2Cexp.h>
#include <SoftwareSerial.h>
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>

// ================= KONFIGURASI WIFI & SERVER AXENTA =================
const char* WIFI_SSID   = "NAMA_WIFI_KAMU";
const char* WIFI_PASS   = "PASSWORD_WIFI_KAMU";
const char* SERVER_BASE = "https://axenta-lime.vercel.app";
const char* READER_CODE = "RDR-GERBANG-01";     // Reader Gerbang Utama Sekolah
const char* DEVICE_KEY  = "demo-gerbang-key";   // Sesuai seed.sql (atau key dari menu Pengaturan > NFC Reader)

// RFID RC522 (SCK=D5, MISO=D6, MOSI=D7 otomatis)
#define RST_PIN D3
#define SS_PIN  D4

// Buzzer
#define BUZZER_PIN D0
#define BUZZER_AKTIF_LOW false   // ubah ke true kalau buzzer modul 3 pin (aktif saat LOW)

#define BUZZER_ON  (BUZZER_AKTIF_LOW ? LOW : HIGH)
#define BUZZER_OFF (BUZZER_AKTIF_LOW ? HIGH : LOW)

MFRC522 mfrc522(SS_PIN, RST_PIN);
hd44780_I2Cexp lcd;

SoftwareSerial espSerial(-1, D8);   // TX ke U0R ESP32-CAM

bool rfidOK = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_MS = 30000; // kirim status online ke web tiap 30 detik

void beep(int durasi) {
  digitalWrite(BUZZER_PIN, BUZZER_ON);
  delay(durasi);
  digitalWrite(BUZZER_PIN, BUZZER_OFF);
}

void bunyiPipPip() {
  beep(100);
  delay(100);
  beep(100);
}

void tampilLCD(const String& baris1, const String& baris2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(baris1.substring(0, 16));
  lcd.setCursor(0, 1);
  lcd.print(baris2.substring(0, 16));
}

void tampilStandby() {
  tampilLCD("AXENTA Absensi", "Tempelkan Kartu");
}

// Helper ambil nilai string dari JSON tanpa library tambahan
String ambilJsonString(const String& json, const String& key) {
  String cari = "\"" + key + "\":\"";
  int start = json.indexOf(cari);
  if (start == -1) return "";
  start += cari.length();
  int end = json.indexOf("\"", start);
  if (end == -1) return "";
  return json.substring(start, end);
}

bool cekJsonTrue(const String& json, const String& key) {
  return json.indexOf("\"" + key + "\":true") != -1;
}

void konekWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  tampilLCD("Menghubungkan", "WiFi...");
  Serial.print("Menghubungkan ke WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 15000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi Terhubung! IP: ");
    Serial.println(WiFi.localIP());
    tampilLCD("WiFi Terhubung!", WiFi.localIP().toString());
    delay(1000);
  } else {
    Serial.println("WiFi Gagal Terhubung!");
    tampilLCD("WiFi Gagal!", "Cek Hotspot/SSID");
    delay(2000);
  }
}

int postKeServer(const String& path, const String& payload, String& responseOut) {
  if (WiFi.status() != WL_CONNECTED) konekWiFi();
  if (WiFi.status() != WL_CONNECTED) return -1;

  std::unique_ptr<BearSSL::WiFiClientSecure> client(new BearSSL::WiFiClientSecure);
  client->setInsecure(); // bypass sertifikat SSL agar hemat RAM ESP8266

  HTTPClient http;
  String url = String(SERVER_BASE) + path;
  if (!http.begin(*client, url)) return -1;

  http.setTimeout(7000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-device-key", DEVICE_KEY);

  int httpCode = http.POST(payload);
  if (httpCode > 0) {
    responseOut = http.getString();
  }
  http.end();
  return httpCode;
}

void kirimHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;
  String payload = "{\"reader\":\"" + String(READER_CODE) + "\"}";
  String resp;
  int code = postKeServer("/api/heartbeat", payload, resp);
  Serial.printf("[HEARTBEAT] HTTP %d\n", code);
}

void setup() {
  Serial.begin(115200);
  Serial.println("\nBooting AXENTA NFC Reader...");
  espSerial.begin(9600);

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, BUZZER_OFF);
  beep(300);   // bunyi panjang saat boot = buzzer OK

  Wire.begin(D2, D1);
  int status = lcd.begin(16, 2);
  if (status) {
    Serial.println("LCD error, cek SDA D2 / SCL D1");
  } else {
    Serial.println("LCD OK");
    lcd.backlight();
  }

  SPI.begin();
  mfrc522.PCD_Init();
  byte v = mfrc522.PCD_ReadRegister(MFRC522::VersionReg);
  Serial.print("RC522 versi: 0x");
  Serial.println(v, HEX);

  if (v == 0x00 || v == 0xFF) {
    rfidOK = false;
    Serial.println("RC522 TIDAK TERDETEKSI, cek wiring!");
    tampilLCD("RFID Error!", "Cek kabel RC522");
    bunyiPipPip();
    bunyiPipPip();   // 4 bunyi = RFID bermasalah
    return;
  }

  rfidOK = true;
  konekWiFi();
  kirimHeartbeat();
  tampilStandby();
  Serial.println("AXENTA Siap. Silakan tap kartu RFID di Gerbang Utama...");
}

void loop() {
  if (!rfidOK) return;

  // Kirim heartbeat tiap 30 detik agar indikator di web "NFC Reader Online"
  if (millis() - lastHeartbeat >= HEARTBEAT_MS) {
    lastHeartbeat = millis();
    kirimHeartbeat();
  }

  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  bunyiPipPip();   // bunyi saat kartu terbaca

  // Format UID tanpa spasi (contoh: "8159FF7B" atau "A3B4C5D6")
  String currentUID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) currentUID += "0";
    currentUID += String(mfrc522.uid.uidByte[i], HEX);
  }
  currentUID.toUpperCase();

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  Serial.print("UID Terdeteksi: ");
  Serial.println(currentUID);

  tampilLCD("Memproses...", "UID: " + currentUID);

  String payload = "{\"uid\":\"" + currentUID + "\",\"reader\":\"" + String(READER_CODE) + "\"}";
  String resp = "";
  int httpCode = postKeServer("/api/tap", payload, resp);

  Serial.printf("[TAP] HTTP %d -> %s\n", httpCode, resp.c_str());

  if (httpCode == 200 && cekJsonTrue(resp, "ok")) {
    String nama = ambilJsonString(resp, "nama");
    if (nama.length() == 0) nama = "Siswa";

    // 1. Jika sedang mode "Scan Kartu" (pendaftaran kartu di web)
    if (cekJsonTrue(resp, "registration")) {
      tampilLCD("Kartu Terbaca!", "UID: " + currentUID);
      beep(150);
      delay(2000);
    }
    // 2. Jika siswa SUDAH absen hari ini (tap ke-2 dst -> tidak masuk database lagi)
    else if (cekJsonTrue(resp, "duplicate")) {
      tampilLCD("Sudah Absen!", nama);
      Serial.println("Siswa sudah absen hari ini, data tidak dimasukkan lagi.");
      bunyiPipPip();
      delay(2500);
    }
    // 3. Jika kartu terdaftar & absen pertama hari ini -> masuk ke Supabase!
    else {
      tampilLCD("Absen Berhasil!", nama);
      espSerial.println("CAPTURE");
      Serial.println("Absen masuk ke Supabase! Perintah CAPTURE dikirim ke ESP32-CAM.");
      beep(200);
      delay(3000);
    }
  }
  else if (httpCode == 404 || resp.indexOf("UID_NOT_REGISTERED") != -1) {
    // 4. Kartu TIDAK terdaftar di tabel siswa Supabase
    tampilLCD("Kartu Ditolak!", "Tidak Terdaftar");
    Serial.println("Kartu ditolak: UID belum terdaftar di Supabase.");
    beep(600);
    delay(2000);
  }
  else if (httpCode == 422 || resp.indexOf("NOT_SCHOOL_DAY") != -1) {
    // Hari ini bukan hari sekolah aktif di menu Aturan Jam Sekolah
    tampilLCD("Hari Libur!", "Absen Nonaktif");
    beep(500);
    delay(2000);
  }
  else if (httpCode == 401) {
    tampilLCD("Device Key", "Tidak Valid!");
    beep(500);
    delay(2000);
  }
  else {
    tampilLCD("Gagal Koneksi!", "HTTP: " + String(httpCode));
    beep(500);
    delay(2000);
  }

  tampilStandby();
}
