// Import polyfills first for React Native compatibility
import './polyfills';

import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Platform, ScrollView, SafeAreaView } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { useBLE } from './hooks/useBLE';
import { useDataMinting } from './hooks/useDataMinting';
import { ThirdwebProvider } from 'thirdweb/react';
import { useKineticWallet } from './components/ThirdwebProvider';
import { 
  validateMintingWorkflow, 
  getWalletStatusMessage, 
  getDataCollectionStatusMessage,
  WalletConnectionState 
} from './utils/WalletGuards';

// Kinetic Dark Theme Colors (matching website branding)
const colors = {
  // Dark theme colors matching website
  background: '#0a0a0f',        // Main dark background
  foreground: '#ffffff',        // White text
  card: '#1a1a1f',              // Slightly lighter dark for cards
  cardForeground: '#ffffff',    // White text on cards
  primary: '#9333ea',           // Purple-600 (main purple)
  primaryForeground: '#ffffff', // White text on purple
  secondary: '#374151',         // Gray-700 for secondary elements
  secondaryForeground: '#ffffff', // White text on secondary
  muted: '#1f2937',             // Gray-800 for muted backgrounds
  mutedForeground: '#9ca3af',   // Gray-400 for muted text
  accent: '#06b6d4',            // Cyan-500 for accents
  accentForeground: '#ffffff',  // White text on cyan
  destructive: '#ef4444',       // Red-500 for errors/warnings
  destructiveForeground: '#ffffff', // White text on red
  border: '#374151',            // Gray-700 for borders
  input: '#374151',             // Gray-700 for inputs
  ring: '#9333ea',              // Purple ring focus
  // Kinetic brand colors
  purple: {
    300: '#c084fc',             // Light purple
    500: '#a855f7',             // Medium purple  
    600: '#9333ea',             // Main purple
    700: '#7c3aed',             // Dark purple
  },
  cyan: {
    500: '#06b6d4',             // Cyan accent
  },
  gray: {
    400: '#9ca3af',             // Secondary text
    500: '#6b7280',             // Tertiary text
    700: '#374151',             // Borders/backgrounds
    800: '#1f2937',             // Card backgrounds
    900: '#111827',             // Darker backgrounds
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    backgroundColor: colors.background,
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom for scroll
  },
  connectedContainer: {
    backgroundColor: colors.background,
    padding: 20,
    paddingBottom: 40, // Extra padding at bottom for scroll
  },
  // Navigation Header Styles
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.muted,
    minWidth: 80,
  },
  backButtonText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: colors.muted,
  },
  headerButtonText: {
    color: colors.foreground,
    fontSize: 12,
  },
  // Device Status Section
  deviceStatusSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  // Section Headers
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 16,
    marginTop: 24,
    textAlign: 'center',
  },
  // Improved spacing for sections
  sensorDataSection: {
    marginBottom: 24,
  },
  walletSection: {
    marginBottom: 16,
  },
  dataCollectionSection: {
    marginBottom: 24,
  },
  // Scroll indicator styles
  scrollIndicator: {
    position: 'absolute',
    right: 4,
    top: '50%',
    width: 3,
    height: 40,
    backgroundColor: colors.accent,
    borderRadius: 2,
    opacity: 0.6,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: colors.foreground,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: colors.gray[400],
    fontWeight: '400',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusLabel: {
    color: colors.gray[400],
    fontSize: 14,
    fontWeight: '500',
  },
  dataCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dataCardTitle: {
    fontSize: 18,
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
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  destructiveButtonDisabled: {
    backgroundColor: colors.muted,
    borderColor: colors.muted,
  },
  destructiveButtonText: {
    color: colors.gray[400],
    fontSize: 16,
    fontWeight: '500',
  },
  deviceCard: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.foreground,
    flex: 1,
  },
  deviceId: {
    fontSize: 12,
    color: colors.gray[400],
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  connectingText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },

  // Data Minting Styles
  mintingSection: {
    marginBottom: 24,
  },
  collectionStatus: {
    alignItems: 'center',
    marginBottom: 16,
  },
  collectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 4,
  },
  collectionTimer: {
    fontSize: 14,
    color: colors.accent,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  mintingButtons: {
    gap: 12,
  },
  errorText: {
    fontSize: 12,
    color: colors.destructive,
    textAlign: 'center',
    marginTop: 8,
  },
  mintResult: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accent,
    marginTop: 12,
  },
  mintResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
    marginBottom: 4,
  },
  mintResultText: {
    fontSize: 12,
    color: colors.gray[400],
  },
  requirementCard: {
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  requirementText: {
    fontSize: 12,
    color: colors.gray[400],
    textAlign: 'center',
  },
  statusOverview: {
    marginTop: 16,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: 12,
    textAlign: 'center',
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusGridLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  emptyState: {
    textAlign: 'center',
    fontSize: 14,
    color: colors.gray[400],
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

function AppContent() {
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectedDevice,
    imuData,
    disconnectFromDevice,
    reconnectToLastDevice,
    isScanning,
    isReady,
    hasError,
  } = useBLE();

  // Thirdweb wallet hooks (now the main wallet)
  const { address, isConnected, isConnecting, connect, disconnect } = useKineticWallet();

  // Wallet state derived from custom wallet context
  const isWalletConnected = isConnected;
  const walletAccount = address;
  const isWalletConnecting = isConnecting;

  // Enhanced wallet connection functions with error handling
  const connectWallet = async () => {
    try {
      console.log('🔗 Connecting to wallet');
      await connect();
    } catch (error: any) {
      console.error('❌ Failed to connect wallet:', error);
    }
  };

  const disconnectWallet = async () => {
    console.log('🔌 Disconnecting wallet');
    try {
      await disconnect();
      console.log('✅ Wallet disconnected successfully');
    } catch (error: any) {
      console.error('❌ Failed to disconnect wallet:', error);
    }
  };

  // Helper function to handle session recovery
  const handleSessionRecovery = async () => {
    console.log('🔄 Attempting session recovery...');
    try {
      // First disconnect
      await disconnectWallet();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Then reconnect
      await connectWallet();
      
      console.log('✅ Session recovery completed');
    } catch (error: any) {
      console.error('❌ Session recovery failed:', error);
    }
  };

  // Note: Transaction signing is now handled internally by the useDataMinting hook

  const {
    startCollection,
    stopCollection,
    mintCollectedData,
    mintToBlockchain,
    addDataPoint,
    clearData,
    isCollecting,
    isMinting,
    collectedData,
    collectionDuration,
    mintResult,
    error: mintingError,
    isWalletConnected: hookWalletConnected,
    walletAddress: hookWalletAddress,
  } = useDataMinting();

  // Create wallet state for guards
  const walletState: WalletConnectionState = {
    isConnected: isWalletConnected,
    address: walletAccount || undefined,
    hasProvider: isConnected,
    status: isWalletConnecting ? 'connecting' : (isWalletConnected ? 'connected' : 'disconnected')
  };

  // Validate minting workflow requirements
  const mintingValidation = validateMintingWorkflow(
    walletState,
    collectedData,
    isCollecting,
    !!connectedDevice,
    imuData.isStale
  );

  const [isLoading, setIsLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Add logging to track component lifecycle
  React.useEffect(() => {
    console.log('📱 App component mounted');
    console.log('📱 Platform:', Platform.OS, Platform.Version);
    if (Platform.OS === 'android') {
      console.log('🤖 Android-specific optimizations enabled');
    }
    return () => {
      console.log('📱 App component unmounting');
    };
  }, []);

  React.useEffect(() => {
    console.log('📱 Connected device changed:', connectedDevice?.name || 'null');
    // Reset loading state when connection changes
    if (connectedDevice) {
      setIsLoading(false);
    }
  }, [connectedDevice]);

  // Reset loading state when component unmounts
  React.useEffect(() => {
    return () => {
      setIsLoading(false);
      setIsDisconnecting(false);
    };
  }, []);

  // Collect IMU data when collection is active
  React.useEffect(() => {
    // const effectId = Math.random().toString(36).slice(2, 8);
    // console.log(`📊 [${effectId}] Data collection useEffect triggered:`, {
    //   isCollecting,
    //   isStale: imuData.isStale,
    //   hasDevice: !!connectedDevice,
    //   deviceName: connectedDevice?.name,
    //   accelerometer: imuData.accelerometer,
    //   gyroscope: imuData.gyroscope,
    //   timestamp: imuData.timestamp,
    //   collectedDataLength: collectedData.length
    // });
    
    if (isCollecting && !imuData.isStale && connectedDevice) {
      // console.log(`📊 [${effectId}] ✅ All conditions met, adding data point to collection`);
      // console.log(`📊 [${effectId}] Current IMU data structure:`, {
      //   accelerometer: imuData.accelerometer,
      //   gyroscope: imuData.gyroscope,
      //   raw: imuData.raw,
      //   timestamp: imuData.timestamp,
      //   isStale: imuData.isStale
      // });
      
      // Add current data point to collection
      addDataPoint(imuData);
      
      // console.log(`📊 [${effectId}] Data point sent to addDataPoint function`);
    } else {
      // console.log(`📊 [${effectId}] ❌ Conditions not met for data collection:`, {
      //   isCollecting: isCollecting ? '✅ Collecting' : '❌ Not collecting',
      //   dataFresh: !imuData.isStale ? '✅ Fresh data' : '❌ Stale data',
      //   deviceConnected: connectedDevice ? '✅ Device connected' : '❌ No device',
      //   reason: !isCollecting ? 'Collection not started' : 
      //           imuData.isStale ? 'Data is stale' : 
      //           !connectedDevice ? 'No device connected' : 'Unknown'
      // });
    }
  }, [imuData, isCollecting, connectedDevice, addDataPoint]);



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
    const appDisconnectId = Math.random().toString(36).slice(2, 11);
    console.log(`📱 [${appDisconnectId}] App handleDisconnect called`);
    console.log(`📱 [${appDisconnectId}] Current state - isDisconnecting: ${isDisconnecting}, connectedDevice: ${connectedDevice?.name || 'null'}`);
    
    if (isDisconnecting) {
      console.log(`📱 [${appDisconnectId}] Disconnect already in progress, ignoring`);
      return;
    }
    
    console.log(`📱 [${appDisconnectId}] Setting isDisconnecting to true...`);
    setIsDisconnecting(true);
    
    try {
      console.log(`📱 [${appDisconnectId}] Starting disconnect process...`);
      console.log(`📱 [${appDisconnectId}] disconnectFromDevice type: ${typeof disconnectFromDevice}`);
      
      // Small delay to prevent race conditions
      console.log(`📱 [${appDisconnectId}] Adding 100ms delay to prevent race conditions...`);
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log(`📱 [${appDisconnectId}] Delay completed`);
      
      // Call disconnect function with additional error handling
      if (typeof disconnectFromDevice === 'function') {
        console.log(`📱 [${appDisconnectId}] Calling disconnectFromDevice()...`);
        try {
          disconnectFromDevice();
          console.log(`📱 [${appDisconnectId}] disconnectFromDevice() call completed`);
        } catch (disconnectCallError: any) {
          console.error(`❌ [${appDisconnectId}] Error calling disconnectFromDevice:`, disconnectCallError?.message || 'Unknown error');
          console.error(`❌ [${appDisconnectId}] Disconnect call error stack:`, disconnectCallError?.stack || 'No stack');
          throw disconnectCallError;
        }
      } else {
        console.error(`❌ [${appDisconnectId}] disconnectFromDevice is not a function: ${typeof disconnectFromDevice}`);
        throw new Error('disconnectFromDevice is not a function');
      }
      
      console.log(`✅ [${appDisconnectId}] Disconnect initiated successfully`);
    } catch (error: any) {
      console.error(`❌ [${appDisconnectId}] Disconnect process failed:`, error?.message || 'Unknown error');
      console.error(`❌ [${appDisconnectId}] Error stack:`, error?.stack || 'No stack');
      console.error(`❌ [${appDisconnectId}] Error details:`, error);
    } finally {
      // Always reset the disconnecting state after a delay
      console.log(`📱 [${appDisconnectId}] Setting timeout to reset isDisconnecting state...`);
      setTimeout(() => {
        try {
          console.log(`📱 [${appDisconnectId}] Timeout callback: Resetting isDisconnecting to false...`);
          console.log(`📱 [${appDisconnectId}] setIsDisconnecting type: ${typeof setIsDisconnecting}`);
          
          if (typeof setIsDisconnecting === 'function') {
            setIsDisconnecting(false);
            console.log(`✅ [${appDisconnectId}] isDisconnecting reset to false`);
          } else {
            console.error(`❌ [${appDisconnectId}] setIsDisconnecting is not a function: ${typeof setIsDisconnecting}`);
          }
          
          console.log(`✅ [${appDisconnectId}] App disconnect process completed`);
        } catch (finalError: any) {
          console.error(`❌ [${appDisconnectId}] Error in timeout callback:`, finalError?.message || 'Unknown error');
          console.error(`❌ [${appDisconnectId}] Final error stack:`, finalError?.stack || 'No stack');
        }
      }, 1000); // Increased delay to ensure cleanup completes
    }
    
    console.log(`🏁 [${appDisconnectId}] handleDisconnect function execution completed`);
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
      <SafeAreaView style={styles.safeArea}>
        {/* Navigation Header */}
        <View style={styles.navigationHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleDisconnect}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>IMU Dashboard</Text>
          
          <View style={styles.headerActions}>
            {imuData.isStale && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={reconnectToLastDevice}
              >
                <Text style={styles.headerButtonText}>🔄</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                // Add settings/info action here if needed
                console.log('Header info button pressed');
              }}
            >
              <Text style={styles.headerButtonText}>ℹ️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={true}
          bounces={true}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
        >
          <View style={styles.connectedContainer}>
        {/* Device Status Section */}
        <View style={styles.deviceStatusSection}>
          <Text style={styles.title}>
            Kinetic IMU Dashboard
          </Text>
          <Text style={styles.subtitle}>
            Connected: {connectedDevice.name || 'Kinetic Device'}
            {imuData.isStale && ' ⚠️ DATA STALE'}
          </Text>
        </View>
        
        {/* Sensor Data Section */}
        <View style={styles.sensorDataSection}>
          <Text style={styles.sectionHeader}>📊 Sensor Data</Text>
          
          <View style={[styles.dataCard, imuData.isStale && { borderColor: colors.destructive, borderWidth: 2 }]}>
            <Text style={[styles.dataCardTitle, { color: imuData.isStale ? colors.destructive : colors.accent }]}>
              Accelerometer (g) {imuData.isStale && '⚠️'}
            </Text>
            <View style={styles.dataRow}>
              <Text style={[styles.dataValue, imuData.isStale && { color: colors.destructive }]}>
                X: {formatValue(imuData.accelerometer.x)}
              </Text>
              <Text style={[styles.dataValue, imuData.isStale && { color: colors.destructive }]}>
                Y: {formatValue(imuData.accelerometer.y)}
              </Text>
              <Text style={[styles.dataValue, imuData.isStale && { color: colors.destructive }]}>
                Z: {formatValue(imuData.accelerometer.z)}
              </Text>
            </View>
          </View>

          <View style={[styles.dataCard, imuData.isStale && { borderColor: colors.destructive, borderWidth: 2 }]}>
            <Text style={[styles.dataCardTitle, { color: imuData.isStale ? colors.destructive : colors.purple[500] }]}>
              Gyroscope (°/s) {imuData.isStale && '⚠️'}
            </Text>
            <View style={styles.dataRow}>
              <Text style={[styles.dataValue, imuData.isStale && { color: colors.destructive }]}>
                X: {formatValue(imuData.gyroscope.x)}
              </Text>
              <Text style={[styles.dataValue, imuData.isStale && { color: colors.destructive }]}>
                Y: {formatValue(imuData.gyroscope.y)}
              </Text>
              <Text style={[styles.dataValue, imuData.isStale && { color: colors.destructive }]}>
                Z: {formatValue(imuData.gyroscope.z)}
              </Text>
            </View>
          </View>
        </View>

        {/* Wallet Section */}
        <View style={styles.walletSection}>
          <Text style={styles.sectionHeader}>🔗 Wallet Connection</Text>
          {isWalletConnected ? (
            <View style={styles.dataCard}>
              <Text style={styles.dataCardTitle}>🔗 Wallet Connected</Text>
              <Text style={[styles.dataValue, { fontSize: 12, fontFamily: 'monospace' }]}>
                {walletAccount}
              </Text>
              <Text style={[styles.requirementText, { marginTop: 8, marginBottom: 8 }]}>
                Status: {walletState.status}
              </Text>
              <TouchableOpacity
                style={[styles.destructiveButton, { marginTop: 12 }]}
                onPress={disconnectWallet}
              >
                <Text style={styles.destructiveButtonText}>
                  ⚙️ Manage Wallet
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, { 
                backgroundColor: isWalletConnecting ? colors.muted : colors.primary,
                shadowColor: isWalletConnecting ? 'transparent' : colors.primary,
              }]}
              onPress={connectWallet}
              disabled={isWalletConnecting}
            >
              <Text style={[
                styles.primaryButtonText,
                isWalletConnecting && { color: colors.mutedForeground }
              ]}>
                {isWalletConnecting ? '🔄 Connecting...' : '🔗 Connect Wallet'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Data Collection Section */}
        <View style={styles.dataCollectionSection}>
          <Text style={styles.sectionHeader}>📊 Data Collection & Export</Text>
          <View style={styles.collectionStatus}>
            <Text style={styles.collectionTitle}>Data Collection</Text>
            <Text style={[styles.collectionTimer, { 
              color: isCollecting ? colors.accent : colors.gray[400] 
            }]}>
              {getDataCollectionStatusMessage(collectedData, isCollecting, collectionDuration)}
            </Text>
          </View>

          <View style={styles.mintingButtons}>
            {!isCollecting ? (
              <TouchableOpacity
                style={[
                  styles.primaryButton, 
                  { 
                    backgroundColor: (!connectedDevice || imuData.isStale) ? colors.muted : colors.accent,
                    shadowColor: (!connectedDevice || imuData.isStale) ? 'transparent' : colors.accent,
                  }
                ]}
                onPress={() => {
                  const collectionId = Math.random().toString(36).slice(2, 8);
                  console.log(`🎯 [${collectionId}] Start Collection button pressed`);
                  console.log(`🎯 [${collectionId}] Pre-collection state:`, {
                    connectedDevice: !!connectedDevice,
                    deviceName: connectedDevice?.name,
                    dataStale: imuData.isStale,
                    currentDataLength: collectedData.length,
                    isCurrentlyCollecting: isCollecting,
                    currentIMUData: {
                      accelerometer: imuData.accelerometer,
                      gyroscope: imuData.gyroscope,
                      timestamp: imuData.timestamp
                    }
                  });
                  
                  // Guard against starting collection without proper device connection
                  if (!connectedDevice) {
                    console.log(`❌ [${collectionId}] Collection blocked: No device connected`);
                    return;
                  }
                  
                  if (imuData.isStale) {
                    console.log(`❌ [${collectionId}] Collection blocked: Device data is stale`);
                    return;
                  }
                  
                  console.log(`✅ [${collectionId}] All checks passed, starting collection...`);
                  startCollection();
                  console.log(`🎯 [${collectionId}] startCollection() called`);
                }}
                disabled={!connectedDevice || imuData.isStale}
              >
                <Text style={[
                  styles.primaryButtonText,
                  (!connectedDevice || imuData.isStale) && { color: colors.mutedForeground }
                ]}>
                  {!connectedDevice ? '📱 Connect Device First' :
                   imuData.isStale ? '⚠️ Reconnect Device' :
                   '🎯 Start Collection'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.destructive }]}
                onPress={stopCollection}
              >
                <Text style={styles.primaryButtonText}>
                  ⏹️ Stop Collection
                </Text>
              </TouchableOpacity>
            )}

            {collectedData.length > 0 && !isCollecting && (
              <>
                <TouchableOpacity
                  style={[
                    styles.primaryButton, 
                    { 
                      backgroundColor: (isMinting || !mintingValidation.canProceed) ? colors.muted : colors.primary,
                      shadowColor: (isMinting || !mintingValidation.canProceed) ? 'transparent' : colors.primary,
                    }
                  ]}
                  onPress={() => {
                    const mintId = Math.random().toString(36).slice(2, 8);
                    console.log(`🚀 [${mintId}] Mint button pressed`);
                    console.log(`🚀 [${mintId}] Current state:`, {
                      collectedDataLength: collectedData.length,
                      isCollecting,
                      isMinting,
                      isWalletConnected,
                      walletAddress: walletAccount,
                      deviceConnected: !!connectedDevice,
                      dataStale: imuData.isStale
                    });
                    console.log(`🚀 [${mintId}] Minting validation:`, mintingValidation);
                    
                    // Use wallet guards to validate requirements
                    if (!mintingValidation.canProceed) {
                      console.log(`❌ [${mintId}] Minting blocked by validation:`, mintingValidation.errorMessage);
                      
                      // If wallet connection is the issue, open AppKit modal
                      if (mintingValidation.errorMessage?.includes('Wallet') || 
                          mintingValidation.errorMessage?.includes('wallet')) {
                        console.log(`🔗 [${mintId}] Opening wallet connection...`);
                        connectWallet();
                      }
                      return;
                    }
                    
                    console.log(`✅ [${mintId}] All validations passed, proceeding with minting...`);
                    // All validations passed, proceed with minting
                    mintCollectedData();
                  }}
                  disabled={isMinting || !mintingValidation.canProceed}
                >
                  <Text style={[
                    styles.primaryButtonText,
                    (isMinting || !mintingValidation.canProceed) && { color: colors.mutedForeground }
                  ]}>
                    {isMinting ? '⏳ Exporting Data...' : 
                     !mintingValidation.canProceed ? '🚫 Requirements Not Met' : 
                     '📊 Export IMU Data JSON'}
                  </Text>
                </TouchableOpacity>

                {/* Blockchain Minting Button - Show only after successful JSON export */}
                {mintResult && mintResult.status === 'exported' && isWalletConnected && (
                  <TouchableOpacity
                    style={[
                      styles.primaryButton, 
                      { 
                        backgroundColor: isMinting ? colors.muted : colors.purple[600],
                        shadowColor: isMinting ? 'transparent' : colors.purple[600],
                        marginTop: 8
                      }
                    ]}
                    onPress={() => {
                      const blockchainMintId = Math.random().toString(36).slice(2, 8);
                      console.log(`⛓️ [${blockchainMintId}] Blockchain mint button pressed`);
                      console.log(`⛓️ [${blockchainMintId}] Wallet state:`, {
                        isConnected: isWalletConnected,
                        address: walletAccount,
                        hasExportedData: !!mintResult?.exportedData
                      });
                      
                      mintToBlockchain();
                    }}
                    disabled={isMinting}
                  >
                    <Text style={[
                      styles.primaryButtonText,
                      isMinting && { color: colors.mutedForeground }
                    ]}>
                      {isMinting ? '⏳ Minting to Blockchain...' : '⛓️ Mint to Blockchain'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.destructiveButton, { marginTop: 8 }]}
                  onPress={clearData}
                >
                  <Text style={styles.destructiveButtonText}>
                    🗑️ Clear Data
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* Show requirements based on validation results */}
            {!mintingValidation.canProceed && (
              <View style={styles.requirementCard}>
                <Text style={styles.requirementText}>
                  {mintingValidation.requirementMessage || mintingValidation.errorMessage}
                </Text>
              </View>
            )}

            {/* Show helpful status messages */}
            {mintingValidation.canProceed && collectedData.length > 0 && !isCollecting && !mintResult && (
              <View style={[styles.requirementCard, { borderColor: colors.accent }]}>
                <Text style={[styles.requirementText, { color: colors.accent }]}>
                  ✅ Ready to export {collectedData.length} IMU data points as JSON
                </Text>
              </View>
            )}

            {/* Show blockchain minting option after export */}
            {mintResult && mintResult.status === 'exported' && isWalletConnected && !mintResult.blockchainMint && (
              <View style={[styles.requirementCard, { borderColor: colors.purple[500] }]}>
                <Text style={[styles.requirementText, { color: colors.purple[500] }]}>
                  ⛓️ Data exported! Now you can mint it to the blockchain as an NFT
                </Text>
              </View>
            )}

            {/* Show blockchain minting success */}
            {mintResult && mintResult.blockchainMint && (
              <View style={[styles.requirementCard, { borderColor: colors.accent }]}>
                <Text style={[styles.requirementText, { color: colors.accent }]}>
                  🎉 Successfully minted to blockchain! Your IMU data is now an NFT
                </Text>
              </View>
            )}
          </View>

          {mintingError && (
            <View>
              <Text style={styles.errorText}>{mintingError}</Text>
              {/* Show session recovery button for session-related errors */}
              {(mintingError.includes('session') || mintingError.includes('reconnect')) && (
                <TouchableOpacity
                  style={[styles.primaryButton, { 
                    backgroundColor: colors.accent,
                    marginTop: 8
                  }]}
                  onPress={handleSessionRecovery}
                >
                  <Text style={styles.primaryButtonText}>
                    🔄 Reconnect Wallet
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {mintResult && (
            <View style={styles.mintResult}>
              <Text style={styles.mintResultTitle}>
                {mintResult.blockchainMint ? '⛓️ Blockchain Minted!' : '✅ IMU Data Exported!'}
              </Text>
              <Text style={styles.mintResultText}>
                {mintResult.blockchainMint 
                  ? mintResult.blockchainMint.message 
                  : (mintResult.message || `Transaction prepared for ${collectedData.length} IMU data points`)
                }
              </Text>
              {mintResult.blockchainMint && (
                <Text style={[styles.mintResultText, { fontSize: 10, marginTop: 4, color: colors.accent }]}>
                  TX: {mintResult.blockchainMint.transactionHash?.slice(0, 20)}...
                </Text>
              )}
              {mintResult.dataIntegrity && (
                <Text style={[styles.mintResultText, { fontSize: 10, marginTop: 4 }]}>
                  Signed: {mintResult.dataIntegrity.pointsCollected} points • {Math.round(mintResult.dataIntegrity.collectionDuration / 1000)}s
                </Text>
              )}
            </View>
          )}

          {/* System Status Overview */}
          <View style={styles.statusOverview}>
            <Text style={styles.sectionHeader}>⚡ System Status</Text>
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={[styles.statusGridLabel, { color: connectedDevice ? colors.accent : colors.destructive }]}>
                  {connectedDevice ? '✅' : '❌'} Device
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={[styles.statusGridLabel, { color: isWalletConnected ? colors.accent : colors.gray[400] }]}>
                  {isWalletConnected ? '✅' : '⚪'} Wallet
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={[styles.statusGridLabel, { color: collectedData.length > 0 ? colors.accent : colors.gray[400] }]}>
                  {collectedData.length > 0 ? '✅' : '⚪'} Data ({collectedData.length})
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={[styles.statusGridLabel, { color: mintingValidation.canProceed ? colors.accent : colors.gray[400] }]}>
                  {mintingValidation.canProceed ? '✅' : '⚪'} Ready
                </Text>
              </View>
            </View>
          </View>
        </View>



          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Navigation Header for Scanner */}
      <View style={styles.navigationHeader}>
        <View style={styles.backButton}>
          <Text style={styles.backButtonText}>🔍 Scanner</Text>
        </View>
        
        <Text style={styles.headerTitle}>Kinetic Devices</Text>
        
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              console.log('Refresh devices');
              if (isReady && !isScanning) {
                scanForDevices();
              }
            }}
          >
            <Text style={styles.headerButtonText}>🔄</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={[styles.scrollContainer, { justifyContent: 'flex-start', alignItems: 'center', minHeight: '100%' }]}
        showsVerticalScrollIndicator={true}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        <View style={styles.container}>
          {/* Scanner Title Section */}
          <View style={styles.deviceStatusSection}>
            <Text style={styles.title}>
              Kinetic Device Scanner
            </Text>
          </View>
          
          {/* Wallet Connection Section */}
          <View style={styles.walletSection}>
            <Text style={styles.sectionHeader}>🔗 Wallet Setup</Text>
        {!isWalletConnected ? (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, { 
                backgroundColor: isWalletConnecting ? colors.muted : colors.primary,
                shadowColor: isWalletConnecting ? 'transparent' : colors.primary,
              }]}
              onPress={connectWallet}
              disabled={isWalletConnecting}
            >
              <Text style={[
                styles.primaryButtonText,
                isWalletConnecting && { color: colors.mutedForeground }
              ]}>
                {isWalletConnecting ? '🔄 Connecting...' : '🔗 Connect Wallet'}
              </Text>
            </TouchableOpacity>
            <View style={[styles.requirementCard, { padding: 8, marginTop: 8 }]}>
              <Text style={[styles.requirementText, { fontSize: 11 }]}>
                💡 Connect wallet for minting
              </Text>
            </View>
          </>
        ) : (
          <View style={[styles.dataCard, { 
            padding: 8, 
            marginBottom: 8,
            minHeight: 'auto'
          }]}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              minHeight: 'auto'
            }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dataCardTitle, { 
                  fontSize: 12, 
                  marginBottom: 2,
                  lineHeight: 14
                }]}>🔗 Connected</Text>
                <Text style={[styles.dataValue, { 
                  fontSize: 9, 
                  fontFamily: 'monospace',
                  lineHeight: 12
                }]}>
                  {walletAccount?.slice(0, 6)}...{walletAccount?.slice(-4)}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.destructiveButton, { 
                  marginTop: 0, 
                  paddingVertical: 6, 
                  paddingHorizontal: 8,
                  minHeight: 'auto',
                  borderWidth: 1
                }]}
                onPress={disconnectWallet}
              >
                <Text style={[styles.destructiveButtonText, { 
                  fontSize: 10,
                  lineHeight: 12
                }]}>
                  ⚙️
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      
          {/* Device Scanner Section */}
          <View style={styles.sensorDataSection}>
            <Text style={styles.sectionHeader}>📡 Device Scanner</Text>
            
            {/* BLE Status Indicator */}
            <View style={styles.statusIndicator}>
        <View style={[styles.statusDot, { 
          backgroundColor: hasError ? colors.destructive : isReady ? colors.accent : colors.gray[500] 
        }]} />
        <Text style={styles.statusLabel}>
          {hasError ? 'Connection Error' : isReady ? 'Scanner Ready' : 'Initializing...'}
        </Text>
      </View>

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

            {/* Available Devices */}
            {allDevices.length > 0 && (
              <Text style={[styles.sectionHeader, { fontSize: 16, marginTop: 16, marginBottom: 8 }]}>
                📱 Available Devices ({allDevices.length})
              </Text>
            )}

            {allDevices.map((device, index) => (
              <TouchableOpacity
                key={device.id}
                style={[
                  styles.deviceCard,
                  isLoading && { opacity: 0.6 }
                ]}
                onPress={() => handleConnect(device)}
                disabled={isLoading}
                activeOpacity={0.7}
              >
                <View style={styles.deviceHeader}>
                  <Text style={styles.deviceName}>
                    {device.name || device.localName || `Kinetic Device ${index + 1}`}
                  </Text>
                  <View style={[styles.statusDot, { 
                    backgroundColor: colors.accent,
                    width: 6,
                    height: 6,
                  }]} />
                </View>
                <Text style={styles.deviceId}>
                  {device.id}
                </Text>
                {isLoading && (
                  <Text style={styles.connectingText}>
                    Connecting...
                  </Text>
                )}
              </TouchableOpacity>
            ))}

            {allDevices.length === 0 && !isScanning && isReady && (
              <Text style={styles.emptyState}>
                No Kinetic devices found.{'\n'}Make sure your device is powered on and advertising.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// AppContent is already defined above with all the UI logic

export default function App() {
  console.log('🚀 App component rendering with Thirdweb v5 as main wallet...');
  
  return (
    <ThirdwebProvider>
      <AppContent />
    </ThirdwebProvider>
  );
}