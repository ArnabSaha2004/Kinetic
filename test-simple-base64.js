// Test with very simple base64 data
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testSimpleBase64() {
  console.log('🧪 Testing with Simple Base64 Data...');
  
  // Create very simple JSON data
  const simpleData = '{"message":"hello world"}';
  console.log('📄 Original data:', simpleData);
  
  // Convert to base64
  const base64Data = btoa(simpleData);
  console.log('📄 Base64 data:', base64Data);
  console.log('📄 Base64 length:', base64Data.length);
  
  // Verify base64 is valid
  try {
    const decoded = atob(base64Data);
    console.log('✅ Base64 verification - decoded:', decoded);
  } catch (error) {
    console.error('❌ Base64 is invalid:', error);
    return;
  }
  
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: 'Simple Test',
      description: 'Simple test with minimal data',
      creators: [{
        name: 'Test User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }]
    },
    nftMetadata: {
      name: 'Simple Test NFT',
      description: 'Simple test NFT',
      attributes: [
        { key: 'test', value: 'simple' }
      ]
    },
    files: [{
      filename: 'simple.json',
      data: base64Data,
      contentType: 'application/json',
      purpose: 'media'
    }]
  };
  
  console.log('\n🚀 Making request with simple data...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('📊 Response Status:', response.status);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ SUCCESS with simple data!');
      const data = JSON.parse(responseText);
      console.log('- Transaction prepared:', !!data.transaction);
      console.log('- IPFS uploaded:', !!data.metadata);
    } else {
      console.log('❌ Error with simple data:');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error code:', errorData.error?.code);
        console.log('Error message:', errorData.error?.message);
        console.log('Error details:', errorData.error?.details?.error);
      } catch {
        console.log('Raw error:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testSimpleBase64();