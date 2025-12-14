// Test that works with the current deployed API (without files)
// This demonstrates the correct format for when file uploads are fixed
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testWorkingFormat() {
  console.log('🧪 Testing working format (without files due to server issue)...');
  console.log('⏰ Waiting 5 seconds for rate limit...');
  
  // Wait for rate limit
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Create test data (same as what would be in the file)
  const testData = {
    message: 'kinetic imu test data',
    timestamp: new Date().toISOString(),
    dataPoints: 25,
    device: 'ESP32C3_MPU6050',
    accelerometer: { x: 0.123, y: -0.456, z: 0.789 },
    gyroscope: { x: 1.234, y: -2.345, z: 3.456 }
  };
  
  const jsonContent = JSON.stringify(testData, null, 2);
  const base64Data = btoa(jsonContent);
  
  console.log('📄 File data prepared (for future use):');
  console.log('- JSON content length:', jsonContent.length);
  console.log('- Base64 length:', base64Data.length);
  console.log('- Base64 is valid:', /^[A-Za-z0-9+/]*={0,2}$/.test(base64Data));
  
  // Request that works with current deployed API (no files)
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: 'Kinetic IMU Data Test - Working Format',
      description: 'Testing the working format without files due to server-side file processing issue. File data is included in metadata for reference.',
      creators: [{
        name: 'Kinetic Device User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }],
      // Include file data in metadata since file uploads are broken
      fileData: {
        filename: 'kinetic-imu-test.json',
        contentType: 'application/json',
        size: jsonContent.length,
        base64Data: base64Data,
        originalData: testData,
        note: 'File data stored in metadata due to server-side file processing issue'
      }
    },
    nftMetadata: {
      name: 'Kinetic IMU Test NFT - Working Format',
      description: 'Test NFT using working format (no files)',
      attributes: [
        { key: 'device_type', value: 'ESP32C3_MPU6050' },
        { key: 'data_points', value: '25' },
        { key: 'format_test', value: 'working_format' },
        { key: 'file_workaround', value: 'metadata_storage' }
      ]
    }
    // No files array - this is what causes the server error
  };
  
  console.log('\n📤 Request using working format:');
  console.log('- User address:', testRequest.userAddress);
  console.log('- IP title:', testRequest.ipMetadata.title);
  console.log('- NFT name:', testRequest.nftMetadata.name);
  console.log('- Has files array:', !!testRequest.files);
  console.log('- File data in metadata:', !!testRequest.ipMetadata.fileData);
  
  try {
    console.log('\n🚀 Making request with working format...');
    
    const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Working-Format-Test/1.0'
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('🎉 SUCCESS! Working format confirmed!');
      const data = JSON.parse(responseText);
      
      console.log('✅ Response Summary:');
      console.log('- Success:', data.success);
      console.log('- Has transaction:', !!data.transaction);
      console.log('- Transaction to:', data.transaction?.to);
      console.log('- Gas estimate:', data.transaction?.gasEstimate);
      console.log('- Has metadata:', !!data.metadata);
      console.log('- IPFS hash:', data.metadata?.ipfsHash);
      console.log('- Uploaded files:', data.uploadedFiles?.length || 0);
      
      console.log('\n🎯 This format works! Your app should:');
      console.log('1. ✅ Use this format for minting (without files array)');
      console.log('2. ✅ Store file data in metadata as a workaround');
      console.log('3. ⏳ Wait for server-side file processing to be fixed');
      console.log('4. 🔄 Then add files array back when server is fixed');
      
      console.log('\n📋 When server is fixed, add this to the request:');
      console.log('files: [{');
      console.log('  filename: "kinetic-imu-test.json",');
      console.log('  data: "' + base64Data.substring(0, 20) + '...",');
      console.log('  contentType: "application/json",');
      console.log('  purpose: "media"');
      console.log('}]');
      
      return true;
      
    } else {
      console.log('❌ Error with working format:');
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

testWorkingFormat().then(success => {
  if (success) {
    console.log('\n🎉 Working format confirmed! Your app can mint without files.');
    console.log('📝 File data can be stored in metadata as a workaround.');
    console.log('🔧 When server file processing is fixed, add files array back.');
  } else {
    console.log('\n❌ Even the working format failed.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});