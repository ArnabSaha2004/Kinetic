# Setup Instructions

## Quick Start

1. **Install Dependencies**
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
   # Install EAS CLI if you haven't
   npm install -g @expo/eas-cli

   # Login to Expo
   eas login

   # Build for development
   eas build --profile development --platform android
   eas build --profile development --platform ios
   ```

4. **Install on Device**
   - Download the development build from the EAS dashboard
   - Install on your physical device

5. **Start Development Server**
   ```bash
   npx expo start --dev-client
   ```

## Arduino Setup

### Hardware Requirements
- Arduino Uno R4 WiFi, ESP32, or ESP8266
- Compatible BLE module (if not built-in)

### Arduino Code Example
```cpp
#include <ArduinoBLE.h>

BLEService colorService("19b10000-e8f2-537e-4f6c-d104768a1214");
BLEStringCharacteristic colorCharacteristic("19b10001-e8f2-537e-4f6c-d104768a1217", BLERead | BLENotify, 10);

void setup() {
  Serial.begin(9600);
  
  if (!BLE.begin()) {
    Serial.println("Starting BLE failed!");
    while (1);
  }

  BLE.setLocalName("Arduino");
  BLE.setAdvertisedService(colorService);
  colorService.addCharacteristic(colorCharacteristic);
  BLE.addService(colorService);
  
  colorCharacteristic.writeValue("W"); // Start with white
  BLE.advertise();
  
  Serial.println("BLE Arduino Peripheral");
}

void loop() {
  BLEDevice central = BLE.central();
  
  if (central) {
    Serial.print("Connected to central: ");
    Serial.println(central.address());
    
    while (central.connected()) {
      // Send different colors every 2 seconds
      String colors[] = {"R", "G", "B", "Y", "P", "O"};
      static int colorIndex = 0;
      
      colorCharacteristic.writeValue(colors[colorIndex]);
      colorIndex = (colorIndex + 1) % 6;
      
      delay(2000);
    }
    
    Serial.println("Disconnected from central");
  }
}
```

## Troubleshooting

### Common Issues

1. **"No devices found"**
   - Ensure Arduino is powered and running BLE code
   - Check that location permissions are granted
   - Verify Bluetooth is enabled on phone

2. **"Connection failed"**
   - Make sure UUIDs match between app and Arduino
   - Try restarting both devices
   - Check that Arduino isn't connected to another device

3. **"Permission denied"**
   - Go to Settings → Apps → [Your App] → Permissions
   - Enable Location and Bluetooth permissions
   - On Android 12+, ensure "Nearby devices" permission is granted

### Debug Mode

Enable detailed logging in the app by modifying `hooks/useBLE.ts`:

```typescript
// Add more console.log statements for debugging
console.log('Scanning for devices...');
console.log('Found device:', device.name, device.id);
console.log('Connecting to:', device.id);
```

### Testing Without Arduino

You can test the app using BLE simulator apps:
- **iOS**: LightBlue Explorer
- **Android**: nRF Connect

Create a service with UUID `19b10000-e8f2-537e-4f6c-d104768a1214` and characteristic `19b10001-e8f2-537e-4f6c-d104768a1217`.

## Platform-Specific Notes

### iOS
- Requires physical device (simulator doesn't support BLE)
- Permissions handled automatically
- Background BLE works for limited time

### Android
- Requires physical device
- Location permission needed for BLE scanning
- Different permissions for Android 12+ vs earlier versions

### Web
- Web Bluetooth API could be added for browser support
- Would require different implementation for web platform