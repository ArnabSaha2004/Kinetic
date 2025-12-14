// Test with the absolute minimal file to isolate the issue
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testMinimalFile() {
  console.log('🧪 Testing Minimal File Upload...');
  console.log('⏰ Waiting 60 seconds for rate limit reset...');
  
  // Wait longer for rate limit
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // Absolute minimal data
  const minimalData = 'test';
  const base64Data = btoa(minimalData);
  
  console.log('📄 Minimal data:', minimalData);
  console.log('📄 Base64:', base64Data);
  console.log('📄 Base64 length:', base64Data.length);
  
  // Verify base64 is valid
  try {
    const decoded = atob(base64Data);
    console.log('📄 Decoded back:', decoded);
    console.log('📄 Round trip works:', decoded === minimalData);
  } catch (error) {
    console.error('❌ Base64 round trip failed:', error);
    return;
  }
  
  const minimalRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: 'Minimal Test',
      description: 'Minimal test for file upload debugging',
      creators: [{
        name: 'Test',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }]
    },
    nftMetadata: {
      name: 'Minimal NFT',
      description: 'Minimal NFT test',
      attributes: [
        { key: 'test', value: 'minimal' }
      ]
    },
    files: [{
      filename: 'test.txt',
      data: base64Data,
      contentType: 'text/plain',
      purpose: 'media'
    }]
  };
  
  console.log('\n📤 Request details:');
  console.log('- Files array length:', minimalRequest.files.length);
  console.log('- File object keys:', Object.keys(minimalRequest.files[0]));
  console.log('- File data type:', typeof minimalRequest.files[0].data);
  console.log('- File data value:', minimalRequest.files[0].data);
  console.log('- File data length:', minimalRequest.files[0].data.length);
  
  // Log the complete request to see if there are any issues
  const requestBody = JSON.stringify(minimalRequest);
  console.log('- Request body size:', requestBody.length);
  console.log('- Request preview:', requestBody.substring(0, 200) + '...');
  
  try {
    console.log('\n🚀 Making minimal file request...');
    
    const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Kinetic-Minimal-Test/1.0'
      },
      body: requestBody
    });
    
    console.log('📊 Response Status:', response.status, response.statusText);
    console.log('📊 Response Headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    const responseText = await response.text();
    console.log('📊 Response Length:', responseText.length);
    
    if (response.ok) {
      console.log('🎉 SUCCESS! Minimal file upload works!');
      const data = JSON.parse(responseText);
      console.log('✅ Success:', data.success);
      console.log('✅ Uploaded files:', data.uploadedFiles?.length || 0);
      if (data.uploadedFiles?.[0]) {
        console.log('✅ First file IPFS hash:', data.uploadedFiles[0].ipfsHash);
      }
      return true;
      
    } else {
      console.log('❌ Error with minimal file:');
      try {
        const errorData = JSON.parse(responseText);
        console.log('Error code:', errorData.error?.code);
        console.log('Error message:', errorData.error?.message);
        
        if (errorData.error?.details?.error) {
          console.log('Error details:', errorData.error.details.error);
          
          // Check if it's still the undefined error
          if (errorData.error.details.error.includes('undefined')) {
            console.log('💡 Still getting undefined error - this suggests a server-side parsing issue');
          }
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

testMinimalFile().then(success => {
  if (success) {
    console.log('\n🎉 File uploads are working! The issue was resolved.');
  } else {
    console.log('\n❌ File uploads still not working. May need to contact Surreal Base team.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});