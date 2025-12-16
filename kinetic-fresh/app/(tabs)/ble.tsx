import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Alert,
  Platform 
} from 'react-native';
import { Device } from 'react-native-ble-plx';
import { useBLE } from '@/hooks/useBLE';
import { useDataMinting } from '@/hooks/useDataMinting';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { SectionIcon } from '@/components/SectionIcon';
import { ConnectButton, useActiveAccount } from 'thirdweb/react';
import { client, chain } from '@/constants/thirdweb';
import { createWallet } from 'thirdweb/wallets';
import { 
  validateMintingWorkflow, 
  validateSimulationWorkflow,
  getWalletStatusMessage, 
  getDataCollectionStatusMessage,
  WalletConnectionState 
} from '@/utils/WalletGuards';

const colors = {
  background: '#0a0a0f',
  foreground: '#ffffff',
  card: '#1a1a1f',
  primary: '#9333ea',
  primaryForeground: '#ffffff',
  secondary: '#374151',
  muted: '#1f2937',
  mutedForeground: '#9ca3af',
  accent: '#06b6d4',
  destructive: '#ef4444',
  border: '#374151',
  success: '#10b981',
  purple: {
    300: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
  },
  gray: {
    400: '#9ca3af',
    500: '#6b7280',
    700: '#374151',
    800: '#1f2937',
  }
};

