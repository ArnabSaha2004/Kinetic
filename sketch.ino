// Enable USB CDC Serial on ESP32-C3
#define USB_CDC_ON_BOOT 1

#include <Wire.h>
#include <MPU6050.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

MPU6050 mpu;

// BLE Service + Characteristic UUIDs
#define SERVICE_UUID        "12345678-1234-1234-1234-1234567890ab"
#define CHARACTERISTIC_UUID "abcd1234-5678-90ab-cdef-1234567890ab"

BLECharacteristic *pCharacteristic;
bool deviceConnected = false;

// ------------ FIX: Correct BLE Callback Syntax ------------
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *server) {
    deviceConnected = true;
    Serial.println("BLE Connected!");
  }
  void onDisconnect(BLEServer *server) {
    deviceConnected = false;
    Serial.println("BLE Disconnected!");
  }
};
// -----------------------------------------------------------

void setup() {

  Serial.begin(115200);
  delay(1500);
  Serial.println("ESP32-C3 BLE + MPU6050 STARTING...");

  // --------- FIX: initialize I2C only ONCE ---------
  Wire.begin(6, 5);  // SDA = 6, SCL = 5 for ESP32-C3 SuperMini
  Serial.println("I2C initialized on SDA=6, SCL=5");

  // --------- FIX: Initialize MPU correctly ---------
  mpu.initialize();
  delay(200);

  if (mpu.testConnection()) {
    Serial.println("MPU6050 Connected Successfully!");
  } else {
    Serial.println("ERROR: MPU6050 NOT detected!");
  }

  // --------- FIX: Add delay before BLE ----------
  delay(500);

  // Initialize BLE
  BLEDevice::init("Kinetic_IMU_Sensor");
  BLEServer *server = BLEDevice::createServer();
  server->setCallbacks(new MyServerCallbacks());

  BLEService *service = server->createService(SERVICE_UUID);
  pCharacteristic = service->createCharacteristic(
                      CHARACTERISTIC_UUID,
                      BLECharacteristic::PROPERTY_NOTIFY
                    );

  pCharacteristic->addDescriptor(new BLE2902());
  service->start();

  server->getAdvertising()->start();
  Serial.println("BLE Advertising Started!");
}

void loop() {

  int16_t ax, ay, az;
  int16_t gx, gy, gz;

  // Read sensor
  mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  // Print to Serial
  Serial.print("ACC: ");
  Serial.print(ax); Serial.print(",");
  Serial.print(ay); Serial.print(",");
  Serial.print(az);

  Serial.print(" | GYRO: ");
  Serial.print(gx); Serial.print(",");
  Serial.print(gy); Serial.print(",");
  Serial.println(gz);

  // Send via BLE Notify with newline terminator (only if connected)
  if (deviceConnected) {
    char buffer[64];
    sprintf(buffer, "%d,%d,%d,%d,%d,%d\n", ax, ay, az, gx, gy, gz);
    pCharacteristic->setValue(buffer);
    pCharacteristic->notify();
    Serial.print("BLE SENT: ");
    Serial.println(buffer);
  } else {
    Serial.println("No BLE client connected");
  }

  delay(150);
}
