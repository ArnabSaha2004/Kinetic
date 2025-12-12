# Kinetic IMU Dashboard

A complete React Native BLE application for real-time IMU data visualization from ESP32-C3 + MPU6050 sensors.

## 🚀 Features

- **Real-time BLE Communication**: Connects to ESP32-C3 devices via Bluetooth Low Energy
- **IMU Data Visualization**: Live accelerometer and gyroscope data display
- **Modern UI**: Clean design matching Kinetic brand guidelines with OKLCH color system
- **Cross-platform**: Supports both Android and iOS (requires physical devices)
- **Robust Error Handling**: Comprehensive null safety and connection management
- **Development Build Ready**: Configured for EAS Build with proper BLE support

## 📱 Screenshots

*Real-time IMU data streaming from ESP32-C3 + MPU6050 sensor*

## 🛠 Tech Stack

- **React Native** 0.81.5 + **Expo SDK** 54
- **TypeScript** with comprehensive type safety
- **react-native-ble-plx** for Bluetooth Low Energy
- **ESP32-C3** + **MPU6050** sensor integration
- **EAS Build** for development builds

## 🔧 Hardware Requirements

- ESP32-C3 SuperMini (or compatible ESP32-C3 board)
- MPU6050 6-axis IMU sensor
- Physical Android/iOS device (BLE doesn't work on simulators)

### Wiring (ESP32-C3 SuperMini)
```
MPU6050    ESP32-C3
VCC    →   3.3V
GND    →   GND
SDA    →   GPIO 6
SCL    →   GPIO 5
```

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone https://github.com/yourusername/kinetic-imu-dashboard.git
cd kinetic-imu-dashboard
npm install
```

### 2. Flash Arduino Code
Upload `sketch.ino` to your ESP32-C3 using Arduino IDE:
- Install ESP32 board support
- Select "ESP32C3 Dev Module"
- Install required libraries: `MPU6050`, `BLEDevice`

### 3. Create Development Build
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Build for your platform
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

### 4. Install and Run
- Download the development build from EAS dashboard
- Install on your physical device
- Start the development server:
```bash
npx expo start --dev-client
```

## 📊 Data Format

The app receives IMU data in CSV format via BLE:
```
ax,ay,az,gx,gy,gz
```
Where:
- `ax,ay,az`: Accelerometer values (raw ADC counts)
- `gx,gy,gz`: Gyroscope values (raw ADC counts)

Data is automatically converted to physical units:
- **Accelerometer**: g-force (±2g range)
- **Gyroscope**: degrees/second (±250°/s range)

## 🔍 BLE Configuration

- **Service UUID**: `12345678-1234-1234-1234-1234567890ab`
- **Characteristic UUID**: `abcd1234-5678-90ab-cdef-1234567890ab`
- **Device Name**: `Kinetic_IMU_Sensor`

## 🎨 Design System

The app uses the exact Kinetic design system with OKLCH colors converted to React Native compatible hex values:

- **Background**: `#ffffff` (Pure white)
- **Foreground**: `#252525` (Dark gray)
- **Primary**: `#343434` (Darker gray)
- **Chart Colors**: Amber, Blue, Indigo, Lime, Orange for data visualization

## 📱 Platform Support

### Android
- Requires Android 6.0+ (API 23+)
- Location permissions needed for BLE scanning
- Different permissions for Android 12+ vs earlier versions

### iOS
- Requires iOS 13.0+
- Bluetooth permissions handled automatically
- Background BLE works for limited time

## 🔧 Development

### Project Structure
```
├── App.tsx                 # Main app component
├── hooks/
│   └── useBLE.ts          # BLE functionality hook
├── constants/
│   └── BLEConstants.ts    # BLE UUIDs and configuration
├── utils/
│   └── BLEUtils.ts        # BLE utility functions
├── components/            # UI components
├── sketch.ino            # Arduino ESP32-C3 code
└── docs/                 # Documentation
```

### Key Features
- **Data Packet Reconstruction**: Handles BLE fragmentation
- **Connection Management**: Robust connect/disconnect handling
- **Permission Handling**: Android 12+ and legacy support
- **Error Boundaries**: Comprehensive error handling
- **Real-time Updates**: Live data streaming and visualization

## 🐛 Troubleshooting

### Common Issues

1. **"No devices found"**
   - Ensure ESP32-C3 is powered and running BLE code
   - Check location permissions are granted
   - Verify Bluetooth is enabled

2. **"Connection failed"**
   - Verify UUIDs match between app and Arduino
   - Try restarting both devices
   - Ensure device isn't connected elsewhere

3. **"App crashes on connect"**
   - Use development build (not Expo Go)
   - Check that New Architecture is disabled
   - Verify all permissions are granted

### Debug Mode
Enable detailed logging by modifying `hooks/useBLE.ts` console.log statements.

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review EAS build logs for build issues
- Ensure you're using a physical device (not simulator)

---

**Built with ❤️ for the Kinetic ecosystem**