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
        // React Native has built-in atob support
        if (typeof atob !== 'undefined') {
            return atob(base64Data);
        } else {
            // Manual base64 decoding as fallback
            console.warn('atob not available, using manual base64 decode');
            return manualBase64Decode(base64Data);
        }
    } catch (error) {
        console.error('Error decoding base64 data:', error);
        return null;
    }
};

/**
 * Manual base64 decoding fallback
 */
const manualBase64Decode = (base64: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;

    base64 = base64.replace(/[^A-Za-z0-9+/]/g, '');

    while (i < base64.length) {
        const encoded1 = chars.indexOf(base64.charAt(i++));
        const encoded2 = chars.indexOf(base64.charAt(i++));
        const encoded3 = chars.indexOf(base64.charAt(i++));
        const encoded4 = chars.indexOf(base64.charAt(i++));

        const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;

        result += String.fromCharCode((bitmap >> 16) & 255);
        if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
        if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
    }

    return result;
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