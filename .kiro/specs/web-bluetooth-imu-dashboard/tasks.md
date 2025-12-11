# Implementation Plan

- [x] 1. Set up ESP32 firmware foundation





  - Update existing sketch.ino to include BLE libraries and basic structure
  - Add ArduinoJson library dependency for JSON packet formatting
  - Create basic class structure for MPU6050Interface, BLEManager, and IMUDataProcessor
  - _Requirements: 1.1, 1.2, 6.1, 6.2_

- [ ] 1.1 Write property test for sensor data reading










  - **Property 1: Sensor data reading consistency**
  - **Validates: Requirements 1.4, 1.5**

- [x] 2. Implement ESP32 sensor initialization and I2C setup









  - Enhance MPU6050Interface class with proper initialization on GPIO 6/5
  - Add connection testing and error handling for sensor detection
  - Implement raw sensor data reading methods for accelerometer and gyroscope
  - _Requirements: 1.1, 1.2, 1.4, 1.5_

- [ ] 2.1 Write unit tests for sensor initialization

















  - Test I2C initialization with correct GPIO pins
  - Test MPU6050 detection and connection validation
  - Test error handling when sensor is not detected
  - _Requirements: 1.1, 1.2, 1.3_




- [ ] 3. Implement ESP32 data processing and unit conversion



  - Create IMUDataProcessor class with unit conversion methods
  - Convert raw accelerometer values to g units using scale factor
  - Convert raw gyroscope values to degrees/second using scale factor
  - Add timestamp generation for IMU packets

  - _Requirements: 6.3_



- [ ] 3.1 Write property test for unit conversion


  - **Property 5: Unit conversion accuracy**
  - **Validates: Requirements 6.3**



- [ ] 4. Implement ESP32 JSON formatting and BLE transmission


  - Create JSON packet formatting in IMUDataProcessor
  - Implement BLEManager class with Nordic UART Service setup

  - Add BLE characteristic creation and notification functionality


  - Integrate sensor reading with BLE transmission loop
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ] 4.1 Write property test for JSON formatting


  - **Property 6: JSON formatting completeness**
  - **Validates: Requirements 6.4**



- [ ] 4.2 Write unit tests for BLE setup




  - Test BLE service initialization with correct UUID
  - Test characteristic creation with notification properties
  - Test JSON packet structure and field validation
  - _Requirements: 6.1, 6.2, 6.4_

- [ ] 5. Create web dashboard project structure



  - Create index.html with basic layout and required panels
  - Create styles.css with responsive design and chart containers
  - Create app.js with main application class structure

  - Set up Chart.js integration for accelerometer and gyroscope charts



  - _Requirements: 5.1, 5.3, 5.5_

- [ ] 5.1 Write unit tests for web project setup




  - Test HTML structure contains required panels and buttons
  - Test CSS responsive layout functionality
  - Test vanilla JavaScript implementation (no frameworks)
  - _Requirements: 5.1, 5.3, 5.5_



- [ ] 6. Implement web dashboard BLE connection management

  - Create BLEConnectionManager class with Web Bluetooth API integration


  - Implement device scanning and connection establishment
  - Add connection status display and error handling
  - Implement characteristic subscription for data notifications
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 6.1 Write unit tests for BLE connection




  - Test connection button functionality and device scanning
  - Test connection status display updates

  - Test characteristic subscription with correct UUID

  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 7. Implement web dashboard data parsing and validation

  - Create IMUDataParser class for JSON packet processing


  - Add Uint8Array to text conversion and JSON parsing
  - Implement packet validation for required fields
  - Add error handling for malformed packets
  - _Requirements: 3.1, 3.2, 3.3, 7.1_

- [ ] 7.1 Write property test for JSON parsing




  - **Property 2: JSON packet parsing round-trip**
  - **Validates: Requirements 3.1, 3.2, 3.3, 7.1**

- [ ] 8. Implement web dashboard live data display



  - Create LiveDataPanel class for real-time sensor value display
  - Add DOM manipulation for updating ax, ay, az, gx, gy, gz, and timestamp
  - Implement data formatting and display styling
  - Add error indicators for invalid or missing data
  - _Requirements: 3.4_



- [ ] 8.1 Write property test for live data updates



  - **Property 3: Live data panel updates**

  - **Validates: Requirements 3.4**

- [ ] 9. Implement web dashboard chart visualization

  - Create ChartManager class using Chart.js for real-time streaming


  - Set up accelerometer chart with three datasets (ax, ay, az)
  - Set up gyroscope chart with three datasets (gx, gy, gz)


  - Implement data point addition and chart updating with requestAnimationFrame
  - _Requirements: 4.1, 4.2, 4.4, 4.5, 7.2_

- [ ] 9.1 Write property test for chart data consistency




  - **Property 4: Chart data consistency**
  - **Validates: Requirements 4.1, 4.2**

- [ ] 9.2 Write unit tests for chart setup




  - Test accelerometer chart has three distinct datasets
  - Test gyroscope chart has three distinct datasets
  - Test requestAnimationFrame usage for smooth updates
  - _Requirements: 4.4, 4.5, 7.2_

- [ ] 10. Implement web dashboard error handling and edge cases

  - Add browser compatibility detection for Web Bluetooth support
  - Implement connection failure and disconnection handling
  - Add graceful error handling for packet parsing failures
  - Create user-friendly error messages and recovery options
  - _Requirements: 2.3, 2.4, 3.5_

- [ ] 10.1 Write unit tests for error handling


  - Test Web Bluetooth support detection
  - Test connection failure error messages
  - Test packet parsing error recovery
  - _Requirements: 2.3, 2.4, 3.5_

- [ ] 11. Integrate web dashboard components and main application flow

  - Create UIController class to coordinate all components
  - Implement main application initialization and event handling
  - Add async/await patterns for BLE operations
  - Connect data flow from BLE reception to chart updates
  - _Requirements: 7.3_

- [ ] 11.1 Write property test for high-frequency data handling


  - **Property 7: High-frequency data integrity**
  - **Validates: Requirements 7.5**

- [ ] 11.2 Write unit tests for async patterns


  - Test async/await usage in BLE operations
  - Test main application initialization flow
  - Test component integration and data flow
  - _Requirements: 7.3_

- [ ] 12. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Create deployment documentation and instructions

  - Write clear instructions for hosting the web dashboard
  - Document ESP32 firmware upload process
  - Create troubleshooting guide for common issues
  - Add explanation of packet parsing and chart streaming mechanisms
  - _Requirements: All requirements (documentation)_

- [ ] 14. Final integration testing and optimization

  - Test complete end-to-end data flow from ESP32 to web dashboard
  - Verify 50-100 Hz data transmission and visualization performance
  - Test connection establishment, data streaming, and error recovery
  - Optimize performance for smooth real-time operation
  - _Requirements: 4.3, 6.5, 7.4_

- [ ] 15. Final Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.