import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IMUData } from '../constants/BLEConstants';

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

interface IMUDataDisplayProps {
    data: IMUData;
    isConnected: boolean;
}

export default function IMUDataDisplay({ data, isConnected }: IMUDataDisplayProps) {
    if (!isConnected) {
        return (
            <View style={styles.container}>
                <Text style={styles.statusText}>Device not connected</Text>
                <Text style={styles.subtitleText}>Connect to an ESP32 IMU device to view data</Text>
            </View>
        );
    }

    if (!data || data.isStale) {
        return (
            <View style={[styles.container, data?.isStale && styles.staleContainer]}>
                <Text style={[styles.statusText, data?.isStale && styles.staleText]}>
                    {data?.isStale ? '⚠️ Data appears stale' : 'Waiting for data...'}
                </Text>
                <Text style={styles.subtitleText}>
                    {data?.isStale
                        ? 'Device may be disconnected or not transmitting'
                        : 'Ensure the device is transmitting sensor data'
                    }
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Accelerometer Section */}
            <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: colors.accent }]}>
                    Accelerometer (g)
                </Text>
                <View style={styles.dataGrid}>
                    <View style={styles.dataItem}>
                        <Text style={styles.axisLabel}>X</Text>
                        <Text style={[styles.dataValue, { color: colors.accent }]}>
                            {data.accelerometer.x.toFixed(3)}
                        </Text>
                    </View>
                    <View style={styles.dataItem}>
                        <Text style={styles.axisLabel}>Y</Text>
                        <Text style={[styles.dataValue, { color: colors.accent }]}>
                            {data.accelerometer.y.toFixed(3)}
                        </Text>
                    </View>
                    <View style={styles.dataItem}>
                        <Text style={styles.axisLabel}>Z</Text>
                        <Text style={[styles.dataValue, { color: colors.accent }]}>
                            {data.accelerometer.z.toFixed(3)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Gyroscope Section */}
            <View style={styles.sectionContainer}>
                <Text style={[styles.sectionTitle, { color: colors.purple[500] }]}>
                    Gyroscope (°/s)
                </Text>
                <View style={styles.dataGrid}>
                    <View style={styles.dataItem}>
                        <Text style={styles.axisLabel}>X</Text>
                        <Text style={[styles.dataValue, { color: colors.purple[500] }]}>
                            {data.gyroscope.x.toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.dataItem}>
                        <Text style={styles.axisLabel}>Y</Text>
                        <Text style={[styles.dataValue, { color: colors.purple[500] }]}>
                            {data.gyroscope.y.toFixed(2)}
                        </Text>
                    </View>
                    <View style={styles.dataItem}>
                        <Text style={styles.axisLabel}>Z</Text>
                        <Text style={[styles.dataValue, { color: colors.purple[500] }]}>
                            {data.gyroscope.z.toFixed(2)}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Raw Data */}
            <View style={styles.rawDataContainer}>
                <Text style={styles.rawDataLabel}>Raw Data:</Text>
                <Text style={styles.rawDataValue}>{data.rawData}</Text>
            </View>

            {/* Timestamp */}
            <View style={styles.timestampContainer}>
                <Text style={styles.timestampLabel}>Last Update:</Text>
                <Text style={styles.timestampValue}>{data.timestamp}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    statusText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.foreground,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitleText: {
        fontSize: 14,
        color: colors.gray[400],
        textAlign: 'center',
        lineHeight: 20,
    },
    staleContainer: {
        borderWidth: 2,
        borderColor: colors.destructive,
        borderRadius: 8,
        padding: 16,
    },
    staleText: {
        color: colors.destructive,
    },
    sectionContainer: {
        backgroundColor: colors.gray[800],
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.gray[700],
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    dataGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    dataItem: {
        alignItems: 'center',
        flex: 1,
    },
    axisLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.gray[400],
        marginBottom: 4,
    },
    dataValue: {
        fontSize: 16,
        fontWeight: '600',
        fontFamily: 'monospace',
        textAlign: 'center',
    },
    rawDataContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.gray[800],
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.gray[700],
    },
    rawDataLabel: {
        fontSize: 12,
        color: colors.gray[400],
        marginRight: 8,
    },
    rawDataValue: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.foreground,
        fontFamily: 'monospace',
    },
    timestampContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.gray[800],
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.gray[700],
    },
    timestampLabel: {
        fontSize: 12,
        color: colors.gray[400],
        marginRight: 8,
    },
    timestampValue: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.foreground,
        fontFamily: 'monospace',
    },
});