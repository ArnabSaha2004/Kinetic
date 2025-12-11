# BLE Arduino Controller - Expo App

A cross-platform Expo application for connecting to and controlling Arduino devices via Bluetooth Low Energy (BLE).

## Features

- 🔍 **Device Scanning**: Automatically scan for nearby BLE devices
- 📱 **Cross-Platform**: Works on iOS and Android with Expo Development Build
- 🎨 **Real-time Data**: Receive color data from Arduino in real-time
- 🔗 **Easy Connection**: Simple tap-to-connect interface
- 🛡️ **Permission Handling**: Automatic permission requests for different Android versions
- 🎯 **Device Filtering**: Smart filtering to show only relevant Arduino devices

## Prerequisites

- **Physical Device Required**: BLE functionality requires a physical iOS or Android device
- **Expo Development Build**: Cannot use Expo Go (react-native-ble-plx not included)
- **Arduino Device**: Compatible Arduino with BLE capability (e.g., Arduino Uno R4 WiFi, ESP32)

## Installation

1. **Clone and Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

2. **Generate Native Code**
   ```bash
   npx expo prebuild
   ```

3. **Create Development Build**
   ```bash
   # For Android
   eas build --profile development --platform android

   # For iOS
   eas build --profile development --platform ios
   ```

4. **Install Development Build** on your physical device

## Arduino Setup

Your Arduino device should implement a BLE service with these UUIDs:

```cpp
// Service UUID
#define SERVICE_UUID "19b10000-e8f2-537e-4f6c-d104768a1214"

// Characteristic UUID for color data
#define COLOR_CHARACTERISTIC_UUID "19b10001-e8f2-537e-4f6c-d104768a1217"
```

### Supported Color Codes

The app recognizes these single-character color codes:
- `B` → Blue
- `R` → Red  
- `G` → Green
- `Y` → Yellow
- `P` → Purple
- `O` → Orange
- Default → White

## Usage

1. **Launch the App** on your physical device
2. **Grant Permissions** when prompted (Bluetooth and Location)
3. **Scan for Devices** by tapping "Start Scanning"
4. **Connect** by tapping on your Arduino device in the list
5. **View Real-time Data** - the color indicator will update as your Arduino sends data

## Configuration

### Device Filtering

Modify the device filtering logic in `hooks/useBLE.ts`:

```typescript
const isTargetDevice = 
  deviceName.toLowerCase().includes('arduino') ||
  deviceName.toLowerCase().includes('esp32') ||
  deviceName.toLowerCase().includes('your-device-name') ||
  device.serviceUUIDs?.includes(DATA_SERVICE_UUID);
```

### BLE UUIDs

Update the service and characteristic UUIDs in `hooks/useBLE.ts` to match your Arduino:

```typescript
const DATA_SERVICE_UUID = "your-service-uuid";
const COLOR_CHARACTERISTIC_UUID = "your-characteristic-uuid";
```

## Platform Support

### iOS
- ✅ Automatic permission handling
- ✅ Background BLE support (limited time)
- ✅ Full BLE functionality

### Android
- ✅ Android 11 and earlier (Location permission)
- ✅ Android 12+ (Bluetooth Scan/Connect permissions)
- ✅ Adaptive permission requests

### Web
- ❌ Web Bluetooth API not implemented (could be added)

## Development

### Running in Development

```bash
# Start the development server
npx expo start --dev-client

# Run on specific platform
npx expo start --android --dev-client
npx expo start --ios --dev-client
```

### Building for Production

```bash
# Android
eas build --platform android

# iOS  
eas build --platform ios
```

## Troubleshooting

### Common Issues

1. **"No devices found"**
   - Ensure your Arduino is advertising with the correct name
   - Check that BLE is enabled on your phone
   - Verify location permissions are granted

2. **"Connection failed"**
   - Make sure the Arduino isn't connected to another device
   - Check that the service/characteristic UUIDs match
   - Try restarting both devices

3. **"Permission denied"**
   - Go to phone Settings → Apps → [Your App] → Permissions
   - Enable Location and Bluetooth permissions

### Debug Mode

Enable detailed logging by adding to your Arduino code:
```cpp
Serial.println("BLE device connected");
Serial.println("Sending color: " + colorCode);
```

## Architecture

```
├── App.tsx                 # Main app component
├── hooks/
│   └── useBLE.ts          # BLE logic and state management
├── app.json               # Expo configuration
├── package.json           # Dependencies
└── eas.json              # Build configuration
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on physical devices
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Based on the tutorial by Daniel Friyia
- Uses [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx) library
- Expo team for the excellent development platform