// Test with clean base64 without any data URL processing
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testCleanBase64() {
  console.log('🧪 Testing with clean base64 (no data URL processing)...');
  console.log('⏰ Waiting 5 seconds for rate limit...');
  
  // Wait for rate limit
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Create test data
  const testData = {
    message: 'kinetic imu test data',
    timestamp: new Date().toISOString(),
    dataPoints: 25,
    device: 'ESP32C3_MPU6050'
  };
  
  const jsonContent = JSON.stringify(testData, null, 2);
  const base64Data = btoa(jsonContent); // Clean base64, no data URL prefix
  
  console.log('📄 Clean base64:');
  console.log('- JSON content length:', jsonContent.length);
  console.log('- Base64 length:', base64Data.length);
  console.log('- Base64 preview:', base64Data.substring(0, 50) + '...');
  console.log('- Contains data URL:', base64Data.includes('data:'));
  
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: 'Clean Base64 Test',
      description: 'Testing with clean base64 encoding without data URL processing',
      creators: [{
        name: 'Test User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }]
    },
    nftMetadata: {
      name: 'Clean Base64 NFT',
      description: 'NFT for clean base64 test'
    },
    files: [{
      filename: 'kinetic-test-clean.json',
      data: base64Data, // Clean base64
      contentType: 'application/json',
      purpose: 'media'
    }]
  };
  
  console.log('\n📤 Request with clean base64:');
  console.log('- Filename:', testRequest.files[0].filename);
  console.log('- ContentType:', testRequest.files[0].contentType);
  console.log('- Purpose:', testRequest.files[0].purpose);
  console.log('- Data length:', testRequest.files[0].data.length);
  console.log('- Data is clean base64:', /^[A-Za-z0-9+/]*={0,2}$/.test(testRequest.files[0].data));
  
  try {
    console.log('\n🚀 Making request with clean base64...');
    
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
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('🎉 SUCCESS! Clean base64 works!');
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
      
      console.log('\n🎯 Clean base64 works! File uploads are functional.');
      return true;
      
    } else {
      console.log('❌ Error with clean base64:');
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

testCleanBase64().then(success => {
  if (success) {
    console.log('\n🎉 File uploads work with clean base64!');
  } else {
    console.log('\n❌ Still having issues with file uploads.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});