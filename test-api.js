// Test script for Surreal Base Universal Minting Engine API
// This will help us debug the API request format and identify issues

const API_BASE_URL = 'https://surreal-base.vercel.app';

async function testAPI() {
  console.log('🧪 Testing Surreal Base Universal Minting Engine API...');
  console.log('🌐 API Base URL:', API_BASE_URL);
  
  // Test 1: Check if API is accessible (GET request for documentation)
  console.log('\n📋 Test 1: API Documentation (GET)');
  try {
    const docResponse = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Kinetic-Test/1.0'
      }
    });
    
    console.log('✅ GET Response Status:', docResponse.status, docResponse.statusText);
    
    if (docResponse.ok) {
      const docData = await docResponse.json();
      console.log('📖 API Documentation:', JSON.stringify(docData, null, 2));
    } else {
      const errorText = await docResponse.text();
      console.log('❌ GET Error Response:', errorText);
    }
  } catch (error) {
    console.error('❌ GET Request Failed:', error.message);
  }
  
  // Test 2: Minimal valid POST request
  console.log('\n🧪 Test 2: Minimal POST Request');
  
  // Create minimal test data
  const testWalletAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6'; // Example address
  const testJsonData = JSON.stringify({
    test: 'data',
    timestamp: new Date().toISOString(),
    message: 'This is a test file for API validation'
  });
  
  // Convert to base64 (simple implementation)
  const base64Data = btoa(testJsonData);
  
  const minimalRequest = {
    userAddress: testWalletAddress,
    ipMetadata: {
      title: 'Test IP Asset',
      description: 'Test IP asset for API validation',
      ipType: 'test_data',
      relationships: [],
      createdAt: new Date().toISOString(),
      creators: [{
        name: 'Test User',
        address: testWalletAddress,
        contributionPercent: 100
      }],
      attributes: [
        { key: 'test_type', value: 'api_validation' },
        { key: 'timestamp', value: new Date().toISOString() }
      ],
      tags: ['test', 'api', 'validation'],
      app: {
        id: 'kinetic-test-app',
        name: 'Kinetic Test App',
        website: 'https://kinetic.app'
      }
    },
    nftMetadata: {
      name: 'Test NFT',
      description: 'Test NFT for API validation',
      image: 'https://kinetic.app/images/test-placeholder.png',
      attributes: [
        { trait_type: 'Test Type', value: 'API Validation' },
        { trait_type: 'Timestamp', value: new Date().toISOString() }
      ],
      external_url: 'https://kinetic.app'
    },
    files: [{
      filename: 'test-data.json',
      content: base64Data,
      mimeType: 'application/json'
    }]
  };
  
  console.log('📤 Request Structure:');
  console.log('- User Address:', minimalRequest.userAddress);
  console.log('- IP Metadata Keys:', Object.keys(minimalRequest.ipMetadata));
  console.log('- NFT Metadata Keys:', Object.keys(minimalRequest.nftMetadata));
  console.log('- Files Count:', minimalRequest.files.length);
  console.log('- File Size (base64):', minimalRequest.files[0].content.length);
  console.log('- Total Request Size:', JSON.stringify(minimalRequest).length, 'bytes');
  
  try {
    console.log('\n🚀 Making POST request...');
    const postResponse = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Kinetic-Test/1.0'
      },
      body: JSON.stringify(minimalRequest)
    });
    
    console.log('📊 POST Response Status:', postResponse.status, postResponse.statusText);
    console.log('📊 Response Headers:');
    for (const [key, value] of postResponse.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Get response body
    const responseText = await postResponse.text();
    console.log('📊 Response Body Length:', responseText.length);
    
    if (postResponse.ok) {
      try {
        const responseData = JSON.parse(responseText);
        console.log('✅ POST Success Response:');
        console.log(JSON.stringify(responseData, null, 2));
      } catch (parseError) {
        console.log('✅ POST Success (Non-JSON Response):', responseText);
      }
    } else {
      console.log('❌ POST Error Response:', responseText);
      
      // Try to parse as JSON for better error details
      try {
        const errorData = JSON.parse(responseText);
        console.log('❌ Parsed Error Data:');
        console.log(JSON.stringify(errorData, null, 2));
      } catch (parseError) {
        console.log('❌ Raw Error Response:', responseText);
      }
    }
    
  } catch (error) {
    console.error('❌ POST Request Failed:', error.message);
    console.error('❌ Error Stack:', error.stack);
  }
  
  // Test 3: Check if it's a CORS issue
  console.log('\n🔒 Test 3: CORS Check');
  try {
    const corsResponse = await fetch(`${API_BASE_URL}/api/prepare-mint`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8085',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('🔒 CORS Preflight Status:', corsResponse.status);
    console.log('🔒 CORS Headers:');
    for (const [key, value] of corsResponse.headers.entries()) {
      if (key.toLowerCase().includes('access-control')) {
        console.log(`  ${key}: ${value}`);
      }
    }
  } catch (corsError) {
    console.error('❌ CORS Check Failed:', corsError.message);
  }
  
  console.log('\n🏁 API Test Complete');
}

// Run the test
testAPI().catch(error => {
  console.error('💥 Test Script Failed:', error);
});