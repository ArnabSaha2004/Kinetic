// Test the promising formats that gave validation errors instead of processing errors
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testPromisingFormats() {
  console.log('🧪 Testing Promising Formats (after rate limit cooldown)...');
  console.log('⏰ Waiting 30 seconds for rate limit reset...');
  
  // Wait for rate limit reset
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  const testData = JSON.stringify({ 
    message: 'kinetic imu test data',
    timestamp: new Date().toISOString(),
    dataPoints: 50
  });
  const base64Data = btoa(testData);
  
  console.log('📄 Test data:', testData);
  console.log('📄 Base64 length:', base64Data.length);
  
  const baseRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: 'Promising Format Test',
      description: 'Testing formats that showed validation errors',
      creators: [{
        name: 'Test User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }]
    },
    nftMetadata: {
      name: 'Promising Test NFT',
      description: 'Testing promising formats',
      attributes: [
        { key: 'test_type', value: 'promising_formats' }
      ]
    }
  };
  
  // Test format 1: content + mimeType + purpose
  console.log('\n📝 Test 1: content + mimeType + purpose');
  await testFormat({
    ...baseRequest,
    files: [{
      filename: 'kinetic-data.json',
      content: base64Data,
      mimeType: 'application/json',
      purpose: 'media'
    }]
  });
  
  // Wait between requests
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test format 2: data + mimeType + purpose  
  console.log('\n📝 Test 2: data + mimeType + purpose');
  await testFormat({
    ...baseRequest,
    files: [{
      filename: 'kinetic-data.json',
      data: base64Data,
      mimeType: 'application/json',
      purpose: 'media'
    }]
  });
}

async function testFormat(request) {
  try {
    console.log('  📤 Making request...');
    
    const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(request)
    });
    
    console.log(`  📊 Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('  ✅ SUCCESS!');
      const data = JSON.parse(responseText);
      console.log('  📋 Success:', data.success);
      console.log('  📋 Has transaction:', !!data.transaction);
      console.log('  📋 Uploaded files:', data.uploadedFiles?.length || 0);
      
      if (data.uploadedFiles && data.uploadedFiles.length > 0) {
        console.log('  📋 First file:', data.uploadedFiles[0]);
      }
      
      return true;
      
    } else {
      console.log('  ❌ Error response:');
      try {
        const errorData = JSON.parse(responseText);
        console.log('  📋 Error code:', errorData.error?.code);
        console.log('  📋 Error message:', errorData.error?.message);
        
        if (errorData.error?.details) {
          console.log('  📋 Error details:', JSON.stringify(errorData.error.details, null, 2));
        }
      } catch {
        console.log('  📋 Raw error:', responseText.substring(0, 200));
      }
      
      return false;
    }
    
  } catch (error) {
    console.log('  💥 Request failed:', error.message);
    return false;
  }
}

testPromisingFormats().then(() => {
  console.log('\n🏁 Promising format testing complete');
}).catch(error => {
  console.error('💥 Test failed:', error);
});