export default function BLEScreen() {
  const {
    requestPermissions,
    scanForPeripherals,
    connectToDevice,
    disconnectFromDevice,
    allDevices,
    connectedDevice,
    imuData,
    isScanning,
    isReady,
    hasError,
  } = useBLE();

  const {
    startCollection,
    stopCollection,
    mintCollectedData,
    simulateMinting,
    addDataPoint,
    clearData,
    isCollecting,
    isMinting,
    collectedData,
    collectionDuration,
    mintResult,
    error: mintingError,
  } = useDataMinting();

  const walletAccount = useActiveAccount();
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  // Add data points when IMU data updates
  useEffect(() => {
    if (isCollecting && !imuData.isStale) {
      addDataPoint(imuData);
    }
  }, [imuData, isCollecting, addDataPoint]);

  // Request permissions on mount
  useEffect(() => {
    const initPermissions = async () => {
      try {
        const granted = await requestPermissions();
        setPermissionsGranted(granted);
        if (!granted) {
          Alert.alert(
            'Permissions Required',
            'Bluetooth and location permissions are required for BLE functionality.'
          );
        }
      } catch (error) {
        console.error('Permission request failed:', error);
      }
    };

    initPermissions();
  }, [requestPermissions]);

  // Create wallet state for validation
  const walletState: WalletConnectionState = {
    isConnected: !!walletAccount,
    address: walletAccount?.address,
    hasProvider: true,
    status: walletAccount ? 'connected' : 'disconnected',
  };

  // Validate minting workflow
  const mintingValidation = validateMintingWorkflow(
    walletState,
    collectedData,
    isCollecting,
    !!connectedDevice,
    imuData.isStale
  );

  // Validate simulation workflow (no wallet required)
  const simulationValidation = validateSimulationWorkflow(
    collectedData,
    isCollecting,
    !!connectedDevice,
    imuData.isStale
  );

  const handleDeviceConnection = async (device: Device) => {
    try {
      await connectToDevice(device);
    } catch (error) {
      Alert.alert('Connection Failed', 'Could not connect to device. Please try again.');
      console.error('Device connection failed:', error);
    }
  };

  const handleStartCollection = () => {
    if (!connectedDevice) {
      Alert.alert('No Device', 'Please connect to a BLE device first.');
      return;
    }
    startCollection();
  };

  const handleMintData = async () => {
    if (!mintingValidation.canProceed) {
      Alert.alert('Cannot Mint', mintingValidation.requirementMessage || mintingValidation.errorMessage);
      return;
    }

    try {
      await mintCollectedData();
      Alert.alert('Success', 'IMU data exported successfully! Check console for details.');
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
      console.error('Minting failed:', error);
    }
  };

  const handleSimulateMinting = async () => {
    if (!simulationValidation.canProceed) {
      Alert.alert('Cannot Simulate', simulationValidation.requirementMessage || simulationValidation.errorMessage);
      return;
    }

    try {
      await simulateMinting();
      Alert.alert('Simulation Complete', 'IP token simulation completed! Check the result below.');
    } catch (error) {
      Alert.alert('Simulation Failed', 'Could not simulate IP token creation. Please try again.');
      console.error('Simulation failed:', error);
    }
  };

  if (hasError) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.errorText}>
          BLE Not Available
        </ThemedText>
        <ThemedText style={styles.errorDescription}>
          Bluetooth Low Energy is not available on this device or simulator.
          Please run on a physical device with BLE support.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          Kinetic IMU Dashboard
        </ThemedText>

        {/* Wallet Status Indicator */}
        <View style={styles.walletStatusBar}>
          <View style={styles.walletStatusIndicator}>
            <SectionIcon name="wallet-outline" color={walletAccount ? colors.success : colors.mutedForeground} size={16} />
            <ThemedText style={[styles.walletStatusText, { color: walletAccount ? colors.success : colors.mutedForeground }]}>
              {walletAccount ? `Connected: ${walletAccount.address.slice(0, 6)}...${walletAccount.address.slice(-4)}` : 'No wallet connected'}
            </ThemedText>
          </View>
          {!walletAccount && (
            <ThemedText style={styles.walletStatusHint}>
              Go to Connect tab to link wallet
            </ThemedText>
          )}
        </View>

        {/* BLE Device Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionIcon name="bluetooth-outline" color={colors.accent} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              BLE Device Connection
            </ThemedText>
          </View>
          <View style={styles.card}>
            {!isReady ? (
              <ThemedText style={styles.statusText}>Initializing BLE...</ThemedText>
            ) : !permissionsGranted ? (
              <ThemedText style={styles.statusText}>Permissions required</ThemedText>
            ) : connectedDevice ? (
              <View>
                <ThemedText style={styles.connectedText}>
                  Connected: {connectedDevice.name || 'Unknown Device'}
                </ThemedText>
                <TouchableOpacity
                  style={[styles.button, styles.disconnectButton]}
                  onPress={disconnectFromDevice}
                >
                  <Text style={styles.buttonText}>Disconnect</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TouchableOpacity
                  style={[styles.button, isScanning && styles.disabledButton]}
                  onPress={scanForPeripherals}
                  disabled={isScanning}
                >
                  <Text style={styles.buttonText}>
                    {isScanning ? 'Scanning...' : 'Scan for Devices'}
                  </Text>
                </TouchableOpacity>
                
                {allDevices.length > 0 && (
                  <View style={styles.deviceList}>
                    <ThemedText style={styles.deviceListTitle}>Found Devices:</ThemedText>
                    {allDevices.map((device) => (
                      <TouchableOpacity
                        key={device.id}
                        style={styles.deviceItem}
                        onPress={() => handleDeviceConnection(device)}
                      >
                        <Text style={styles.deviceName}>
                          {device.name || device.localName || 'Unknown Device'}
                        </Text>
                        <Text style={styles.deviceId}>
                          {device.id.slice(-8)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </View>

        {/* IMU Data Section */}
        {connectedDevice && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SectionIcon name="analytics-outline" color={colors.accent} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                IMU Data
              </ThemedText>
            </View>
            <View style={styles.card}>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Accelerometer:</Text>
                <Text style={styles.dataValue}>
                  X: {imuData.accelerometer.x.toFixed(3)} | 
                  Y: {imuData.accelerometer.y.toFixed(3)} | 
                  Z: {imuData.accelerometer.z.toFixed(3)}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Gyroscope:</Text>
                <Text style={styles.dataValue}>
                  X: {imuData.gyroscope.x.toFixed(3)} | 
                  Y: {imuData.gyroscope.y.toFixed(3)} | 
                  Z: {imuData.gyroscope.z.toFixed(3)}
                </Text>
              </View>
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>Timestamp:</Text>
                <Text style={styles.dataValue}>{imuData.timestamp}</Text>
              </View>
              {imuData.isStale && (
                <View style={styles.staleWarningContainer}>
                  <SectionIcon name="warning-outline" color={colors.destructive} size={16} />
                  <Text style={styles.staleWarning}>Data appears stale</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Data Collection Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionIcon name="radio-outline" color={colors.success} />
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Data Collection
            </ThemedText>
          </View>
          <View style={styles.card}>
            <ThemedText style={styles.statusText}>
              {getDataCollectionStatusMessage(collectedData, isCollecting, collectionDuration)}
            </ThemedText>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.collectButton,
                  (!connectedDevice || isCollecting) && styles.disabledButton
                ]}
                onPress={handleStartCollection}
                disabled={!connectedDevice || isCollecting}
              >
                <Text style={styles.buttonText}>Start Collection</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.stopButton,
                  !isCollecting && styles.disabledButton
                ]}
                onPress={stopCollection}
                disabled={!isCollecting}
              >
                <Text style={styles.buttonText}>Stop Collection</Text>
              </TouchableOpacity>
            </View>

            {collectedData.length > 0 && (
              <TouchableOpacity
                style={[styles.button, styles.clearButton]}
                onPress={clearData}
              >
                <Text style={styles.buttonText}>Clear Data</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Minting Section */}
        {collectedData.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <SectionIcon name="cloud-upload-outline" color={colors.primary} />
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Create IP Token
              </ThemedText>
            </View>
            <View style={styles.card}>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.mintButton,
                    { flex: 1, marginRight: 5 },
                    (!mintingValidation.canProceed || isMinting) && styles.disabledButton
                  ]}
                  onPress={handleMintData}
                  disabled={!mintingValidation.canProceed || isMinting}
                >
                  <Text style={styles.buttonText}>
                    {isMinting ? 'Creating IP...' : 'Create IP Token'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.simulateButton,
                    { flex: 1, marginLeft: 5 },
                    (!simulationValidation.canProceed || isMinting) && styles.disabledButton
                  ]}
                  onPress={handleSimulateMinting}
                  disabled={!simulationValidation.canProceed || isMinting}
                >
                  <Text style={styles.buttonText}>
                    {isMinting ? 'Simulating...' : 'Simulate IP Token'}
                  </Text>
                </TouchableOpacity>
              </View>

              {!mintingValidation.canProceed && (
                <Text style={styles.validationMessage}>
                  {mintingValidation.requirementMessage}
                </Text>
              )}

              {mintingError && (
                <Text style={styles.errorMessage}>{mintingError}</Text>
              )}

              {mintResult && (
                <View>
                  <Text style={[
                    mintResult.status === 'simulated' ? styles.simulationMessage : styles.successMessage
                  ]}>
                    {mintResult.message}
                  </Text>
                  
                  {mintResult.status === 'simulated' && mintResult.simulationInfo && (
                    <View style={styles.simulationDetails}>
                      <Text style={styles.simulationDetailText}>
                        IP Token ID: #{mintResult.simulationInfo.ipTokenId}
                      </Text>
                      <Text style={styles.simulationDetailText}>
                        IP Asset ID: {mintResult.simulationInfo.ipAssetId?.slice(0, 10)}...
                      </Text>
                      <Text style={styles.simulationDetailText}>
                        License Token: #{mintResult.simulationInfo.licenseTokenId}
                      </Text>
                      <Text style={styles.simulationDetailText}>
                        Royalty Rate: {mintResult.simulationInfo.royaltyRate}
                      </Text>
                      <Text style={styles.simulationDetailText}>
                        Gas Fee: {mintResult.simulationInfo.gasFeeIP} IP
                      </Text>
                      <Text style={styles.simulationDetailText}>
                        Network: {mintResult.simulationInfo.network}
                      </Text>
                      
                      {mintResult.simulationInfo.sampleJson && (
                        <View style={styles.jsonPreview}>
                          <Text style={styles.jsonTitle}>Sample JSON (first 10 lines):</Text>
                          <Text style={styles.jsonContent}>
                            {mintResult.simulationInfo.sampleJson}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.simulationNote}>
                        {mintResult.simulationInfo.note}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}


      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingTop: 80,
  },
  title: {
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.foreground,
    marginBottom: 0,
  },
  card: {
    backgroundColor: colors.card,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: {
    color: colors.mutedForeground,
    marginBottom: 10,
  },
  connectedText: {
    color: colors.success,
    marginBottom: 10,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginVertical: 8,
  },
  disabledButton: {
    backgroundColor: colors.muted,
  },
  disconnectButton: {
    backgroundColor: colors.destructive,
  },
  collectButton: {
    backgroundColor: colors.success,
    flex: 1,
    marginRight: 5,
  },
  stopButton: {
    backgroundColor: colors.destructive,
    flex: 1,
    marginLeft: 5,
  },
  clearButton: {
    backgroundColor: colors.secondary,
  },
  mintButton: {
    backgroundColor: colors.accent,
  },
  simulateButton: {
    backgroundColor: colors.purple[500],
  },

  buttonText: {
    color: colors.primaryForeground,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    marginVertical: 10,
  },
  deviceList: {
    marginTop: 15,
  },
  deviceListTitle: {
    color: colors.foreground,
    marginBottom: 10,
  },
  deviceItem: {
    backgroundColor: colors.muted,
    padding: 10,
    borderRadius: 5,
    marginVertical: 2,
  },
  deviceName: {
    color: colors.foreground,
    fontWeight: 'bold',
  },
  deviceId: {
    color: colors.mutedForeground,
    fontSize: 12,
  },
  dataRow: {
    marginVertical: 5,
  },
  dataLabel: {
    color: colors.foreground,
    fontWeight: 'bold',
  },
  dataValue: {
    color: colors.mutedForeground,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  staleWarningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  staleWarning: {
    color: colors.destructive,
    marginLeft: 4,
  },
  validationMessage: {
    color: colors.mutedForeground,
    marginTop: 10,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.destructive,
    marginTop: 10,
    textAlign: 'center',
  },
  successMessage: {
    color: colors.success,
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: colors.destructive,
    textAlign: 'center',
    marginBottom: 20,
  },
  errorDescription: {
    color: colors.mutedForeground,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  walletStatusBar: {
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  walletStatusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  walletStatusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  walletStatusHint: {
    color: colors.mutedForeground,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  simulationMessage: {
    color: colors.purple[300],
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  simulationDetails: {
    backgroundColor: colors.muted,
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  simulationDetailText: {
    color: colors.foreground,
    fontSize: 12,
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  simulationNote: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  jsonPreview: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  jsonTitle: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  jsonContent: {
    color: colors.foreground,
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 16,
  },
});