// Direct API test for Universal Minting Engine
const fetch = require('node-fetch');

async function testApiDirect() {
  const testId = Math.random().toString(36).slice(2, 8);
  console.log(`🧪 [${testId}] Testing API directly...`);
  
  // Create minimal test data
  const testData = {
    metadata: {
      title: "Test IMU Data",
      description: "Test data for API validation",
      timestamp: new Date().toISOString()
    },
    sensorData: {
      dataPoints: [
        {
          timestamp: Date.now(),
          accelerometer: { x: 1.0, y: 0.5, z: -0.2 },
          gyroscope: { x: 0.1, y: -0.3, z: 0.8 }
        }
      ]
    }
  };
  
  const jsonContent = JSON.stringify(testData, null, 2);
  const base64Data = Buffer.from(jsonContent).toString('base64');
  
  console.log(`📁 [${testId}] Test file prepared:`, {
    originalSize: jsonContent.length,
    base64Size: base64Data.length,
    dataPreview: jsonContent.substring(0, 100) + '...'
  });
  
  // Prepare CLI format request
  const prepareMintRequest = {
    userAddress: '0x1234567890123456789012345678901234567890', // Test address
    filePath: `./test-imu-data-${Date.now()}.json`,
    fileData: base64Data,
    filename: `test-imu-data-${Date.now()}.json`,
    contentType: 'application/json'
  };
  
  console.log(`🌐 [${testId}] API request prepared:`, {
    userAddress: prepareMintRequest.userAddress,
    filename: prepareMintRequest.filename,
    contentType: prepareMintRequest.contentType,
    fileDataLength: prepareMintRequest.fileData.length,
    requestSize: JSON.stringify(prepareMintRequest).length
  });
  
  try {
    console.log(`🌐 [${testId}] Making API call to: https://surreal-base.vercel.app/api/cli/mint-file`);
    
    const response = await fetch('https://surreal-base.vercel.app/api/cli/mint-file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Kinetic-API-Test/1.0'
      },
      body: JSON.stringify(prepareMintRequest)
    });
    
    console.log(`🌐 [${testId}] Response received:`, {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });
    
    const responseText = await response.text();
    console.log(`🌐 [${testId}] Raw response:`, responseText);
    
    if (response.ok) {
      try {
        const responseData = JSON.parse(responseText);
        console.log(`✅ [${testId}] API SUCCESS:`, responseData);
        
        if (responseData.success && responseData.transaction) {
          console.log(`🎉 [${testId}] Transaction prepared successfully:`, {
            to: responseData.transaction.to,
            value: responseData.transaction.value,
            hasData: !!responseData.transaction.data
          });
        }
        
        if (responseData.uploadedFiles && responseData.uploadedFiles.length > 0) {
          console.log(`📁 [${testId}] Files uploaded:`, responseData.uploadedFiles.map(f => ({
            filename: f.filename,
            ipfsHash: f.ipfsHash
          })));
        }
        
      } catch (parseError) {
        console.error(`❌ [${testId}] Failed to parse successful response:`, parseError);
      }
    } else {
      console.error(`❌ [${testId}] API ERROR:`, {
        status: response.status,
        statusText: response.statusText,
        response: responseText
      });
      
      try {
        const errorData = JSON.parse(responseText);
        console.error(`❌ [${testId}] Parsed error:`, errorData);
        
        if (errorData.error) {
          console.error(`❌ [${testId}] Error details:`, {
            code: errorData.error.code,
            message: errorData.error.message,
            retryable: errorData.error.retryable,
            details: errorData.error.details
          });
        }
      } catch (parseError) {
        console.error(`❌ [${testId}] Could not parse error response`);
      }
    }
    
  } catch (networkError) {
    console.error(`❌ [${testId}] Network error:`, {
      message: networkError.message,
      code: networkError.code,
      type: networkError.type
    });
  }
  
  console.log(`🏁 [${testId}] API test completed`);
}

// Run the test
testApiDirect().catch(console.error);