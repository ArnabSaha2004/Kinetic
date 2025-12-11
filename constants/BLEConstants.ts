// BLE Service and Characteristic UUIDs
// Update these to match your specific Arduino device
export const BLE_CONFIG = {
  // Main service UUID - update this to match your Arduino
  DATA_SERVICE_UUID: "19b10000-e8f2-537e-4f6c-d104768a1214",
  
  // Characteristic UUIDs
  COLOR_CHARACTERISTIC_UUID: "19b10001-e8f2-537e-4f6c-d104768a1217",
  
  // Add more characteristics as needed
  // SENSOR_CHARACTERISTIC_UUID: "19b10002-e8f2-537e-4f6c-d104768a1218",
  // CONTROL_CHARACTERISTIC_UUID: "19b10003-e8f2-537e-4f6c-d104768a1219",
};

// Device name patterns to look for during scanning
export const DEVICE_NAME_PATTERNS = [
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