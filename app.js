// Minimal ESP32-C3 IMU Dashboard
// Simple BLE connection and data display

// BLE UUIDs matching ESP32 sketch
const SERVICE_UUID = '12345678-1234-1234-1234-1234567890ab';
const CHARACTERISTIC_UUID = 'abcd1234-5678-90ab-cdef-1234567890ab';

class MinimalIMUDashboard {
    constructor() {
        this.device = null;
        this.characteristic = null;
        this.isConnected = false;
        
        // Scale factors for unit conversion
        this.ACCEL_SCALE = 16384.0;  // LSB/g for ±2g range
        this.GYRO_SCALE = 131.0;     // LSB/(deg/s) for ±250deg/s range
        
        // Recording functionality
        this.isRecording = false;
        this.recordedData = [];
        this.recordingStartTime = null;
        
        // UI elements
        this.connectBtn = document.getElementById('connectBtn');
        this.connectionStatus = document.getElementById('connectionStatus');
        this.errorMessage = document.getElementById('errorMessage');
        
        // Recording UI elements
        this.recordBtn = document.getElementById('recordBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.recordingStatus = document.getElementById('recordingStatus');
        this.sampleCount = document.getElementById('sampleCount');
        
        // Data display elements
        this.accelX = document.getElementById('accelX');
        this.accelY = document.getElementById('accelY');
        this.accelZ = document.getElementById('accelZ');
        this.gyroX = document.getElementById('gyroX');
        this.gyroY = document.getElementById('gyroY');
        this.gyroZ = document.getElementById('gyroZ');
        this.rawData = document.getElementById('rawData');
        this.timestamp = document.getElementById('timestamp');
        
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        this.connectBtn.addEventListener('click', () => {
            if (this.isConnected) {
                this.disconnect();
            } else {
                this.connect();
            }
        });
        
        this.recordBtn.addEventListener('click', () => {
            this.startRecording();
        });
        
        this.stopBtn.addEventListener('click', () => {
            this.stopRecording();
        });
    }
    
    async connect() {
        try {
            this.showError('');
            this.connectBtn.disabled = true;
            this.connectBtn.textContent = 'Connecting...';
            
            console.log('Requesting Bluetooth Device...');
            
            // Check Web Bluetooth support
            if (!navigator.bluetooth) {
                throw new Error('Web Bluetooth not supported in this browser');
            }
            
            // Try multiple connection methods
            try {
                // First try: by service UUID
                this.device = await navigator.bluetooth.requestDevice({
                    filters: [{ services: [SERVICE_UUID] }],
                    optionalServices: [SERVICE_UUID]
                });
            } catch (serviceError) {
                console.log('Service UUID filter failed, trying name filter...');
                try {
                    // Second try: by device name
                    this.device = await navigator.bluetooth.requestDevice({
                        filters: [{ name: 'ESP32C3_MPU6050' }],
                        optionalServices: [SERVICE_UUID]
                    });
                } catch (nameError) {
                    console.log('Name filter failed, trying acceptAllDevices...');
                    // Third try: show all devices
                    this.device = await navigator.bluetooth.requestDevice({
                        acceptAllDevices: true,
                        optionalServices: [SERVICE_UUID]
                    });
                }
            }
            
            console.log('Connecting to GATT Server...');
            const server = await this.device.gatt.connect();
            
            console.log('Getting Service...');
            const service = await server.getPrimaryService(SERVICE_UUID);
            
            console.log('Getting Characteristic...');
            this.characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
            
            // Subscribe to notifications
            console.log('Starting notifications...');
            await this.characteristic.startNotifications();
            
            // Set up data reception handler
            this.characteristic.addEventListener('characteristicvaluechanged', (event) => {
                this.handleData(event.target.value);
            });
            
            // Set up disconnection handler
            this.device.addEventListener('gattserverdisconnected', () => {
                console.log('Device disconnected');
                this.isConnected = false;
                this.updateConnectionStatus();
            });
            
            this.isConnected = true;
            this.updateConnectionStatus();
            console.log('Successfully connected!');
            
        } catch (error) {
            console.error('Connection failed:', error);
            this.handleConnectionError(error);
        } finally {
            this.connectBtn.disabled = false;
        }
    }
    
    async disconnect() {
        try {
            if (this.device && this.device.gatt.connected) {
                await this.device.gatt.disconnect();
            }
        } catch (error) {
            console.error('Disconnection error:', error);
        }
        
        this.isConnected = false;
        this.device = null;
        this.characteristic = null;
        this.updateConnectionStatus();
    }
    
    updateConnectionStatus() {
        if (this.isConnected) {
            this.connectionStatus.textContent = `Connected - ${this.device.name || 'ESP32C3_MPU6050'}`;
            this.connectionStatus.className = 'status-value connected';
            this.connectBtn.textContent = 'Disconnect';
            this.recordBtn.disabled = false;
        } else {
            this.connectionStatus.textContent = 'Disconnected';
            this.connectionStatus.className = 'status-value disconnected';
            this.connectBtn.textContent = 'Connect to ESP32C3_MPU6050';
            this.recordBtn.disabled = true;
            this.stopBtn.disabled = true;
            if (this.isRecording) {
                this.stopRecording();
            }
        }
    }
    
    handleConnectionError(error) {
        let errorMessage = 'Connection failed';
        
        if (error.name === 'NotSupportedError') {
            errorMessage = 'Web Bluetooth not supported. Please use Chrome or Edge.';
        } else if (error.name === 'NotFoundError') {
            errorMessage = 'No ESP32C3_MPU6050 devices found. Make sure your ESP32 is powered on.';
        } else if (error.name === 'SecurityError') {
            errorMessage = 'Bluetooth access denied. Please allow Bluetooth access.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        this.showError(errorMessage);
    }
    
    showError(message) {
        if (message) {
            this.errorMessage.textContent = message;
            this.errorMessage.classList.remove('hidden');
        } else {
            this.errorMessage.classList.add('hidden');
        }
    }
    
    handleData(uint8Array) {
        try {
            // Convert Uint8Array to string
            const text = new TextDecoder().decode(uint8Array).trim();
            console.log('Received:', text);
            
            // Parse CSV format: "ax,ay,az,gx,gy,gz"
            const values = text.split(',');
            
            if (values.length !== 6) {
                console.warn(`Expected 6 values, got ${values.length}`);
                return;
            }
            
            // Convert to numbers
            const rawValues = values.map(val => parseInt(val.trim()));
            
            // Check for invalid values
            if (rawValues.some(val => isNaN(val))) {
                console.warn('Invalid numeric values:', values);
                return;
            }
            
            // Convert to physical units
            const ax = rawValues[0] / this.ACCEL_SCALE;
            const ay = rawValues[1] / this.ACCEL_SCALE;
            const az = rawValues[2] / this.ACCEL_SCALE;
            const gx = rawValues[3] / this.GYRO_SCALE;
            const gy = rawValues[4] / this.GYRO_SCALE;
            const gz = rawValues[5] / this.GYRO_SCALE;
            
            // Update display
            this.updateValue(this.accelX, ax);
            this.updateValue(this.accelY, ay);
            this.updateValue(this.accelZ, az);
            this.updateValue(this.gyroX, gx);
            this.updateValue(this.gyroY, gy);
            this.updateValue(this.gyroZ, gz);
            this.updateValue(this.rawData, text);
            this.updateValue(this.timestamp, new Date().toLocaleTimeString());
            
            // Record data if recording is active
            if (this.isRecording) {
                const dataPoint = {
                    timestamp: Date.now(),
                    relativeTime: Date.now() - this.recordingStartTime,
                    accelerometer: {
                        x: ax,
                        y: ay,
                        z: az
                    },
                    gyroscope: {
                        x: gx,
                        y: gy,
                        z: gz
                    },
                    raw: {
                        ax: rawValues[0],
                        ay: rawValues[1],
                        az: rawValues[2],
                        gx: rawValues[3],
                        gy: rawValues[4],
                        gz: rawValues[5]
                    }
                };
                
                this.recordedData.push(dataPoint);
                this.updateValue(this.sampleCount, this.recordedData.length);
            }
            
        } catch (error) {
            console.error('Data processing error:', error);
        }
    }
    
    updateValue(element, value) {
        if (element) {
            const formattedValue = typeof value === 'number' ? value.toFixed(3) : value;
            element.textContent = formattedValue;
            
            // Add visual feedback
            element.classList.add('updated');
            setTimeout(() => {
                element.classList.remove('updated');
            }, 200);
        }
    }
    
    startRecording() {
        if (!this.isConnected) {
            this.showError('Please connect to device first');
            return;
        }
        
        this.isRecording = true;
        this.recordedData = [];
        this.recordingStartTime = Date.now();
        
        // Update UI
        this.recordBtn.disabled = true;
        this.recordBtn.classList.add('recording');
        this.recordBtn.textContent = 'Recording...';
        this.stopBtn.disabled = false;
        this.recordingStatus.textContent = 'Recording';
        this.recordingStatus.className = 'status-value recording';
        this.updateValue(this.sampleCount, 0);
        
        console.log('Recording started');
    }
    
    stopRecording() {
        if (!this.isRecording) {
            return;
        }
        
        this.isRecording = false;
        
        // Update UI
        this.recordBtn.disabled = false;
        this.recordBtn.classList.remove('recording');
        this.recordBtn.textContent = 'Start Recording';
        this.stopBtn.disabled = true;
        this.recordingStatus.textContent = 'Stopped';
        this.recordingStatus.className = 'status-value stopped';
        
        console.log(`Recording stopped. Captured ${this.recordedData.length} samples`);
        
        // Generate and download JSON file
        if (this.recordedData.length > 0) {
            this.downloadRecording();
        } else {
            this.showError('No data recorded');
        }
    }
    
    downloadRecording() {
        const recordingData = {
            metadata: {
                deviceName: this.device.name || 'ESP32C3_MPU6050',
                recordingStart: new Date(this.recordingStartTime).toISOString(),
                recordingEnd: new Date().toISOString(),
                duration: Date.now() - this.recordingStartTime,
                sampleCount: this.recordedData.length,
                sampleRate: this.recordedData.length / ((Date.now() - this.recordingStartTime) / 1000),
                units: {
                    accelerometer: 'g (gravity)',
                    gyroscope: 'deg/s (degrees per second)'
                }
            },
            data: this.recordedData
        };
        
        // Create JSON blob
        const jsonString = JSON.stringify(recordingData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `imu_recording_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('Recording downloaded');
        this.showError(''); // Clear any errors
        
        // Show success message temporarily
        const originalText = this.recordingStatus.textContent;
        this.recordingStatus.textContent = 'Downloaded!';
        setTimeout(() => {
            this.recordingStatus.textContent = originalText;
        }, 2000);
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Minimal IMU Dashboard initializing...');
    
    // Check Web Bluetooth support
    if (!navigator.bluetooth) {
        document.getElementById('errorMessage').textContent = 
            'Web Bluetooth not supported. Please use Chrome or Edge with HTTPS.';
        document.getElementById('errorMessage').classList.remove('hidden');
        document.getElementById('connectBtn').disabled = true;
        return;
    }
    
    // Initialize dashboard
    new MinimalIMUDashboard();
    console.log('Dashboard ready');
});