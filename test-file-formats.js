// Test different file formats to find what works
const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testDifferentFileFormats() {
  console.log('🧪 Testing Different File Formats...');
  
  const testWalletAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6';
  
  // Test 1: Very simple string
  console.log('\n📝 Test 1: Simple string data');
  const simpleString = 'Hello World';
  const simpleBase64 = btoa(simpleString);
  
  await testFileFormat('simple-string', {
    filename: 'test.txt',
    data: simpleBase64,
    contentType: 'text/plain',
    purpose: 'media'
  });
  
  // Test 2: Simple JSON
  console.log('\n📝 Test 2: Simple JSON data');
  const simpleJson = JSON.stringify({ message: 'test' });
  const jsonBase64 = btoa(simpleJson);
  
  await testFileFormat('simple-json', {
    filename: 'test.json',
    data: jsonBase64,
    contentType: 'application/json',
    purpose: 'media'
  });
  
  // Test 3: Try with Buffer encoding (if available)
  if (typeof Buffer !== 'undefined') {
    console.log('\n📝 Test 3: Buffer-based encoding');
    const bufferBase64 = Buffer.from(simpleJson, 'utf8').toString('base64');
    
    await testFileFormat('buffer-json', {
      filename: 'buffer-test.json',
      data: bufferBase64,
      contentType: 'application/json',
      purpose: 'media'
    });
  }
  
  // Test 4: Try different purpose values
  console.log('\n📝 Test 4: Different purpose values');
  const purposes = ['media', 'metadata', 'evidence', 'attachment'];
  
  for (const purpose of purposes) {
    console.log(`\n  Testing purpose: ${purpose}`);
    await testFileFormat(`purpose-${purpose}`, {
      filename: `test-${purpose}.json`,
      data: jsonBase64,
      contentType: 'application/json',
      purpose: purpose
    });
  }
}

async function testFileFormat(testName, fileConfig) {
  const testRequest = {
    userAddress: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
    ipMetadata: {
      title: `Test ${testName}`,
      description: `Testing file format: ${testName}`,
      creators: [{
        name: 'Test User',
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6',
        contributionPercent: 100
      }]
    },
    nftMetadata: {
      name: `Test NFT ${testName}`,
      description: `Test NFT for ${testName}`,
      attributes: [
        { key: 'test_type', value: testName }
      ]
    },
    files: [fileConfig]
  };
  
  try {
    console.log(`  📤 Testing: ${fileConfig.filename} (${fileConfig.contentType}, ${fileConfig.purpose})`);
    console.log(`  📄 Data length: ${fileConfig.data.length}`);
    console.log(`  📄 Data preview: ${fileConfig.data.substring(0, 20)}...`);
    
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
      console.log(`  ✅ SUCCESS with ${testName}!`);
      const data = await response.json();
      console.log(`  📋 Uploaded files: ${data.uploadedFiles?.length || 0}`);
      return true;
    } else {
      const errorText = await response.text();
      try {
        const errorData = JSON.parse(errorText);
        console.log(`  ❌ Error: ${errorData.error?.code} - ${errorData.error?.message}`);
        if (errorData.error?.details?.error) {
          console.log(`  📝 Details: ${errorData.error.details.error.substring(0, 100)}...`);
        }
      } catch {
        console.log(`  ❌ Raw error: ${errorText.substring(0, 100)}...`);
      }
      return false;
    }
    
  } catch (error) {
    console.log(`  💥 Request failed: ${error.message}`);
    return false;
  }
}

testDifferentFileFormats().then(() => {
  console.log('\n🏁 File format testing complete');
}).catch(error => {
  console.error('💥 Test suite failed:', error);
});