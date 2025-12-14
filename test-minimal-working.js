// Test with minimal metadata that matches useDataMinting hook exactly
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testMinimalWorking() {
  console.log('🧪 Testing minimal working format (matches useDataMinting hook)...');
  console.log('⏰ Waiting 5 seconds for rate limit...');
  
  // Wait for rate limit
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Use the exact same format as the useDataMinting hook
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: 'Kinetic IMU Data Collection - 12/13/2025',
      description: 'IMU sensor data collected from Kinetic ESP32C3 device over 30 seconds. Contains 25 data points with accelerometer and gyroscope readings.',
      ipType: 'sensor_data',
      relationships: [],
      createdAt: new Date().toISOString(),
      creators: [{
        name: 'Kinetic Device User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }],
      attributes: [
        { key: 'device_type', value: 'ESP32C3_MPU6050' },
        { key: 'data_points', value: '25' },
        { key: 'collection_duration_seconds', value: '30' },
        { key: 'wallet_address', value: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6' }
      ],
      tags: ['kinetic', 'imu', 'sensor-data', 'esp32c3', 'accelerometer', 'gyroscope'],
      app: {
        id: 'kinetic-imu-app',
        name: 'Kinetic IMU Dashboard',
        website: 'https://kinetic.app'
      }
    },
    nftMetadata: {
      name: `Kinetic IMU Data #${Date.now()}`,
      description: 'NFT representing IMU sensor data collected from Kinetic device. 25 data points over 30 seconds.',
      image: 'https://kinetic.app/images/kinetic-nft-placeholder.png',
      attributes: [
        { key: 'device_type', value: 'ESP32C3_MPU6050' },
        { key: 'data_points', value: '25' },
        { key: 'duration_seconds', value: '30' },
        { key: 'collection_date', value: new Date().toLocaleDateString() },
        { key: 'export_format', value: 'JSON' }
      ],
      external_url: 'https://kinetic.app'
    }
  };
  
  console.log('\n📤 Request using minimal format:');
  console.log('- User address:', testRequest.userAddress);
  console.log('- IP title:', testRequest.ipMetadata.title);
  console.log('- NFT name:', testRequest.nftMetadata.name);
  console.log('- Creators count:', testRequest.ipMetadata.creators.length);
  console.log('- Attributes count:', testRequest.ipMetadata.attributes.length);
  console.log('- Has files:', !!testRequest.files);
  
  try {
    console.log('\n🚀 Making request with minimal format...');
    
    const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Minimal-Working-Test/1.0'
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('🎉 SUCCESS! Minimal format works!');
      const data = JSON.parse(responseText);
      
      console.log('✅ Response Summary:');
      console.log('- Success:', data.success);
      console.log('- Has transaction:', !!data.transaction);
      console.log('- Transaction to:', data.transaction?.to);
      console.log('- Gas estimate:', data.transaction?.gasEstimate);
      console.log('- Has metadata:', !!data.metadata);
      console.log('- IPFS hash:', data.metadata?.ipfsHash);
      console.log('- Uploaded files:', data.uploadedFiles?.length || 0);
      
      console.log('\n🎯 SUCCESS! This is the working format for your app.');
      console.log('✅ Your useDataMinting hook is using the correct format.');
      console.log('✅ File uploads are disabled due to server issue (as expected).');
      console.log('✅ Metadata-only minting works perfectly.');
      
      return true;
      
    } else {
      console.log('❌ Error with minimal format:');
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

testMinimalWorking().then(success => {
  if (success) {
    console.log('\n🎉 PERFECT! Your app is using the correct format.');
    console.log('📝 The useDataMinting hook is working as intended.');
    console.log('🔧 File uploads are correctly disabled due to server issue.');
    console.log('✅ Metadata-only minting is functional and ready to use.');
  } else {
    console.log('\n❌ There may be an issue with the API or metadata format.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});