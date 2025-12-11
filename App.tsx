import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Device } from 'react-native-ble-plx';
import { useBLE } from './hooks/useBLE';
import { DeviceItem } from './components/DeviceItem';
import { ColorIndicator } from './components/ColorIndicator';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BLETest } from './components/BLETest';

function BLEApp() {
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
      Alert.alert(
        'BLE Initialization Error',
        'Bluetooth Low Energy failed to initialize. This usually happens when:\n\n' +
        '1. New Architecture is enabled (should be disabled)\n' +
        '2. App is running on simulator (use physical device)\n' +
        '3. Native module not properly linked\n\n' +
        'Try rebuilding the app with: npx expo prebuild --clean'
      );
      return;
    }

    if (!isReady) {
      Alert.alert(
        'BLE Not Ready',
        'Bluetooth Low Energy is still initializing. Please wait a moment and try again.'
      );
      return;
    }

    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    } else {
      Alert.alert(
        'Permission Required',
        'Bluetooth permissions are required to scan for devices.'
      );
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

  const renderDeviceItem = ({ item }: { item: Device }) => (
    <DeviceItem
      device={item}
      onPress={handleConnectToDevice}
      isConnecting={isLoading}
    />
  );

  if (connectedDevice) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <View style={styles.connectedContainer}>
          <View style={styles.header}>
            <Ionicons name="bluetooth" size={24} color="#34C759" />
            <Text style={styles.title}>Connected</Text>
          </View>
          
          <Text style={styles.deviceInfo}>
            {connectedDevice.name || connectedDevice.localName || 'Arduino Device'}
          </Text>
          
          <ColorIndicator color={color} isConnected={true} />

          <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
            <Ionicons name="close-circle-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.content}>
        <BLETest />
        <Text style={styles.title}>BLE Arduino Controller</Text>
        <Text style={styles.subtitle}>
          Scan for and connect to your Arduino device
        </Text>

        <TouchableOpacity
          style={[styles.scanButton, (isScanning || !isReady || hasError) && styles.scanningButton]}
          onPress={scanForDevices}
          disabled={isScanning || (!isReady && !hasError)}
        >
          {hasError ? (
            <>
              <Ionicons name="warning-outline" size={20} color="#fff" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>BLE Error - Tap for Info</Text>
            </>
          ) : !isReady ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>Initializing BLE...</Text>
            </>
          ) : isScanning ? (
            <>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>Scanning...</Text>
            </>
          ) : (
            <>
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                {allDevices.length > 0 ? 'Scan Again' : 'Start Scanning'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {allDevices.length > 0 ? (
          <View style={styles.deviceList}>
            <View style={styles.deviceListHeader}>
              <Ionicons name="bluetooth-outline" size={20} color="#333" />
              <Text style={styles.deviceListTitle}>Available Devices ({allDevices.length})</Text>
            </View>
            <FlatList
              data={allDevices}
              renderItem={renderDeviceItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : !isScanning && (
          <View style={styles.emptyState}>
            <Ionicons name="bluetooth-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateText}>No devices found</Text>
            <Text style={styles.emptyStateSubtext}>
              Make sure your Arduino is powered on and advertising
            </Text>
          </View>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Connecting...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  scanButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  scanningButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceList: {
    flex: 1,
  },
  deviceListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceListTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  connectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceInfo: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <BLEApp />
    </ErrorBoundary>
  );
}