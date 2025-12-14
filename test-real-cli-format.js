// Test using the REAL CLI format and endpoint
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testRealCLIFormat() {
  console.log('🧪 Testing REAL CLI format (/api/cli/mint-file)...');
  console.log('⏰ Waiting 5 seconds for rate limit...');
  
  // Wait for rate limit
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Create test data
  const testData = {
    message: 'kinetic imu test data - REAL CLI FORMAT',
    timestamp: new Date().toISOString(),
    dataPoints: 25,
    device: 'ESP32C3_MPU6050',
    accelerometer: { x: 0.123, y: -0.456, z: 0.789 },
    gyroscope: { x: 1.234, y: -2.345, z: 3.456 }
  };
  
  const jsonContent = JSON.stringify(testData, null, 2);
  const base64Data = btoa(jsonContent);
  
  console.log('📄 File data prepared:');
  console.log('- JSON content length:', jsonContent.length);
  console.log('- Base64 length:', base64Data.length);
  
  // Use the EXACT CLI format for /api/cli/mint-file
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    filePath: './kinetic-imu-test-real-cli.json', // CLI sends file path
    fileData: base64Data, // Base64 encoded file content
    filename: 'kinetic-imu-test-real-cli.json',
    contentType: 'application/json',
    title: 'Kinetic IMU Data Test - Real CLI Format',
    description: 'Testing with the real CLI format using /api/cli/mint-file endpoint',
    generateMetadata: false // CLI controls metadata generation
  };
  
  console.log('\n📤 Request using REAL CLI format:');
  console.log('- Endpoint: /api/cli/mint-file');
  console.log('- User address:', testRequest.userAddress);
  console.log('- File path:', testRequest.filePath);
  console.log('- Filename:', testRequest.filename);
  console.log('- Content type:', testRequest.contentType);
  console.log('- Title:', testRequest.title);
  console.log('- Has file data:', !!testRequest.fileData);
  console.log('- File data length:', testRequest.fileData.length);
  
  try {
    console.log('\n🚀 Making request to CLI endpoint...');
    
    const response = await fetch(`${API_BASE_URL}/api/cli/mint-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Real-CLI-Format-Test/1.0'
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('🎉 SUCCESS! REAL CLI format works!');
      const data = JSON.parse(responseText);
      
      console.log('✅ Response Summary:');
      console.log('- Success:', data.success);
      console.log('- Has transaction:', !!data.transaction);
      console.log('- Transaction to:', data.transaction?.to);
      console.log('- Gas estimate:', data.transaction?.gasEstimate);
      console.log('- Has metadata:', !!data.metadata);
      console.log('- IPFS hash:', data.metadata?.ipfsHash);
      console.log('- Additional data keys:', Object.keys(data.additionalData || {}));
      
      if (data.additionalData) {
        console.log('📁 File upload info:');
        console.log('- Content hash:', data.additionalData.contentHash);
        console.log('- File size:', data.additionalData.fileSize);
        console.log('- IPFS URL:', data.additionalData.ipfsUrl);
      }
      
      console.log('\n🎯 PERFECT! This is the REAL working format!');
      console.log('✅ Use /api/cli/mint-file endpoint');
      console.log('✅ Include filePath, fileData, filename, contentType');
      console.log('✅ File is uploaded to IPFS successfully');
      console.log('✅ This is what your useDataMinting hook should use!');
      
      return true;
      
    } else {
      console.log('❌ Error with REAL CLI format:');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error code:', errorData.error?.code);
        console.log('Error message:', errorData.error?.message);
        if (errorData.error?.details) {
          console.log('Error details:', JSON.stringify(errorData.error.details, null, 2));
        }
      } catch {
        console.log('Raw error:', responseText);
      }
      return false;
    }
    
  } catch (error) {
    console.error('💥 Request failed:', error.message);
    return false;
  }
}

testRealCLIFormat().then(success => {
  if (success) {
    console.log('\n🎉 FOUND THE REAL WORKING FORMAT!');
    console.log('📝 Update your useDataMinting hook to use:');
    console.log('- Endpoint: /api/cli/mint-file');
    console.log('- Format: { userAddress, filePath, fileData, filename, contentType, title, description }');
    console.log('✅ File uploads will work perfectly with this format!');
  } else {
    console.log('\n❌ Still investigating the CLI format.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});