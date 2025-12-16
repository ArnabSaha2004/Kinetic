# Native Dependencies Testing Guide

## Overview
This guide ensures all native dependencies work correctly before creating EAS builds, saving time and preventing build failures.

## Quick Test Methods

### Method 1: Console Test (Fastest)
1. Start the development server: `bun start`
2. Open Metro console
3. Paste the contents of `console-test.js` into the console
4. Check results immediately

### Method 2: In-App Test Button
1. Open the app on your device/simulator
2. Go to the "Kinetic" tab (BLE screen)
3. Scroll down to "Quick Tests" section
4. Tap "Run Quick Tests"
5. Check Metro console for results

### Method 3: Dedicated Test Tab
1. Go to the "Test" tab in the app
2. Tap "Run All Tests"
3. View detailed results in the app interface

## Critical Dependencies Tested

### ✅ Must Pass (Critical for EAS Build)
- **Platform Detection**: React Native platform APIs
- **Expo Device**: Device information and capabilities
- **AsyncStorage**: Local data persistence
- **Thirdweb**: Wallet connection libraries
- **JSON Processing**: Data serialization for minting

### ⚠️ Should Pass (Important for Functionality)
- **BLE Manager**: Bluetooth Low Energy connectivity
- **NetInfo**: Network connectivity detection
- **Expo Linking**: Deep link handling
- **Crypto Dependencies**: Encryption and security
- **Base64 Encoding**: Data encoding for API calls

## Test Results Interpretation

### 🎉 Safe for EAS Build
- All critical tests pass
- Warnings are acceptable
- Ready to create production build

### 🛑 Do Not Build
- Any critical test fails
- Fix issues before building
- Re-run tests after fixes

## Common Issues and Solutions

### BLE Manager Fails
- **Cause**: Running on simulator/emulator
- **Solution**: Test on physical device only
- **Status**: Warning (not critical for build)

### Thirdweb Import Fails
- **Cause**: Missing dependencies or version conflicts
- **Solution**: Run `bun install` and check package.json
- **Status**: Critical (will break wallet functionality)

### AsyncStorage Fails
- **Cause**: Native module linking issues
- **Solution**: Rebuild development build with `expo run:android`
- **Status**: Critical (will break data persistence)

### Platform Detection Fails
- **Cause**: Fundamental React Native issue
- **Solution**: Check React Native installation
- **Status**: Critical (app won't run)

## Pre-Build Checklist

1. ✅ Run quick console test
2. ✅ Verify all critical tests pass
3. ✅ Check BLE functionality on physical device
4. ✅ Test wallet connection with MetaMask
5. ✅ Verify data collection and export works
6. ✅ Check deep linking with test URLs
7. ✅ Confirm no TypeScript errors
8. ✅ Run `expo doctor` and fix issues

## Files for Testing

- `console-test.js` - Quick console test
- `run-tests.js` - Comprehensive test runner
- `test-native-dependencies.js` - Full test suite
- `app/(tabs)/test.tsx` - In-app test interface
- `app/(tabs)/ble.tsx` - BLE functionality with quick test

## Development Workflow

1. **Before any code changes**: Run quick test
2. **After adding dependencies**: Run full test suite
3. **Before EAS build**: Run all tests and verify results
4. **After build**: Test on physical device

## Troubleshooting

### Tests Won't Run
- Check Metro console for errors
- Verify all dependencies installed: `bun install`
- Clear Metro cache: `bun start --clear`

### Inconsistent Results
- Restart Metro server
- Clear app cache
- Test on different device/simulator

### Build Still Fails After Tests Pass
- Check EAS build logs for specific errors
- Verify app.json configuration
- Check for platform-specific issues

## Success Indicators

When all tests pass, you should see:
- ✅ All critical dependencies working
- 🎉 "SAFE FOR EAS BUILD" message
- No critical failures in test results
- BLE functionality working on physical device
- Wallet connection working with MetaMask

## Next Steps After Testing

1. Create EAS build: `eas build --platform android`
2. Test build on physical device
3. Verify all functionality works in production build
4. Deploy to app stores if needed

Remember: Testing saves time and prevents frustrating build failures!