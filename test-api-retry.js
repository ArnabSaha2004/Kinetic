// Test API with retry logic like the app should have
const fetch = require('node-fetch');

async function testApiWithRetry() {
  const testId = Math.random().toString(36).slice(2, 8);
  console.log(`🔄 [${testId}] Testing API with retry logic...`);
  
  // Create test data similar to app
  const testData = {
    metadata: {
      title: "Kinetic IMU Data Collection",
      description: "Test data with retry logic",
      collectionInfo: {
        startTime: Date.now() - 15000,
        endTime: Date.now(),
        duration: 15000,
        durationSeconds: 15,
        totalDataPoints: 34,
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
      dataPoints: Array.from({length: 34}, (_, i) => ({
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
      }))
    }
  };
  
  const jsonContent = JSON.stringify(testData, null, 2);
  const base64Data = Buffer.from(jsonContent).toString('base64');
  
  const prepareMintRequest = {
    userAddress: '0x1234567890123456789012345678901234567890',
    filePath: `./kinetic-imu-data-${Date.now()}.json`,
    fileData: base64Data,
    filename: `kinetic-imu-data-${Date.now()}.json`,
    contentType: 'application/json'
  };
  
  console.log(`📊 [${testId}] Request prepared:`, {
    dataPoints: testData.sensorData.dataPoints.length,
    sizeKB: (JSON.stringify(prepareMintRequest).length / 1024).toFixed(2)
  });
  
  // Retry logic similar to what the app should have
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    attempt++;
    console.log(`🔄 [${testId}] Attempt ${attempt}/${maxRetries}...`);
    
    try {
      const response = await fetch('https://surreal-base.vercel.app/api/cli/mint-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Kinetic-Retry-Test/1.0'
        },
        body: JSON.stringify(prepareMintRequest)
      });
      
      console.log(`🌐 [${testId}] Response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log(`✅ [${testId}] SUCCESS on attempt ${attempt}!`);
        console.log(`🎉 [${testId}] Transaction prepared:`, {
          to: responseData.transaction?.to,
          hasData: !!responseData.transaction?.data
        });
        console.log(`📁 [${testId}] Files uploaded:`, responseData.uploadedFiles?.length || 0);
        return; // Success, exit retry loop
        
      } else {
        const errorText = await response.text();
        console.error(`❌ [${testId}] Attempt ${attempt} failed: ${response.status}`);
        
        try {
          const errorData = JSON.parse(errorText);
          console.error(`❌ [${testId}] Error details:`, {
            code: errorData.error?.code,
            message: errorData.error?.message,
            retryable: errorData.error?.retryable
          });
          
          // Check if error is retryable
          if (errorData.error?.retryable && attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
            console.log(`🔄 [${testId}] Retryable error, waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry
          } else {
            console.error(`❌ [${testId}] Non-retryable error or max retries reached`);
            break;
          }
          
        } catch (parseError) {
          console.error(`❌ [${testId}] Could not parse error response`);
          if (attempt < maxRetries) {
            console.log(`🔄 [${testId}] Retrying due to parse error...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
      }
      
    } catch (networkError) {
      console.error(`❌ [${testId}] Network error on attempt ${attempt}:`, networkError.message);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`🔄 [${testId}] Network error, waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }
  
  console.error(`❌ [${testId}] All ${maxRetries} attempts failed`);
}

// Run multiple tests to check for intermittent issues
async function runMultipleTests() {
  console.log('🧪 Running multiple API tests to check for intermittent issues...\n');
  
  for (let i = 1; i <= 5; i++) {
    console.log(`\n--- Test ${i}/5 ---`);
    await testApiWithRetry();
    
    if (i < 5) {
      console.log('⏳ Waiting 2 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🏁 All tests completed');
}

runMultipleTests().catch(console.error);