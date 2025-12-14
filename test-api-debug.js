// Debug test to identify the exact issue
const fetch = require('node-fetch');

async function debugApiIssue() {
  const testId = Math.random().toString(36).slice(2, 8);
  console.log(`🔍 [${testId}] Debugging API issue...`);
  
  // Test 1: Minimal data (should work)
  console.log(`\n🧪 [${testId}] TEST 1: Minimal data`);
  await testWithData(testId + '-min', createMinimalData());
  
  // Test 2: Medium data (10 points)
  console.log(`\n🧪 [${testId}] TEST 2: Medium data (10 points)`);
  await testWithData(testId + '-med', createMediumData());
  
  // Test 3: Large data (34 points like app)
  console.log(`\n🧪 [${testId}] TEST 3: Large data (34 points)`);
  await testWithData(testId + '-large', createLargeData());
  
  // Test 4: Very large data (100 points)
  console.log(`\n🧪 [${testId}] TEST 4: Very large data (100 points)`);
  await testWithData(testId + '-xl', createVeryLargeData());
}

function createMinimalData() {
  return {
    metadata: {
      title: "Test IMU Data",
      description: "Minimal test data"
    },
    sensorData: {
      dataPoints: [{
        timestamp: Date.now(),
        accelerometer: { x: 1.0, y: 0.5, z: -0.2 },
        gyroscope: { x: 0.1, y: -0.3, z: 0.8 }
      }]
    }
  };
}

function createMediumData() {
  const dataPoints = [];
  for (let i = 0; i < 10; i++) {
    dataPoints.push({
      timestamp: Date.now() + i * 100,
      accelerometer: {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1
      },
      gyroscope: {
        x: Math.random() * 360 - 180,
        y: Math.random() * 360 - 180,
        z: Math.random() * 360 - 180
      },
      raw: {
        ax: Math.random() * 4096,
        ay: Math.random() * 4096,
        az: Math.random() * 4096,
        gx: Math.random() * 4096,
        gy: Math.random() * 4096,
        gz: Math.random() * 4096
      }
    });
  }
  
  return {
    metadata: {
      title: "Kinetic IMU Data Collection",
      description: "Medium test data with 10 points",
      collectionInfo: {
        startTime: Date.now() - 5000,
        endTime: Date.now(),
        duration: 5000,
        durationSeconds: 5,
        totalDataPoints: dataPoints.length,
        deviceType: 'ESP32C3_MPU6050',
        dataType: 'IMU Sensor Data'
      }
    },
    sensorData: {
      dataPoints: dataPoints,
      summary: {
        totalPoints: dataPoints.length
      }
    }
  };
}

function createLargeData() {
  const dataPoints = [];
  for (let i = 0; i < 34; i++) {
    dataPoints.push({
      timestamp: Date.now() + i * 100,
      accelerometer: {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1
      },
      gyroscope: {
        x: Math.random() * 360 - 180,
        y: Math.random() * 360 - 180,
        z: Math.random() * 360 - 180
      },
      raw: {
        ax: Math.random() * 4096,
        ay: Math.random() * 4096,
        az: Math.random() * 4096,
        gx: Math.random() * 4096,
        gy: Math.random() * 4096,
        gz: Math.random() * 4096
      }
    });
  }
  
  return {
    metadata: {
      title: "Kinetic IMU Data Collection",
      description: `IMU sensor data collected over 15 seconds from Kinetic device`,
      collectionInfo: {
        startTime: Date.now() - 15000,
        endTime: Date.now(),
        duration: 15000,
        durationSeconds: 15,
        totalDataPoints: dataPoints.length,
        deviceType: 'ESP32C3_MPU6050',
        dataType: 'IMU Sensor Data'
      },
      walletInfo: {
        address: '0x1234567890123456789012345678901234567890',
        connected: true
      },
      exportedAt: new Date().toISOString(),
      exportId: 'test-export'
    },
    sensorData: {
      dataPoints: dataPoints,
      summary: {
        totalPoints: dataPoints.length,
        avgAcceleration: {
          x: dataPoints.reduce((sum, p) => sum + p.accelerometer.x, 0) / dataPoints.length,
          y: dataPoints.reduce((sum, p) => sum + p.accelerometer.y, 0) / dataPoints.length,
          z: dataPoints.reduce((sum, p) => sum + p.accelerometer.z, 0) / dataPoints.length
        },
        avgGyroscope: {
          x: dataPoints.reduce((sum, p) => sum + p.gyroscope.x, 0) / dataPoints.length,
          y: dataPoints.reduce((sum, p) => sum + p.gyroscope.y, 0) / dataPoints.length,
          z: dataPoints.reduce((sum, p) => sum + p.gyroscope.z, 0) / dataPoints.length
        }
      }
    }
  };
}

