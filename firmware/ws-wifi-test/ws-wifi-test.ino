/*
 * Teste B: WiFi + WebSocketServer.begin(), SEM pinos/motores.
 * Se isso rodar, o problema esta no PWM/analogWrite; se crashar, no WiFi+WS.
 */

#include <WiFi.h>
#include <WebSocketsServer.h>

const char *WIFI_SSID     = "Francisco";
const char *WIFI_PASSWORD = "tosemwifi";
const uint16_t WS_PORT    = 81;

WebSocketsServer ws(WS_PORT);

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("[B1] setup");

  Serial.println("[B2] conectando WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000UL) {
    delay(400);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[B3] WiFi OK - IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[B3] WiFi FALHOU");
    return;
  }

  ws.begin();
  ws.onEvent([](uint8_t, WStype_t t, uint8_t *p, size_t l) {});
  Serial.println("[B4] ws.begin() OK");
}

void loop() {
  ws.loop();
  delay(5);
  Serial.println("[B loop] rodando");
  delay(2000);
}