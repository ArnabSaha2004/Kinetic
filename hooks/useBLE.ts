import { useState, useEffect, useRef } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import {
  BleManager,
  Device,
  BleError,
  Characteristic,
} from 'react-native-ble-plx';
import * as ExpoDevice from 'expo-device';
import { BLE_CONFIG, COLOR_CODES, SCAN_CONFIG } from '../constants/BLEConstants';
import { 
  isDuplicateDevice, 
  isTargetDevice, 
  safeBase64Decode, 
  logDeviceConnection,
  validateUUIDs 
} from '../utils/BLEUtils';

interface IMUData {
  accelerometer: {
    x: number;
    y: number;
    z: number;
  };
  gyroscope: {
    x: number;
    y: number;
    z: number;
  };
  raw: {
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
  };
  timestamp: string;
  rawData: string;
}

interface BLEApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice(deviceId: Device): Promise<void>;
  disconnectFromDevice(): void;
  allDevices: Device[];
  connectedDevice: Device | null;
  imuData: IMUData;
  isScanning: boolean;
  isReady: boolean;
  hasError: boolean;
}

export function useBLE(): BLEApi {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [imuData, setImuData] = useState<IMUData>({
    accelerometer: { x: 0, y: 0, z: 0 },
    gyroscope: { x: 0, y: 0, z: 0 },
    raw: { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 },
    timestamp: '--:--:--',
    rawData: '0,0,0,0,0,0'
  });
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  
  // Use ref to store BLE manager instance, data buffer, and subscription
  const bleManagerRef = useRef<BleManager | null>(null);
  const dataBufferRef = useRef<string>('');
  const subscriptionRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);
  const isConnectingRef = useRef<boolean>(false);

  // Request Android 12+ (API 31+) permissions
  const requestAndroid31Permissions = async (): Promise<boolean> => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Bluetooth Scan Permission",
        message: "Bluetooth Low Energy requires Bluetooth Scan permission",
        buttonPositive: "OK",
      }
    );
    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Bluetooth Connect Permission",
        message: "Bluetooth Low Energy requires Bluetooth Connect permission",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location permission",
        buttonPositive: "OK",
      }
    );

    return (
      bluetoothScanPermission === "granted" &&
      bluetoothConnectPermission === "granted" &&
      fineLocationPermission === "granted"
    );
  };

  // Request permissions for different Android versions
  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === "android") {
      if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location permission",
            buttonPositive: "OK",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted = await requestAndroid31Permissions();
        return isAndroid31PermissionsGranted;
      }
    } else {
      return true; // iOS permissions are handled automatically
    }
  };

  // Initialize BLE manager and validation
  useEffect(() => {
    const initializeBLE = async () => {
      try {
        console.log('Initializing BLE Manager...');
        console.log('BleManager available:', !!BleManager);
        
        // Simple direct initialization as per Context7 docs
        bleManagerRef.current = new BleManager();
        console.log('BLE Manager instance created');
        
        // Test basic functionality
        const state = await bleManagerRef.current.state();
        console.log('BLE State:', state);
        
        validateUUIDs();
        setIsReady(true);
        setHasError(false);
        console.log('BLE Manager initialized successfully');
        
      } catch (error) {
        console.error('Failed to initialize BLE Manager:', error);
        setIsReady(false);
        setHasError(true);
        
        // Show helpful error message
        console.error('BLE Initialization Failed. This usually means:');
        console.error('1. App needs to be run on a physical device (BLE doesn\'t work on simulators)');
        console.error('2. react-native-ble-plx native module is not properly linked');
        console.error('3. New Architecture (TurboModules) is enabled - should be disabled');
        console.error('4. Try installing the new development build from EAS');
      }
    };

    // Initialize immediately - no delays needed
    initializeBLE();
    
    // Cleanup on unmount
    return () => {
      if (bleManagerRef.current) {
        try {
          bleManagerRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying BLE Manager:', error);
        }
        bleManagerRef.current = null;
      }
    };
  }, []);

  // Scan for BLE peripherals with null safety
  const scanForPeripherals = (): void => {
    try {
      if (!bleManagerRef.current || !isReady) {
        console.warn('BLE Manager not ready yet');
        return;
      }

      setIsScanning(true);
      setAllDevices([]); // Clear previous devices
      
      bleManagerRef.current.startDeviceScan(null, null, (error, device) => {
        try {
          if (error) {
            console.log('Scan error:', error);
            if (isMountedRef.current) {
              setIsScanning(false);
            }
            return;
          }

          if (device && isTargetDevice(device)) {
            if (isMountedRef.current) {
              setAllDevices((prevState: Device[]) => {
                if (!isDuplicateDevice(prevState, device)) {
                  return [...prevState, device];
                }
                return prevState;
              });
            }
          }
        } catch (scanCallbackError) {
          console.error('Error in scan callback:', scanCallbackError);
        }
      });

      // Stop scanning after configured timeout
      setTimeout(() => {
        try {
          if (bleManagerRef.current && isMountedRef.current) {
            bleManagerRef.current.stopDeviceScan();
            setIsScanning(false);
          }
        } catch (timeoutError) {
          console.error('Error stopping scan on timeout:', timeoutError);
        }
      }, SCAN_CONFIG.SCAN_TIMEOUT);
    } catch (scanError) {
      console.error('Error starting scan:', scanError);
      if (isMountedRef.current) {
        setIsScanning(false);
      }
    }
  };

  // Scale factors for unit conversion (matching web app)
  const ACCEL_SCALE = 16384.0;  // LSB/g for ±2g range
  const GYRO_SCALE = 131.0;     // LSB/(deg/s) for ±250deg/s range

  // Process complete IMU data packet with comprehensive null safety
  const processIMUData = (completeData: string | null | undefined): void => {
    try {
      // Check if component is still mounted to prevent state updates after unmount
      if (!isMountedRef.current) {
        console.log('🔍 Component unmounted, skipping IMU data processing');
        return;
      }

      if (!completeData || typeof completeData !== 'string') {
        console.warn('Invalid data provided to processIMUData:', completeData);
        return;
      }

      // Parse CSV format: "ax,ay,az,gx,gy,gz"
      const trimmedData = completeData.trim();
      if (!trimmedData) {
        console.warn('Empty data after trimming');
        return;
      }

      const values = trimmedData.split(',');
      
      if (!values || !Array.isArray(values) || values.length !== 6) {
        console.warn(`Expected 6 values, got ${values?.length || 0}:`, values);
        return;
      }
      
      // Convert to numbers with comprehensive NaN safeguards
      const rawValues = values.map((val, index) => {
        try {
          if (val === null || val === undefined) {
            console.warn(`Value at index ${index} is null/undefined`);
            return 0;
          }
          const trimmedVal = String(val).trim();
          const num = parseInt(trimmedVal, 10);
          return (isNaN(num) || !isFinite(num)) ? 0 : num;
        } catch (parseError) {
          console.warn(`Error parsing value at index ${index}:`, val, parseError);
          return 0;
        }
      });
      
      // Validate rawValues array
      if (!rawValues || rawValues.length !== 6) {
        console.warn('Invalid rawValues array:', rawValues);
        return;
      }

      // Convert to physical units with safeguards
      const ax = (isFinite(rawValues[0]) && isFinite(ACCEL_SCALE) && ACCEL_SCALE !== 0) ? rawValues[0] / ACCEL_SCALE : 0;
      const ay = (isFinite(rawValues[1]) && isFinite(ACCEL_SCALE) && ACCEL_SCALE !== 0) ? rawValues[1] / ACCEL_SCALE : 0;
      const az = (isFinite(rawValues[2]) && isFinite(ACCEL_SCALE) && ACCEL_SCALE !== 0) ? rawValues[2] / ACCEL_SCALE : 0;
      const gx = (isFinite(rawValues[3]) && isFinite(GYRO_SCALE) && GYRO_SCALE !== 0) ? rawValues[3] / GYRO_SCALE : 0;
      const gy = (isFinite(rawValues[4]) && isFinite(GYRO_SCALE) && GYRO_SCALE !== 0) ? rawValues[4] / GYRO_SCALE : 0;
      const gz = (isFinite(rawValues[5]) && isFinite(GYRO_SCALE) && GYRO_SCALE !== 0) ? rawValues[5] / GYRO_SCALE : 0;
      
      // Update IMU data state only if component is mounted and setImuData is available
      if (isMountedRef.current && typeof setImuData === 'function') {
        try {
          setImuData({
            accelerometer: { x: ax, y: ay, z: az },
            gyroscope: { x: gx, y: gy, z: gz },
            raw: { 
              ax: rawValues[0] || 0, 
              ay: rawValues[1] || 0, 
              az: rawValues[2] || 0, 
              gx: rawValues[3] || 0, 
              gy: rawValues[4] || 0, 
              gz: rawValues[5] || 0 
            },
            timestamp: new Date().toLocaleTimeString(),
            rawData: trimmedData
          });
          
          console.log('✅ IMU data updated - Accel:', { 
            x: isFinite(ax) ? ax.toFixed(3) : 'NaN', 
            y: isFinite(ay) ? ay.toFixed(3) : 'NaN', 
            z: isFinite(az) ? az.toFixed(3) : 'NaN' 
          });
        } catch (stateUpdateError: any) {
          console.error('Error updating IMU state:', stateUpdateError?.message || 'Unknown error');
        }
      } else {
        console.log('🔍 Component unmounted or setImuData unavailable, skipping state update');
      }
    } catch (processError: any) {
      console.error('Error processing IMU data:', processError?.message || 'Unknown error');
    }
  };

  // Handle data updates from BLE characteristic with buffering and null safety
  const onDataUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null
  ): void => {
    try {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log('🔍 Component unmounted, ignoring data update');
        return;
      }

      if (error) {
        console.log('Data update error:', error);
        return;
      } 
      
      if (!characteristic || !characteristic.value) {
        console.log('No data was received - characteristic or value is null');
        return;
      }

      const decodedData = safeBase64Decode(characteristic.value);
      if (decodedData && typeof decodedData === 'string') {
        console.log('📦 Received fragment:', decodedData);
        
        // Add to buffer with null safety
        try {
          if (dataBufferRef.current !== undefined) {
            dataBufferRef.current += decodedData;
          } else {
            dataBufferRef.current = decodedData;
          }
        } catch (bufferError) {
          console.error('Error updating buffer:', bufferError);
          dataBufferRef.current = decodedData; // Reset buffer
        }
        
        // Try to find complete 6-value packets in the buffer
        // Look for patterns that have exactly 6 comma-separated values
        const allValues = dataBufferRef.current.split(',');
        
        if (allValues && Array.isArray(allValues) && allValues.length >= 6) {
          // Process complete 6-value packets
          let processedValues = 0;
          
          while (processedValues + 5 < allValues.length) {
            const packet = allValues.slice(processedValues, processedValues + 6);
            
            // Validate all values are numeric
            const isValidPacket = packet.every(val => {
              const trimmed = val.trim();
              return trimmed && !isNaN(parseInt(trimmed));
            });
            
            if (isValidPacket) {
              const packetString = packet.join(',');
              console.log('🔄 Processing complete packet:', packetString);
              processIMUData(packetString);
              processedValues += 6;
            } else {
              // Skip invalid value and try next position
              processedValues += 1;
            }
          }
          
          // Keep remaining values in buffer
          if (processedValues > 0) {
            const remainingValues = allValues.slice(processedValues);
            dataBufferRef.current = remainingValues.join(',');
            console.log('📦 Buffer updated, remaining values:', remainingValues.length);
          }
        } else {
          console.log('📦 Buffer has', allValues?.length || 0, 'values, waiting for more...');
        }
        
        // Clear buffer if it gets too long (prevent memory issues)
        if (dataBufferRef.current && dataBufferRef.current.length > 200) {
          console.warn('🧹 Buffer cleared (too long)');
          dataBufferRef.current = '';
        }
      } else {
        console.log('No valid decoded data received');
      }
    } catch (updateError: any) {
      console.error('Error in onDataUpdate:', updateError?.message || 'Unknown error');
      // Reset buffer on error to prevent stuck state
      try {
        dataBufferRef.current = '';
      } catch (resetError) {
        console.error('Error resetting buffer:', resetError);
      }
    }
  };

  // Start streaming data from connected device with null safety
  const startStreamingData = async (device: Device | null): Promise<void> => {
    try {
      if (!device || !isMountedRef.current) {
        console.log('No device connected or component unmounted');
        return;
      }

      console.log('🔄 Starting data streaming for device:', device?.name || 'Unknown');
      
      // Clean up any existing subscription first
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.remove();
          console.log('🧹 Old subscription removed');
        } catch (cleanupError) {
          console.warn('Error removing old subscription:', cleanupError);
        }
        subscriptionRef.current = null;
      }

      // Add a small delay to ensure device is fully connected
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if still mounted after delay
      if (!isMountedRef.current) {
        console.log('Component unmounted during delay, aborting streaming');
        return;
      }
      
      console.log('🔍 Attempting to monitor characteristic...');
      console.log('Service UUID:', BLE_CONFIG.DATA_SERVICE_UUID);
      console.log('Characteristic UUID:', BLE_CONFIG.COLOR_CHARACTERISTIC_UUID);
      
      const subscription = await device.monitorCharacteristicForService(
        BLE_CONFIG.DATA_SERVICE_UUID,
        BLE_CONFIG.COLOR_CHARACTERISTIC_UUID,
        onDataUpdate
      );
      
      // Store subscription for cleanup only if component is still mounted
      if (isMountedRef.current && subscription) {
        subscriptionRef.current = subscription;
        console.log('✅ Started monitoring characteristic successfully');
        console.log('✅ Characteristic monitoring subscription created');
        
        // Test if we can read the characteristic once
        try {
          const characteristic = await device.readCharacteristicForService(
            BLE_CONFIG.DATA_SERVICE_UUID,
            BLE_CONFIG.COLOR_CHARACTERISTIC_UUID
          );
          console.log('📖 Test read characteristic value:', characteristic?.value || 'null');
        } catch (readError: any) {
          console.log('⚠️ Could not read characteristic (this is normal for notify-only):', readError?.message || 'Unknown error');
        }
      } else {
        console.warn('⚠️ Subscription failed or component unmounted');
      }
    } catch (streamError: any) {
      console.error('❌ Error starting data stream:', streamError);
      console.error('Error details:', streamError?.message || 'Unknown error');
      // Don't throw error, just log it
    }
  };

  // Connect to a BLE device with comprehensive null safety
  const connectToDevice = async (device: Device): Promise<void> => {
    try {
      if (!device || !device.id) {
        throw new Error('Invalid device provided');
      }

      if (!bleManagerRef.current || !isReady) {
        throw new Error('BLE Manager not ready');
      }

      if (!isMountedRef.current) {
        throw new Error('Component unmounted');
      }

      // Set connecting flag to prevent premature cleanup
      isConnectingRef.current = true;
      console.log('🔒 Connection process started, preventing cleanup');

      logDeviceConnection(device, 'connecting');
      
      const deviceConnection = await bleManagerRef.current.connectToDevice(device.id);
      
      if (!deviceConnection) {
        throw new Error('Failed to establish device connection');
      }

      if (isMountedRef.current) {
        setConnectedDevice(deviceConnection);
      }
      
      console.log('🔍 Discovering services and characteristics...');
      await deviceConnection.discoverAllServicesAndCharacteristics();
      
      // List all services and characteristics for debugging
      try {
        const services = await deviceConnection.services();
        if (services && Array.isArray(services)) {
          console.log('📋 Available services:');
          for (const service of services) {
            if (service && service.uuid) {
              console.log(`  Service: ${service.uuid}`);
              try {
                const characteristics = await service.characteristics();
                if (characteristics && Array.isArray(characteristics)) {
                  for (const char of characteristics) {
                    if (char && char.uuid) {
                      console.log(`    Characteristic: ${char.uuid} (properties: ${char.isReadable ? 'R' : ''}${char.isWritableWithResponse ? 'W' : ''}${char.isWritableWithoutResponse ? 'w' : ''}${char.isNotifiable ? 'N' : ''}${char.isIndicatable ? 'I' : ''})`);
                    }
                  }
                }
              } catch (charError: any) {
                console.log(`    Could not read characteristics: ${charError?.message || 'Unknown error'}`);
              }
            }
          }
        }
      } catch (serviceError: any) {
        console.log('Could not list services:', serviceError?.message || 'Unknown error');
      }
      
      // Stop scanning safely
      try {
        if (bleManagerRef.current && isMountedRef.current) {
          bleManagerRef.current.stopDeviceScan();
          setIsScanning(false);
        }
      } catch (stopScanError) {
        console.warn('Error stopping scan:', stopScanError);
      }
      
      // Start streaming data
      await startStreamingData(deviceConnection);
      
      logDeviceConnection(device, 'connected');
      
      // Clear connecting flag after successful connection
      isConnectingRef.current = false;
      console.log('🔓 Connection process completed successfully');
      console.log('🔗 BLE connection established and streaming data');
      
    } catch (connectError: any) {
      // Clear connecting flag on error
      isConnectingRef.current = false;
      console.error('Failed to connect:', connectError);
      console.error('Connection error details:', connectError?.message || 'Unknown error');
      throw connectError;
    }
  };

  // Disconnect from current device with comprehensive null safety
  const disconnectFromDevice = (): void => {
    try {
      console.log('🔌 Starting disconnect process...');
      
      // Clean up subscription first with null checks
      if (subscriptionRef.current) {
        try {
          console.log('🧹 Removing BLE subscription...');
          if (typeof subscriptionRef.current.remove === 'function') {
            subscriptionRef.current.remove();
          }
          subscriptionRef.current = null;
          console.log('✅ BLE subscription removed');
        } catch (subscriptionError: any) {
          console.warn('⚠️ Error removing subscription:', subscriptionError?.message || 'Unknown error');
        }
      } else {
        console.log('🔍 No subscription to remove');
      }

      // Clear data buffer safely
      try {
        if (dataBufferRef.current !== undefined) {
          dataBufferRef.current = '';
          console.log('🧹 Data buffer cleared');
        }
      } catch (bufferError) {
        console.warn('⚠️ Error clearing buffer:', bufferError);
      }

      // Disconnect from device with null checks
      if (connectedDevice && connectedDevice.id && bleManagerRef.current) {
        try {
          logDeviceConnection(connectedDevice, 'disconnected');
          if (typeof bleManagerRef.current.cancelDeviceConnection === 'function') {
            bleManagerRef.current.cancelDeviceConnection(connectedDevice.id);
          }
          console.log('🔌 Device disconnected');
        } catch (deviceError: any) {
          console.warn('⚠️ Error disconnecting device:', deviceError?.message || 'Unknown error');
        }
      } else {
        console.log('🔍 No device to disconnect or BLE manager unavailable');
      }

      // Reset state only if component is mounted and functions are available
      if (isMountedRef.current) {
        try {
          if (typeof setConnectedDevice === 'function') {
            setConnectedDevice(null);
          }
          if (typeof setImuData === 'function') {
            setImuData({
              accelerometer: { x: 0, y: 0, z: 0 },
              gyroscope: { x: 0, y: 0, z: 0 },
              raw: { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 },
              timestamp: '--:--:--',
              rawData: '0,0,0,0,0,0'
            });
          }
          console.log('✅ Disconnect completed successfully');
        } catch (stateError: any) {
          console.warn('⚠️ Error resetting state:', stateError?.message || 'Unknown error');
        }
      } else {
        console.log('🔍 Component unmounted, skipping state reset');
      }
    } catch (disconnectError: any) {
      console.error('❌ Error during disconnect:', disconnectError?.message || 'Unknown error');
      // Even if there's an error, try to reset the state to prevent stuck connections
      if (isMountedRef.current) {
        try {
          setConnectedDevice(null);
        } catch (finalError) {
          console.error('❌ Final error resetting connected device:', finalError);
        }
      }
    }
  };

  // Cleanup connected device on unmount with comprehensive null safety
  useEffect(() => {
    return () => {
      try {
        // Only cleanup if we have a connected device or are not in connecting state
        if (connectedDevice || !isConnectingRef.current) {
          performCleanup();
        } else {
          console.log('🔒 Connection in progress, skipping cleanup to maintain connection');
        }
      } catch (cleanupError: any) {
        console.error('❌ Error during component cleanup:', cleanupError?.message || 'Unknown error');
      }
    };
  }, [connectedDevice]);

  // Separate cleanup function
  const performCleanup = () => {
    try {
      console.log('🧹 Performing BLE cleanup...');
      
      // Don't cleanup if we have an active connection and are receiving data
      if (connectedDevice && subscriptionRef.current) {
        console.log('🔗 Active BLE connection detected, preserving connection');
        // Only mark as unmounted but don't destroy the connection
        isMountedRef.current = false;
        return;
      }
      
      console.log('🧹 Component unmounting, cleaning up...');
      isMountedRef.current = false;
        
        // Clean up subscription with null checks
        if (subscriptionRef.current) {
          try {
            if (typeof subscriptionRef.current.remove === 'function') {
              subscriptionRef.current.remove();
            }
            subscriptionRef.current = null;
            console.log('✅ Subscription cleaned up on unmount');
          } catch (subscriptionError: any) {
            console.warn('Error removing subscription on unmount:', subscriptionError?.message || 'Unknown error');
          }
        }

        // Clean up BLE manager with null checks
        if (bleManagerRef.current) {
          try {
            // Stop scanning if available
            if (typeof bleManagerRef.current.stopDeviceScan === 'function') {
              bleManagerRef.current.stopDeviceScan();
            }
            
            // Disconnect device if connected
            if (connectedDevice && connectedDevice.id && typeof bleManagerRef.current.cancelDeviceConnection === 'function') {
              bleManagerRef.current.cancelDeviceConnection(connectedDevice.id);
            }
            
            console.log('✅ BLE manager cleaned up on unmount');
          } catch (bleError: any) {
            console.warn('Error cleaning up BLE manager on unmount:', bleError?.message || 'Unknown error');
          }
        }

        // Clear data buffer
        try {
          if (dataBufferRef.current !== undefined) {
            dataBufferRef.current = '';
          }
        } catch (bufferError) {
          console.warn('Error clearing buffer on unmount:', bufferError);
        }

        console.log('✅ Component cleanup completed');
    } catch (cleanupError: any) {
      console.error('❌ Error during component cleanup:', cleanupError?.message || 'Unknown error');
    }
  };

  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    imuData,
    isScanning,
    isReady,
    hasError,
  };
}