function createVeryLargeData() {
  const dataPoints = [];
  for (let i = 0; i < 100; i++) {
    dataPoints.push({
      timestamp: Date.now() + i * 100,
      accelerometer: {
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1
      },
      gyroscope: {
        x: Math.random() * 360 - 180,
        y: Math.random() * 360 - 180,
        z: Math.random() * 360 - 180
      },
      raw: {
        ax: Math.random() * 4096,
        ay: Math.random() * 4096,
        az: Math.random() * 4096,
        gx: Math.random() * 4096,
        gy: Math.random() * 4096,
        gz: Math.random() * 4096
      }
    });
  }
  
  return {
    metadata: {
      title: "Kinetic IMU Data Collection - Large Dataset",
      description: `Large IMU sensor data collected over 45 seconds from Kinetic device`,
      collectionInfo: {
        startTime: Date.now() - 45000,
        endTime: Date.now(),
        duration: 45000,
        durationSeconds: 45,
        totalDataPoints: dataPoints.length,
        deviceType: 'ESP32C3_MPU6050',
        dataType: 'IMU Sensor Data'
      },
      walletInfo: {
        address: '0x1234567890123456789012345678901234567890',
        connected: true
      },
      exportedAt: new Date().toISOString(),
      exportId: 'test-large-export'
    },
    sensorData: {
      dataPoints: dataPoints,
      summary: {
        totalPoints: dataPoints.length,
        avgAcceleration: {
          x: dataPoints.reduce((sum, p) => sum + p.accelerometer.x, 0) / dataPoints.length,
          y: dataPoints.reduce((sum, p) => sum + p.accelerometer.y, 0) / dataPoints.length,
          z: dataPoints.reduce((sum, p) => sum + p.accelerometer.z, 0) / dataPoints.length
        },
        avgGyroscope: {
          x: dataPoints.reduce((sum, p) => sum + p.gyroscope.x, 0) / dataPoints.length,
          y: dataPoints.reduce((sum, p) => sum + p.gyroscope.y, 0) / dataPoints.length,
          z: dataPoints.reduce((sum, p) => sum + p.gyroscope.z, 0) / dataPoints.length
        }
      }
    }
  };
}

async function testWithData(testId, data) {
  const jsonContent = JSON.stringify(data, null, 2);
  const base64Data = Buffer.from(jsonContent).toString('base64');
  
  console.log(`📊 [${testId}] Data size:`, {
    dataPoints: data.sensorData?.dataPoints?.length || 0,
    jsonSizeKB: (jsonContent.length / 1024).toFixed(2),
    base64SizeKB: (base64Data.length / 1024).toFixed(2)
  });
  
  const prepareMintRequest = {
    userAddress: '0x1234567890123456789012345678901234567890',
    filePath: `./test-data-${testId}.json`,
    fileData: base64Data,
    filename: `test-data-${testId}.json`,
    contentType: 'application/json'
  };
  
  try {
    const response = await fetch('https://surreal-base.vercel.app/api/cli/mint-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Kinetic-Debug-Test/1.0'
      },
      body: JSON.stringify(prepareMintRequest)
    });
    
    if (response.ok) {
      console.log(`✅ [${testId}] SUCCESS - Status: ${response.status}`);
    } else {
      const errorText = await response.text();
      console.error(`❌ [${testId}] FAILED - Status: ${response.status}`);
      console.error(`❌ [${testId}] Error:`, errorText.substring(0, 200));
    }
    
  } catch (error) {
    console.error(`❌ [${testId}] Network error:`, error.message);
  }
}

// Run the debug tests
debugApiIssue().catch(console.error);