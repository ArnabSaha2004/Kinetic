import { Device } from 'react-native-ble-plx';
import { DEVICE_NAME_PATTERNS, BLE_CONFIG } from '../constants/BLEConstants';

/**
 * Check if a device is a duplicate in the devices array
 */
export const isDuplicateDevice = (devices: Device[], nextDevice: Device): boolean => {
  return devices.findIndex((device) => nextDevice.id === device.id) > -1;
};

/**
 * Check if a device matches our target criteria
 */
export const isTargetDevice = (device: Device): boolean => {
  const deviceName = (device.localName || device.name || '').toLowerCase();
  
  // Check if device name matches any of our patterns
  const nameMatches = DEVICE_NAME_PATTERNS.some(pattern => 
    deviceName.includes(pattern.toLowerCase())
  );
  
  // Check if device advertises our service UUID
  const serviceMatches = device.serviceUUIDs?.includes(BLE_CONFIG.DATA_SERVICE_UUID);
  
  // Check if device has a recognizable manufacturer data or other identifiers
  const hasValidIdentifier = deviceName.length > 0 || (device.serviceUUIDs?.length ?? 0) > 0;
  
  return (nameMatches || serviceMatches || false) && hasValidIdentifier;
};

/**
 * Get a display name for a device
 */
export const getDeviceDisplayName = (device: Device): string => {
  return device.name || device.localName || `Device ${device.id.slice(-4)}`;
};

/**
 * Get device signal strength description
 */
export const getSignalStrengthDescription = (rssi?: number | null): string => {
  if (!rssi || rssi === null) return 'Unknown';
  
  if (rssi >= -50) return 'Excellent';
  if (rssi >= -60) return 'Good';
  if (rssi >= -70) return 'Fair';
  return 'Weak';
};

/**
 * Format device information for display
 */
export const formatDeviceInfo = (device: Device) => {
  return {
    id: device.id,
    name: getDeviceDisplayName(device),
    rssi: device.rssi,
    signalStrength: getSignalStrengthDescription(device.rssi),
    isConnectable: device.isConnectable,
    serviceUUIDs: device.serviceUUIDs || [],
  };
};

/**
 * Validate BLE service and characteristic UUIDs
 */
export const validateUUIDs = () => {
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  const isValidServiceUUID = uuidPattern.test(BLE_CONFIG.DATA_SERVICE_UUID);
  const isValidCharacteristicUUID = uuidPattern.test(BLE_CONFIG.COLOR_CHARACTERISTIC_UUID);
  
  if (!isValidServiceUUID) {
    console.warn('Invalid service UUID format:', BLE_CONFIG.DATA_SERVICE_UUID);
  }
  
  if (!isValidCharacteristicUUID) {
    console.warn('Invalid characteristic UUID format:', BLE_CONFIG.COLOR_CHARACTERISTIC_UUID);
  }
  
  return isValidServiceUUID && isValidCharacteristicUUID;
};

/**
 * Convert base64 data to string safely
 */
export const safeBase64Decode = (base64Data: string): string | null => {
  try {
    // Handle both react-native-base64 and built-in atob
    if (typeof atob !== 'undefined') {
      return atob(base64Data);
    } else {
      // Fallback for environments without atob
      const base64 = require('react-native-base64');
      return base64.decode(base64Data);
    }
  } catch (error) {
    console.error('Error decoding base64 data:', error);
    return null;
  }
};

/**
 * Log device connection info for debugging
 */
export const logDeviceConnection = (device: Device, action: 'connecting' | 'connected' | 'disconnected') => {
  const deviceInfo = formatDeviceInfo(device);
  console.log(`Device ${action}:`, {
    name: deviceInfo.name,
    id: deviceInfo.id,
    rssi: deviceInfo.rssi,
    signalStrength: deviceInfo.signalStrength,
  });
};