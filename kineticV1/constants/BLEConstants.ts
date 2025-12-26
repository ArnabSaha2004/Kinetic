// BLE Service and Characteristic UUIDs
// Update these to match your specific Arduino device
export const BLE_CONFIG = {
    // Main service UUID - matches Arduino sketch
    DATA_SERVICE_UUID: "12345678-1234-1234-1234-1234567890ab",

    // IMU data characteristic UUID - matches Arduino sketch
    COLOR_CHARACTERISTIC_UUID: "abcd1234-5678-90ab-cdef-1234567890ab",

    // Add more characteristics as needed
    // SENSOR_CHARACTERISTIC_UUID: "19b10002-e8f2-537e-4f6c-d104768a1218",
    // CONTROL_CHARACTERISTIC_UUID: "19b10003-e8f2-537e-4f6c-d104768a1219",
};

// Device name patterns to look for during scanning
export const DEVICE_NAME_PATTERNS = [
    'ESP32C3_MPU6050',
    'arduino',
    'esp32',
    'esp8266',
    'nano',
    'uno',
    // Add your custom device names here
];

// Color mapping for received data
export const COLOR_CODES = {
    'B': 'blue',
    'R': 'red',
    'G': 'green',
    'Y': 'yellow',
    'P': 'purple',
    'O': 'orange',
    'C': 'cyan',
    'M': 'magenta',
    'W': 'white',
    'K': 'black',
} as const;

// Scan configuration
export const SCAN_CONFIG = {
    SCAN_TIMEOUT: 10000, // 10 seconds
    ALLOW_DUPLICATES: false,
    SCAN_MODE: 'balanced', // 'low_power', 'balanced', 'low_latency'
};

// Connection configuration
export const CONNECTION_CONFIG = {
    CONNECTION_TIMEOUT: 5000, // 5 seconds
    AUTO_RECONNECT: true,
    RECONNECT_ATTEMPTS: 3,
};

// IMU data interface (matches kinetic-fresh format)
export interface IMUData {
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

// Connection status enum
export enum ConnectionStatus {
    DISCONNECTED = 'disconnected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    ERROR = 'error'
}