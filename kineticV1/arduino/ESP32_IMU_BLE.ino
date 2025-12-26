/*
 * Kinetic IMU BLE Transmitter
 * ESP32-C3 + MPU6050 IMU Sensor
 * 
 * This sketch reads data from an MPU6050 IMU sensor and transmits it
 * via Bluetooth Low Energy (BLE) to a React Native mobile app.
 * 
 * Hardware:
 * - ESP32-C3 SuperMini (or compatible ESP32-C3 board)
 * - MPU6050 6-axis IMU sensor
 * 
 * Wiring:
 * MPU6050    ESP32-C3
 * VCC    →   3.3V
 * GND    →   GND
 * SDA    →   GPIO 8
 * SCL    →   GPIO 9
 * 
 * Libraries required:
 * - MPU6050 by Electronic Cats
 * - ESP32 BLE Arduino (built-in)
 */

#include <Wire.h>
#include <MPU6050.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// BLE Service and Characteristic UUIDs (matches kinetic-fresh configuration)
#define SERVICE_UUID        "12345678-1234-1234-1234-1234567890ab"
#define CHARACTERISTIC_UUID "abcd1234-5678-90ab-cdef-1234567890ab"

// Device configuration
#define DEVICE_NAME "ESP32C3_MPU6050"
#define I2C_SDA_PIN 8
#define I2C_SCL_PIN 9

// Sensor configuration
#define SAMPLE_RATE_HZ 50
#define SAMPLE_INTERVAL_MS (1000 / SAMPLE_RATE_HZ)

// MPU6050 scale factors (matches kinetic-fresh)
const float ACCEL_SCALE = 16384.0;  // LSB/g for ±2g range
const float GYRO_SCALE = 131.0;     // LSB/(deg/s) for ±250deg/s range

// Global objects
MPU6050 mpu;
BLEServer* pServer = nullptr;
BLECharacteristic* pCharacteristic = nullptr;
bool deviceConnected = false;
bool oldDeviceConnected = false;

// Timing variables
unsigned long lastSampleTime = 0;

// Status LED pin (built-in LED on most ESP32-C3 boards)
#define LED_PIN 2

// BLE Server Callbacks
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
        deviceConnected = true;
        digitalWrite(LED_PIN, HIGH); // Turn on LED when connected
        Serial.println("Client connected");
    };

    void onDisconnect(BLEServer* pServer) {
        deviceConnected = false;
        digitalWrite(LED_PIN, LOW); // Turn off LED when disconnected
        Serial.println("Client disconnected");
        
        // Restart advertising
        BLEDevice::startAdvertising();
        Serial.println("Started advertising again");
    }
};

void setup() {
    Serial.begin(115200);
    Serial.println("Kinetic IMU BLE Transmitter Starting...");
    
    // Initialize LED
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
    
    // Initialize I2C
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
    Wire.setClock(400000); // 400kHz I2C speed
    
    // Initialize MPU6050
    Serial.println("Initializing MPU6050...");
    mpu.initialize();
    
    // Test MPU6050 connection
    if (mpu.testConnection()) {
        Serial.println("MPU6050 connection successful");
    } else {
        Serial.println("MPU6050 connection failed");
        // Flash LED to indicate error
        for (int i = 0; i < 10; i++) {
            digitalWrite(LED_PIN, HIGH);
            delay(100);
            digitalWrite(LED_PIN, LOW);
            delay(100);
        }
    }
    
    // Configure MPU6050
    mpu.setFullScaleAccelRange(MPU6050_ACCEL_FS_2);  // ±2g
    mpu.setFullScaleGyroRange(MPU6050_GYRO_FS_250);  // ±250°/s
    mpu.setDLPFMode(MPU6050_DLPF_BW_20);             // 20Hz low pass filter
    
    // Initialize BLE
    Serial.println("Initializing BLE...");
    BLEDevice::init(DEVICE_NAME);
    
    // Create BLE Server
    pServer = BLEDevice::createServer();
    pServer->setCallbacks(new MyServerCallbacks());
    
    // Create BLE Service
    BLEService *pService = pServer->createService(SERVICE_UUID);
    
    // Create BLE Characteristic
    pCharacteristic = pService->createCharacteristic(
        CHARACTERISTIC_UUID,
        BLECharacteristic::PROPERTY_READ |
        BLECharacteristic::PROPERTY_WRITE |
        BLECharacteristic::PROPERTY_NOTIFY
    );
    
    // Add descriptor for notifications
    pCharacteristic->addDescriptor(new BLE2902());
    
    // Start the service
    pService->start();
    
    // Start advertising
    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(SERVICE_UUID);
    pAdvertising->setScanResponse(false);
    pAdvertising->setMinPreferred(0x0);  // Set value to 0x00 to not advertise this parameter
    BLEDevice::startAdvertising();
    
    Serial.println("BLE device is ready and advertising");
    Serial.print("Device name: ");
    Serial.println(DEVICE_NAME);
    Serial.print("Service UUID: ");
    Serial.println(SERVICE_UUID);
    
    // Flash LED to indicate successful initialization
    for (int i = 0; i < 3; i++) {
        digitalWrite(LED_PIN, HIGH);
        delay(200);
        digitalWrite(LED_PIN, LOW);
        delay(200);
    }
}

void loop() {
    unsigned long currentTime = millis();
    
    // Check if it's time to read sensor data
    if (currentTime - lastSampleTime >= SAMPLE_INTERVAL_MS) {
        lastSampleTime = currentTime;
        
        // Read sensor data
        readAndTransmitIMUData();
    }
    
    // Handle BLE connection state changes
    if (!deviceConnected && oldDeviceConnected) {
        delay(500); // Give the bluetooth stack time to get ready
        pServer->startAdvertising(); // Restart advertising
        Serial.println("Started advertising");
        oldDeviceConnected = deviceConnected;
    }
    
    if (deviceConnected && !oldDeviceConnected) {
        oldDeviceConnected = deviceConnected;
    }
    
    // Small delay to prevent watchdog issues
    delay(1);
}

void readAndTransmitIMUData() {
    // Read raw sensor data
    int16_t ax, ay, az;
    int16_t gx, gy, gz;
    
    mpu.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);
    
    // Create CSV string: ax,ay,az,gx,gy,gz (raw values)
    String csvData = String(ax) + "," + String(ay) + "," + String(az) + "," + 
                     String(gx) + "," + String(gy) + "," + String(gz);
    
    // Print to serial for debugging
    if (Serial.available() > 0 || !deviceConnected) {
        Serial.println(csvData);
    }
    
    // Transmit via BLE if connected
    if (deviceConnected && pCharacteristic) {
        pCharacteristic->setValue(csvData.c_str());
        pCharacteristic->notify();
    }
}

// Helper function to get battery voltage (if connected to ADC pin)
float getBatteryVoltage() {
    // This is optional - only if you have battery voltage monitoring
    // Connect battery voltage divider to GPIO10 (ADC)
    int adcValue = analogRead(10);
    float voltage = (adcValue / 4095.0) * 3.3 * 2.0; // Assuming 2:1 voltage divider
    return voltage;
}

// Helper function to get chip temperature
float getChipTemperature() {
    // ESP32-C3 internal temperature sensor
    return temperatureRead();
}