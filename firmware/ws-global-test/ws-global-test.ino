#include <WiFi.h>
#include <WebSocketsServer.h>

const char* SSID  = "Francisco";
const char* SENHA = "tosemwifi";

WebSocketsServer* ws = nullptr;

void setup() {
    Serial.begin(115200);
    while (!Serial);
    delay(300);

    // Conecta ao WiFi
    Serial.printf("[WiFi] Conectando a '%s'...\n", SSID);
    WiFi.begin(SSID, SENHA);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println();
    Serial.printf("[WiFi] Conectado! IP: %s\n", WiFi.localIP().toString().c_str());

    // Sobe o WebSocket
    ws = new WebSocketsServer(81);
    ws->begin();
    Serial.printf("[WS] Servidor rodando em ws://%s:81\n", WiFi.localIP().toString().c_str());
}

void loop() {
    ws->loop();   // processa eventos do WebSocket
    delay(10);
}