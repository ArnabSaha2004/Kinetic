// Test using the exact format from the demo
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testDemoFormat() {
  console.log('🧪 Testing with Exact Demo Format...');
  console.log('⏰ Waiting 10 seconds for rate limit...');
  
  // Wait for rate limit
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  // Create test data exactly like the demo would
  const testData = {
    message: 'kinetic imu test data',
    timestamp: new Date().toISOString(),
    dataPoints: 25,
    device: 'ESP32C3_MPU6050',
    accelerometer: { x: 0.123, y: -0.456, z: 0.789 },
    gyroscope: { x: 1.234, y: -2.345, z: 3.456 }
  };
  
  const jsonContent = JSON.stringify(testData, null, 2);
  console.log('📄 Test JSON content:', jsonContent);
  
  // Use the exact same method as the demo
  const base64WithPrefix = `data:application/json;base64,${btoa(jsonContent)}`;
  const base64Data = base64WithPrefix.split(',')[1]; // Extract just the base64 part
  
  console.log('📄 Base64 processing:');
  console.log('- With prefix length:', base64WithPrefix.length);
  console.log('- Extracted length:', base64Data.length);
  console.log('- Starts with data:', base64WithPrefix.startsWith('data:'));
  console.log('- Extracted clean:', !base64Data.includes('data:'));
  console.log('- Preview:', base64Data.substring(0, 50) + '...');
  
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: 'Kinetic IMU Data Test - Demo Format',
      description: 'Testing with exact demo format for file uploads',
      creators: [{
        name: 'Kinetic Device User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }]
    },
    nftMetadata: {
      name: 'Kinetic IMU Test NFT',
      description: 'Test NFT using demo format',
      attributes: [
        { key: 'device_type', value: 'ESP32C3_MPU6050' },
        { key: 'data_points', value: '25' },
        { key: 'format_test', value: 'demo_format' }
      ]
    },
    files: [{
      filename: 'kinetic-imu-test.json',
      data: base64Data,
      contentType: 'application/json',
      purpose: 'media'
    }]
  };
  
  console.log('\n📤 Request using demo format:');
  console.log('- Filename:', testRequest.files[0].filename);
  console.log('- ContentType:', testRequest.files[0].contentType);
  console.log('- Purpose:', testRequest.files[0].purpose);
  console.log('- Data length:', testRequest.files[0].data.length);
  
  try {
    console.log('\n🚀 Making request with demo format...');
    
    const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Kinetic-Demo-Format-Test/1.0'
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('🎉 SUCCESS! Demo format works!');
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
      }
      
      console.log('\n🎯 The demo format works! File uploads are now functional.');
      return true;
      
    } else {
      console.log('❌ Still getting error with demo format:');
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

testDemoFormat().then(success => {
  if (success) {
    console.log('\n🎉 File uploads are working! Update your app to use this format.');
  } else {
    console.log('\n❌ Still need to debug the file upload format.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});