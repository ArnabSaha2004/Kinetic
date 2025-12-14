// Test API with the exact same format as the app
const fetch = require('node-fetch');

async function testApiWithAppFormat() {
  const testId = Math.random().toString(36).slice(2, 8);
  console.log(`🧪 [${testId}] Testing API with app-like data format...`);
  
  // Create data similar to what the app generates (34 data points like in the error)
  const collectedData = [];
  for (let i = 0; i < 34; i++) {
    collectedData.push({
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
  
  // Create the exact same data structure as the app
  const exportData = {
    metadata: {
      title: `Kinetic IMU Data Collection`,
      description: `IMU sensor data collected over 15 seconds from Kinetic device`,
      collectionInfo: {
        startTime: Date.now() - 15000,
        endTime: Date.now(),
        duration: 15000,
        durationSeconds: 15,
        totalDataPoints: collectedData.length,
        deviceType: 'ESP32C3_MPU6050',
        dataType: 'IMU Sensor Data'
      },
      walletInfo: {
        address: '0x1234567890123456789012345678901234567890',
        connected: true
      },
      exportedAt: new Date().toISOString(),
      exportId: testId
    },
    sensorData: {
      dataPoints: collectedData,
      summary: {
        totalPoints: collectedData.length,
        avgAcceleration: {
          x: collectedData.reduce((sum, p) => sum + p.accelerometer.x, 0) / collectedData.length,
          y: collectedData.reduce((sum, p) => sum + p.accelerometer.y, 0) / collectedData.length,
          z: collectedData.reduce((sum, p) => sum + p.accelerometer.z, 0) / collectedData.length
        },
        avgGyroscope: {
          x: collectedData.reduce((sum, p) => sum + p.gyroscope.x, 0) / collectedData.length,
          y: collectedData.reduce((sum, p) => sum + p.gyroscope.y, 0) / collectedData.length,
          z: collectedData.reduce((sum, p) => sum + p.gyroscope.z, 0) / collectedData.length
        }
      }
    }
  };
  
  const jsonContent = JSON.stringify(exportData, null, 2);
  const base64Data = Buffer.from(jsonContent).toString('base64');
  
  console.log(`📁 [${testId}] App-like data prepared:`, {
    dataPoints: collectedData.length,
    originalSize: jsonContent.length,
    base64Size: base64Data.length,
    sizeKB: (jsonContent.length / 1024).toFixed(2)
  });
  
  // Use the exact same request format as the app
  const prepareMintRequest = {
    userAddress: '0x1234567890123456789012345678901234567890',
    filePath: `./kinetic-imu-data-${Date.now()}.json`,
    fileData: base64Data,
    filename: `kinetic-imu-data-${Date.now()}.json`,
    contentType: 'application/json'
  };
  
  console.log(`🌐 [${testId}] Request prepared (app format):`, {
    userAddress: prepareMintRequest.userAddress,
    filename: prepareMintRequest.filename,
    contentType: prepareMintRequest.contentType,
    fileDataLength: prepareMintRequest.fileData.length,
    requestSizeKB: (JSON.stringify(prepareMintRequest).length / 1024).toFixed(2)
  });
  
  try {
    console.log(`🌐 [${testId}] Making API call...`);
    
    const response = await fetch('https://surreal-base.vercel.app/api/cli/mint-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Kinetic-IMU-App/1.0'
      },
      body: JSON.stringify(prepareMintRequest)
    });
    
    console.log(`🌐 [${testId}] Response:`, {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type')
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      const responseData = JSON.parse(responseText);
      console.log(`✅ [${testId}] SUCCESS with app-like data!`);
      console.log(`🎉 [${testId}] Transaction:`, {
        to: responseData.transaction?.to,
        value: responseData.transaction?.value,
        hasData: !!responseData.transaction?.data
      });
      console.log(`📁 [${testId}] Files uploaded:`, responseData.uploadedFiles?.length || 0);
    } else {
      console.error(`❌ [${testId}] FAILED with app-like data:`, {
        status: response.status,
        response: responseText.substring(0, 500)
      });
      
      try {
        const errorData = JSON.parse(responseText);
        console.error(`❌ [${testId}] Error details:`, errorData.error);
      } catch (e) {
        console.error(`❌ [${testId}] Could not parse error response`);
      }
    }
    
  } catch (error) {
    console.error(`❌ [${testId}] Network error:`, error.message);
  }
}

// Run the test
testApiWithAppFormat().catch(console.error);