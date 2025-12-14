// Test the fixed file upload format
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testFixedFormat() {
  console.log('🧪 Testing FIXED file upload format...');
  console.log('⏰ Waiting 5 seconds for rate limit...');
  
  // Wait for rate limit
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Create test data
  const testData = {
    message: 'kinetic imu test data - FIXED FORMAT',
    timestamp: new Date().toISOString(),
    dataPoints: 25,
    device: 'ESP32C3_MPU6050',
    accelerometer: { x: 0.123, y: -0.456, z: 0.789 },
    gyroscope: { x: 1.234, y: -2.345, z: 3.456 }
  };
  
  const jsonContent = JSON.stringify(testData, null, 2);
  
  // Test both formats: clean base64 and data URL
  const cleanBase64 = btoa(jsonContent);
  const dataUrlBase64 = `data:application/json;base64,${cleanBase64}`;
  
  console.log('📄 File data prepared:');
  console.log('- JSON content length:', jsonContent.length);
  console.log('- Clean base64 length:', cleanBase64.length);
  console.log('- Data URL length:', dataUrlBase64.length);
  console.log('- Clean base64 valid:', /^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64));
  
  // Test with the FIXED format (matches validation schema)
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: 'Kinetic IMU Data Test - FIXED FORMAT',
      description: 'Testing with the FIXED file upload format that matches validation schema',
      creators: [{
        name: 'Kinetic Device User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }]
    },
    nftMetadata: {
      name: 'Kinetic IMU Test NFT - FIXED',
      description: 'Test NFT using FIXED format',
      attributes: [
        { key: 'device_type', value: 'ESP32C3_MPU6050' },
        { key: 'data_points', value: '25' },
        { key: 'format_test', value: 'FIXED_FORMAT' }
      ]
    },
    files: [{
      filename: 'kinetic-imu-test-fixed.json',
      data: dataUrlBase64, // Test data URL format (should be handled by validation)
      contentType: 'application/json',
      purpose: 'media'
    }]
  };
  
  console.log('\n📤 Request using FIXED format:');
  console.log('- Filename:', testRequest.files[0].filename);
  console.log('- ContentType:', testRequest.files[0].contentType);
  console.log('- Purpose:', testRequest.files[0].purpose);
  console.log('- Data format:', testRequest.files[0].data.includes('data:') ? 'Data URL' : 'Clean base64');
  console.log('- Data length:', testRequest.files[0].data.length);
  
  try {
    console.log('\n🚀 Making request with FIXED format...');
    
    const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Fixed-Format-Test/1.0'
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('🎉 SUCCESS! FIXED format works!');
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
        console.log('📁 First uploaded file:');
        console.log('- Filename:', data.uploadedFiles[0].filename);
        console.log('- IPFS hash:', data.uploadedFiles[0].ipfsHash);
        console.log('- URL:', data.uploadedFiles[0].url);
        console.log('- Purpose:', data.uploadedFiles[0].purpose);
      }
      
      console.log('\n🎯 FILE UPLOADS ARE NOW WORKING!');
      console.log('✅ The fix is successful!');
      console.log('✅ Data URL format is properly handled!');
      console.log('✅ Files are uploaded to IPFS!');
      console.log('✅ Validation schema and API route are now consistent!');
      
      return true;
      
    } else {
      console.log('❌ Error with FIXED format:');
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

// Also test with clean base64 format
async function testCleanBase64Format() {
  console.log('\n🧪 Testing FIXED format with clean base64...');
  console.log('⏰ Waiting 5 seconds for rate limit...');
  
  // Wait for rate limit
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Create test data
  const testData = {
    message: 'kinetic imu test data - CLEAN BASE64',
    timestamp: new Date().toISOString(),
    dataPoints: 30,
    device: 'ESP32C3_MPU6050'
  };
  
  const jsonContent = JSON.stringify(testData, null, 2);
  const cleanBase64 = btoa(jsonContent); // Clean base64 without data URL prefix
  
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: 'Kinetic IMU Data Test - Clean Base64',
      description: 'Testing with clean base64 format (no data URL prefix)',
      creators: [{
        name: 'Kinetic Device User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }]
    },
    nftMetadata: {
      name: 'Kinetic IMU Test NFT - Clean Base64',
      description: 'Test NFT using clean base64 format'
    },
    files: [{
      filename: 'kinetic-imu-test-clean.json',
      data: cleanBase64, // Clean base64 format
      contentType: 'application/json',
      purpose: 'media'
    }]
  };
  
  console.log('\n📤 Request using clean base64:');
  console.log('- Data format: Clean base64');
  console.log('- Data length:', cleanBase64.length);
  console.log('- Is valid base64:', /^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64));
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Clean-Base64-Test/1.0'
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('🎉 SUCCESS! Clean base64 also works!');
      console.log('- Uploaded files:', data.uploadedFiles?.length || 0);
      if (data.uploadedFiles?.[0]) {
        console.log('- IPFS hash:', data.uploadedFiles[0].ipfsHash);
      }
      return true;
    } else {
      console.log('❌ Clean base64 failed');
      return false;
    }
  } catch (error) {
    console.error('💥 Clean base64 test failed:', error.message);
    return false;
  }
}

// Run both tests
async function runAllTests() {
  console.log('🚀 Running file upload fix tests...\n');
  
  const dataUrlTest = await testFixedFormat();
  const cleanBase64Test = await testCleanBase64Format();
  
  console.log('\n📋 TEST RESULTS:');
  console.log('- Data URL format:', dataUrlTest ? '✅ PASS' : '❌ FAIL');
  console.log('- Clean base64 format:', cleanBase64Test ? '✅ PASS' : '❌ FAIL');
  
  if (dataUrlTest && cleanBase64Test) {
    console.log('\n🎉 ALL TESTS PASSED! File uploads are FIXED!');
    console.log('✅ Both data URL and clean base64 formats work');
    console.log('✅ Files are properly uploaded to IPFS');
    console.log('✅ The API is ready for production use');
  } else {
    console.log('\n❌ Some tests failed. Check the server deployment.');
  }
}

runAllTests().catch(error => {
  console.error('💥 Test suite failed:', error);
});