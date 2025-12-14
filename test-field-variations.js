// Test different field name variations for file uploads
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testFieldVariations() {
  console.log('🧪 Testing Different Field Name Variations...');
  
  const testData = JSON.stringify({ test: 'data' });
  const base64Data = btoa(testData);
  
  const baseRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: 'Field Test',
      description: 'Testing field variations',
      creators: [{
        name: 'Test User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }]
    },
    nftMetadata: {
      name: 'Field Test NFT',
      description: 'Testing field variations',
      attributes: [
        { key: 'test', value: 'field_variations' }
      ]
    }
  };
  
  // Test different field combinations
  const variations = [
    {
      name: 'data + contentType + purpose',
      files: [{
        filename: 'test1.json',
        data: base64Data,
        contentType: 'application/json',
        purpose: 'media'
      }]
    },
    {
      name: 'content + mimeType + purpose',
      files: [{
        filename: 'test2.json',
        content: base64Data,
        mimeType: 'application/json',
        purpose: 'media'
      }]
    },
    {
      name: 'data + mimeType + purpose',
      files: [{
        filename: 'test3.json',
        data: base64Data,
        mimeType: 'application/json',
        purpose: 'media'
      }]
    },
    {
      name: 'content + contentType + purpose',
      files: [{
        filename: 'test4.json',
        content: base64Data,
        contentType: 'application/json',
        purpose: 'media'
      }]
    },
    {
      name: 'base64 + contentType + purpose',
      files: [{
        filename: 'test5.json',
        base64: base64Data,
        contentType: 'application/json',
        purpose: 'media'
      }]
    },
    {
      name: 'file + contentType + purpose',
      files: [{
        filename: 'test6.json',
        file: base64Data,
        contentType: 'application/json',
        purpose: 'media'
      }]
    },
    {
      name: 'buffer + contentType + purpose',
      files: [{
        filename: 'test7.json',
        buffer: base64Data,
        contentType: 'application/json',
        purpose: 'media'
      }]
    }
  ];
  
  for (const variation of variations) {
    console.log(`\n📝 Testing: ${variation.name}`);
    
    const testRequest = {
      ...baseRequest,
      files: variation.files
    };
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(testRequest)
      });
      
      console.log(`  📊 Status: ${response.status}`);
      
      if (response.ok) {
        console.log(`  ✅ SUCCESS with ${variation.name}!`);
        const data = await response.json();
        console.log(`  📋 Response keys: ${Object.keys(data)}`);
        console.log(`  📋 Uploaded files: ${data.uploadedFiles?.length || 0}`);
        
        // If this works, we found the right format!
        console.log(`\n🎉 FOUND WORKING FORMAT: ${variation.name}`);
        console.log(`📋 Working file structure:`, JSON.stringify(variation.files[0], null, 2));
        return variation.files[0];
        
      } else {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          console.log(`  ❌ Error: ${errorData.error?.code}`);
          
          // Check if it's a different error (not the undefined issue)
          if (!errorData.error?.details?.error?.includes('undefined')) {
            console.log(`  💡 Different error - might be progress: ${errorData.error?.message}`);
          }
        } catch {
          console.log(`  ❌ Parse error`);
        }
      }
      
    } catch (error) {
      console.log(`  💥 Request failed: ${error.message}`);
    }
  }
  
  console.log('\n❌ No working format found');
  return null;
}

testFieldVariations().then(workingFormat => {
  if (workingFormat) {
    console.log('\n🎯 Use this format in your app:', JSON.stringify(workingFormat, null, 2));
  } else {
    console.log('\n💭 The server-side file upload might have a bug. Consider reporting to Surreal Base team.');
  }
}).catch(error => {
  console.error('💥 Test failed:', error);
});