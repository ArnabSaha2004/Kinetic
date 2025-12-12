import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { useBLE } from './hooks/useBLE';

// Kinetic Design System Colors (exact match from frontend globals.css)
const colors = {
  // Light theme colors (converted from OKLCH to hex)
  background: '#ffffff',        // oklch(1 0 0)
  foreground: '#252525',        // oklch(0.145 0 0)
  card: '#ffffff',              // oklch(1 0 0)
  cardForeground: '#252525',    // oklch(0.145 0 0)
  primary: '#343434',           // oklch(0.205 0 0)
  primaryForeground: '#fcfcfc', // oklch(0.985 0 0)
  secondary: '#f8f8f8',         // oklch(0.97 0 0)
  secondaryForeground: '#343434', // oklch(0.205 0 0)
  muted: '#f8f8f8',             // oklch(0.97 0 0)
  mutedForeground: '#8e8e8e',   // oklch(0.556 0 0)
  accent: '#f8f8f8',            // oklch(0.97 0 0)
  accentForeground: '#343434',  // oklch(0.205 0 0)
  destructive: '#e11d48',       // oklch(0.577 0.245 27.325)
  destructiveForeground: '#fcfcfc', // oklch(0.577 0.245 27.325)
  border: '#ebebeb',            // oklch(0.922 0 0)
  input: '#ebebeb',             // oklch(0.922 0 0)
  ring: '#b5b5b5',              // oklch(0.708 0 0)
  // Chart colors from frontend
  chart1: '#f59e0b',            // oklch(0.646 0.222 41.116) - amber
  chart2: '#3b82f6',            // oklch(0.6 0.118 184.704) - blue
  chart3: '#6366f1',            // oklch(0.398 0.07 227.392) - indigo
  chart4: '#84cc16',            // oklch(0.828 0.189 84.429) - lime
  chart5: '#f97316',            // oklch(0.769 0.188 70.08) - orange
  // Sidebar colors (for future use)
  sidebar: '#fcfcfc',           // oklch(0.985 0 0)
  sidebarForeground: '#252525', // oklch(0.145 0 0)
  sidebarPrimary: '#343434',    // oklch(0.205 0 0)
  sidebarBorder: '#ebebeb',     // oklch(0.922 0 0)
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 50,
  },
  connectedContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: colors.foreground,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: colors.mutedForeground,
    fontWeight: '400',
  },
  statusText: {
    marginBottom: 32,
    textAlign: 'center',
    color: colors.mutedForeground,
    fontSize: 16,
    fontWeight: '500',
  },
  dataCard: {
    backgroundColor: colors.card,
    padding: 24,
    borderRadius: 10, // Using --radius: 0.625rem = 10px
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dataCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: colors.foreground,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  dataValue: {
    color: colors.foreground,
    fontWeight: '600',
    fontSize: 16,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'center',
  },
  rawDataText: {
    fontSize: 14,
    marginBottom: 8,
    color: colors.mutedForeground,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  primaryButtonDisabled: {
    backgroundColor: colors.muted,
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButtonTextDisabled: {
    color: colors.mutedForeground,
  },
  destructiveButton: {
    backgroundColor: colors.destructive,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  destructiveButtonDisabled: {
    backgroundColor: colors.muted,
    shadowOpacity: 0,
    elevation: 0,
  },
  destructiveButtonText: {
    color: colors.destructiveForeground,
    fontSize: 16,
    fontWeight: '600',
  },
  deviceCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minWidth: 300,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 6,
  },
  deviceId: {
    fontSize: 12,
    color: colors.mutedForeground,
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 40,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: colors.primary,
    marginTop: 32,
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default function App() {
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectedDevice,
    imuData,
    disconnectFromDevice,
    isScanning,
    isReady,
    hasError,
  } = useBLE();

  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Add logging to track component lifecycle
  React.useEffect(() => {
    console.log('📱 App component mounted');
    return () => {
      console.log('📱 App component unmounting');
    };
  }, []);

  React.useEffect(() => {
    console.log('📱 Connected device changed:', connectedDevice?.name || 'null');
  }, [connectedDevice]);

  const scanForDevices = async () => {
    if (!isReady) return;
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  };

  const handleConnect = async (device: Device) => {
    setIsLoading(true);
    try {
      await connectToDevice(device);
    } catch (error) {
      console.log('Connection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to prevent race conditions
      disconnectFromDevice();
    } catch (error) {
      console.log('Disconnect failed:', error);
    } finally {
      setTimeout(() => {
        setIsDisconnecting(false);
      }, 500); // Give time for cleanup
    }
  };

  // Helper function to safely format numbers
  const formatValue = (value: number): string => {
    if (isNaN(value) || !isFinite(value)) {
      return 'NaN';
    }
    return value.toFixed(3);
  };

  if (connectedDevice) {
    return (
      <View style={styles.connectedContainer}>
        <Text style={styles.title}>
          Kinetic IMU Dashboard
        </Text>
        <Text style={styles.subtitle}>
          Connected: {connectedDevice.name || 'Kinetic Device'}
        </Text>
        
        {/* Accelerometer Data */}
        <View style={styles.dataCard}>
          <Text style={[styles.dataCardTitle, { color: colors.chart2 }]}>Accelerometer (g)</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataValue}>X: {formatValue(imuData.accelerometer.x)}</Text>
            <Text style={styles.dataValue}>Y: {formatValue(imuData.accelerometer.y)}</Text>
            <Text style={styles.dataValue}>Z: {formatValue(imuData.accelerometer.z)}</Text>
          </View>
        </View>

        {/* Gyroscope Data */}
        <View style={styles.dataCard}>
          <Text style={[styles.dataCardTitle, { color: colors.chart4 }]}>Gyroscope (°/s)</Text>
          <View style={styles.dataRow}>
            <Text style={styles.dataValue}>X: {formatValue(imuData.gyroscope.x)}</Text>
            <Text style={styles.dataValue}>Y: {formatValue(imuData.gyroscope.y)}</Text>
            <Text style={styles.dataValue}>Z: {formatValue(imuData.gyroscope.z)}</Text>
          </View>
        </View>

        {/* Raw Data */}
        <View style={styles.dataCard}>
          <Text style={[styles.dataCardTitle, { color: colors.chart1 }]}>Raw Values</Text>
          <Text style={styles.rawDataText}>Raw Data: {imuData.rawData}</Text>
          <Text style={styles.rawDataText}>Timestamp: {imuData.timestamp}</Text>
        </View>

        {/* Raw Individual Values */}
        <View style={styles.dataCard}>
          <Text style={styles.dataCardTitle}>Raw Sensor Values</Text>
          <Text style={styles.rawDataText}>Accel: {imuData.raw.ax}, {imuData.raw.ay}, {imuData.raw.az}</Text>
          <Text style={styles.rawDataText}>Gyro: {imuData.raw.gx}, {imuData.raw.gy}, {imuData.raw.gz}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.destructiveButton,
            isDisconnecting && styles.destructiveButtonDisabled
          ]}
          onPress={handleDisconnect}
          disabled={isDisconnecting}
        >
          <Text style={styles.destructiveButtonText}>
            {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={styles.title}>
        Kinetic Device Scanner
      </Text>
      
      <Text style={styles.statusText}>
        Status: {hasError ? '❌ Error' : isReady ? '✅ Ready' : '⏳ Loading...'}
      </Text>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          !isReady && styles.primaryButtonDisabled
        ]}
        onPress={scanForDevices}
        disabled={!isReady}
      >
        <Text style={[
          styles.primaryButtonText,
          !isReady && styles.primaryButtonTextDisabled
        ]}>
          {isScanning ? 'Scanning...' : 'Scan for Kinetic Devices'}
        </Text>
      </TouchableOpacity>

      {allDevices.map((device, index) => (
        <TouchableOpacity
          key={device.id}
          style={styles.deviceCard}
          onPress={() => handleConnect(device)}
          disabled={isLoading}
        >
          <Text style={styles.deviceName}>
            {device.name || device.localName || `Kinetic Device ${index + 1}`}
          </Text>
          <Text style={styles.deviceId}>
            {device.id}
          </Text>
        </TouchableOpacity>
      ))}

      {isLoading && (
        <Text style={styles.loadingText}>
          Connecting to device...
        </Text>
      )}
      
      {allDevices.length === 0 && !isScanning && isReady && (
        <Text style={styles.emptyState}>
          No Kinetic devices found.{'\n'}Make sure your device is powered on and advertising.
        </Text>
      )}
    </View>
  );
}