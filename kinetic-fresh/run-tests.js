/**
 * Simple test runner for React Native environment
 * Run this in the Metro console or import in your app
 */

// Test BLE Manager
const testBLE = async () => {
  try {
    console.log('🧪 Testing BLE Manager...');
    const { BleManager } = require('react-native-ble-plx');
    const bleManager = new BleManager();
    const state = await bleManager.state();
    console.log('✅ BLE State:', state);
    bleManager.destroy();
    return { status: 'PASS', state };
  } catch (error) {
    console.log('❌ BLE Test failed:', error.message);
    return { status: 'FAIL', error: error.message };
  }
};

// Test AsyncStorage
const testAsyncStorage = async () => {
  try {
    console.log('🧪 Testing AsyncStorage...');
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const testKey = 'test_' + Date.now();
    const testValue = 'test_value';
    
    await AsyncStorage.setItem(testKey, testValue);
    const retrieved = await AsyncStorage.getItem(testKey);
    await AsyncStorage.removeItem(testKey);
    
    if (retrieved !== testValue) {
      throw new Error('Data mismatch');
    }
    
    console.log('✅ AsyncStorage working');
    return { status: 'PASS' };
  } catch (error) {
    console.log('❌ AsyncStorage Test failed:', error.message);
    return { status: 'FAIL', error: error.message };
  }
};

// Test Thirdweb
const testThirdweb = async () => {
  try {
    console.log('🧪 Testing Thirdweb...');
    const { createThirdwebClient } = require('thirdweb');
    const { createWallet } = require('thirdweb/wallets');
    const { ConnectButton } = require('thirdweb/react');
    
    console.log('✅ Thirdweb imports successful');
    return { 
      status: 'PASS', 
      imports: {
        client: !!createThirdwebClient,
        wallet: !!createWallet,
        react: !!ConnectButton
      }
    };
  } catch (error) {
    console.log('❌ Thirdweb Test failed:', error.message);
    return { status: 'FAIL', error: error.message };
  }
};

// Test Expo Device
const testExpoDevice = async () => {
  try {
    console.log('🧪 Testing Expo Device...');
    const ExpoDevice = require('expo-device');
    
    const deviceInfo = {
      isDevice: ExpoDevice.isDevice,
      brand: ExpoDevice.brand,
      modelName: ExpoDevice.modelName,
      osName: ExpoDevice.osName,
      osVersion: ExpoDevice.osVersion,
    };
    
    console.log('✅ Expo Device info:', deviceInfo);
    return { status: 'PASS', deviceInfo };
  } catch (error) {
    console.log('❌ Expo Device Test failed:', error.message);
    return { status: 'FAIL', error: error.message };
  }
};

// Test Base64
const testBase64 = () => {
  try {
    console.log('🧪 Testing Base64...');
    const testString = 'Hello Kinetic!';
    
    let encoded, decoded;
    
    if (typeof btoa !== 'undefined') {
      encoded = btoa(testString);
      decoded = atob(encoded);
    } else {
      const base64 = require('react-native-base64');
      encoded = base64.encode(testString);
      decoded = base64.decode(encoded);
    }
    
    if (decoded !== testString) {
      throw new Error('Base64 encoding/decoding failed');
    }
    
    console.log('✅ Base64 working');
    return { status: 'PASS', method: typeof btoa !== 'undefined' ? 'builtin' : 'library' };
  } catch (error) {
    console.log('❌ Base64 Test failed:', error.message);
    return { status: 'FAIL', error: error.message };
  }
};

// Run all tests
const runQuickTests = async () => {
  console.log('🚀 Starting Quick Native Tests...');
  console.log('=' .repeat(40));
  
  const tests = [
    { name: 'Expo Device', test: testExpoDevice },
    { name: 'AsyncStorage', test: testAsyncStorage },
    { name: 'Base64', test: testBase64 },
    { name: 'BLE Manager', test: testBLE },
    { name: 'Thirdweb', test: testThirdweb },
  ];
  
  const results = {};
  let passed = 0;
  let failed = 0;
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      results[name] = result;
      
      if (result.status === 'PASS') {
        passed++;
        console.log(`✅ ${name}: PASSED`);
      } else {
        failed++;
        console.log(`❌ ${name}: FAILED`);
      }
    } catch (error) {
      failed++;
      results[name] = { status: 'FAIL', error: error.message };
      console.log(`❌ ${name}: ERROR - ${error.message}`);
    }
  }
  
  console.log('=' .repeat(40));
  console.log(`📊 Results: ${passed}/${tests.length} passed (${((passed/tests.length)*100).toFixed(1)}%)`);
  
  const criticalFailures = [];
  const criticalTests = ['Expo Device', 'AsyncStorage', 'Thirdweb'];
  
  for (const test of criticalTests) {
    if (results[test]?.status === 'FAIL') {
      criticalFailures.push(test);
    }
  }
  
  if (criticalFailures.length === 0) {
    console.log('🎉 ALL CRITICAL TESTS PASSED - SAFE FOR EAS BUILD!');
  } else {
    console.log('🛑 CRITICAL FAILURES DETECTED:');
    criticalFailures.forEach(test => console.log(`   - ${test}`));
    console.log('🛑 DO NOT BUILD UNTIL FIXED!');
  }
  
  return {
    results,
    summary: {
      total: tests.length,
      passed,
      failed,
      criticalFailures,
      safeForBuild: criticalFailures.length === 0
    }
  };
};

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runQuickTests };
}

// Auto-run if in React Native environment
if (typeof global !== 'undefined' && global.document === undefined) {
  // Delay to ensure all modules are loaded
  setTimeout(() => {
    runQuickTests().catch(console.error);
  }, 2000);
}

// Make available globally for console access
if (typeof global !== 'undefined') {
  global.runQuickTests = runQuickTests;
}