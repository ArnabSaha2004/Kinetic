// Updated test script with corrected API format
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testFixedAPI() {
  console.log('🧪 Testing Fixed API Request Format...');
  
  const testWalletAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
  const testJsonData = JSON.stringify({
    test: 'kinetic_imu_data',
    timestamp: new Date().toISOString(),
    dataPoints: 100,
    device: 'ESP32C3_MPU6050'
  });
  
  const base64Data = btoa(testJsonData);
  
  const correctedRequest = {
    userAddress: testWalletAddress,
    ipMetadata: {
      title: 'Kinetic IMU Data Collection Test',
      description: 'Test IMU sensor data from Kinetic ESP32C3 device',
      ipType: 'sensor_data',
      relationships: [],
      createdAt: new Date().toISOString(),
      creators: [{
        name: 'Kinetic Device User',
        address: testWalletAddress,
        contributionPercent: 100
      }],
      attributes: [
        { key: 'device_type', value: 'ESP32C3_MPU6050' },
        { key: 'data_points', value: '100' },
        { key: 'test_mode', value: 'true' }
      ],
      tags: ['kinetic', 'imu', 'test'],
      app: {
        id: 'kinetic-imu-app',
        name: 'Kinetic IMU Dashboard',
        website: 'https://kinetic.app'
      }
    },
    nftMetadata: {
      name: 'Kinetic IMU Test Data',
      description: 'Test NFT for Kinetic IMU data validation',
      image: 'https://kinetic.app/images/kinetic-nft-placeholder.png',
      attributes: [
        { key: 'device_type', value: 'ESP32C3_MPU6050' },
        { key: 'data_points', value: '100' },
        { key: 'test_mode', value: 'true' }
      ],
      external_url: 'https://kinetic.app'
    },
    files: [{
      filename: 'kinetic-test-data.json',
      data: base64Data,
      contentType: 'application/json',
      purpose: 'media'
    }]
  };
  
  console.log('📤 Corrected Request Format:');
  console.log('- NFT attributes use "key" instead of "trait_type"');
  console.log('- Files use "data" instead of "content"');
  console.log('- Files use "contentType" instead of "mimeType"');
  console.log('- Files include "purpose" field');
  
  try {
    console.log('\n🚀 Making corrected POST request...');
    const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Kinetic-Test-Fixed/1.0'
      },
      body: JSON.stringify(correctedRequest)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (response.ok) {
      const responseData = JSON.parse(responseText);
      console.log('✅ SUCCESS! API Request Worked:');
      console.log('- Success:', responseData.success);
      console.log('- Has Transaction:', !!responseData.transaction);
      console.log('- Has Metadata:', !!responseData.metadata);
      console.log('- Transaction To:', responseData.transaction?.to);
      console.log('- Gas Estimate:', responseData.transaction?.gasEstimate);
      console.log('- IPFS Hash:', responseData.metadata?.ipfsHash);
      
      return true;
    } else {
      console.log('❌ Still getting error:');
      try {
        const errorData = JSON.parse(responseText);
        console.log(JSON.stringify(errorData, null, 2));
      } catch {
        console.log(responseText);
      }
      return false;
    }
    
  } catch (error) {
    console.error('❌ Request Failed:', error.message);
    return false;
  }
}

testFixedAPI().then(success => {
  if (success) {
    console.log('\n🎉 API Format is now correct! The minting should work.');
  } else {
    console.log('\n❌ Still need to fix the API request format.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});