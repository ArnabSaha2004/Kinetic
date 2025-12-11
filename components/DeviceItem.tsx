import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { Ionicons } from '@expo/vector-icons';
import { getDeviceDisplayName, getSignalStrengthDescription } from '../utils/BLEUtils';

interface DeviceItemProps {
  device: Device;
  onPress: (device: Device) => void;
  isConnecting?: boolean;
}

export const DeviceItem: React.FC<DeviceItemProps> = ({ 
  device, 
  onPress, 
  isConnecting = false 
}) => {
  const displayName = getDeviceDisplayName(device);
  const signalStrength = getSignalStrengthDescription(device.rssi);
  
  const getSignalIcon = () => {
    if (!device.rssi) return 'help-outline';
    if (device.rssi >= -50) return 'wifi';
    if (device.rssi >= -60) return 'wifi-outline';
    return 'cellular-outline';
  };

  const getSignalColor = () => {
    if (!device.rssi) return '#999';
    if (device.rssi >= -50) return '#4CAF50';
    if (device.rssi >= -60) return '#FF9800';
    return '#F44336';
  };

  return (
    <TouchableOpacity
      style={[styles.container, isConnecting && styles.connecting]}
      onPress={() => onPress(device)}
      disabled={isConnecting}
    >
      <View style={styles.deviceInfo}>
        <View style={styles.header}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {displayName}
          </Text>
          <View style={styles.signalContainer}>
            <Ionicons 
              name={getSignalIcon()} 
              size={16} 
              color={getSignalColor()} 
            />
            <Text style={[styles.signalText, { color: getSignalColor() }]}>
              {signalStrength}
            </Text>
          </View>
        </View>
        
        <Text style={styles.deviceId} numberOfLines={1}>
          ID: {device.id}
        </Text>
        
        {device.rssi && (
          <Text style={styles.rssi}>
            Signal: {device.rssi} dBm
          </Text>
        )}
        
        {device.serviceUUIDs && device.serviceUUIDs.length > 0 && (
          <Text style={styles.services} numberOfLines={1}>
            Services: {device.serviceUUIDs.length}
          </Text>
        )}
      </View>
      
      <View style={styles.connectButton}>
        <Ionicons 
          name={isConnecting ? "hourglass-outline" : "bluetooth-outline"} 
          size={24} 
          color={isConnecting ? "#999" : "#007AFF"} 
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  connecting: {
    opacity: 0.6,
  },
  deviceInfo: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  signalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  deviceId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  rssi: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  services: {
    fontSize: 12,
    color: '#888',
  },
  connectButton: {
    padding: 8,
  },
});