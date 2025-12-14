// Test without files to isolate the issue
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testWithoutFiles() {
  console.log('🧪 Testing without files to isolate the issue...');
  
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: 'Test Without Files',
      description: 'Testing API without file uploads',
      creators: [{
        name: 'Test User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }]
    },
    nftMetadata: {
      name: 'Test NFT No Files',
      description: 'Test NFT without files',
      attributes: [
        { key: 'test_type', value: 'no_files' }
      ]
    }
    // No files array
  };
  
  console.log('📤 Request without files...');
  
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
      console.log('✅ SUCCESS without files!');
      const data = JSON.parse(responseText);
      console.log('- Success:', data.success);
      console.log('- Has transaction:', !!data.transaction);
      console.log('- Transaction to:', data.transaction?.to);
      console.log('- Gas estimate:', data.transaction?.gasEstimate);
      console.log('- IPFS metadata:', !!data.metadata);
      
      console.log('\n🎯 This means the API works, but there\'s an issue with file uploads.');
      console.log('💡 We can proceed with minting without files, or fix the file upload issue.');
      
    } else {
      console.log('❌ Error without files:');
      try {
        const errorData = JSON.parse(responseText);
        console.log(JSON.stringify(errorData, null, 2));
      } catch {
        console.log('Raw error:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

testWithoutFiles();