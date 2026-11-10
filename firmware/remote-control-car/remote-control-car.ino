/*
 * ESP32 RC Car - controle remoto via HTTP
 * -------------------------------------------------
 * Servidor HTTP leve. O app manda comandos assim:
 *
 *   GET /move?d=F&s=40     d = F | B | L | R | S |  s = 0..100
 *   GET /ping              health check -> {"ok":true}
 *   GET /                  pagina de status
 *
 * SEGURANCA: se nenhum comando chegar por ~800ms, o carro para sozinho.
 * CORS: respostas liberadas (Access-Control-Allow-Origin: *) pro
 * controle rodar direto do browser.
 */

#include <WiFi.h>
#include <WebServer.h>

// ==================== CONFIGURE AQUI ====================
const char *WIFI_SSID     = "Francisco";
const char *WIFI_PASSWORD = "tosemwifi";
const uint16_t PORT       = 80;

// Motor esquerdo: IN1/IN2 | Motor direito: IN3/IN4
// ATENCAO: pino 25 e DAC no ESP32 -> se der crash no boot, troque esse fio
// por um GPIO comum (ex. 19). Os demais (14/27/33) sao normais.
#define IN1 14
#define IN2 27
#define IN3 25
#define IN4 33
// =========================================================

#define SAFETY_TIMEOUT_MS 800

WebServer server(PORT);

unsigned long lastCmdMs = 0;
bool motorsRunning = false;
unsigned long lastWifiTryMs = 0;

void motores(int a, int b, int c, int d) {
  analogWrite(IN1, a);
  analogWrite(IN2, b);
  analogWrite(IN3, c);
  analogWrite(IN4, d);
}

void frente(int v)   { motores(v, 0, 0, v); }
void tras(int v)     { motores(0, v, v, 0); }
void virarDir(int v) { motores(v, 0, v, 0); }
void virarEsq(int v) { motores(0, v, 0, v); }

void stopNow() {
  if (motorsRunning) {
    motores(0, 0, 0, 0);
    motorsRunning = false;
  }
}

void applyCommand(char dir, int speed) {
  int pwm = map(speed, 0, 100, 0, 255);

  if (dir == 'S' || pwm == 0) {
    stopNow();
    return;
  }

  switch (dir) {
    case 'F': frente(pwm); break;
    case 'B': tras(pwm); break;
    case 'L': virarEsq(pwm); break;
    case 'R': virarDir(pwm); break;
    default:  stopNow(); return;
  }

  motorsRunning = true;
  lastCmdMs = millis();
}

void handlePing() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", "{\"ok\":true}");
}

void handleMove() {
  char dir = 'S';
  String d = server.arg("d");
  if (d.length() > 0) {
    char c = d.charAt(0);
    if (c == 'F' || c == 'B' || c == 'L' || c == 'R' || c == 'S') dir = c;
  }
  int speed = server.arg("s").toInt();
  applyCommand(dir, speed);

  String json = "{\"ok\":true,\"d\":\"";
  json += dir;
  json += "\",\"s\":";
  json += speed;
  json += "}";
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "application/json", json);
}

void handleRoot() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String html = "<h1>ESP32 RC Car</h1>";
  html += "<p>IP: ";
  html += WiFi.localIP().toString();
  html += "</p><p>Use GET /move?d=(F|B|L|R|S)&s=0..100</p>";
  server.send(200, "text/html", html);
}

bool connectWifi() {
  Serial.println("[4] conectando WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000UL) {
    delay(400);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[4] WiFi OK - IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }

  Serial.println("[4] WiFi FALHOU (confira SSID/senha e rede 2.4GHz)");
  return false;
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("[1] setup iniciou");

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  Serial.print("[2] pinos PWM prontos: ");
  Serial.printf("%d,%d,%d,%d\n", IN1, IN2, IN3, IN4);

  stopNow();
  Serial.println("[3] motores parados");

  connectWifi();

  server.on("/", handleRoot);
  server.on("/ping", handlePing);
  server.on("/move", handleMove);
  server.begin();
  Serial.printf("[5] HTTP em http://%s:%d\n", WiFi.localIP().toString().c_str(), PORT);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiTryMs > 5000) {
      lastWifiTryMs = millis();
      connectWifi();
    }
  } else {
    server.handleClient();
  }

  if (motorsRunning && millis() - lastCmdMs > SAFETY_TIMEOUT_MS) {
    stopNow();
  }

  delay(5);
}