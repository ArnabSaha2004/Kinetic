# ESP32 Sensor Initialization Unit Tests

## Overview

This test suite validates the sensor initialization functionality for the Web Bluetooth IMU Dashboard project. The tests cover the requirements specified in the project specification:

- **Requirement 1.1**: I2C initialization with correct GPIO pins (6 for SDA, 5 for SCL)
- **Requirement 1.2**: MPU6050 detection and connection validation  
- **Requirement 1.3**: Error handling when sensor is not detected

## Test Files

- `test_sensor_initialization.cpp` - Main unit test file containing all sensor initialization tests

## Running the Tests

### Option 1: Arduino IDE
1. Open `test_sensor_initialization.cpp` in Arduino IDE
2. Select your ESP32-C3 board from Tools > Board
3. Select the correct COM port from Tools > Port
4. Upload and run the sketch
5. Open Serial Monitor (115200 baud) to view test results

### Option 2: PlatformIO
1. Create a new PlatformIO project for ESP32-C3
2. Copy `test_sensor_initialization.cpp` to `src/main.cpp`
3. Add required libraries to `platformio.ini`:
   ```ini
   [env:esp32-c3-devkitm-1]
   platform = espressif32
   board = esp32-c3-devkitm-1
   framework = arduino
   lib_deps = 
       electroniccats/MPU6050@^1.0.0
   monitor_speed = 115200
   ```
4. Run `pio run -t upload && pio device monitor`

## Test Coverage

### I2C Initialization Tests
- ✅ Correct GPIO pin assignment (6/5 as specified)
- ✅ Alternative GPIO pin assignment validation
- ✅ Pin storage verification

### MPU6050 Detection Tests  
- ✅ Connection validation when sensor is present
- ✅ Initialization state tracking
- ✅ Connection test functionality

### Error Handling Tests
- ✅ Behavior when sensor is not detected
- ✅ Initialization failure handling
- ✅ Retry logic with appropriate delays
- ✅ Clear error indication via serial output

## Expected Output

When running the tests, you should see output similar to:

```
ESP32 Sensor Initialization Unit Tests
Requirements: 1.1, 1.2, 1.3

========================================
Starting Test Suite: Sensor Initialization Unit Tests
========================================
Initializing I2C on SDA=6, SCL=5
Test: SDA pin set to GPIO 6 ... PASS
Test: SCL pin set to GPIO 5 ... PASS
I2C initialization result with GPIO 6/5: SUCCESS/FAILED (expected if no hardware)
...
========================================
Test Results: X passed, Y failed, Z total
========================================

Unit tests completed.
All tests passed: YES/NO
```

## Hardware Requirements

- ESP32-C3 development board
- MPU6050 sensor (optional - tests include simulation for missing hardware)
- Proper wiring: SDA to GPIO 6, SCL to GPIO 5

## Notes

- Tests include simulation modes for environments without physical hardware
- Retry logic tests verify timing behavior (minimum 1 second for retry delays)
- Error handling tests validate proper failure modes and status reporting
- All tests validate the specific GPIO pin requirements (6/5) from the specification