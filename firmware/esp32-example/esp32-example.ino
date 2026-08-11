/*
 * IoT Lab — Example ESP32 Firmware
 * ---------------------------------
 * Demonstrates the target production flow described in the platform spec
 * (section 29): connect to Wi-Fi, connect to AWS IoT Core over MQTT/TLS
 * using a per-device X.509 certificate, publish telemetry, and subscribe
 * to commands to drive GPIO.
 *
 * Libraries: WiFiClientSecure, PubSubClient (or the AWS IoT Device SDK for
 * Embedded C if you prefer AWS's official client).
 *
 * Device identity: each physical ESP32 is provisioned in AWS IoT Core with
 * its own certificate + private key + the AmazonRootCA1.pem root CA, and an
 * IoT policy scoped to only its own topics:
 *   university/{universityId}/device/{deviceId}/telemetry  (publish)
 *   university/{universityId}/device/{deviceId}/command    (subscribe)
 *   university/{universityId}/device/{deviceId}/status     (publish)
 * Certificates are generated and stored by the platform backend, never by
 * students, and are flashed to the device out-of-band during lab setup.
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

// --- Wi-Fi ---
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// --- AWS IoT Core ---
const char* AWS_IOT_ENDPOINT = "xxxxxxxxxxxxx-ats.iot.us-east-1.amazonaws.com";
const char* DEVICE_ID = "ESP32-001";
const char* UNIVERSITY_ID = "example-university";

// TLS certificates provisioned per-device (do NOT hard-code in real
// deployments — load from secure flash storage / NVS instead).
const char* AWS_ROOT_CA PROGMEM = "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n";
const char* DEVICE_CERT PROGMEM = "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n";
const char* DEVICE_PRIVATE_KEY PROGMEM = "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n";

// --- Pins ---
const int LED_PIN = 2;
const int TEMP_SENSOR_PIN = 34;

WiFiClientSecure netClient;
PubSubClient mqttClient(netClient);

String topicTelemetry() { return "university/" + String(UNIVERSITY_ID) + "/device/" + String(DEVICE_ID) + "/telemetry"; }
String topicCommand()   { return "university/" + String(UNIVERSITY_ID) + "/device/" + String(DEVICE_ID) + "/command"; }
String topicStatus()    { return "university/" + String(UNIVERSITY_ID) + "/device/" + String(DEVICE_ID) + "/status"; }

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];

  // Expected payload: {"command":"LED_ON"} / "LED_OFF" / "RESET"
  if (message.indexOf("LED_ON") >= 0) {
    digitalWrite(LED_PIN, HIGH);
  } else if (message.indexOf("LED_OFF") >= 0) {
    digitalWrite(LED_PIN, LOW);
  } else if (message.indexOf("RESET") >= 0) {
    digitalWrite(LED_PIN, LOW);
  }
}

void connectMqtt() {
  netClient.setCACert(AWS_ROOT_CA);
  netClient.setCertificate(DEVICE_CERT);
  netClient.setPrivateKey(DEVICE_PRIVATE_KEY);

  mqttClient.setServer(AWS_IOT_ENDPOINT, 8883);
  mqttClient.setCallback(onMqttMessage);

  while (!mqttClient.connected()) {
    if (mqttClient.connect(DEVICE_ID)) {
      mqttClient.subscribe(topicCommand().c_str());
      mqttClient.publish(topicStatus().c_str(), "{\"status\":\"ONLINE\"}");
    } else {
      delay(2000);
    }
  }
}

float readTemperature() {
  int raw = analogRead(TEMP_SENSOR_PIN);
  return (raw / 4095.0) * 100.0; // placeholder scaling — replace with real sensor math
}

void publishTelemetry() {
  float temperature = readTemperature();
  bool ledState = digitalRead(LED_PIN);

  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"temperature\":" + String(temperature, 1) + ",";
  payload += "\"led\":" + String(ledState ? "true" : "false") + ",";
  payload += "\"timestamp\":\"" + String(millis()) + "\"";
  payload += "}";

  mqttClient.publish(topicTelemetry().c_str(), payload.c_str());
}

void setup() {
  pinMode(LED_PIN, OUTPUT);
  connectWiFi();
  connectMqtt();
}

void loop() {
  if (!mqttClient.connected()) connectMqtt();
  mqttClient.loop();

  // Local control logic mirrors what a student writes in the Code Editor —
  // the same threshold rule they build in the Virtual Lab.
  float temperature = readTemperature();
  if (temperature > 30) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    digitalWrite(LED_PIN, LOW);
  }

  publishTelemetry();
  delay(5000);
}
