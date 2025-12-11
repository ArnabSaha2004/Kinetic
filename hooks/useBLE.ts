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

interface BLEApi {
  requestPermissions(): Promise<boolean>;
  scanForPeripherals(): void;
  connectToDevice(deviceId: Device): Promise<void>;
  disconnectFromDevice(): void;
  allDevices: Device[];
  connectedDevice: Device | null;
  color: string;
  isScanning: boolean;
  isReady: boolean;
  hasError: boolean;
}

export function useBLE(): BLEApi {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [color, setColor] = useState<string>('white');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  
  // Use ref to store BLE manager instance
  const bleManagerRef = useRef<BleManager | null>(null);

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
        
        // Check if BleManager is available
        if (!BleManager) {
          throw new Error('BleManager is not available - react-native-ble-plx may not be properly linked');
        }
        
        // Add a longer delay to ensure native modules are ready
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        bleManagerRef.current = new BleManager();
        
        // Wait for the native module to be ready
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Test if the manager is working by checking its state
        if (bleManagerRef.current) {
          console.log('BLE Manager created, checking state...');
          try {
            const state = await bleManagerRef.current.state();
            console.log('BLE State:', state);
            validateUUIDs();
            setIsReady(true);
            console.log('BLE Manager initialized successfully');
          } catch (stateError) {
            console.error('BLE state check failed:', stateError);
            throw stateError;
          }
        }
      } catch (error) {
        console.error('Failed to initialize BLE Manager:', error);
        setIsReady(false);
        setHasError(true);
        
        // Show a more helpful error message
        setTimeout(() => {
          console.error('BLE Initialization Failed. This usually means:');
          console.error('1. New Architecture (TurboModules) is enabled - disable it in android/gradle.properties');
          console.error('2. react-native-ble-plx native module is not properly linked');
          console.error('3. App needs to be run on a physical device (BLE doesn\'t work on simulators)');
          console.error('4. Try: npx expo prebuild --clean && rebuild the app');
        }, 100);
      }
    };

    // Delay initialization to ensure React Native is fully loaded
    const timer = setTimeout(initializeBLE, 500);
    
    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
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
    if (!bleManagerRef.current || !isReady) {
      console.warn('BLE Manager not ready yet');
      return;
    }

    setIsScanning(true);
    setAllDevices([]); // Clear previous devices
    
    bleManagerRef.current.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log('Scan error:', error);
        setIsScanning(false);
        return;
      }

      if (device && isTargetDevice(device)) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicateDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });

    // Stop scanning after configured timeout
    setTimeout(() => {
      if (bleManagerRef.current) {
        bleManagerRef.current.stopDeviceScan();
      }
      setIsScanning(false);
    }, SCAN_CONFIG.SCAN_TIMEOUT);
  };

  // Handle data updates from BLE characteristic
  const onDataUpdate = (
    error: BleError | null,
    characteristic: Characteristic | null
  ): void => {
    if (error) {
      console.log('Data update error:', error);
      return;
    } else if (!characteristic?.value) {
      console.log('No data was received');
      return;
    }

    const decodedData = safeBase64Decode(characteristic.value);
    if (decodedData) {
      console.log('Received color code:', decodedData);
      
      const colorCode = decodedData.toUpperCase();
      const newColor = COLOR_CODES[colorCode as keyof typeof COLOR_CODES] || 'white';
      
      setColor(newColor);
    }
  };

  // Start streaming data from connected device
  const startStreamingData = (device: Device): void => {
    if (device) {
      try {
        device.monitorCharacteristicForService(
          BLE_CONFIG.DATA_SERVICE_UUID,
          BLE_CONFIG.COLOR_CHARACTERISTIC_UUID,
          onDataUpdate
        );
        console.log('Started monitoring characteristic');
      } catch (error) {
        console.log('Error starting data stream:', error);
      }
    } else {
      console.log('No device connected');
    }
  };

  // Connect to a BLE device
  const connectToDevice = async (device: Device): Promise<void> => {
    if (!bleManagerRef.current || !isReady) {
      throw new Error('BLE Manager not ready');
    }

    try {
      logDeviceConnection(device, 'connecting');
      
      const deviceConnection = await bleManagerRef.current.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManagerRef.current.stopDeviceScan();
      setIsScanning(false);
      
      // Start streaming data
      startStreamingData(deviceConnection);
      
      logDeviceConnection(device, 'connected');
    } catch (error) {
      console.log('Failed to connect:', error);
      throw error;
    }
  };

  // Disconnect from current device
  const disconnectFromDevice = (): void => {
    if (connectedDevice && bleManagerRef.current) {
      logDeviceConnection(connectedDevice, 'disconnected');
      bleManagerRef.current.cancelDeviceConnection(connectedDevice.id);
      setConnectedDevice(null);
      setColor('white');
    }
  };

  // Cleanup connected device on unmount
  useEffect(() => {
    return () => {
      if (bleManagerRef.current) {
        bleManagerRef.current.stopDeviceScan();
        if (connectedDevice) {
          bleManagerRef.current.cancelDeviceConnection(connectedDevice.id);
        }
      }
    };
  }, [connectedDevice]);

  return {
    scanForPeripherals,
    requestPermissions,
    connectToDevice,
    allDevices,
    connectedDevice,
    disconnectFromDevice,
    color,
    isScanning,
    isReady,
    hasError,
  };
}