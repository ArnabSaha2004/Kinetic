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
  isStale: boolean; // New field to track if data is stale
  lastUpdateTime: number; // Timestamp of last data update
}

interface BLEApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice(deviceId: Device): Promise<void>;
  disconnectFromDevice(): void;
  reconnectToLastDevice(): void;
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
    rawData: '0,0,0,0,0,0',
    isStale: false,
    lastUpdateTime: Date.now()
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
  const staleDataTimerRef = useRef<number | null>(null);
  const lastDataTimeRef = useRef<number>(Date.now());
  const lastConnectedDeviceRef = useRef<Device | null>(null);

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

  // Stale data detection - mark data as stale if no updates for 3 seconds
  const checkForStaleData = () => {
    try {
      if (!isMountedRef.current) {
        return; // Component unmounted, skip check
      }

      const now = Date.now();
      const timeSinceLastUpdate = now - lastDataTimeRef.current;
      
      if (timeSinceLastUpdate > 3000) { // 3 seconds threshold
        console.warn('⚠️ Data appears stale - no updates for', timeSinceLastUpdate, 'ms');
        
        // Only update state if component is still mounted and setImuData is available
        if (isMountedRef.current && typeof setImuData === 'function') {
          setImuData(prevData => {
            // Additional null check on prevData
            if (!prevData) {
              return {
                accelerometer: { x: 0, y: 0, z: 0 },
                gyroscope: { x: 0, y: 0, z: 0 },
                raw: { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 },
                timestamp: '--:--:--',
                rawData: '0,0,0,0,0,0',
                isStale: true,
                lastUpdateTime: now
              };
            }
            
            // If data just became stale, just mark it - let user manually reconnect
            if (!prevData.isStale) {
              console.log('⚠️ Data became stale - manual reconnection available');
            }
            
            return {
              ...prevData,
              isStale: true
            };
          });
        }
      }
    } catch (staleCheckError: any) {
      console.warn('⚠️ Error in stale data check:', staleCheckError?.message || 'Unknown error');
    }
  };

  // Start stale data monitoring when connected
  const startStaleDataMonitoring = () => {
    if (staleDataTimerRef.current) {
      clearInterval(staleDataTimerRef.current);
    }
    
    staleDataTimerRef.current = setInterval(checkForStaleData, 1000); // Check every second
    console.log('🕐 Started stale data monitoring');
  };

  // Stop stale data monitoring
  const stopStaleDataMonitoring = () => {
    if (staleDataTimerRef.current) {
      clearInterval(staleDataTimerRef.current);
      staleDataTimerRef.current = null;
      console.log('🕐 Stopped stale data monitoring');
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
      stopStaleDataMonitoring();
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
      const ax = isFinite(rawValues[0]) ? rawValues[0] / ACCEL_SCALE : 0;
      const ay = isFinite(rawValues[1]) ? rawValues[1] / ACCEL_SCALE : 0;
      const az = isFinite(rawValues[2]) ? rawValues[2] / ACCEL_SCALE : 0;
      const gx = isFinite(rawValues[3]) ? rawValues[3] / GYRO_SCALE : 0;
      const gy = isFinite(rawValues[4]) ? rawValues[4] / GYRO_SCALE : 0;
      const gz = isFinite(rawValues[5]) ? rawValues[5] / GYRO_SCALE : 0;
      
      // Update IMU data state only if component is mounted and setImuData is available
      if (isMountedRef.current && typeof setImuData === 'function') {
        try {
          const now = Date.now();
          lastDataTimeRef.current = now; // Update last data time
          
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
            rawData: trimmedData,
            isStale: false, // Reset stale flag on new data
            lastUpdateTime: now
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
    const updateId = Math.random().toString(36).slice(2, 8);
    
    try {
      // Check if component is still mounted
      if (!isMountedRef.current) {
        console.log(`📦 [${updateId}] Component unmounted, ignoring data update`);
        return;
      }

      if (error) {
        console.log(`📦 [${updateId}] Data update error:`, error?.message || 'Unknown error');
        return;
      } 
      
      if (!characteristic) {
        console.log(`📦 [${updateId}] No characteristic received`);
        return;
      }
      
      if (!characteristic.value) {
        console.log(`📦 [${updateId}] No characteristic value received`);
        return;
      }

      console.log(`📦 [${updateId}] Processing data update...`);
      
      let decodedData: string | null = null;
      try {
        decodedData = safeBase64Decode(characteristic.value);
        console.log(`📦 [${updateId}] Decoded data:`, decodedData);
      } catch (decodeError: any) {
        console.error(`📦 [${updateId}] Error decoding data:`, decodeError?.message || 'Unknown error');
        return;
      }
      
      if (decodedData && typeof decodedData === 'string') {
        console.log(`📦 [${updateId}] Received fragment:`, decodedData);
        
        // Add to buffer with null safety
        try {
          console.log(`📦 [${updateId}] Current buffer length: ${dataBufferRef.current?.length || 0}`);
          
          if (dataBufferRef.current !== undefined && dataBufferRef.current !== null) {
            dataBufferRef.current += decodedData;
          } else {
            console.log(`📦 [${updateId}] Buffer was null/undefined, initializing with new data`);
            dataBufferRef.current = decodedData;
          }
          
          console.log(`📦 [${updateId}] Buffer updated, new length: ${dataBufferRef.current?.length || 0}`);
        } catch (bufferError: any) {
          console.error(`📦 [${updateId}] Error updating buffer:`, bufferError?.message || 'Unknown error');
          console.error(`� [ ${updateId}] Buffer error stack:`, bufferError?.stack || 'No stack');
          dataBufferRef.current = decodedData; // Reset buffer
          console.log(`📦 [${updateId}] Buffer reset with new data`);
        }
        
        // Try to find complete 6-value packets in the buffer
        console.log(`📦 [${updateId}] Processing buffer for complete packets...`);
        
        let allValues: string[] = [];
        try {
          if (dataBufferRef.current && typeof dataBufferRef.current === 'string') {
            allValues = dataBufferRef.current.split(',');
            console.log(`📦 [${updateId}] Split buffer into ${allValues.length} values`);
          } else {
            console.warn(`📦 [${updateId}] Buffer is not a string: ${typeof dataBufferRef.current}`);
            return;
          }
        } catch (splitError: any) {
          console.error(`📦 [${updateId}] Error splitting buffer:`, splitError?.message || 'Unknown error');
          return;
        }
        
        if (allValues && Array.isArray(allValues) && allValues.length >= 6) {
          console.log(`📦 [${updateId}] Found ${allValues.length} values, processing packets...`);
          
          // Process complete 6-value packets
          let processedValues = 0;
          
          while (processedValues + 5 < allValues.length) {
            try {
              const packet = allValues.slice(processedValues, processedValues + 6);
              console.log(`📦 [${updateId}] Checking packet at position ${processedValues}:`, packet);
              
              // Validate all values are numeric
              const isValidPacket = packet.every((val, index) => {
                try {
                  if (val === null || val === undefined) {
                    console.warn(`📦 [${updateId}] Packet value at index ${index} is null/undefined`);
                    return false;
                  }
                  const trimmed = String(val).trim();
                  const isValid = trimmed && !isNaN(parseInt(trimmed));
                  if (!isValid) {
                    console.warn(`📦 [${updateId}] Invalid packet value at index ${index}: "${val}" -> "${trimmed}"`);
                  }
                  return isValid;
                } catch (validationError: any) {
                  console.error(`📦 [${updateId}] Error validating packet value at index ${index}:`, validationError?.message || 'Unknown error');
                  return false;
                }
              });
              
              if (isValidPacket) {
                const packetString = packet.join(',');
                console.log(`📦 [${updateId}] Processing valid packet:`, packetString);
                
                try {
                  processIMUData(packetString);
                  console.log(`📦 [${updateId}] Packet processed successfully`);
                } catch (processError: any) {
                  console.error(`📦 [${updateId}] Error processing packet:`, processError?.message || 'Unknown error');
                }
                
                processedValues += 6;
              } else {
                console.log(`📦 [${updateId}] Invalid packet, skipping to next position`);
                // Skip invalid value and try next position
                processedValues += 1;
              }
            } catch (packetError: any) {
              console.error(`📦 [${updateId}] Error processing packet at position ${processedValues}:`, packetError?.message || 'Unknown error');
              processedValues += 1; // Skip this position
            }
          }
          
          // Keep remaining values in buffer
          if (processedValues > 0) {
            try {
              const remainingValues = allValues.slice(processedValues);
              dataBufferRef.current = remainingValues.join(',');
              console.log(`📦 [${updateId}] Buffer updated, remaining values: ${remainingValues.length}`);
            } catch (remainingError: any) {
              console.error(`📦 [${updateId}] Error updating remaining buffer:`, remainingError?.message || 'Unknown error');
              dataBufferRef.current = ''; // Clear buffer on error
            }
          }
        } else {
          console.log(`📦 [${updateId}] Buffer has ${allValues?.length || 0} values, waiting for more...`);
        }
        
        // Clear buffer if it gets too long (prevent memory issues)
        try {
          if (dataBufferRef.current && dataBufferRef.current.length > 200) {
            console.warn(`📦 [${updateId}] Buffer too long (${dataBufferRef.current.length} chars), clearing...`);
            dataBufferRef.current = '';
          }
        } catch (lengthCheckError: any) {
          console.error(`📦 [${updateId}] Error checking buffer length:`, lengthCheckError?.message || 'Unknown error');
          dataBufferRef.current = ''; // Clear buffer on error
        }
      } else {
        console.log(`📦 [${updateId}] No valid decoded data received`);
      }
    } catch (updateError: any) {
      console.error(`📦 [${updateId}] CRITICAL ERROR in onDataUpdate:`, updateError?.message || 'Unknown error');
      console.error(`📦 [${updateId}] Update error stack:`, updateError?.stack || 'No stack');
      console.error(`📦 [${updateId}] Update error details:`, updateError);
      
      // Reset buffer on error to prevent stuck state
      try {
        console.log(`📦 [${updateId}] Resetting buffer due to error...`);
        dataBufferRef.current = '';
        console.log(`📦 [${updateId}] Buffer reset completed`);
      } catch (resetError: any) {
        console.error(`📦 [${updateId}] Error resetting buffer:`, resetError?.message || 'Unknown error');
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
        
        // Start monitoring for stale data
        startStaleDataMonitoring();
        
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

  // Simple reconnect - just try to connect to the last device
  const reconnectToLastDevice = (): void => {
    const deviceToReconnect = lastConnectedDeviceRef.current;
    if (deviceToReconnect) {
      console.log('🔄 Reconnecting to:', deviceToReconnect.name);
      connectToDevice(deviceToReconnect).catch(error => {
        console.log('❌ Reconnect failed:', error);
      });
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
        lastConnectedDeviceRef.current = deviceConnection; // Store for reconnection
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

  // Disconnect from current device with comprehensive null safety and detailed logging
  const disconnectFromDevice = (): void => {
    const disconnectId = Math.random().toString(36).slice(2, 11);
    console.log(`🔌 [${disconnectId}] Starting disconnect process...`);
    console.log(`🔌 [${disconnectId}] Current state - mounted: ${isMountedRef.current}, connectedDevice: ${connectedDevice?.name || 'null'}, subscription: ${!!subscriptionRef.current}`);
    
    try {
      // Step 1: Stop stale data monitoring first
      console.log(`🕐 [${disconnectId}] Step 1: Stopping stale data monitoring...`);
      try {
        stopStaleDataMonitoring();
        console.log(`✅ [${disconnectId}] Stale data monitoring stopped`);
      } catch (monitorError: any) {
        console.error(`❌ [${disconnectId}] Error stopping stale data monitoring:`, monitorError?.message || 'Unknown error');
      }
      
      // Step 2: Store current device reference before clearing state
      const deviceToDisconnect = connectedDevice;
      console.log(`📱 [${disconnectId}] Step 2: Device to disconnect:`, deviceToDisconnect ? {
        id: deviceToDisconnect.id,
        name: deviceToDisconnect.name
      } : 'null');
      
      // Step 3: Clean up subscription first with null checks
      console.log(`🧹 [${disconnectId}] Step 3: Cleaning up subscription...`);
      if (subscriptionRef.current) {
        try {
          console.log(`🧹 [${disconnectId}] Subscription exists, removing...`);
          console.log(`🧹 [${disconnectId}] Subscription type:`, typeof subscriptionRef.current);
          console.log(`🧹 [${disconnectId}] Subscription has remove method:`, typeof subscriptionRef.current.remove === 'function');
          
          if (subscriptionRef.current && typeof subscriptionRef.current.remove === 'function') {
            subscriptionRef.current.remove();
            console.log(`✅ [${disconnectId}] Subscription.remove() called successfully`);
          } else {
            console.warn(`⚠️ [${disconnectId}] Subscription remove method not available`);
          }
          
          subscriptionRef.current = null;
          console.log(`✅ [${disconnectId}] Subscription reference cleared`);
        } catch (subscriptionError: any) {
          console.error(`❌ [${disconnectId}] Error removing subscription:`, subscriptionError?.message || 'Unknown error');
          console.error(`❌ [${disconnectId}] Subscription error stack:`, subscriptionError?.stack || 'No stack');
          // Force clear subscription reference even if removal failed
          subscriptionRef.current = null;
          console.log(`🚨 [${disconnectId}] Force cleared subscription reference`);
        }
      } else {
        console.log(`🔍 [${disconnectId}] No subscription to remove`);
      }

      // Step 4: Clear data buffer safely
      console.log(`🧹 [${disconnectId}] Step 4: Clearing data buffer...`);
      try {
        const bufferLength = dataBufferRef.current?.length || 0;
        dataBufferRef.current = '';
        console.log(`✅ [${disconnectId}] Data buffer cleared (was ${bufferLength} chars)`);
      } catch (bufferError: any) {
        console.error(`❌ [${disconnectId}] Error clearing buffer:`, bufferError?.message || 'Unknown error');
        // Force reset buffer
        dataBufferRef.current = '';
        console.log(`🚨 [${disconnectId}] Force cleared data buffer`);
      }

      // Step 5: Reset state first to prevent UI showing stale connection
      console.log(`🔄 [${disconnectId}] Step 5: Resetting UI state...`);
      console.log(`🔄 [${disconnectId}] Component mounted check: ${isMountedRef.current}`);
      console.log(`🔄 [${disconnectId}] setConnectedDevice type: ${typeof setConnectedDevice}`);
      console.log(`🔄 [${disconnectId}] setImuData type: ${typeof setImuData}`);
      
      if (isMountedRef.current) {
        try {
          console.log(`🔄 [${disconnectId}] Calling setConnectedDevice(null)...`);
          if (typeof setConnectedDevice === 'function') {
            setConnectedDevice(null);
            console.log(`✅ [${disconnectId}] setConnectedDevice(null) completed`);
          } else {
            console.error(`❌ [${disconnectId}] setConnectedDevice is not a function: ${typeof setConnectedDevice}`);
          }
          
          console.log(`🔄 [${disconnectId}] Calling setImuData with reset values...`);
          if (typeof setImuData === 'function') {
            const resetData = {
              accelerometer: { x: 0, y: 0, z: 0 },
              gyroscope: { x: 0, y: 0, z: 0 },
              raw: { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 },
              timestamp: '--:--:--',
              rawData: '0,0,0,0,0,0',
              isStale: false,
              lastUpdateTime: Date.now()
            };
            console.log(`🔄 [${disconnectId}] Reset data prepared:`, resetData);
            setImuData(resetData);
            console.log(`✅ [${disconnectId}] setImuData completed`);
          } else {
            console.error(`❌ [${disconnectId}] setImuData is not a function: ${typeof setImuData}`);
          }
          
          console.log(`✅ [${disconnectId}] UI state reset completed`);
        } catch (stateError: any) {
          console.error(`❌ [${disconnectId}] Error resetting state:`, stateError?.message || 'Unknown error');
          console.error(`❌ [${disconnectId}] State error stack:`, stateError?.stack || 'No stack');
          console.error(`❌ [${disconnectId}] State error details:`, stateError);
        }
      } else {
        console.log(`🔍 [${disconnectId}] Component not mounted, skipping state reset`);
      }

      // Step 6: Disconnect from device with null checks (do this after state reset)
      console.log(`🔌 [${disconnectId}] Step 6: Disconnecting from BLE device...`);
      console.log(`🔌 [${disconnectId}] Device check - deviceToDisconnect: ${!!deviceToDisconnect}, deviceId: ${deviceToDisconnect?.id || 'null'}, bleManager: ${!!bleManagerRef.current}`);
      
      if (deviceToDisconnect?.id && bleManagerRef.current) {
        try {
          console.log(`🔌 [${disconnectId}] Disconnecting from device:`, deviceToDisconnect.name || deviceToDisconnect.id);
          console.log(`🔌 [${disconnectId}] BLE Manager type: ${typeof bleManagerRef.current}`);
          console.log(`🔌 [${disconnectId}] cancelDeviceConnection method: ${typeof bleManagerRef.current.cancelDeviceConnection}`);
          
          // Log device connection for tracking
          try {
            logDeviceConnection(deviceToDisconnect, 'disconnected');
            console.log(`✅ [${disconnectId}] Device connection logged`);
          } catch (logError: any) {
            console.warn(`⚠️ [${disconnectId}] Error logging device connection:`, logError?.message || 'Unknown error');
          }
          
          if (bleManagerRef.current && typeof bleManagerRef.current.cancelDeviceConnection === 'function') {
            console.log(`🔌 [${disconnectId}] Calling cancelDeviceConnection...`);
            
            try {
              const disconnectPromise = bleManagerRef.current.cancelDeviceConnection(deviceToDisconnect.id);
              console.log(`🔌 [${disconnectId}] cancelDeviceConnection called, promise type: ${typeof disconnectPromise}`);
              
              // Don't await the promise to prevent blocking, but handle it
              if (disconnectPromise && typeof disconnectPromise.catch === 'function') {
                disconnectPromise.catch((error: any) => {
                  console.warn(`⚠️ [${disconnectId}] Device disconnect promise rejected:`, error?.message || 'Unknown error');
                  console.warn(`⚠️ [${disconnectId}] Promise rejection stack:`, error?.stack || 'No stack');
                });
                console.log(`✅ [${disconnectId}] Promise error handler attached`);
              } else {
                console.log(`🔍 [${disconnectId}] No promise returned or no catch method`);
              }
            } catch (cancelError: any) {
              console.error(`❌ [${disconnectId}] Error calling cancelDeviceConnection:`, cancelError?.message || 'Unknown error');
              console.error(`❌ [${disconnectId}] Cancel error stack:`, cancelError?.stack || 'No stack');
            }
          } else {
            console.error(`❌ [${disconnectId}] cancelDeviceConnection method not available`);
          }
          
          console.log(`✅ [${disconnectId}] Device disconnect process initiated`);
        } catch (deviceError: any) {
          console.error(`❌ [${disconnectId}] Error in device disconnect process:`, deviceError?.message || 'Unknown error');
          console.error(`❌ [${disconnectId}] Device error stack:`, deviceError?.stack || 'No stack');
        }
      } else {
        console.log(`🔍 [${disconnectId}] No device to disconnect or BLE manager unavailable`);
        console.log(`🔍 [${disconnectId}] - deviceToDisconnect: ${!!deviceToDisconnect}`);
        console.log(`🔍 [${disconnectId}] - deviceToDisconnect.id: ${deviceToDisconnect?.id || 'null'}`);
        console.log(`🔍 [${disconnectId}] - bleManagerRef.current: ${!!bleManagerRef.current}`);
      }

      console.log(`✅ [${disconnectId}] Disconnect process completed successfully`);
      
    } catch (disconnectError: any) {
      console.error(`❌ [${disconnectId}] CRITICAL ERROR during disconnect:`, disconnectError?.message || 'Unknown error');
      console.error(`❌ [${disconnectId}] Critical error stack:`, disconnectError?.stack || 'No stack');
      console.error(`❌ [${disconnectId}] Critical error details:`, disconnectError);
      
      // Emergency cleanup - force reset everything
      console.log(`🚨 [${disconnectId}] Starting emergency cleanup...`);
      try {
        console.log(`🚨 [${disconnectId}] Emergency: Stopping stale data monitoring...`);
        stopStaleDataMonitoring();
        
        console.log(`🚨 [${disconnectId}] Emergency: Clearing subscription reference...`);
        subscriptionRef.current = null;
        
        console.log(`🚨 [${disconnectId}] Emergency: Clearing data buffer...`);
        dataBufferRef.current = '';
        
        console.log(`🚨 [${disconnectId}] Emergency: Checking if component is mounted...`);
        if (isMountedRef.current) {
          console.log(`🚨 [${disconnectId}] Emergency: Resetting state...`);
          
          if (typeof setConnectedDevice === 'function') {
            setConnectedDevice(null);
            console.log(`🚨 [${disconnectId}] Emergency: setConnectedDevice(null) completed`);
          }
          
          if (typeof setImuData === 'function') {
            setImuData({
              accelerometer: { x: 0, y: 0, z: 0 },
              gyroscope: { x: 0, y: 0, z: 0 },
              raw: { ax: 0, ay: 0, az: 0, gx: 0, gy: 0, gz: 0 },
              timestamp: '--:--:--',
              rawData: '0,0,0,0,0,0',
              isStale: false,
              lastUpdateTime: Date.now()
            });
            console.log(`🚨 [${disconnectId}] Emergency: setImuData completed`);
          }
        }
        
        console.log(`✅ [${disconnectId}] Emergency cleanup completed`);
      } catch (emergencyError: any) {
        console.error(`❌ [${disconnectId}] EMERGENCY CLEANUP FAILED:`, emergencyError?.message || 'Unknown error');
        console.error(`❌ [${disconnectId}] Emergency error stack:`, emergencyError?.stack || 'No stack');
        console.error(`❌ [${disconnectId}] Emergency error details:`, emergencyError);
      }
    }
    
    console.log(`🏁 [${disconnectId}] Disconnect function execution completed`);
  };

  // Cleanup on unmount - use a single effect without dependencies to avoid race conditions
  useEffect(() => {
    const cleanupId = Math.random().toString(36).slice(2, 11);
    console.log(`🏗️ [${cleanupId}] useEffect cleanup handler registered`);
    
    return () => {
      console.log(`🧹 [${cleanupId}] Component unmounting, performing cleanup...`);
      console.log(`🧹 [${cleanupId}] Current state - mounted: ${isMountedRef.current}, subscription: ${!!subscriptionRef.current}, buffer length: ${dataBufferRef.current?.length || 0}`);
      
      try {
        console.log(`🧹 [${cleanupId}] Step 1: Setting mounted flag to false...`);
        isMountedRef.current = false;
        console.log(`✅ [${cleanupId}] Mounted flag set to false`);
        
        // Stop stale data monitoring immediately
        console.log(`🧹 [${cleanupId}] Step 2: Stopping stale data monitoring...`);
        try {
          stopStaleDataMonitoring();
          console.log(`✅ [${cleanupId}] Stale data monitoring stopped`);
        } catch (monitorError: any) {
          console.error(`❌ [${cleanupId}] Error stopping stale data monitoring:`, monitorError?.message || 'Unknown error');
        }
        
        // Clean up subscription with null checks
        console.log(`🧹 [${cleanupId}] Step 3: Cleaning up subscription...`);
        if (subscriptionRef.current) {
          try {
            console.log(`🧹 [${cleanupId}] Subscription exists, type: ${typeof subscriptionRef.current}`);
            console.log(`🧹 [${cleanupId}] Remove method available: ${typeof subscriptionRef.current.remove === 'function'}`);
            
            if (subscriptionRef.current && typeof subscriptionRef.current.remove === 'function') {
              subscriptionRef.current.remove();
              console.log(`✅ [${cleanupId}] Subscription.remove() called`);
            } else {
              console.warn(`⚠️ [${cleanupId}] Subscription remove method not available`);
            }
            
            subscriptionRef.current = null;
            console.log(`✅ [${cleanupId}] Subscription reference cleared`);
          } catch (subscriptionError: any) {
            console.error(`❌ [${cleanupId}] Error removing subscription:`, subscriptionError?.message || 'Unknown error');
            console.error(`❌ [${cleanupId}] Subscription error stack:`, subscriptionError?.stack || 'No stack');
            subscriptionRef.current = null; // Force clear
            console.log(`🚨 [${cleanupId}] Force cleared subscription reference`);
          }
        } else {
          console.log(`🔍 [${cleanupId}] No subscription to clean up`);
        }

        // Clear data buffer
        console.log(`🧹 [${cleanupId}] Step 4: Clearing data buffer...`);
        try {
          const bufferLength = dataBufferRef.current?.length || 0;
          dataBufferRef.current = '';
          console.log(`✅ [${cleanupId}] Data buffer cleared (was ${bufferLength} chars)`);
        } catch (bufferError: any) {
          console.error(`❌ [${cleanupId}] Error clearing buffer:`, bufferError?.message || 'Unknown error');
          dataBufferRef.current = ''; // Force clear
          console.log(`🚨 [${cleanupId}] Force cleared data buffer`);
        }

        console.log(`✅ [${cleanupId}] Component cleanup completed successfully`);
      } catch (cleanupError: any) {
        console.error(`❌ [${cleanupId}] CRITICAL ERROR during component cleanup:`, cleanupError?.message || 'Unknown error');
        console.error(`❌ [${cleanupId}] Cleanup error stack:`, cleanupError?.stack || 'No stack');
        console.error(`❌ [${cleanupId}] Cleanup error details:`, cleanupError);
        
        // Force cleanup critical references
        console.log(`🚨 [${cleanupId}] Starting emergency cleanup...`);
        try {
          console.log(`🚨 [${cleanupId}] Emergency: Stopping stale data monitoring...`);
          stopStaleDataMonitoring();
          
          console.log(`🚨 [${cleanupId}] Emergency: Clearing subscription reference...`);
          subscriptionRef.current = null;
          
          console.log(`🚨 [${cleanupId}] Emergency: Clearing data buffer...`);
          dataBufferRef.current = '';
          
          console.log(`✅ [${cleanupId}] Emergency cleanup completed`);
        } catch (forceError: any) {
          console.error(`❌ [${cleanupId}] EMERGENCY CLEANUP FAILED:`, forceError?.message || 'Unknown error');
          console.error(`❌ [${cleanupId}] Emergency error stack:`, forceError?.stack || 'No stack');
        }
      }
      
      console.log(`🏁 [${cleanupId}] Cleanup function execution completed`);
    };
  }, []); // No dependencies to avoid race conditions



  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    reconnectToLastDevice,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    imuData,
    isScanning,
    isReady,
    hasError,
  };
}