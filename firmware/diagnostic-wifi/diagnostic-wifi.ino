/*
 * Diagnostico - testa apenas WiFi + Serial
 * Se este rodar (imprime o IP) e o firmware do carrinho nao rodar,
 * o problema e de biblioteca/protocolo, nao da placa nem do WiFi.
 */

#include <WiFi.h>

const char *WIFI_SSID     = "Francisco";
const char *WIFI_PASSWORD = "tosemwifi";

void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("=== DIAGNOSTICO INICIO ===");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000UL) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("WiFi OK - IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi FALHOU - confira SSID/senha e rede 2.4GHz");
  }
}

void loop() {
  delay(1000);
  Serial.println("loop rodando");
}