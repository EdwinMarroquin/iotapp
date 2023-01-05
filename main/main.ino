#include <ESP8266HTTPClient.h>
#include <ESP8266mDNS.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <DHT.h> // Libreria DHT
#include <DNSServer.h>
#include <WiFiManager.h>

WiFiManager wm;

#define EST_SSID "METEOROLOGIA"
#define EST_PASS "estacion2022"
#define DHTPIN D5
#define DHTTYPE DHT11

float temperature = 0.0;
float humidity = 0.0;

int d = 10000;
long timestamp = 0;
int utcOffset = -5;
String stationTime = "";
// GMT+5 =  5
// GMT-5 =  -5

WiFiClient sClient;
HTTPClient sHttp;
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", utcOffset * 3600);
DHT dht(DHTPIN, DHTTYPE); // Instaciacion de la clase para el Sensor DHT

void setup()
{
  wm.autoConnect(EST_SSID, EST_PASS);

  WiFi.mode(WIFI_STA);
  MDNS.begin("esp8266");

  Serial.begin(115200);
  dht.begin();
}

void loop()
{
  MDNS.update();
  delay(500);

  while (true)
  {
    timeClient.update();
    stationTime = timeClient.getFormattedTime();
    timestamp = timeClient.getEpochTime();
    temperature = dht.readTemperature();
    humidity = dht.readHumidity();
    Serial.println(String(timestamp) + "," + String(temperature) + "," + String(humidity));
    delay(1000);
  }
}
