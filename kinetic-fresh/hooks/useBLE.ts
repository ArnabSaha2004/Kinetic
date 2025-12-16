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
  isStale: boolean;
  lastUpdateTime: number;
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

  const bleManagerRef = useRef<BleManager | null>(null);
  const dataBufferRef = useRef<string>('');
  const subscriptionRef = useRef<any>(null);
  const isMountedRef = useRef<boolean>(true);
  const isConnectingRef = useRef<boolean>(false);
  const staleDataTimerRef = useRef<number | null>(null);
  const lastDataTimeRef = useRef<number>(Date.now());
  const lastConnectedDeviceRef = useRef<Device | null>(null);

  // Request Android 12+ permissions
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
      return true;
    }
  };

  // Stale data detection
  const checkForStaleData = () => {
    try {
      if (!isMountedRef.current) {
        return;
      }

      const now = Date.now();
      const timeSinceLastUpdate = now - lastDataTimeRef.current;
      
      if (timeSinceLastUpdate > 3000) {
        console.warn('⚠️ Data appears stale - no updates for', timeSinceLastUpdate, 'ms');
        
        if (isMountedRef.current && typeof setImuData === 'function') {
          setImuData(prevData => {
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

  // Start stale data monitoring
  const startStaleDataMonitoring = () => {
    if (staleDataTimerRef.current) {
      clearInterval(staleDataTimerRef.current);
    }
    
    staleDataTimerRef.current = setInterval(checkForStaleData, 1000);
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

  // Initialize BLE manager
  useEffect(() => {
    const initializeBLE = async () => {
      try {
        console.log('Initializing BLE Manager...');
        console.log('BleManager available:', !!BleManager);
        
        bleManagerRef.current = new BleManager();
        console.log('BLE Manager instance created');
        
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
        
        console.error('BLE Initialization Failed. This usually means:');
        console.error('1. App needs to be run on a physical device (BLE doesn\'t work on simulators)');
        console.error('2. react-native-ble-plx native module is not properly linked');
        console.error('3. New Architecture (TurboModules) is enabled - should be disabled');
        console.error('4. Try installing the new development build from EAS');
      }
    };

    initializeBLE();
    
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

  // Scan for BLE peripherals
  const scanForPeripherals = (): void => {
    try {
      if (!bleManagerRef.current || !isReady) {
        console.warn('BLE Manager not ready yet');
        return;
      }

      setIsScanning(true);
      setAllDevices([]);
      
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

  // Scale factors for unit conversion
  const ACCEL_SCALE = 16384.0;
  const GYRO_SCALE = 131.0;

  // Process complete IMU data packet
  const processIMUData = (completeData: string | null | undefined): void => {
    try {
      if (!isMountedRef.current) {
        return;
      }

      if (!completeData || typeof completeData !== 'string') {
        console.warn('Invalid data provided to processIMUData:', completeData);
        return;
      }

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
      
      if (!rawValues || rawValues.length !== 6) {
        console.warn('Invalid rawValues array:', rawValues);
        return;
      }

      const ax = isFinite(rawValues[0]) ? rawValues[0] / ACCEL_SCALE : 0;
      const ay = isFinite(rawValues[1]) ? rawValues[1] / ACCEL_SCALE : 0;
      const az = isFinite(rawValues[2]) ? rawValues[2] / ACCEL_SCALE : 0;
      const gx = isFinite(rawValues[3]) ? rawValues[3] / GYRO_SCALE : 0;
      const gy = isFinite(rawValues[4]) ? rawValues[4] / GYRO_SCALE : 0;
      const gz = isFinite(rawValues[5]) ? rawValues[5] / GYRO_SCALE : 0;
      
      if (isMountedRef.current && typeof setImuData === 'function') {
        try {
          const now = Date.now();
          lastDataTimeRef.current = now;
          
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
            isStale: false,
            lastUpdateTime: now
          });
          
        } catch (stateUpdateError: any) {
          console.error('Error updating IMU state:', stateUpdateError?.message || 'Unknown error');
        }
      }
    } catch (processError: any) {
      console.error('Error processing IMU data:', processError?.message || 'Unknown error');
    }
  };

  // Handle data updates from BLE characteristic
  const onDataUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null
  ): void => {
    try {
      if (!isMountedRef.current) {
        return;
      }

      if (error) {
        console.log('BLE data update error:', error?.message || 'Unknown error');
        return;
      } 
      
      if (!characteristic?.value) {
        return;
      }

      let decodedData: string | null = null;
      try {
        decodedData = safeBase64Decode(characteristic.value);
      } catch (decodeError: any) {
        console.error('Error decoding BLE data:', decodeError?.message || 'Unknown error');
        return;
      }
      
      if (decodedData && typeof decodedData === 'string') {
        // Add to buffer
        try {
          if (dataBufferRef.current !== undefined && dataBufferRef.current !== null) {
            dataBufferRef.current += decodedData;
          } else {
            dataBufferRef.current = decodedData;
          }
        } catch (bufferError: any) {
          console.error('Error updating buffer:', bufferError?.message || 'Unknown error');
          dataBufferRef.current = decodedData;
        }
        
        // Process complete packets
        let allValues: string[] = [];
        try {
          if (dataBufferRef.current && typeof dataBufferRef.current === 'string') {
            allValues = dataBufferRef.current.split(',');
          } else {
            return;
          }
        } catch (splitError: any) {
          console.error('Error splitting buffer:', splitError?.message || 'Unknown error');
          return;
        }
        
        if (allValues && Array.isArray(allValues) && allValues.length >= 6) {
          let processedValues = 0;
          
          while (processedValues + 5 < allValues.length) {
            try {
              const packet = allValues.slice(processedValues, processedValues + 6);
              
              const isValidPacket = packet.every((val) => {
                try {
                  if (val === null || val === undefined) {
                    return false;
                  }
                  const trimmed = String(val).trim();
                  return trimmed && !isNaN(parseInt(trimmed));
                } catch (validationError: any) {
                  return false;
                }
              });
              
              if (isValidPacket) {
                const packetString = packet.join(',');
                
                try {
                  processIMUData(packetString);
                } catch (processError: any) {
                  console.error('Error processing packet:', processError?.message || 'Unknown error');
                }
                
                processedValues += 6;
              } else {
                processedValues += 1;
              }
            } catch (packetError: any) {
              console.error('Error processing packet:', packetError?.message || 'Unknown error');
              processedValues += 1;
            }
          }
          
          if (processedValues > 0) {
            try {
              const remainingValues = allValues.slice(processedValues);
              dataBufferRef.current = remainingValues.join(',');
            } catch (remainingError: any) {
              console.error('Error updating remaining buffer:', remainingError?.message || 'Unknown error');
              dataBufferRef.current = '';
            }
          }
        }
        
        // Clear buffer if too long
        try {
          if (dataBufferRef.current && dataBufferRef.current.length > 200) {
            console.warn('Buffer too long, clearing...');
            dataBufferRef.current = '';
          }
        } catch (lengthCheckError: any) {
          console.error('Error checking buffer length:', lengthCheckError?.message || 'Unknown error');
          dataBufferRef.current = '';
        }
      }
    } catch (updateError: any) {
      console.error('CRITICAL ERROR in onDataUpdate:', updateError?.message || 'Unknown error');
      
      try {
        dataBufferRef.current = '';
      } catch (resetError: any) {
        console.error('Error resetting buffer:', resetError?.message || 'Unknown error');
      }
    }
  };

  // Start streaming data
  const startStreamingData = async (device: Device | null): Promise<void> => {
    try {
      if (!device || !isMountedRef.current) {
        console.log('No device connected or component unmounted');
        return;
      }

      console.log('🔄 Starting data streaming for device:', device?.name || 'Unknown');
      
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.remove();
          console.log('🧹 Old subscription removed');
        } catch (cleanupError) {
          console.warn('Error removing old subscription:', cleanupError);
        }
        subscriptionRef.current = null;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      
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
      
      if (isMountedRef.current && subscription) {
        subscriptionRef.current = subscription;
        console.log('✅ Started monitoring characteristic successfully');
        
        startStaleDataMonitoring();
        
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
    }
  };

  // Simple reconnect
  const reconnectToLastDevice = (): void => {
    const deviceToReconnect = lastConnectedDeviceRef.current;
    if (deviceToReconnect) {
      console.log('🔄 Reconnecting to:', deviceToReconnect.name);
      connectToDevice(deviceToReconnect).catch(error => {
        console.log('❌ Reconnect failed:', error);
      });
    }
  };

  // Connect to device
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

      isConnectingRef.current = true;
      console.log('🔒 Connection process started, preventing cleanup');

      logDeviceConnection(device, 'connecting');
      
      const deviceConnection = await bleManagerRef.current.connectToDevice(device.id);
      
      if (!deviceConnection) {
        throw new Error('Failed to establish device connection');
      }

      if (isMountedRef.current) {
        setConnectedDevice(deviceConnection);
        lastConnectedDeviceRef.current = deviceConnection;
      }
      
      console.log('🔍 Discovering services and characteristics...');
      await deviceConnection.discoverAllServicesAndCharacteristics();
      
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
      
      try {
        if (bleManagerRef.current && isMountedRef.current) {
          bleManagerRef.current.stopDeviceScan();
          setIsScanning(false);
        }
      } catch (stopScanError) {
        console.warn('Error stopping scan:', stopScanError);
      }
      
      await startStreamingData(deviceConnection);
      
      logDeviceConnection(device, 'connected');
      
      isConnectingRef.current = false;
      console.log('🔓 Connection process completed successfully');
      console.log('🔗 BLE connection established and streaming data');
      
    } catch (connectError: any) {
      isConnectingRef.current = false;
      console.error('Failed to connect:', connectError);
      console.error('Connection error details:', connectError?.message || 'Unknown error');
      throw connectError;
    }
  };

  // Disconnect from device
  const disconnectFromDevice = (): void => {
    const disconnectId = Math.random().toString(36).slice(2, 11);
    console.log(`🔌 [${disconnectId}] Starting disconnect process...`);
    
    try {
      console.log(`🕐 [${disconnectId}] Step 1: Stopping stale data monitoring...`);
      try {
        stopStaleDataMonitoring();
        console.log(`✅ [${disconnectId}] Stale data monitoring stopped`);
      } catch (monitorError: any) {
        console.error(`❌ [${disconnectId}] Error stopping stale data monitoring:`, monitorError?.message || 'Unknown error');
      }
      
      const deviceToDisconnect = connectedDevice;
      console.log(`📱 [${disconnectId}] Step 2: Device to disconnect:`, deviceToDisconnect ? {
        id: deviceToDisconnect.id,
        name: deviceToDisconnect.name
      } : 'null');
      
      console.log(`🧹 [${disconnectId}] Step 3: Cleaning up subscription...`);
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.remove();
          subscriptionRef.current = null;
          console.log(`✅ [${disconnectId}] Subscription cleaned up successfully`);
        } catch (subscriptionError: any) {
          console.error(`❌ [${disconnectId}] Error cleaning up subscription:`, subscriptionError?.message || 'Unknown error');
          subscriptionRef.current = null;
        }
      } else {
        console.log(`ℹ️ [${disconnectId}] No subscription to clean up`);
      }
      
      console.log(`🔌 [${disconnectId}] Step 4: Disconnecting from device...`);
      if (deviceToDisconnect && bleManagerRef.current) {
        try {
          bleManagerRef.current.cancelDeviceConnection(deviceToDisconnect.id);
          console.log(`✅ [${disconnectId}] Device disconnection initiated`);
        } catch (disconnectError: any) {
          console.error(`❌ [${disconnectId}] Error disconnecting device:`, disconnectError?.message || 'Unknown error');
        }
      } else {
        console.log(`ℹ️ [${disconnectId}] No device to disconnect or BLE manager unavailable`);
      }
      
      console.log(`🧹 [${disconnectId}] Step 5: Clearing state...`);
      if (isMountedRef.current) {
        setConnectedDevice(null);
        console.log(`✅ [${disconnectId}] Connected device state cleared`);
      } else {
        console.log(`⚠️ [${disconnectId}] Component unmounted, skipping state update`);
      }
      
      dataBufferRef.current = '';
      console.log(`✅ [${disconnectId}] Data buffer cleared`);
      
      console.log(`✅ [${disconnectId}] Disconnect process completed successfully`);
      
    } catch (error: any) {
      console.error(`❌ [${disconnectId}] Error during disconnect:`, error?.message || 'Unknown error');
      console.error(`❌ [${disconnectId}] Disconnect error stack:`, error?.stack || 'No stack');
      
      try {
        if (isMountedRef.current) {
          setConnectedDevice(null);
        }
        dataBufferRef.current = '';
        subscriptionRef.current = null;
        console.log(`🧹 [${disconnectId}] Emergency cleanup completed`);
      } catch (cleanupError: any) {
        console.error(`❌ [${disconnectId}] Emergency cleanup failed:`, cleanupError?.message || 'Unknown error');
      }
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    const cleanupId = Math.random().toString(36).slice(2, 11);
    console.log(`🏗️ [${cleanupId}] useEffect cleanup handler registered`);
    
    return () => {
      console.log(`🧹 [${cleanupId}] useEffect cleanup starting...`);
      isMountedRef.current = false;
      
      try {
        stopStaleDataMonitoring();
        
        if (subscriptionRef.current) {
          try {
            subscriptionRef.current.remove();
            console.log(`✅ [${cleanupId}] Subscription removed during cleanup`);
          } catch (subError: any) {
            console.error(`❌ [${cleanupId}] Error removing subscription during cleanup:`, subError?.message || 'Unknown error');
          }
          subscriptionRef.current = null;
        }
        
        if (bleManagerRef.current && !isConnectingRef.current) {
          try {
            bleManagerRef.current.destroy();
            console.log(`✅ [${cleanupId}] BLE Manager destroyed during cleanup`);
          } catch (destroyError: any) {
            console.error(`❌ [${cleanupId}] Error destroying BLE Manager during cleanup:`, destroyError?.message || 'Unknown error');
          }
          bleManagerRef.current = null;
        } else if (isConnectingRef.current) {
          console.log(`⚠️ [${cleanupId}] Skipping BLE Manager destruction - connection in progress`);
        }
        
        console.log(`✅ [${cleanupId}] useEffect cleanup completed successfully`);
      } catch (cleanupError: any) {
        console.error(`❌ [${cleanupId}] Error during useEffect cleanup:`, cleanupError?.message || 'Unknown error');
      }
    };
  }, []);

  return {
    requestPermissions,
    scanForPeripherals,
    connectToDevice,
    disconnectFromDevice,
    reconnectToLastDevice,
    allDevices,
    connectedDevice,
    imuData,
    isScanning,
    isReady,
    hasError,
  };
}