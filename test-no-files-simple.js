// Test without files to isolate the issue
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testWithoutFiles() {
  console.log('🧪 Testing without files to isolate the issue...');
  
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: 'Simple Test Without Files',
      description: 'Testing API without file uploads to isolate the issue',
      creators: [{
        name: 'Test User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }]
    },
    nftMetadata: {
      name: 'Simple Test NFT',
      description: 'Test NFT without files'
    }
    // No files array
  };
  
  console.log('\n📤 Request without files:');
  console.log('- User address:', testRequest.userAddress);
  console.log('- IP title:', testRequest.ipMetadata.title);
  console.log('- NFT name:', testRequest.nftMetadata.name);
  console.log('- Has files:', !!testRequest.files);
  
  try {
    console.log('\n🚀 Making request without files...');
    
    const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Simple-Test/1.0'
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('🎉 SUCCESS! API works without files!');
      const data = JSON.parse(responseText);
      
      console.log('✅ Response Summary:');
      console.log('- Success:', data.success);
      console.log('- Has transaction:', !!data.transaction);
      console.log('- Transaction to:', data.transaction?.to);
      console.log('- Gas estimate:', data.transaction?.gasEstimate);
      console.log('- Has metadata:', !!data.metadata);
      console.log('- IPFS hash:', data.metadata?.ipfsHash);
      console.log('- Uploaded files:', data.uploadedFiles?.length || 0);
      
      console.log('\n🎯 The API works without files! The issue is in file processing.');
      return true;
      
    } else {
      console.log('❌ Error even without files:');
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

testWithoutFiles().then(success => {
  if (success) {
    console.log('\n🎉 API works without files! The issue is specifically with file uploads.');
  } else {
    console.log('\n❌ API has issues even without files.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});