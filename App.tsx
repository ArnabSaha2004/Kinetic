import React, { useState } from 'react';
import { Text, View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { useBLE } from './hooks/useBLE';
import { useDataMinting } from './hooks/useDataMinting';
import { WalletProvider } from './components/AppKitProvider';
import { useWallet } from './components/AppKitProvider';
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 60,
  },
  connectedContainer: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
    paddingTop: 60,
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
  // Wallet connection styles (for AppKit integration)
  walletSection: {
    marginBottom: 24,
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

  // Custom wallet hooks
  const { address, isConnected, isConnecting, connect, disconnect } = useWallet();

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

  // Note: Transaction signing is now handled internally by the useDataMinting hook

  const {
    startCollection,
    stopCollection,
    mintCollectedData,
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
    if (isCollecting && !imuData.isStale && connectedDevice) {
      // Add current data point to collection
      addDataPoint(imuData);
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
      <View style={styles.connectedContainer}>
        <Text style={styles.title}>
          Kinetic IMU Dashboard
        </Text>
        <Text style={styles.subtitle}>
          Connected: {connectedDevice.name || 'Kinetic Device'}
          {imuData.isStale && ' ⚠️ DATA STALE'}
        </Text>
        
        {/* IMU Data - Kinetic Branded */}
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

        {/* Wallet Status Section - AppKit Integration */}
        <View style={styles.walletSection}>
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

        {/* Data Collection & Minting Section */}
        <View style={styles.mintingSection}>
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
                  // Guard against starting collection without proper device connection
                  if (!connectedDevice) {
                    console.log('❌ Collection blocked: No device connected');
                    return;
                  }
                  
                  if (imuData.isStale) {
                    console.log('❌ Collection blocked: Device data is stale');
                    return;
                  }
                  
                  startCollection();
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
                    console.log('🚀 Mint button pressed');
                    console.log('Minting validation:', mintingValidation);
                    
                    // Use wallet guards to validate requirements
                    if (!mintingValidation.canProceed) {
                      console.log('❌ Minting blocked by validation:', mintingValidation.errorMessage);
                      
                      // If wallet connection is the issue, open AppKit modal
                      if (mintingValidation.errorMessage?.includes('Wallet') || 
                          mintingValidation.errorMessage?.includes('wallet')) {
                        connectWallet();
                      }
                      return;
                    }
                    
                    // All validations passed, proceed with minting
                    mintCollectedData();
                  }}
                  disabled={isMinting || !mintingValidation.canProceed}
                >
                  <Text style={[
                    styles.primaryButtonText,
                    (isMinting || !mintingValidation.canProceed) && { color: colors.mutedForeground }
                  ]}>
                    {isMinting ? '⏳ Minting via Wallet...' : 
                     !mintingValidation.canProceed ? '🚫 Requirements Not Met' : 
                     '🚀 Mint IMU Data NFT'}
                  </Text>
                </TouchableOpacity>

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
            {mintingValidation.canProceed && collectedData.length > 0 && !isCollecting && (
              <View style={[styles.requirementCard, { borderColor: colors.accent }]}>
                <Text style={[styles.requirementText, { color: colors.accent }]}>
                  ✅ Ready to mint {collectedData.length} IMU data points as NFT
                </Text>
              </View>
            )}
          </View>

          {mintingError && (
            <Text style={styles.errorText}>{mintingError}</Text>
          )}

          {mintResult && (
            <View style={styles.mintResult}>
              <Text style={styles.mintResultTitle}>✅ IMU Data NFT Signed!</Text>
              <Text style={styles.mintResultText}>
                {mintResult.message || `Transaction prepared for ${collectedData.length} IMU data points`}
              </Text>
              {mintResult.dataIntegrity && (
                <Text style={[styles.mintResultText, { fontSize: 10, marginTop: 4 }]}>
                  Signed: {mintResult.dataIntegrity.pointsCollected} points • {Math.round(mintResult.dataIntegrity.collectionDuration / 1000)}s
                </Text>
              )}
            </View>
          )}

          {/* Status Overview */}
          <View style={styles.statusOverview}>
            <Text style={styles.statusTitle}>System Status</Text>
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

        {/* Kinetic Branded Reconnect Button */}
        {imuData.isStale && (
          <TouchableOpacity
            style={[styles.primaryButton, { 
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            }]}
            onPress={() => {
              reconnectToLastDevice();
            }}
          >
            <Text style={styles.primaryButtonText}>
              🔄 Reconnect Device
            </Text>
          </TouchableOpacity>
        )}

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
      
      {/* Wallet Connection Section - AppKit Integration */}
      <View style={styles.walletSection}>
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
            <View style={styles.requirementCard}>
              <Text style={styles.requirementText}>
                💡 Connect your wallet now to streamline the minting process after data collection
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.dataCard}>
            <Text style={styles.dataCardTitle}>🔗 Wallet Connected</Text>
            <Text style={[styles.dataValue, { fontSize: 12, fontFamily: 'monospace' }]}>
              {walletAccount}
            </Text>
            <Text style={[styles.requirementText, { marginTop: 8, marginBottom: 8, color: colors.accent }]}>
              {getWalletStatusMessage(walletState)}
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
        )}
      </View>
      
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
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}