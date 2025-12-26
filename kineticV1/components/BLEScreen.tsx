import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Device } from 'react-native-ble-plx';
import { useBLE } from '../hooks/useBLE';
import IMUDataDisplay from './IMUDataDisplay';
import { SectionIcon } from './SectionIcon';

// Colors from STYLE.md
const colors = {
    background: '#0a0a0f',
    foreground: '#ffffff',
    card: '#1a1a1f',
    cardForeground: '#ffffff',
    primary: '#9333ea',
    primaryForeground: '#ffffff',
    accent: '#06b6d4',
    destructive: '#ef4444',
    gray: {
        400: '#9ca3af',
        500: '#6b7280',
        700: '#374151',
        800: '#1f2937',
    },
    purple: {
        300: '#c084fc',
        500: '#a855f7',
        600: '#9333ea',
        700: '#7c3aed',
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

    const [permissionsGranted, setPermissionsGranted] = useState(false);
    const [dataCount, setDataCount] = useState(0);

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

    // Count data updates
    useEffect(() => {
        if (!imuData.isStale) {
            setDataCount(prev => prev + 1);
        }
    }, [imuData.lastUpdateTime]);

    // Reset data count when disconnected
    useEffect(() => {
        if (!connectedDevice) {
            setDataCount(0);
        }
    }, [connectedDevice]);

    const handleDeviceConnection = async (device: Device) => {
        try {
            await connectToDevice(device);
        } catch (error) {
            Alert.alert('Connection Failed', 'Could not connect to device. Please try again.');
            console.error('Device connection failed:', error);
        }
    };

    const handleConnect = async () => {
        try {
            if (!isReady) {
                Alert.alert('Not Ready', 'BLE is not ready yet. Please wait and try again.');
                return;
            }

            if (!permissionsGranted) {
                Alert.alert('Permissions Required', 'Please grant Bluetooth and location permissions.');
                return;
            }

            scanForPeripherals();
        } catch (error: any) {
            console.error('Scan failed:', error);
            Alert.alert('Scan Failed', error.message || 'Unknown error occurred');
        }
    };

    const handleDisconnect = async () => {
        try {
            disconnectFromDevice();
        } catch (error) {
            console.error('Disconnect failed:', error);
        }
    };

    const getStatusColor = () => {
        if (hasError) return colors.destructive;
        if (connectedDevice) return colors.accent;
        if (isScanning) return colors.purple[500];
        return colors.gray[500];
    };

    const getStatusText = () => {
        if (hasError) return 'Error - BLE not available';
        if (connectedDevice) return 'Connected';
        if (isScanning) return 'Scanning...';
        if (!isReady) return 'Initializing...';
        return 'Disconnected';
    };

    if (hasError) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle}>⚠️ BLE Not Available</Text>
                    <Text style={styles.errorDescription}>
                        Bluetooth Low Energy is not available on this device or simulator.
                        Please run on a physical device with BLE support.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <SectionIcon name="analytics-outline" color={colors.accent} size={32} />
                    </View>
                    <Text style={styles.title}>Kinetic IMU</Text>
                    <Text style={styles.subtitle}>ESP32-C3 + MPU6050 Sensor</Text>
                </View>

                {/* Connection Status Card */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <SectionIcon name="bluetooth-outline" color={colors.accent} />
                        <Text style={styles.cardTitle}>BLE Device Connection</Text>
                    </View>
                    <View style={styles.statusHeader}>
                        <View style={styles.statusPill}>
                            <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
                            <Text style={styles.statusText}>{getStatusText()}</Text>
                        </View>
                        {(isScanning || !isReady) && (
                            <ActivityIndicator size="small" color={colors.primary} />
                        )}
                    </View>

                    {connectedDevice && (
                        <View style={styles.deviceInfo}>
                            <Text style={styles.deviceInfoLabel}>Device:</Text>
                            <Text style={styles.deviceInfoValue}>
                                {connectedDevice.name || connectedDevice.localName || 'Unknown Device'}
                            </Text>
                        </View>
                    )}

                    {connectedDevice && (
                        <View style={styles.statsContainer}>
                            <Text style={styles.statsText}>Data packets: {dataCount}</Text>
                            {imuData.isStale && (
                                <View style={styles.staleWarningContainer}>
                                    <SectionIcon name="warning-outline" color={colors.destructive} size={16} />
                                    <Text style={styles.staleWarning}>⚠️ Data appears stale</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Device List */}
                    {allDevices.length > 0 && !connectedDevice && (
                        <View style={styles.deviceList}>
                            <Text style={styles.deviceListTitle}>Available Devices</Text>
                            {allDevices.map((device) => (
                                <TouchableOpacity
                                    key={device.id}
                                    style={styles.deviceItem}
                                    onPress={() => handleDeviceConnection(device)}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.deviceHeader}>
                                        <SectionIcon name="radio-outline" color={colors.accent} size={16} />
                                        <Text style={styles.deviceName}>
                                            {device.name || device.localName || 'Unknown Device'}
                                        </Text>
                                    </View>
                                    <Text style={styles.deviceId}>
                                        {device.id.slice(-8)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Connection Button */}
                    <TouchableOpacity
                        style={[
                            styles.primaryButton,
                            connectedDevice && styles.destructiveButton,
                            (isScanning || !isReady) && styles.disabledButton
                        ]}
                        onPress={connectedDevice ? handleDisconnect : handleConnect}
                        disabled={isScanning || !isReady}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.buttonText}>
                            {connectedDevice ? 'Disconnect' :
                                isScanning ? 'Scanning...' :
                                    !isReady ? 'Initializing...' : 'Scan for Devices'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* IMU Data Display */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <SectionIcon name="analytics-outline" color={colors.purple[500]} />
                        <Text style={styles.cardTitle}>Real-time IMU Data</Text>
                    </View>
                    <IMUDataDisplay
                        data={imuData}
                        isConnected={!!connectedDevice}
                    />
                </View>

                {/* Hardware Info */}
                <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <SectionIcon name="hardware-chip-outline" color={colors.gray[400]} />
                        <Text style={styles.cardTitle}>Hardware Specifications</Text>
                    </View>
                    <View style={styles.specsList}>
                        <View style={styles.specItem}>
                            <Text style={styles.specLabel}>Microcontroller:</Text>
                            <Text style={styles.specValue}>ESP32-C3 RISC-V</Text>
                        </View>
                        <View style={styles.specItem}>
                            <Text style={styles.specLabel}>IMU Sensor:</Text>
                            <Text style={styles.specValue}>MPU6050 6-axis</Text>
                        </View>
                        <View style={styles.specItem}>
                            <Text style={styles.specLabel}>Connectivity:</Text>
                            <Text style={styles.specValue}>Bluetooth 5.0 LE</Text>
                        </View>
                        <View style={styles.specItem}>
                            <Text style={styles.specLabel}>Sample Rate:</Text>
                            <Text style={styles.specValue}>Up to 100 Hz</Text>
                        </View>
                        <View style={styles.specItem}>
                            <Text style={styles.specLabel}>Data Format:</Text>
                            <Text style={styles.specValue}>CSV (ax,ay,az,gx,gy,gz)</Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 60, // Account for status bar
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 20,
        minHeight: '100%',
    },
    header: {
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
    },
    headerIcon: {
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        letterSpacing: -0.5,
        color: colors.foreground,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: colors.gray[400],
    },
    card: {
        backgroundColor: colors.card,
        padding: 20,
        borderRadius: 12,
        marginHorizontal: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.gray[700],
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.card,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.gray[700],
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
    },
    deviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    deviceInfoLabel: {
        fontSize: 14,
        color: colors.gray[400],
        marginRight: 8,
    },
    deviceInfoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.foreground,
    },
    statsContainer: {
        marginBottom: 16,
    },
    statsText: {
        fontSize: 14,
        color: colors.gray[400],
    },
    staleWarning: {
        fontSize: 14,
        color: colors.destructive,
        marginTop: 4,
    },
    staleWarningContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    deviceList: {
        marginBottom: 16,
    },
    deviceListTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.foreground,
        marginBottom: 12,
    },
    deviceItem: {
        backgroundColor: colors.gray[800],
        padding: 16,
        borderRadius: 8,
        marginVertical: 4,
        borderWidth: 1,
        borderColor: colors.gray[700],
    },
    deviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    deviceName: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.foreground,
    },
    deviceId: {
        fontSize: 12,
        color: colors.gray[400],
        fontFamily: 'monospace',
    },
    primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    destructiveButton: {
        backgroundColor: colors.destructive,
        shadowColor: colors.destructive,
    },
    disabledButton: {
        backgroundColor: colors.gray[500],
        shadowOpacity: 0.1,
        opacity: 0.6,
    },
    buttonText: {
        color: colors.primaryForeground,
        fontSize: 16,
        fontWeight: '600',
    },
    specsList: {
        gap: 12,
    },
    specItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    specLabel: {
        fontSize: 14,
        color: colors.gray[400],
    },
    specValue: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.foreground,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: '600',
        color: colors.destructive,
        marginBottom: 16,
        textAlign: 'center',
    },
    errorDescription: {
        fontSize: 16,
        color: colors.gray[400],
        textAlign: 'center',
        lineHeight: 24,
    },
});