import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const BLETest: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('Testing...');

  useEffect(() => {
    const testBLE = async () => {
      try {
        // Test 1: Check if react-native-ble-plx is available
        const BleModule = require('react-native-ble-plx');
        console.log('BLE Module loaded:', !!BleModule);
        
        if (!BleModule.BleManager) {
          setTestResult('❌ BleManager not found in module');
          return;
        }

        // Test 2: Try to create BleManager
        console.log('Creating BleManager...');
        const manager = new BleModule.BleManager();
        
        if (!manager) {
          setTestResult('❌ BleManager creation returned null');
          return;
        }

        // Test 3: Try to call a method
        console.log('Testing BleManager methods...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const state = await manager.state();
        console.log('BLE State:', state);
        
        setTestResult(`✅ BLE Manager working! State: ${state}`);
        
        // Cleanup
        manager.destroy();
        
      } catch (error) {
        console.error('BLE Test Error:', error);
        setTestResult(`❌ Error: ${error.message}`);
      }
    };

    testBLE();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BLE Module Test</Text>
      <Text style={styles.result}>{testResult}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f0f0',
    margin: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  result: {
    fontSize: 14,
    fontFamily: 'monospace',
  },
});