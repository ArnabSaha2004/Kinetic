# Kinetic BLE Implementation

This implementation provides Bluetooth Low Energy (BLE) connectivity for ESP32-C3 + MPU6050 IMU sensor integration with the React Native app.

## Architecture

The BLE implementation follows the kinetic-fresh pattern with:

- **Hook-based approach**: Uses `useBLE` hook instead of class-based manager
- **CSV data format**: Transmits raw sensor values as comma-separated values
- **Proper error handling**: Comprehensive error handling and stale data detection
- **Permission management**: Handles Android BLE permissions properly

## Components

### 1. BLE Constants (`constants/BLEConstants.ts`)
- Service and characteristic UUIDs matching Arduino firmware
- Device name patterns for scanning
- Configuration for scan and connection timeouts
- IMU data interface definition

### 2. BLE Hook (`hooks/useBLE.ts`)
- Main BLE functionality using React hooks
- Device scanning and connection management
- Real-time data processing with CSV parsing
- Stale data detection and monitoring
- Comprehensive error handling

### 3. BLE Utilities (`utils/BLEUtils.ts`)
- Device filtering and validation
- Base64 decoding utilities
- Device information formatting
- UUID validation

### 4. BLE Screen (`components/BLEScreen.tsx`)
- Main UI for BLE functionality
- Device scanning and selection
- Connection status display
- Real-time data visualization

### 5. IMU Data Display (`components/IMUDataDisplay.tsx`)
- Real-time sensor data visualization
- Accelerometer and gyroscope data display
- Raw data and timestamp information

## Data Format

The Arduino firmware transmits data as CSV strings:
```
ax,ay,az,gx,gy,gz
```

Where:
- `ax`, `ay`, `az`: Raw accelerometer values (16-bit signed integers)
- `gx`, `gy`, `gz`: Raw gyroscope values (16-bit signed integers)

The React Native app converts these to physical units:
- Accelerometer: Raw value / 16384.0 = g-force
- Gyroscope: Raw value / 131.0 = degrees per second

## BLE Configuration

### Service UUID
```
12345678-1234-1234-1234-1234567890ab
```

### Characteristic UUID
```
abcd1234-5678-90ab-cdef-1234567890ab
```

### Device Name Pattern
```
ESP32C3_MPU6050
```

## Arduino Firmware

The ESP32-C3 firmware (`arduino/ESP32_IMU_BLE.ino`) provides:

- MPU6050 sensor initialization and configuration
- BLE server setup with proper UUIDs
- Real-time sensor data reading at 50Hz
- CSV data transmission via BLE notifications
- Connection status LED indication

### Hardware Wiring
```
MPU6050    ESP32-C3
VCC    →   3.3V
GND    →   GND
SDA    →   GPIO 8
SCL    →   GPIO 9
```

## Usage

1. **Hardware Setup**: Wire ESP32-C3 to MPU6050 as shown above
2. **Firmware Upload**: Upload the Arduino sketch to ESP32-C3
3. **App Connection**: 
   - Open the app and navigate to the BLE screen
   - Tap "Scan for Devices"
   - Select your ESP32C3_MPU6050 device
   - View real-time IMU data

## Features

- **Real-time Data**: 50Hz sensor data streaming
- **Stale Data Detection**: Automatically detects when data stops flowing
- **Reconnection**: Manual reconnection capability
- **Error Handling**: Comprehensive error messages and recovery
- **Permission Management**: Proper Android BLE permission handling
- **Device Filtering**: Only shows compatible ESP32 devices

## Troubleshooting

### Common Issues

1. **BLE Not Available**: Ensure running on physical device, not simulator
2. **Permission Denied**: Grant Bluetooth and location permissions
3. **Device Not Found**: Check device name matches `ESP32C3_MPU6050`
4. **Connection Failed**: Ensure UUIDs match between app and firmware
5. **No Data**: Check MPU6050 wiring and initialization

### Debug Information

The app provides extensive logging:
- BLE initialization status
- Device scan results
- Connection process details
- Data parsing information
- Error messages with context

Check the console logs for detailed debugging information.

## Quick Start

### 1. Hardware Setup

**Components needed:**
- ESP32-C3 SuperMini (or compatible ESP32-C3 board)
- MPU6050 6-axis IMU sensor
- Jumper wires
- Breadboard (optional)

### 2. Arduino Code

1. Install required libraries in Arduino IDE:
   - `MPU6050` by Electronic Cats
   - ESP32 board support (built-in BLE library)

2. Flash the Arduino code:
   - Open `arduino/ESP32_IMU_BLE.ino` in Arduino IDE
   - Select board: "ESP32C3 Dev Module"
   - Upload to your ESP32-C3

### 3. React Native App

1. Install dependencies:
```bash
npm install react-native-ble-plx expo-device
```

2. For Android, ensure permissions are granted at runtime (handled by the app)

3. Build and run:
```bash
npx expo run:android
# or
npx expo run:ios
```

## Files Structure

```
kineticV1/
├── arduino/
│   └── ESP32_IMU_BLE.ino          # Arduino firmware
├── components/
│   ├── BLEScreen.tsx              # Main BLE interface
│   └── IMUDataDisplay.tsx         # Data visualization
├── constants/
│   └── BLEConstants.ts            # BLE configuration
├── hooks/
│   └── useBLE.ts                  # BLE hook implementation
├── utils/
│   └── BLEUtils.ts                # BLE utilities
└── BLE_README.md                  # This file
```

---

**Built for the Kinetic ecosystem** 🚀