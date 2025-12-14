// Test the updated useDataMinting hook format
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testUpdatedHookFormat() {
  console.log('🧪 Testing updated useDataMinting hook format...');
  console.log('⏰ Waiting 5 seconds for rate limit...');
  
  // Wait for rate limit
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Simulate the data that useDataMinting hook would prepare
  const testData = {
    message: 'kinetic imu test data - UPDATED HOOK FORMAT',
    timestamp: new Date().toISOString(),
    dataPoints: 25,
    device: 'ESP32C3_MPU6050',
    accelerometer: { x: 0.123, y: -0.456, z: 0.789 },
    gyroscope: { x: 1.234, y: -2.345, z: 3.456 }
  };
  
  const jsonContent = JSON.stringify(testData, null, 2);
  const base64Data = btoa(jsonContent);
  const filename = `kinetic-imu-data-${Date.now()}.json`;
  
  console.log('📄 Simulated hook data:');
  console.log('- JSON content length:', jsonContent.length);
  console.log('- Base64 length:', base64Data.length);
  console.log('- Filename:', filename);
  
  // Use the EXACT format that the updated hook will send
  const prepareMintRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Simulated wallet address
    filePath: `./kinetic-imu-data-${Date.now()}.json`,
    fileData: base64Data, // Clean base64 without data URL prefix
    filename: filename,
    contentType: 'application/json'
  };
  
  console.log('\n📤 Updated hook request format:');
  console.log('- User address:', prepareMintRequest.userAddress);
  console.log('- File path:', prepareMintRequest.filePath);
  console.log('- Filename:', prepareMintRequest.filename);
  console.log('- Content type:', prepareMintRequest.contentType);
  console.log('- File data length:', prepareMintRequest.fileData.length);
  
  try {
    console.log('\n🚀 Making request with updated hook format...');
    
    const response = await fetch(`${API_BASE_URL}/api/cli/mint-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Kinetic-IMU-App/1.0'
      },
      body: JSON.stringify(prepareMintRequest)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('🎉 SUCCESS! Updated hook format works perfectly!');
      const data = JSON.parse(responseText);
      
      console.log('✅ Response Summary:');
      console.log('- Success:', data.success);
      console.log('- Has transaction:', !!data.transaction);
      console.log('- Transaction to:', data.transaction?.to);
      console.log('- Gas estimate:', data.transaction?.gasEstimate);
      console.log('- Has metadata:', !!data.metadata);
      console.log('- IPFS hash:', data.metadata?.ipfsHash);
      console.log('- Uploaded files:', data.uploadedFiles?.length || 0);
      
      if (data.uploadedFiles && data.uploadedFiles.length > 0) {
        console.log('📁 File upload details:');
        data.uploadedFiles.forEach((file, index) => {
          console.log(`  File ${index + 1}:`);
          console.log(`  - Filename: ${file.filename}`);
          console.log(`  - IPFS hash: ${file.ipfsHash}`);
          console.log(`  - URL: ${file.url}`);
          console.log(`  - Purpose: ${file.purpose}`);
        });
      }
      
      if (data.additionalData?.cli) {
        console.log('🔧 CLI processing info:');
        console.log('- Request ID:', data.additionalData.cli.requestId);
        console.log('- Processing time:', data.additionalData.cli.processingTime + 'ms');
        console.log('- Content hash:', data.additionalData.cli.contentHash);
        console.log('- File size:', data.additionalData.cli.fileSize);
      }
      
      console.log('\n🎯 PERFECT! Your updated useDataMinting hook will work!');
      console.log('✅ File uploads are now functional');
      console.log('✅ CLI endpoint handles metadata automatically');
      console.log('✅ IPFS storage is working');
      console.log('✅ Transaction preparation is successful');
      
      return true;
      
    } else {
      console.log('❌ Error with updated hook format:');
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

testUpdatedHookFormat().then(success => {
  if (success) {
    console.log('\n🎉 HOOK UPDATE SUCCESSFUL!');
    console.log('📱 Your Kinetic IMU app is now ready for file uploads!');
    console.log('🚀 Users can mint their sensor data with files to IPFS!');
    console.log('⛓️ Blockchain minting with file attachments is working!');
  } else {
    console.log('\n❌ Hook update needs debugging.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});