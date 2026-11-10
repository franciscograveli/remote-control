/*
 * Teste C: pinos + PWM dos motores (14, 27, 25, 33), sem WiFi/WS.
 * Se crashar, o culpado e o analogWrite/ledc nos pinos (25 = DAC do ESP32).
 */

#define IN1 14
#define IN2 27
#define IN3 25
#define IN4 33

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("[P1] ok");

  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  Serial.println("[P2] pinMode ok");

  ledcAttach(IN1, 5000, 8);
  ledcAttach(IN2, 5000, 8);
  ledcAttach(IN3, 5000, 8);
  ledcAttach(IN4, 5000, 8);
  Serial.println("[P3] ledcAttach ok");

  analogWrite(IN1, 0);
  analogWrite(IN2, 0);
  analogWrite(IN3, 0);
  analogWrite(IN4, 0);
  Serial.println("[P4] analogWrite ok");
}

void loop() {
  delay(2000);
  Serial.println("[P] loop ok");
}