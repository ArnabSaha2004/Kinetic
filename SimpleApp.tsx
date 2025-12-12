import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Device } from 'react-native-ble-plx';
import { useBLE } from './hooks/useBLE';

function SimpleBLEApp() {
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectedDevice,
    color,
    disconnectFromDevice,
    isScanning,
    isReady,
    hasError,
  } = useBLE();

  const [isLoading, setIsLoading] = useState(false);

  const scanForDevices = async () => {
    if (hasError) {
      Alert.alert('BLE Error', 'BLE initialization failed. Try restarting the app.');
      return;
    }

    if (!isReady) {
      Alert.alert('BLE Not Ready', 'Please wait for BLE to initialize.');
      return;
    }

    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    } else {
      Alert.alert('Permission Required', 'Bluetooth permissions are required.');
    }
  };

  const handleConnectToDevice = async (device: Device) => {
    setIsLoading(true);
    try {
      await connectToDevice(device);
    } catch (error) {
      Alert.alert('Connection Error', 'Failed to connect to device');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectFromDevice();
  };

  if (connectedDevice) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.content}>
          <Text style={styles.title}>🔗 Connected!</Text>
          <Text style={styles.deviceName}>
            {connectedDevice.name || connectedDevice.localName || 'Unknown Device'}
          </Text>
          
          <View style={[styles.colorBox, { backgroundColor: color }]}>
            <Text style={styles.colorText}>Color: {color}</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleDisconnect}>
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView style={styles.content}>
        <Text style={styles.title}>BLE Arduino Controller</Text>
        
        <Text style={styles.status}>
          Status: {hasError ? '❌ Error' : isReady ? '✅ Ready' : '⏳ Initializing...'}
        </Text>

        <TouchableOpacity
          style={[styles.button, (!isReady || hasError) && styles.disabledButton]}
          onPress={scanForDevices}
          disabled={!isReady || hasError}
        >
          <Text style={styles.buttonText}>
            {isScanning ? 'Scanning...' : 'Start Scan'}
          </Text>
        </TouchableOpacity>

        {allDevices.length > 0 && (
          <View style={styles.deviceList}>
            <Text style={styles.subtitle}>Found Devices:</Text>
            {allDevices.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={styles.deviceItem}
                onPress={() => handleConnectToDevice(device)}
                disabled={isLoading}
              >
                <Text style={styles.deviceName}>
                  {device.name || device.localName || 'Unknown'}
                </Text>
                <Text style={styles.deviceId}>{device.id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isLoading && (
          <Text style={styles.loading}>Connecting...</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  status: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceList: {
    marginTop: 20,
  },
  deviceItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  colorBox: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
    elevation: 5,
  },
  colorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loading: {
    textAlign: 'center',
    fontSize: 16,
    color: '#007AFF',
    marginTop: 20,
  },
});

export default function SimpleApp() {
  return (
    <SafeAreaProvider>
      <SimpleBLEApp />
    </SafeAreaProvider>
  );
}