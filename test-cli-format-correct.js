// Test using the correct CLI format based on storylite CLI analysis
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testCorrectCLIFormat() {
  console.log('🧪 Testing CORRECT CLI format...');
  console.log('⏰ Waiting 5 seconds for rate limit...');
  
  // Wait for rate limit
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Create test data
  const testData = {
    message: 'kinetic imu test data - CORRECT CLI FORMAT',
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
  
  // Based on CLI analysis, it seems to send both metadata AND file data
  // Let me try the format that includes both ipMetadata/nftMetadata AND file fields
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    
    // Required metadata objects (like the working format)
    ipMetadata: {
      title: 'Kinetic IMU Data Test - Correct CLI Format',
      description: 'Testing with the correct CLI format that includes both metadata and file data',
      creators: [{
        name: 'Kinetic Device User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }]
    },
    nftMetadata: {
      name: 'Kinetic IMU Test NFT - Correct CLI',
      description: 'Test NFT using correct CLI format'
    },
    
    // CLI-style file fields (based on verbose output)
    filename: 'kinetic-imu-test-cli.json',
    contentType: 'application/json',
    fileDataLength: jsonContent.length,
    fileData: base64Data, // The actual file content in base64
    
    // Additional CLI fields
    hasCustomMetadata: false
  };
  
  console.log('\n📤 Request using CORRECT CLI format:');
  console.log('- Has ipMetadata:', !!testRequest.ipMetadata);
  console.log('- Has nftMetadata:', !!testRequest.nftMetadata);
  console.log('- Filename:', testRequest.filename);
  console.log('- Content type:', testRequest.contentType);
  console.log('- File data length:', testRequest.fileDataLength);
  console.log('- Has file data:', !!testRequest.fileData);
  console.log('- Has files array:', !!testRequest.files);
  
  try {
    console.log('\n🚀 Making request with CORRECT CLI format...');
    
    const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Correct-CLI-Format-Test/1.0'
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('🎉 SUCCESS! CORRECT CLI format works!');
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
        console.log('📁 Uploaded file:');
        console.log('- Filename:', data.uploadedFiles[0].filename);
        console.log('- IPFS hash:', data.uploadedFiles[0].ipfsHash);
        console.log('- URL:', data.uploadedFiles[0].url);
      }
      
      console.log('\n🎯 PERFECT! This is the correct format for file uploads!');
      console.log('✅ Use metadata objects + individual file fields');
      console.log('✅ No files array needed');
      console.log('✅ File data is uploaded to IPFS successfully');
      
      return true;
      
    } else {
      console.log('❌ Error with CORRECT CLI format:');
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

testCorrectCLIFormat().then(success => {
  if (success) {
    console.log('\n🎉 FOUND THE CORRECT FORMAT!');
    console.log('📝 Update your useDataMinting hook to use this format:');
    console.log('- Include ipMetadata and nftMetadata objects');
    console.log('- Add filename, contentType, fileDataLength, fileData fields');
    console.log('- Remove the files array');
    console.log('✅ File uploads will work with this format!');
  } else {
    console.log('\n❌ Still need to find the correct format.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});