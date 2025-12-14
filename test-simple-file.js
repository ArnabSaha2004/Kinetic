// Test with a very simple file to narrow down the issue
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testSimpleFile() {
  console.log('🧪 Testing with a very simple file...');
  console.log('⏰ Waiting 5 seconds for rate limit...');
  
  // Wait for rate limit
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Create the simplest possible file
  const simpleText = 'Hello World';
  const base64Data = btoa(simpleText); // Simple base64 without data URL prefix
  
  console.log('📄 Simple file:');
  console.log('- Content:', simpleText);
  console.log('- Base64:', base64Data);
  console.log('- Length:', base64Data.length);
  
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: 'Simple File Test',
      description: 'Testing with the simplest possible file',
      creators: [{
        name: 'Test User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }]
    },
    nftMetadata: {
      name: 'Simple File NFT',
      description: 'NFT for simple file test'
    },
    files: [{
      filename: 'hello.txt',
      data: base64Data, // Use 'data' as expected by deployed API
      contentType: 'text/plain', // Use 'contentType' as expected by deployed API
      purpose: 'media' // Include 'purpose' as required by deployed API
    }]
  };
  
  console.log('\n📤 Request with simple file:');
  console.log('- Filename:', testRequest.files[0].filename);
  console.log('- ContentType:', testRequest.files[0].contentType);
  console.log('- Purpose:', testRequest.files[0].purpose);
  console.log('- Data length:', testRequest.files[0].data.length);
  console.log('- Has data URL prefix:', testRequest.files[0].data.includes('data:'));
  
  try {
    console.log('\n🚀 Making request with simple file...');
    
    const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Simple-File-Test/1.0'
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log('🎉 SUCCESS! Simple file upload works!');
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
      
      console.log('\n🎯 Simple file upload works! Now test with data URL format...');
      return true;
      
    } else {
      console.log('❌ Error with simple file:');
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

testSimpleFile().then(success => {
  if (success) {
    console.log('\n🎉 Simple file upload works!');
  } else {
    console.log('\n❌ Even simple file upload fails.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});