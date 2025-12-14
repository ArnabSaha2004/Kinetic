// Test using the exact format that storylite CLI uses
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testCLIFormat() {
  console.log('🧪 Testing CLI format (matches storylite CLI exactly)...');
  console.log('⏰ Waiting 5 seconds for rate limit...');
  
  // Wait for rate limit
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Create test data exactly like CLI would
  const testData = {
    message: 'kinetic imu test data - CLI FORMAT',
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
  
  // Use the EXACT same format as storylite CLI (no files array!)
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipTitle: 'Kinetic IMU Data Test - CLI Format',
    nftName: 'Kinetic IMU Test NFT - CLI Format',
    filename: 'kinetic-imu-test-cli.json',
    contentType: 'application/json',
    fileDataLength: jsonContent.length,
    hasCustomMetadata: false,
    // The CLI likely sends the actual file data in a different field
    // Let me check what other fields it might send...
    fileData: base64Data // This might be how CLI sends the actual file content
  };
  
  console.log('\n📤 Request using CLI format:');
  console.log('- User address:', testRequest.userAddress);
  console.log('- IP title:', testRequest.ipTitle);
  console.log('- NFT name:', testRequest.nftName);
  console.log('- Filename:', testRequest.filename);
  console.log('- Content type:', testRequest.contentType);
  console.log('- File data length:', testRequest.fileDataLength);
  console.log('- Has file data:', !!testRequest.fileData);
  console.log('- Has files array:', !!testRequest.files);
  
  try {
    console.log('\n🚀 Making request with CLI format...');
    
    const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'CLI-Format-Test/1.0'
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('🎉 SUCCESS! CLI format works!');
      const data = JSON.parse(responseText);
      
      console.log('✅ Response Summary:');
      console.log('- Success:', data.success);
      console.log('- Has transaction:', !!data.transaction);
      console.log('- Transaction to:', data.transaction?.to);
      console.log('- Gas estimate:', data.transaction?.gasEstimate);
      console.log('- Has metadata:', !!data.metadata);
      console.log('- IPFS hash:', data.metadata?.ipfsHash);
      console.log('- Uploaded files:', data.uploadedFiles?.length || 0);
      
      console.log('\n🎯 CLI format works! This is the format your app should use.');
      console.log('✅ No files array needed - send file data directly in request');
      console.log('✅ Use ipTitle, nftName, filename, contentType, fileData fields');
      
      return true;
      
    } else {
      console.log('❌ Error with CLI format:');
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

testCLIFormat().then(success => {
  if (success) {
    console.log('\n🎉 CLI format confirmed! Use this format in your app.');
    console.log('📝 Update useDataMinting to use CLI format instead of files array.');
  } else {
    console.log('\n❌ CLI format test failed. Need to investigate further.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});